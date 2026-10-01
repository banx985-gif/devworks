// Buying, selling and stage upgrades (Milestone 11, bible §35 / §36). The layout rules live in the world
// (studioWorld: footprints, seats, the walkway); this adds the money and the unlocks.
//   status(id) → { def, owned, hidden, ok, why }: can it be bought now (and if not, why)?
//   buy(id)    → { ok, why, station }: placed on its home spot or the first free one, then paid; move it in Build Mode
//   sell(id)   → { ok, why, refund }: 50% back; the desks and the Break Area stay; not while someone works there
//   next()     → the next stage, with its requirements [{ label, ok }], ok and why; upgrade() moves up (and pays)
// Milestone 22: S4 Corporate HQ (Rank A + 3 major awards) and S5 Global Campus (Rank S + Year 16); facilities with a
// stage unlock wait for it.
// Research is Milestone 12 (researched() is empty until then) and awards Milestone 19 (state.awards, with a debug
// award so S3 can be reached before then). Secret facilities (F34 / F35) stay hidden.
//
// Milestone 40e: facility levels 1–3 (data FACILITY_LEVELS, the world's core/FacilityLevels): levelStatus(id) → { level,
// max, pending, next: { to, cost, days, rank, ok, why } }; upgradeFacility(id) pays and starts it (finished on a later
// day: 'facility:levelUp'); selling pays back SELL_BACK_PCT of the price and of every upgrade.
//
// Events: 'facility:bought' { station, cost }, 'facility:sold' { id, refund }, and the world's 'studio:stage'.
import { FACILITIES, FACILITY_LEVELS, facilityById, SELL_BACK_PCT, KEEP, STAGES, stageById } from '../../data/facilities.js';
import { FAME } from '../../data/balance.js';
import { researchById } from '../../data/research.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';

// Milestone 33: discountPct(id) — an NG+ facility blueprint's first purchase costs that % less (usedDiscount(id) after).
export function createFacilityShop({ bus, world, business, clock, projects, researched = () => new Set(), secretOpen = () => false, discountPct = () => 0, usedDiscount = () => {} }) {
  const rankIndex = () => business.reputation.highestRankIndex;
  const released = () => projects.catalogue.list().filter((r) => r.release);
  const awards = () => business.state.awards ?? 0;
  const majorAwards = () => business.state.majorAwards ?? 0; // Milestone 22: S4
  const trophies = awards; // awards and trophies are the same thing until Milestone 19

  // Why a facility can't be bought yet (null = it can), from its unlock rule.
  function lockReason(def) {
    const u = def.unlock ?? {};
    const why = [];
    if (u.rank && rankIndex() < rankIndexOf(FAME.ranks, u.rank)) why.push(`Rank ${u.rank}`);
    if (u.year && clock.year < u.year) why.push(`Year ${u.year}`);
    for (const id of u.research ?? []) if (!researched().has(id)) why.push(`Research ${researchById(id)?.name ?? id}`);
    if (u.trophies && trophies() < u.trophies) why.push(u.trophies === 1 ? 'a first trophy' : `${u.trophies} trophies`);
    if (u.story && !released().some((r) => (r.result.outputs?.story ?? 0) >= u.story)) why.push(`a released game with Story ${u.story}+`);
    if (u.stage && world.stage < u.stage) why.push(`the ${stageById(u.stage).name}`); // Milestone 22
    return why.length ? `Needs ${why.join(' + ')}` : null;
  }

  const priceOf = (def) => Math.round((def.cost * (100 - (discountPct(def.id) ?? 0))) / 100);
  function status(id) {
    const def = facilityById(id);
    if (!def) return null;
    const price = priceOf(def);
    const owned = !!world.stationById(id);
    const hidden = !!def.unlock?.secret && !secretOpen(def.id); // Milestone 29: F34 / F35 open with their secret
    const why = owned ? 'Already in the studio' : hidden ? 'Secret' : lockReason(def) ?? (business.credits < price ? `Needs ${price.toLocaleString('en-GB')} Credits` : null);
    return { def, owned, hidden, ok: !why, why, price, discount: price < def.cost };
  }

  function buy(id) {
    const s = status(id);
    if (!s?.ok) return { ok: false, why: s?.why ?? 'Unknown facility' };
    const st = world.addStation(id);
    if (!st) return { ok: false, why: 'No free spot: make room or move up a stage' };
    business.economy.spend('credits', s.price, `Built: ${s.def.name}${s.discount ? ' (NG+ blueprint)' : ''}`, 'facilities');
    if (s.discount) usedDiscount(id);
    bus?.emit('facility:bought', { station: st, cost: s.price });
    return { ok: true, station: st };
  }

  const refundOf = (id) => Math.round((((facilityById(id)?.cost ?? 0) + (world.levels?.invested(id) ?? 0)) * SELL_BACK_PCT) / 100); // Milestone 40e: upgrades too
  function sellWhy(id) {
    const st = world.stationById(id);
    if (!st) return 'Not in the studio';
    if (KEEP[id]) return KEEP[id];
    const user = world.workers.find((w) => w.station === st);
    if (user) return `${user.staff.name.split(' ')[0]} works here`;
    return null;
  }
  function sell(id) {
    const why = sellWhy(id);
    if (why) return { ok: false, why };
    const refund = refundOf(id);
    world.removeStation(id);
    world.levels?.remove(id); // Milestone 40e: its levels go with it
    business.economy.add('credits', refund, `Sold: ${facilityById(id).name}`, 'facilities');
    bus?.emit('facility:sold', { id, refund });
    return { ok: true, refund };
  }

  // The next stage and what it needs.
  function next() {
    const st = STAGES.find((s) => s.id === world.stage + 1);
    if (!st) return null;
    const u = st.unlock;
    const reqs = [];
    if (u.rank) reqs.push({ label: `Rank ${u.rank}`, ok: rankIndex() >= rankIndexOf(FAME.ranks, u.rank) });
    if (u.released) reqs.push({ label: `${u.released} released games (${Math.min(u.released, released().length)} so far)`, ok: released().length >= u.released });
    if (u.awards) reqs.push({ label: u.awards === 1 ? 'An award won (Compete → Awards)' : `${u.awards} awards won`, ok: awards() >= u.awards }); // Milestone 19: real awards
    if (u.majorAwards) reqs.push({ label: `${u.majorAwards} major awards (C04 and up; ${Math.min(u.majorAwards, majorAwards())} so far)`, ok: majorAwards() >= u.majorAwards }); // Milestone 22
    if (u.year) reqs.push({ label: `Year ${u.year}`, ok: clock.year >= u.year });
    reqs.push({ label: `${st.cost.toLocaleString('en-GB')} Credits`, ok: business.credits >= st.cost });
    const miss = reqs.find((r) => !r.ok);
    return { stage: st, reqs, ok: !miss, why: miss ? `Needs ${miss.label}` : null };
  }
  // Milestone 40e: facility levels.
  const LV = FACILITY_LEVELS;
  function levelStatus(id) {
    const def = facilityById(id);
    if (!def || !world.stationById(id)) return null;
    const lv = world.levels.level(id);
    const pending = world.levels.pending(id);
    let nx = null;
    if (lv < LV.max) {
      const to = lv + 1;
      const cost = Math.round((def.cost * LV.costPct[to - 1]) / 100);
      const rank = LV.rank[to - 1];
      const why = pending ? `Upgrading: ready on day ${pending.doneDay - clock.totalDays > 0 ? `${pending.doneDay - clock.totalDays} more` : 'today'}` : rank && rankIndex() < rankIndexOf(FAME.ranks, rank) ? `Needs Rank ${rank}` : business.credits < cost ? `Needs ${cost.toLocaleString('en-GB')} Credits` : null;
      nx = { to, cost, days: LV.days[to - 1], rank, ok: !why, why };
    }
    return { level: lv, max: LV.max, pending, next: nx, mult: world.levels.mult(id, def.levelMult ?? null) };
  }
  function upgradeFacility(id) {
    const s = levelStatus(id);
    if (!s?.next?.ok) return { ok: false, why: s?.next?.why ?? (s ? 'Top level' : 'Not in the studio') };
    const def = facilityById(id);
    business.economy.spend('credits', s.next.cost, `Upgrade: ${def.name} to level ${s.next.to}`, 'facilities');
    return world.levels.start(id, { cost: s.next.cost, today: clock.totalDays, days: s.next.days });
  }
  bus?.on('clock:day', () => world.levels.tick(clock.totalDays));

  function upgrade() {
    const n = next();
    if (!n?.ok) return { ok: false, why: n?.why ?? 'Already the biggest studio for now' };
    business.economy.spend('credits', n.stage.cost, `Moved to the ${n.stage.name}`, 'facilities');
    world.setStage(n.stage.id);
    return { ok: true, stage: n.stage };
  }

  return {
    status,
    buy,
    sell,
    sellWhy,
    refundOf,
    next,
    upgrade,
    levelStatus, // Milestone 40e
    upgradeFacility,
    lockReason,
    stage: () => stageById(world.stage),
    // The shop list: every facility not hidden, open ones first, then locked, then owned.
    list: () =>
      FACILITIES.map((f) => status(f.id))
        .filter((s) => !s.hidden)
        .sort((a, b) => a.owned - b.owned || !!lockReason(a.def) - !!lockReason(b.def) || a.def.cost - b.def.cost),
  };
}
