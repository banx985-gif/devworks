// Distribution (Milestone 26, bible §31). Saved with the studio; every number is in data/distribution.js.
//
// The market moves from boxes to downloads over the 20 years (physicalPctOf). Each release picks a mode — Retail-heavy,
// Balanced (the standard mix, exactly what every game had before), Digital-first or Early Access — which changes how
// many players it reaches this year, the shape of its sales curve (retail: a bigger launch that fades faster;
// digital: a smaller launch and a longer tail), what it costs (retail pays for pressing at release and for each box)
// and how much of each copy is kept. The business asks effectsOf() at launch and pressingCost() at release.
//
// Early Access (open platforms only, eligible types, from a set year): the game is not launched yet — it sells a slow
// trickle at a lower price and its bugs get fixed month by month from player feedback; staying in too long costs Fan
// Trust every month, and a full launch with many bugs left costs Fan Trust too. Full launch is the normal launch
// (reviews, the curve) with fewer buyers left. The state is kept on the catalogue record (record.ea).
//
// Own storefront (F32 Storefront Ops): while open, a capped share of your games' digital copies go through it (you keep
// the store's cut on those) and your consoles' third-party games pay a little through it, for a monthly operating
// cost. It adds margin only — it never sells a copy of its own, so the platforms stay the way games reach players.
//
// Events: 'ea:started' { record }, 'ea:month' { record, fixed, trust }, 'ea:launched' { record, buggy },
// 'storefront:month' { month }.
import { DISTRIBUTION as D, modeById } from '../../data/distribution.js';
import { PROJECT_BALANCE, RELEASE } from '../../data/balance.js';
import { startSales, sellDay } from './sales.js';
import { reviewGame } from './reviews.js';
import { platformById } from '../../data/platforms.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r4 = (x) => +x.toFixed(4);

// Pure pieces (tested).
export function physicalPctOf(year, table = D.physicalByYear) {
  if (year <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [y1, p1] = table[i];
    const [y0, p0] = table[i - 1];
    if (year <= y1) return +(p0 + ((p1 - p0) * (year - y0)) / (y1 - y0)).toFixed(2);
  }
  return table.at(-1)[1];
}
// What a mode does in a year: { mode, physicalPct, salesMult, physFrac, digitalFrac, netMult, curve }.
export function effectsOf(modeId, year) {
  const m = modeById(modeId) ?? D.modes.balanced;
  const p = physicalPctOf(year) / 100;
  const phys = p * m.reach.physical;
  const dig = (1 - p) * m.reach.digital;
  const salesMult = phys + dig;
  const physFrac = salesMult ? phys / salesMult : 0;
  const netMult = 1 + m.netPct / 100 - (physFrac * m.physCopyPct) / (100 - RELEASE.storeCutPct);
  return { mode: modeId in D.modes ? modeId : 'balanced', physicalPct: +(p * 100).toFixed(2), salesMult: r4(salesMult), physFrac: r4(physFrac), digitalFrac: r4(1 - physFrac), netMult: r4(netMult), curve: m.curve };
}
export const isNeutral = (fx) => fx.salesMult === 1 && fx.netMult === 1 && fx.curve.spike === 1 && fx.curve.tail === 1 && fx.curve.tailDays === 1;
// A sales curve reshaped by a mode (the parts still add up to 1).
export function shapeCurve(curve, c) {
  if (c.spike === 1 && c.tail === 1 && c.tailDays === 1) return curve;
  const out = {};
  let total = 0;
  for (const [k, p] of Object.entries(curve)) {
    const share = p.share * (k === 'spike' ? c.spike : k === 'tail' ? c.tail : 1);
    out[k] = { ...p, share, ...(k === 'tail' ? { days: +(p.days * c.tailDays).toFixed(6) } : {}) };
    total += share;
  }
  for (const p of Object.values(out)) p.share = +(p.share / total).toFixed(6);
  return out;
}
export function pressingCostOf(scope, modeId, year) {
  const m = modeById(modeId) ?? D.modes.balanced;
  const sc = PROJECT_BALANCE.scopes[scope] ?? PROJECT_BALANCE.scopes.tiny;
  return Math.round((sc.baseCostPerDay * m.pressDays * physicalPctOf(year)) / 100);
}

export function createDistribution({ bus, clock, world, business, projects, consoles = () => null }) {
  const EA = D.earlyAccess;
  const S = D.storefront;
  const year = () => clock.year;
  const eco = () => business.economy;
  const blankMonth = () => ({ copies: 0, viaStore: 0, margin: 0 });
  let store = { open: false, month: blankMonth(), history: [], totals: { margin: 0, thirdParty: 0, opCost: 0, viaStore: 0, copies: 0 } };

  // --- Early Access -------------------------------------------------------------------------------------------------
  function eaWhy(record, ids = []) {
    if (!record) return 'No such game';
    if (year() < EA.unlockYear) return `Early Access opens in Year ${EA.unlockYear}`;
    if (!EA.types.includes(record.result.type ?? 'original')) return 'Early Access is for new games, sequels and spin-offs';
    if (record.result.deal) return 'A publisher deal decides how it is sold';
    if (!ids.length || ids.some((id) => !platformById(id)?.open)) return 'Early Access needs open platforms only (no certification)';
    return null;
  }
  const inEA = () => projects.catalogue.list().filter((r) => r.ea && !r.release);
  function startEA(record, plan) {
    const g = record.result;
    const sc = PROJECT_BALANCE.scopes[g.scope] ?? PROJECT_BALANCE.scopes.tiny;
    const preview = reviewGame(g).score; // what early players think of it now
    const x = plan.platforms[0];
    const st = startSales({ score: preview, fit: g.outputs.audienceFit, trust: business.state.fanTrust, demand: 100, platform: x.id, reviewSeed: `${g.reviewSeed}|ea`, day: clock.totalDays, salesMult: (sc.salesMult * x.fit * EA.salesPct) / 100, price: Math.round((sc.price * EA.pricePct) / 100), audience: plan.platforms.reduce((t, p) => t + p.buyers, 0), hype: 0 });
    st.curve = { tail: { share: 1, days: EA.poolDays } };
    record.ea = { startDay: clock.totalDays, months: 0, platforms: plan.platforms.map((p) => p.id), bugsAtStart: g.bugs, fixed: 0, trustLost: 0, previewScore: preview, sales: st, plan };
    bus.emit('ea:started', { record });
    return record;
  }
  function fullLaunchWhy(number) {
    const r = projects.catalogue.get(number);
    return r?.ea && !r.release ? null : 'Not in Early Access';
  }
  function fullLaunch(number) {
    const r = projects.catalogue.get(number);
    if (fullLaunchWhy(number)) return { ok: false, why: fullLaunchWhy(number) };
    const ea = r.ea;
    const plan = business.releasePlan(number, ea.platforms);
    plan.distribution = 'earlyAccess';
    plan.fromEA = true;
    const bugs = r.result.bugs + (plan.extraBugs ?? 0);
    business.launchNow(r, plan);
    const buggy = bugs > EA.buggyBugs;
    if (buggy) loseTrust(r, EA.buggyTrust);
    r.release.earlyAccess = { months: ea.months, copies: ea.sales.copies, revenue: ea.sales.revenue, fixed: ea.fixed, bugsAtStart: ea.bugsAtStart, trustLost: ea.trustLost, buggy }; // trustLost already has the buggy launch
    delete r.ea;
    bus.emit('ea:launched', { record: r, buggy });
    return { ok: true, record: r, buggy };
  }
  function loseTrust(r, n) {
    business.state.fanTrust = +clamp(business.state.fanTrust - n, 0, 100).toFixed(2);
    if (r.ea) r.ea.trustLost += n;
  }

  // --- storefront ---------------------------------------------------------------------------------------------------
  const storefrontWhy = () => (world.stationById?.(S.facility) ? null : 'Needs Storefront Ops (F32: Year 15 + Digital Storefront research)');
  const shareNow = () => +Math.min(S.capPct, ((100 - physicalPctOf(year())) * S.takePct) / 100).toFixed(2);
  function setStorefront(on) {
    if (on && storefrontWhy()) return { ok: false, why: storefrontWhy() };
    store.open = !!on;
    return { ok: true };
  }

  // --- the day and the month ----------------------------------------------------------------------------------------
  bus.on('clock:day', () => {
    for (const r of inEA()) {
      const { copies, revenue } = sellDay(r.ea.sales);
      if (revenue) eco().add('credits', revenue, `Early Access: ${r.result.title}`, 'sales');
      void copies;
    }
  });
  bus.on('sales:day', ({ record, copies }) => {
    if (!store.open || storefrontWhy() || !copies) return;
    const digital = record.release?.distribution?.digitalFrac ?? 1 - physicalPctOf(year()) / 100;
    const via = copies * digital * (shareNow() / 100); // never more than capPct% of the copies
    const price = record.release?.price ?? RELEASE.price;
    store.month.copies += copies;
    store.month.viaStore += via;
    store.month.margin += (via * price * RELEASE.storeCutPct) / 100;
  });
  bus.on('clock:month', () => {
    for (const r of inEA()) {
      r.ea.months++;
      const fixed = Math.floor((r.result.bugs * EA.bugFixPct) / 100);
      r.result.bugs -= fixed;
      r.ea.fixed += fixed;
      let trust = 0;
      if (r.ea.months > EA.okMonths) {
        trust = EA.trustPerMonth;
        loseTrust(r, trust);
      }
      bus.emit('ea:month', { record: r, fixed, trust });
      if (r.ea.months >= EA.maxMonths) fullLaunch(r.number);
    }
    // The storefront settles once a month.
    if (store.open && !storefrontWhy()) {
      const m = store.month;
      const share = shareNow();
      let third = 0;
      for (const c of consoles()?.consoles ?? []) if (c.status !== 'retired') third += (consoles().thirdPartyCount(c) * (c.installBase / 1000) * S.thirdPartyPerThousand * share) / 100;
      const margin = Math.round(m.margin);
      third = Math.round(third);
      if (margin) eco().add('credits', margin, 'Storefront: your games', 'sales');
      if (third) eco().add('credits', third, 'Storefront: third-party games', 'sales');
      eco().spend('credits', S.opCost, 'Storefront Ops running costs', 'facilities');
      const row = { month: Math.floor(clock.totalDays / clock.daysPerMonth), share, copies: Math.round(m.copies), viaStore: Math.round(m.viaStore), margin, thirdParty: third, opCost: S.opCost, net: margin + third - S.opCost };
      store.history.push(row);
      if (store.history.length > 60) store.history.shift();
      const T = store.totals;
      Object.assign(T, { margin: T.margin + margin, thirdParty: T.thirdParty + third, opCost: T.opCost + S.opCost, viaStore: T.viaStore + row.viaStore, copies: T.copies + row.copies });
      bus.emit('storefront:month', { month: row });
    }
    store.month = blankMonth();
  });

  const api = {
    physicalPctOf,
    physicalNow: () => physicalPctOf(year()),
    EA,
    effectsOf,
    effectsNow: (mode) => effectsOf(mode, year()),
    pressingCost: (record, mode) => pressingCostOf(record.result.scope, mode, year()),
    shapeCurve,
    isNeutral,
    eaWhy,
    startEA,
    inEA,
    fullLaunchWhy,
    fullLaunch,
    storefrontWhy,
    setStorefront,
    shareNow,
    get storefront() {
      return store;
    },
    newGame() {
      store = { open: false, month: blankMonth(), history: [], totals: { margin: 0, thirdParty: 0, opCost: 0, viaStore: 0, copies: 0 } };
    },
    serialize: () => JSON.parse(JSON.stringify({ store })),
    load(data) {
      const s = data?.store;
      store = s ? JSON.parse(JSON.stringify(s)) : { open: false, month: blankMonth(), history: [], totals: { margin: 0, thirdParty: 0, opCost: 0, viaStore: 0, copies: 0 } };
    },
  };
  business.setDistribution?.(api);
  return api;
}
