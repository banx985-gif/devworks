// Franchises / IP and the back catalogue (Milestone 10, bible §18). Owned by the business (saved with it). Every number
// is in data/balance.js (FRANCHISE_BALANCE), where the rules are written out; types and statuses in data/franchises.js.
//
// An IP is made when an Original game is finished (named after it; the player can rename it) and every Sequel,
// Spin-off, Remake or Remaster joins one. Stored per IP: { id, name, genre, theme, createdDay, entries: [catalogue
// number], fatigue, fatigueDay, status, legendaryDay }. Lifetime copies, review average, points, fanbase and status
// are worked out from its released games whenever asked, so they can never drift from the catalogue.
//
// A save from before Milestone 10 has no IPs: they are rebuilt once from the catalogue (every old game was an
// Original), with the fatigue their releases would have left.
//
// Events: 'franchise:new' { ip }, 'franchise:status' { ip, status } (a higher status reached),
// 'franchise:legendary' { ip } (the first time only — the hook for later secrets).
import { FRANCHISE_BALANCE } from '../../data/balance.js';
import { FRANCHISE_STATUSES } from '../../data/franchises.js';
import { netPerCopy } from './sales.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r4 = (x) => +x.toFixed(4);

// --- pure rules --------------------------------------------------------------------------------------------------
export const typeOf = (id, F = FRANCHISE_BALANCE) => F.types[id] ?? F.types.original;
export const fanbaseFor = (points, F = FRANCHISE_BALANCE) => r4(100 * (1 - Math.exp(-Math.max(0, points) / F.fanScale)));
export const fatigueAfter = (fatigue, days, F = FRANCHISE_BALANCE) => r4(fatigue * Math.exp(-Math.max(0, days) / F.fatigueDays));

// The highest status these numbers earn.
export function statusFor({ points, entries, reviewAvg }) {
  let best = FRANCHISE_STATUSES[0];
  for (const s of FRANCHISE_STATUSES) if (points >= s.points && entries >= (s.entries ?? 0) && reviewAvg >= (s.reviewAvg ?? 0)) best = s;
  return best;
}

// What a franchise does to a launch: fatigue after relief (other technology / art direction / genre than the last
// game), and the sales and review changes. fanShare from the type (an Original gets no fan boost).
export function launchEffect({ fatigueNow, fanbase, type, last = null, recipe = {} }, F = FRANCHISE_BALANCE) {
  const T = typeOf(type, F);
  const relief = { tech: 0, art: 0, genre: 0 };
  if (last) {
    if (recipe.technology && recipe.technology !== last.technology) relief.tech = F.relief.tech;
    if (recipe.artDirection && recipe.artDirection !== last.artDirection) relief.art = F.relief.art;
    if (recipe.genre && recipe.genre !== last.genre) relief.genre = F.relief.genre;
  }
  const fatigue = r4(Math.max(0, fatigueNow - relief.tech - relief.art - relief.genre));
  const fan = (fanbase / 100) * (F.fanSalesPct / 100) * T.fanShare;
  return {
    fatigueBefore: r4(fatigueNow),
    relief,
    fatigue,
    fanbase: r4(fanbase),
    fanBoost: r4(fan),
    salesMult: r4((1 + fan) * (1 - (fatigue / 100) * (F.fatigueSalesPct / 100))),
    reviewPenalty: r4(fatigue * F.fatigueReview),
  };
}

// --- the system ------------------------------------------------------------------------------------------------
// marketing: the business's campaigns (a new entry starts with its fans' Hype).
export function createFranchises({ bus, clock, projects, marketing, F = FRANCHISE_BALANCE }) {
  let ips = [];
  let nextId = 1;
  const today = () => clock.totalDays;
  const byId = (id) => ips.find((x) => x.id === id) ?? null;
  const rec = (n) => projects.catalogue.get(n);
  const releasedOf = (ip) => ip.entries.map(rec).filter((r) => r?.release).sort((a, b) => a.release.day - b.release.day || a.number - b.number);
  const copiesOf = (r) => (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0);

  // Everything worked out about one IP now.
  function stats(ip, day = today()) {
    const rel = releasedOf(ip);
    const copies = rel.reduce((t, r) => t + copiesOf(r), 0);
    const reviewAvg = rel.length ? rel.reduce((t, r) => t + r.release.score, 0) / rel.length : 0;
    // Milestone 15: a combo's "franchise potential" (the best of its released games) makes the points count more.
    const potential = Math.max(0, ...rel.map((r) => r.result.comboFx?.franchisePct ?? 0));
    const points = ((copies * reviewAvg) / F.pointsReviewRef) * (1 + potential / 100) + (ip.basePoints ?? 0); // Milestone 21: an acquired IP's fans
    const status = statusFor({ points, entries: rel.length, reviewAvg });
    return {
      entries: ip.entries.length,
      released: rel.length,
      copies,
      revenue: rel.reduce((t, r) => t + (r.sales?.revenue ?? 0) + (r.catalogue?.revenue ?? 0), 0),
      reviewAvg: r4(reviewAvg),
      points: r4(points),
      fanbase: fanbaseFor(points, F),
      fatigue: fatigueAfter(ip.fatigue, day - ip.fatigueDay, F),
      status,
      lastRelease: rel.length ? rel[rel.length - 1].release.day : null,
    };
  }

  function create(record) {
    const g = record.result;
    const ip = { id: `IP${nextId++}`, name: g.title, genre: g.recipe?.genre ?? null, theme: g.recipe?.theme ?? null, createdDay: record.finishedAt?.totalDays ?? today(), entries: [record.number], fatigue: 0, fatigueDay: today(), status: 'new', legendaryDay: null };
    ips.push(ip);
    g.ipId = ip.id;
    return ip;
  }
  function join(record) {
    const ip = byId(record.result.ipId);
    if (!ip) return create(record); // its franchise is gone (should not happen): it starts its own
    if (!ip.entries.includes(record.number)) ip.entries.push(record.number);
    // Milestone 37: a new entry in a Legendary franchise gets the Legendary Franchise cover family (cover_24).
    if (ip.status === 'legendary' && !record.result.projectOne && !record.result.coverOverride) Object.assign(record.result, { cover: 'cover_24', coverFamily: 'cover_24', coverOverride: 'legendary' });
    return ip;
  }

  // Status up (never down), and the first Legendary.
  function checkStatus(ip) {
    const st = stats(ip).status;
    const rank = (id) => FRANCHISE_STATUSES.findIndex((s) => s.id === id);
    if (rank(st.id) <= rank(ip.status)) return;
    ip.status = st.id;
    bus?.emit('franchise:status', { ip, status: st });
    if (st.id === 'legendary' && ip.legendaryDay == null) {
      ip.legendaryDay = today();
      bus?.emit('franchise:legendary', { ip });
    }
  }

  // Finished games join (or start) their franchise.
  bus?.on('project:complete', ({ record }) => {
    if (!record || record.result?.title == null) return;
    const type = record.result.type ?? 'original';
    if (type === 'original' || !record.result.ipId) {
      const ip = create(record);
      bus.emit('franchise:new', { ip });
    } else join(record);
  });
  // A new entry starts with its fans' Hype.
  bus?.on('project:start', ({ job }) => {
    const d = job?.data;
    if (!d || !d.ipId || (d.type ?? 'original') === 'original') return;
    const ip = byId(d.ipId);
    if (!ip) return;
    const hype = stats(ip).fanbase * F.startHype * typeOf(d.type, F).fanShare;
    if (hype > 0) marketing.addHype(job.id, hype);
  });

  return {
    list: () => ips,
    byId,
    stats,
    releasedOf,
    ipOf: (record) => byId(record?.result?.ipId),
    // Milestone 21: an IP bought with a studio (no games of yours yet; its fans are basePoints). Returns the IP.
    addAcquired({ name, genre = null, theme = null, basePoints = 0, from = null }) {
      const ip = { id: `IP${nextId++}`, name, genre, theme, createdDay: today(), entries: [], fatigue: 0, fatigueDay: today(), status: 'new', legendaryDay: null, basePoints, acquired: from ?? true };
      ips.push(ip);
      checkStatus(ip);
      bus?.emit('franchise:new', { ip });
      return ip;
    },
    rename(id, name) {
      const ip = byId(id);
      const n = `${name ?? ''}`.trim().slice(0, 28);
      if (!ip || !n) return false;
      ip.name = n;
      return true;
    },
    // The games of a franchise that can be remade / remastered now (released, old enough), newest first.
    eligible(type, day = today()) {
      const T = typeOf(type, F);
      const out = [];
      for (const ip of ips) for (const r of releasedOf(ip)) if (day - r.release.day >= (T.minAgeDays ?? 0)) out.push({ ip, record: r });
      return out.sort((a, b) => b.record.release.day - a.record.release.day);
    },

    // What this franchise does to a game launching today (no franchise: nothing).
    effectFor(record, day = today()) {
      const ip = byId(record.result.ipId);
      if (!ip) return null;
      const prev = releasedOf(ip).filter((r) => r.number !== record.number);
      const last = prev.length ? prev[prev.length - 1].result.recipe : null;
      return launchEffect({ fatigueNow: fatigueAfter(ip.fatigue, day - ip.fatigueDay, F), fanbase: prev.length || ip.basePoints ? stats(ip, day).fanbase : 0, type: record.result.type ?? 'original', last, recipe: record.result.recipe }, F);
    },
    // After the launch: fatigue grows by the type's amount; the franchise's other games get a sales spike.
    launched(record, eff) {
      const ip = byId(record.result.ipId);
      if (!ip) return;
      ip.fatigue = r4(clamp((eff?.fatigue ?? 0) + typeOf(record.result.type ?? 'original', F).fatigueAdd, 0, 100));
      ip.fatigueDay = today();
      for (const r of releasedOf(ip)) {
        if (r.number === record.number) continue;
        const c = (r.catalogue ||= { copies: 0, revenue: 0, spike: 0, carry: 0 });
        c.spike += Math.round((r.sales.lifetime * F.catalogue.spikePct) / 100);
      }
      checkStatus(ip);
    },

    // Month end: the back catalogue sells. Returns [{ record, copies, revenue }] (the business books them).
    month() {
      const C = F.catalogue;
      const out = [];
      for (const r of projects.catalogue.list()) {
        if (!r.release || !r.sales) continue;
        const c = (r.catalogue ||= { copies: 0, revenue: 0, spike: 0, carry: 0 });
        const old = today() - r.release.day >= C.afterDays;
        // Milestone 40 (bible §44, late passive income diminishing): it fades with the game's age after its first year.
        const age = today() - r.release.day - C.afterDays;
        const fade = C.fadeYears ? Math.exp(-Math.max(0, age) / (C.fadeYears * 336)) : 1;
        const exact = (old ? (r.sales.lifetime * C.monthlyPct * fade) / 100 : 0) + c.carry + c.spike;
        const copies = Math.floor(exact);
        c.carry = r4(exact - copies);
        c.spike = 0;
        if (!copies) continue;
        const price = r.release.price ?? r.sales.byPlatform?.[r.release.platform]?.price ?? 12;
        const revenue = Math.round((copies * netPerCopy(undefined, price) * C.pricePct) / 100);
        c.copies += copies;
        c.revenue += revenue;
        out.push({ record: r, copies, revenue });
      }
      for (const ip of ips) checkStatus(ip);
      return out;
    },

    newGame() {
      ips = [];
      nextId = 1;
    },
    serialize: () => ({ nextId, ips: JSON.parse(JSON.stringify(ips)) }),
    // A save from before Milestone 10: rebuild the IPs from the catalogue.
    load(data) {
      if (data) {
        nextId = data.nextId ?? 1;
        ips = JSON.parse(JSON.stringify(data.ips ?? []));
        return;
      }
      ips = [];
      nextId = 1;
      for (const r of projects.catalogue.list()) {
        if ((r.result.type ?? 'original') === 'original' || !byId(r.result.ipId)) create(r);
        else join(r);
      }
      for (const ip of ips) {
        let f = 0;
        let at = 0;
        for (const r of releasedOf(ip)) {
          f = fatigueAfter(f, r.release.day - at, F) + typeOf(r.result.type, F).fatigueAdd;
          at = r.release.day;
        }
        ip.fatigue = r4(clamp(f, 0, 100));
        ip.fatigueDay = at;
        ip.status = stats(ip).status.id;
        if (ip.status === 'legendary') ip.legendaryDay = at;
      }
    },
  };
}
