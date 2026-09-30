// Hardware foundation (Milestone 23, bible §32 / §33). Saved with the studio. Every number is in data/hardware.js.
//
// Fully optional: nothing else needs it. Console work opens with the Hardware Prototype Lab (F28: Year 11 + HW2
// research). A design picks one component per slot (CPU, Graphics, Memory, Storage / Media, Controller, System
// Features); a component needs HW research of its tier (tier 6 "Prestige" parts stay locked for the secrets). The
// console family gets a name. Building a prototype is a project like an engine (core ProjectSystem, three phases,
// mostly Programmers and Producers, Credits every day, the team is busy); when it is done the prototype is kept with
// its seven ratings (from the parts, pure) and its validation: required checks (reliability, developer friendliness,
// unit cost, a CPU / GPU that match) — plain reasons when one fails — and capability checks (3D, online, streaming
// worlds, a digital store) that say what games it could run. Manufacturing and sales are Milestone 24.
//
// Milestone 25: a later generation starts from the console on sale (designNext: its family and parts, to reuse or
// upgrade); each part already built into an earlier prototype takes CONSOLE.generations.reuseWorkPct off the work.
//
// Events: 'hardware:start' { job }, 'hardware:prototype' { prototype, first }.
import { ProjectSystem } from '../../../../core/ProjectSystem.js';
import { HW_SLOTS, COMPONENTS, componentById, componentsOf, HW_RATINGS, HARDWARE as H } from '../../data/hardware.js';
import { CONSOLE } from '../../data/consoles.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r0 = (x) => Math.round(clamp(x, 0, 100));

// The seven ratings of a set of parts ({ CPU: id, GPU: id, … }) — pure.
export function ratingsFor(parts) {
  const p = Object.fromEntries(HW_SLOTS.map((s) => [s.id, componentById(parts[s.id])]));
  if (HW_SLOTS.some((s) => !p[s.id])) return null;
  const all = Object.values(p);
  const unitCost = all.reduce((t, c) => t + c.cost, 0);
  const performance = 0.4 * p.CPU.perf + 0.4 * p.GPU.perf + 0.2 * p.MEM.perf + 0.1 * (p.STO.perf - 50);
  const relAvg = all.reduce((t, c) => t + c.rel, 0) / all.length;
  const relMin = Math.min(...all.map((c) => c.rel));
  const reliability = relAvg - ((relAvg - relMin) * H.weakestPct) / 100;
  const devFriendly = 0.3 * p.CPU.dev + 0.25 * p.GPU.dev + 0.25 * p.MEM.dev + 0.2 * p.SYS.dev;
  const online = 0.8 * p.SYS.online + 0.2 * p.STO.online;
  const usability = 0.6 * p.CTL.use + 0.4 * p.STO.use;
  const costEfficiency = 100 - (unitCost - H.costPivot) / H.costPerPoint + (performance - 50) / 2;
  const appeal = all.reduce((t, c) => t + c.appeal, 0) / all.length;
  const launchAppeal = 0.3 * clamp(performance, 0, 100) + 0.3 * appeal + 0.15 * usability + 0.1 * online + 0.15 * clamp(costEfficiency, 0, 100);
  const out = { performance, costEfficiency, reliability, devFriendly, online, usability, launchAppeal };
  for (const k of Object.keys(out)) out[k] = r0(out[k]);
  out.unitCost = unitCost;
  return out;
}

// Validation — pure: { passed, required: [{ id, name, ok, why }], capabilities: [{ id, name, ok, why }] }.
export function validate(parts, ratings = ratingsFor(parts)) {
  const K = H.checks;
  const cpu = componentById(parts.CPU);
  const gpu = componentById(parts.GPU);
  const required = [
    { id: 'reliability', name: 'Reliability', ok: ratings.reliability >= K.minReliability, why: `Too unreliable (Reliability ${ratings.reliability}, needs ${K.minReliability}): pick sturdier parts` },
    { id: 'devFriendly', name: 'Developer Friendliness', ok: ratings.devFriendly >= K.minDevFriendly, why: `Too hard to make games for (Developer Friendliness ${ratings.devFriendly}, needs ${K.minDevFriendly})` },
    { id: 'unitCost', name: 'Unit cost', ok: ratings.unitCost <= K.maxUnitCost, why: `Too expensive to make: ${ratings.unitCost} Credits a console (at most ${K.maxUnitCost})` },
    { id: 'balance', name: 'CPU / GPU match', ok: Math.abs(cpu.tier - gpu.tier) <= K.maxTierGap, why: `${cpu.name} and ${gpu.name} don't match: one holds the other back` },
  ];
  const capabilities = H.capabilities.map((c) => ({ id: c.id, name: c.name, ok: componentById(parts[c.slot]).tier >= c.tier, why: c.why }));
  return { passed: required.every((r) => r.ok), required, capabilities };
}

export function createHardware({ bus, clock, world, business, research, studioName = () => 'Studio', extraBusy = () => null, isBusy = () => null, prestigePart = () => false }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;
  const done = () => research?.researched() ?? new Set();
  let prototypes = []; // { id, family, parts, ratings, validation, builtDay, cost, team }
  let nextId = 1;
  let draft = null; // { family, parts }

  // Parts already built into an earlier prototype (reused by a later generation) need less work.
  const reusedOf = (parts) => HW_SLOTS.filter((s) => prototypes.some((p) => p.parts[s.id] === parts[s.id])).length;
  const workOf = (parts) => Math.round((H.work.base + H.work.perTier * HW_SLOTS.reduce((t, s) => t + (componentById(parts[s.id])?.tier ?? 0), 0)) * (1 - (CONSOLE.generations.reuseWorkPct * reusedOf(parts)) / 100));
  const costPerDayOf = (parts) => H.costPerDay.base + H.costPerDay.perTier * HW_SLOTS.reduce((t, s) => t + (componentById(parts[s.id])?.tier ?? 0), 0);

  const system = new ProjectSystem({
    bus: null,
    staff,
    phases: H.phases.map((p) => ({ id: p.id, name: p.name, weights: p.weights })),
    rules: { progressBase: 0, progressDivisor: H.progressDivisor, checkpoints: [] },
    hooks: {
      workerModifier: (job, phase, s) => (world.onDuty(s.id) ? 1 : 0),
      onPhaseStart: (job) => {
        job.phaseTarget = job.data.work * H.phases[job.phaseIndex].share;
      },
      onDay: (job) => {
        job.data.cost += job.data.costPerDay;
        business.economy.spend('credits', job.data.costPerDay, `Hardware: ${job.name}`, 'hardware');
      },
      onComplete: (job) => finish(job),
      now: () => clock.now?.() ?? null,
    },
  });
  const active = () => system.jobs[0] ?? null;

  // --- what is open ------------------------------------------------------------------------------------------------
  const hardwareWhy = () => (world.stationById(H.lab) ? null : 'Needs a Hardware Prototype Lab (Year 11 + Chip Architecture research)');
  function partWhy(id) {
    const c = componentById(id);
    if (!c) return 'Unknown part';
    if (c.tier >= 6 && !prestigePart(id)) return 'Prestige part: locked (a secret)'; // Milestone 29: opened by a hardware secret
    if (c.tier >= 6) return done().has('HW6') ? null : 'Needs HW research tier 6';
    if (!done().has(`HW${c.tier}`)) return `Needs HW research tier ${c.tier}`;
    return null;
  }
  const openParts = (slot) => componentsOf(slot).filter((c) => !partWhy(c.id));

  // The design being made (a starting one: the best open part of each slot that keeps it valid-ish: the lowest tier).
  function ensureDraft() {
    if (!draft) {
      draft = { family: `${studioName().split(' ')[0]} Station`, parts: {} };
    }
    for (const s of HW_SLOTS) if (!draft.parts[s.id] || partWhy(draft.parts[s.id])) draft.parts[s.id] = openParts(s.id)[0]?.id ?? null;
    return draft;
  }
  function pick(slot, id) {
    const c = componentById(id);
    if (!c || c.slot !== slot || partWhy(id)) return false;
    ensureDraft().parts[slot] = id;
    return true;
  }
  // The next generation's design starts from a console's family and parts (keep, or upgrade slot by slot).
  function designNext(family, parts) {
    draft = { family, parts: { ...parts } };
    ensureDraft();
    return draft;
  }
  function rename(name) {
    const n = `${name ?? ''}`.trim().slice(0, 24);
    if (!n) return false;
    ensureDraft().family = n;
    return true;
  }
  const preview = () => {
    const d = ensureDraft();
    const ratings = ratingsFor(d.parts);
    return ratings ? { ...d, ratings, validation: validate(d.parts, ratings), work: workOf(d.parts), reused: reusedOf(d.parts), costPerDay: costPerDayOf(d.parts) } : { ...d, ratings: null, validation: null };
  };

  // --- building ----------------------------------------------------------------------------------------------------
  const busyWhy = (team) => {
    for (const id of team) {
      const why = isBusy(id) ?? extraBusy(id);
      if (why) return `${staff.get(id)?.name ?? id}: ${why.charAt(0).toLowerCase()}${why.slice(1)}`;
    }
    return null;
  };
  function startWhy(team = []) {
    if (hardwareWhy()) return hardwareWhy();
    if (active()) return `Already building: ${active().name}`;
    const d = ensureDraft();
    if (HW_SLOTS.some((s) => !d.parts[s.id])) return 'Pick a part for every slot';
    const cpd = costPerDayOf(d.parts);
    if (business.credits < cpd * 10) return `Needs ${(cpd * 10).toLocaleString('en-GB')} Credits`;
    if (team.length && busyWhy(team)) return busyWhy(team);
    return null;
  }
  function start(team) {
    const why = startWhy(team) ?? (team.length ? null : 'Pick at least one person');
    if (why) return { ok: false, why };
    const d = ensureDraft();
    const n = prototypes.filter((p) => p.family === d.family).length + 1;
    const job = system.createJob({ type: 'hardware', name: `${d.family} prototype ${n}`, phaseTarget: 1, slots: team.length, data: {} });
    job.slots = [...team];
    job.data = { family: d.family, parts: { ...d.parts }, work: workOf(d.parts), costPerDay: costPerDayOf(d.parts), cost: 0, startedDay: today() };
    system.start(job);
    bus.emit('hardware:start', { job });
    return { ok: true, job };
  }
  function finish(job) {
    const d = job.data;
    const ratings = ratingsFor(d.parts);
    const proto = { id: `HW${nextId++}`, name: job.name, family: d.family, parts: { ...d.parts }, ratings, validation: validate(d.parts, ratings), builtDay: today(), startedDay: d.startedDay, cost: d.cost, team: [...job.slots] };
    prototypes.push(proto);
    bus.emit('hardware:prototype', { prototype: proto, first: prototypes.length === 1 });
  }
  bus.on('clock:day', () => system.dailyTick());
  bus.on('staff:removed', ({ staff: s }) => {
    for (const j of system.jobs) j.slots = j.slots.filter((id) => id !== s.id);
  });

  return {
    system,
    hardwareWhy,
    partWhy,
    openParts,
    ensureDraft,
    get draft() {
      return ensureDraft();
    },
    pick,
    rename,
    designNext,
    reusedOf,
    preview,
    startWhy,
    start,
    get prototypes() {
      return prototypes;
    },
    get active() {
      return active();
    },
    jobOf: (id) => system.jobs.find((j) => j.slots.includes(id)) ?? null,
    view() {
      const j = active();
      if (!j) return null;
      const frac = j.phaseTarget ? clamp(j.phaseProgress / j.phaseTarget, 0, 1) : 0;
      const total = H.phases.slice(0, j.phaseIndex).reduce((t, p) => t + p.share, 0) + H.phases[j.phaseIndex].share * frac;
      return { name: j.name, phase: H.phases[j.phaseIndex].name, totalFrac: total, team: [...j.slots], cost: j.data.cost };
    },
    ratingsFor,
    validate,
    RATINGS: HW_RATINGS,
    COMPONENTS,
    newGame() {
      prototypes = [];
      nextId = 1;
      draft = null;
      system.load(null);
    },
    serialize: () => JSON.parse(JSON.stringify({ prototypes, nextId, draft, projects: system.serialize() })),
    load(data) {
      prototypes = JSON.parse(JSON.stringify(data?.prototypes ?? []));
      nextId = data?.nextId ?? 1;
      draft = data?.draft ? JSON.parse(JSON.stringify(data.draft)) : null;
      system.load(data?.projects ?? null);
    },
  };
}
