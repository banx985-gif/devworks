// Buying, selling and stage upgrades (Milestone 11, bible §35 / §36). The layout rules live in the world
// (studioWorld: footprints, seats, the walkway); this adds the money and the unlocks.
//   status(id) → { def, owned, hidden, ok, why }: can it be bought now (and if not, why)?
//   buy(id)    → { ok, why, station }: placed on its home spot or the first free one, then paid; move it in Build Mode
//   sell(id)   → { ok, why, refund }: 50% back; the desks and the Break Area stay; not while someone works there
//   next()     → the next stage, with its requirements [{ label, ok }], ok and why; upgrade() moves up (and pays)
// Research is Milestone 12 (researched() is empty until then) and awards Milestone 19 (state.awards, with a debug
// award so S3 can be reached before then). Secret facilities (F34 / F35) stay hidden.
//
// Events: 'facility:bought' { station, cost }, 'facility:sold' { id, refund }, and the world's 'studio:stage'.
import { FACILITIES, facilityById, SELL_BACK_PCT, KEEP, STAGES, stageById } from '../../data/facilities.js';
import { FAME } from '../../data/balance.js';
import { researchById } from '../../data/research.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';

export function createFacilityShop({ bus, world, business, clock, projects, researched = () => new Set() }) {
  const rankIndex = () => business.reputation.highestRankIndex;
  const released = () => projects.catalogue.list().filter((r) => r.release);
  const awards = () => business.state.awards ?? 0;
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
    return why.length ? `Needs ${why.join(' + ')}` : null;
  }

  function status(id) {
    const def = facilityById(id);
    if (!def) return null;
    const owned = !!world.stationById(id);
    const hidden = !!def.unlock?.secret;
    const why = owned ? 'Already in the studio' : hidden ? 'Secret' : lockReason(def) ?? (business.credits < def.cost ? `Needs ${def.cost.toLocaleString('en-GB')} Credits` : null);
    return { def, owned, hidden, ok: !why, why };
  }

  function buy(id) {
    const s = status(id);
    if (!s?.ok) return { ok: false, why: s?.why ?? 'Unknown facility' };
    const st = world.addStation(id);
    if (!st) return { ok: false, why: 'No free spot: make room or move up a stage' };
    business.economy.spend('credits', s.def.cost, `Built: ${s.def.name}`, 'facilities');
    bus?.emit('facility:bought', { station: st, cost: s.def.cost });
    return { ok: true, station: st };
  }

  const refundOf = (id) => Math.round(((facilityById(id)?.cost ?? 0) * SELL_BACK_PCT) / 100);
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
    if (u.awards) reqs.push({ label: u.awards === 1 ? 'An award (awards come in a later update)' : `${u.awards} awards`, ok: awards() >= u.awards });
    reqs.push({ label: `${st.cost.toLocaleString('en-GB')} Credits`, ok: business.credits >= st.cost });
    const miss = reqs.find((r) => !r.ok);
    return { stage: st, reqs, ok: !miss, why: miss ? `Needs ${miss.label}` : null };
  }
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
    lockReason,
    stage: () => stageById(world.stage),
    // The shop list: every facility not hidden, open ones first, then locked, then owned.
    list: () =>
      FACILITIES.map((f) => status(f.id))
        .filter((s) => !s.hidden)
        .sort((a, b) => a.owned - b.owned || !!lockReason(a.def) - !!lockReason(b.def) || a.def.cost - b.def.cost),
    // ?debug=1: awards arrive in Milestone 19; this stands in for one so S3 can be tried.
    debugAward() {
      business.state.awards = awards() + 1;
    },
  };
}
