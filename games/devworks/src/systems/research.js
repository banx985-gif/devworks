// The research tree (Milestone 12, bible §37) on core ResearchSystem + UnlockRunner. The 36 topics and the RP numbers
// are in data/research.js (RESEARCH, RP_BALANCE), where the rules are written out.
//
// Each topic's unlock actions are worked out from the data that waits on it: the recipe elements whose unlock names
// it ({ type: 'element' }) and the facilities that need it ({ type: 'facility' }). Completing a topic fires them once;
// the element unlocks and the facility shop then see the topic as done (researched()), and anything else a thing
// needs (Advanced 3D also needs Rank B; the Hardware Prototype Lab also needs Year 11) still applies.
//
// The queue: core research needs a worker on a queue. Until hiring (Milestone 13) brings researchers, the studio
// researches as a team: the queue's worker is the built-in 'studio' researcher (stat 0), so a topic advances
// RP_BALANCE.workPerDay a day × (1 + the facilities' progressPct + researchPct). Queue 2 is the later / VIP hook
// (closed). RP: every day (base + on-duty workers at research stations), each release (review × scope), and firsts
// (a genre's first release, each element's first release).
//
// Events (core): 'research:rp', 'research:start', 'research:stop', 'research:complete'.
import { ResearchSystem } from '../../../../core/ResearchSystem.js';
import { UnlockRunner } from '../../../../core/UnlockActions.js';
import { RESEARCH, RP_BALANCE } from '../../data/research.js';
import { ELEMENTS } from '../../data/elements.js';
import { FACILITIES } from '../../data/facilities.js';

export const STUDIO_RESEARCHER = 'studio';

// What completing a topic opens (the data that waits on it).
export function unlocksOf(id) {
  return [
    ...ELEMENTS.filter((e) => e.unlock?.research === id).map((e) => ({ type: 'element', id: e.id })),
    ...FACILITIES.filter((f) => (f.unlock?.research ?? []).includes(id)).map((f) => ({ type: 'facility', id: f.id })),
  ];
}

// Every topic's prerequisites first (for debug complete-all and the tests).
export function topoOrder(nodes = RESEARCH) {
  const out = [];
  const seen = new Set();
  const visit = (n, path = new Set()) => {
    if (seen.has(n.id)) return;
    if (path.has(n.id)) throw new Error(`research cycle at ${n.id}`);
    path.add(n.id);
    for (const r of n.requires) visit(nodes.find((x) => x.id === r), path);
    path.delete(n.id);
    seen.add(n.id);
    out.push(n.id);
  };
  for (const n of nodes) visit(n);
  return out;
}

export function createResearch({ bus, clock, world, R = RP_BALANCE }) {
  const runner = new UnlockRunner({ bus });
  const team = { id: STUDIO_RESEARCHER, name: 'The studio', stats: {} };
  const system = new ResearchSystem({
    bus,
    nodes: RESEARCH.map((r) => ({ id: r.id, name: r.name, cost: r.rp, requires: [...r.requires], actions: unlocksOf(r.id) })),
    queues: [
      { id: 'main', name: 'Research' },
      { id: 'second', name: 'Second queue', rule: { later: 'vip' } }, // the later / VIP convenience hook: closed
    ],
    runner,
    staff: { get: (id) => (id === STUDIO_RESEARCHER ? team : world.staffSystem.get(id)) },
    rules: { basePerDay: R.workPerDay, statDivisor: 35 },
    hooks: {
      conditionMet: (rule) => !rule?.later,
      workerStat: () => 0,
      speedPct: () => (world.effect?.('progressPct') ?? 0) + (world.effect?.('researchPct') ?? 0),
    },
  });
  let carry = 0; // daily RP fractions

  // Today's RP: the base, plus every on-duty worker at a research station (their best stat ÷ statDiv).
  function dailyRp() {
    let rp = R.daily.base;
    for (const w of world.workers) {
      if (!w.station || !R.researchStations.includes(w.station.id) || !world.onDuty(w.id)) continue;
      rp += Math.max(...Object.values(w.staff.stats)) / R.daily.statDiv;
    }
    return rp;
  }
  bus.on('clock:day', () => {
    const exact = dailyRp() + carry;
    const whole = Math.floor(exact);
    carry = +(exact - whole).toFixed(6);
    if (whole) system.addRp(whole, 'Studio research', clock.totalDays);
    system.dailyTick();
  });
  // A release: review × scope, and the firsts.
  bus.on('game:released', ({ record }) => {
    const g = record.result;
    const rel = record.release;
    system.addRp(rel.score * R.release.perReview * (R.release.scopeMult[g.scope] ?? 1), `Released ${g.title}`, clock.totalDays);
    if (g.recipe?.genre && system.firstTime('genre', g.recipe.genre)) system.addRp(R.firsts.genre, 'First game in a genre', clock.totalDays);
    let n = 0;
    for (const id of Object.values(g.recipe ?? {})) if (system.firstTime('element', id)) n++;
    if (n) system.addRp(n * R.firsts.element, `${n} element${n === 1 ? '' : 's'} used for the first time`, clock.totalDays);
  });

  const api = {
    system,
    runner,
    get rp() {
      return system.rp;
    },
    get active() {
      return system.queues[0].nodeId;
    },
    status: (id) => system.status(id),
    missing: (id) => system.missing(id),
    fraction: (id) => system.fraction(id),
    daysLeft: () => system.daysLeft(0),
    perDay: () => system.perDay(0),
    dailyRp,
    researched: () => new Set(system.done),
    // Why a topic can't start now (null = it can).
    why(id) {
      if (system.status(id) === 'locked') return `Needs ${system.missing(id).nodes.map((x) => system.node(x).name).join(' and ')}`;
      const c = system.canStart(0, id);
      if (c.ok) return null;
      if (c.reason === 'Locked') return `Needs ${system.missing(id).nodes.map((x) => system.node(x).name).join(' and ')}`;
      if (c.reason === 'Not enough RP') return `Needs ${system.costOf(id)} RP`;
      return c.reason;
    },
    start: (id) => system.start(0, id, STUDIO_RESEARCHER),
    stop: () => system.stop(0),
    // ?debug=1 / tests: finish a topic now (its prerequisites first).
    complete(id) {
      const order = topoOrder().filter((x) => x === id || isBefore(x, id));
      for (const x of order) system.complete(x);
      return system.isDone(id);
    },
    completeAll() {
      for (const x of topoOrder()) system.complete(x);
    },
    newGame() {
      system.reset();
      runner.reset();
      carry = 0;
    },
    serialize: () => ({ tree: system.serialize(), unlocked: runner.serialize(), carry }),
    // A save from before Milestone 12: nothing researched, no RP.
    load(data) {
      system.load(data?.tree ?? null);
      runner.load(data?.unlocked ?? null);
      carry = data?.carry ?? 0;
    },
  };
  // Is x a (transitive) prerequisite of id?
  function isBefore(x, id) {
    const n = RESEARCH.find((r) => r.id === id);
    return n.requires.some((r) => r === x || isBefore(x, r));
  }
  return api;
}
