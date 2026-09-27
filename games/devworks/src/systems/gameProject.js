// Game projects (Milestones 3–4): one Tiny game at a time, made in five phases (on screen: milestones) on core
// ProjectSystem, with DEVWORKS rules plugged in through its hooks. Every number is in data/balance.js
// (PROJECT_BALANCE), where the formulas are also written out in words.
//
// Determinism: a project carries its own seeded random state (job.data.rng), taken from the studio's seeded Rng
// when it starts and saved with it, and everything runs on whole days. The same save and choices give the same
// progress, bugs, breakthroughs and outputs. The state at Gold Master becomes the game's review seed (bible §14).
// Money (Milestone 4): charge(amount, reason) pays the audio package at the start and production every day.
// Founder perk (Milestone 5b, data/setup.js): founder() → { id, perk } or null. While the founder is on the team their
// perk stat counts statPct more (progress and outputs), bugs made change by bugPct while they are on duty, and a
// finished game they are credited on gets the outputBonus.
//
// Events on the bus: 'project:start' / 'project:phase' / 'project:complete' (core), plus 'project:bug' { count },
// 'project:fix' { count } and 'project:breakthrough' { key, points }.
import { ProjectSystem } from '../../../../core/ProjectSystem.js';
import { JobHistory } from '../../../../core/JobHistory.js';
import { Rng } from '../../../../core/Rng.js';
import { PROJECT_BALANCE } from '../../data/balance.js';
import { PHASE_NAMES, OUTPUTS } from '../../data/projects.js';
import { STAT_KEYS } from '../../data/staff.js';
import { coverFor, coverFamilyFor } from '../../data/covers.js';

// --- the formulas (pure, tested in tests/devworks) -----------------------------------------------------
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A team strength (roughly the stat level behind an output) → a quality 0–100 that flattens towards 100.
export function qualityCurve(strength, K = PROJECT_BALANCE.curveK) {
  return strength > 0 ? 100 * (1 - Math.exp(-strength / K)) : 0;
}

// One day's strength behind each output from the leads on duty: their best stat in each key, mixed per output,
// times their average workMultiplier. members: [{ stats, mult }]. Returns { gameplay: n, ... } (no audio).
export function outputStrengths(members, B = PROJECT_BALANCE) {
  const out = {};
  if (!members.length) return out;
  const best = {};
  for (const k of STAT_KEYS) best[k] = Math.max(...members.map((m) => m.stats[k] ?? 0));
  const mult = members.reduce((t, m) => t + m.mult, 0) / members.length;
  for (const [key, mix] of Object.entries(B.outputMix)) {
    let v = 0;
    for (const [k, w] of Object.entries(mix)) v += best[k] * w;
    out[key] = v * mult;
  }
  return out;
}

// The output stats (0–100, whole numbers) of a job so far. phaseQuality: the finished phases' quality per output;
// current: this phase's quality so far and how far through it is. AUDIO = the package. bonus = breakthroughs.
export function outputsFrom({ phaseQuality = [], currentQuality = null, currentIndex = 0, currentFrac = 0, audio = 'none', bonus = {} }, B = PROJECT_BALANCE) {
  const out = {};
  for (const { key } of OUTPUTS) {
    if (key === 'audio') {
      out.audio = Math.round(clamp(B.audio[audio]?.value ?? 0, 0, 100));
      continue;
    }
    let built = 0;
    phaseQuality.forEach((q, i) => (built += B.phases[i].emphasis[key] * (q[key] ?? 0)));
    if (currentQuality) built += B.phases[currentIndex].emphasis[key] * (currentQuality[key] ?? 0) * clamp(currentFrac, 0, 1);
    out[key] = Math.round(clamp(B.outputStart + ((100 - B.outputStart) * built) / 100 + (bonus[key] ?? 0), 0, 100));
  }
  return out;
}

// Bugs made in one worked day (before the seeded roll of the fraction).
export function bugsForDay({ scope = 'tiny', phaseIndex, bestCode, avgEnergy }, B = PROJECT_BALANCE) {
  const low = clamp(1.6 - bestCode / B.bugs.lowCodeRef, 0.6, 1.6);
  const tired = 1 + (B.bugs.tiredWeight * (100 - avgEnergy)) / 100;
  return B.scopes[scope].bugsPerDay * B.phases[phaseIndex].bugMult * low * tired;
}

// Bugs fixed in one worked day (before the roll). bugFixPct from traits (Bug Hunter).
export function fixesForDay({ phaseIndex, bestCode, bugFixPct = 0 }, B = PROJECT_BALANCE) {
  return B.phases[phaseIndex].fixPerDay * (bestCode / B.bugs.fixCodeRef) * (1 + bugFixPct / 100);
}

// Whole number from a fraction with a seeded roll: 1.3 → 1, or 2 with 30% chance.
const rollCount = (x, rng) => Math.floor(x) + (rng.next() < x - Math.floor(x) ? 1 : 0);

// --- the system ---------------------------------------------------------------------------------------
// The founder's perk as a multiplier on one of a worker's stats (1 for everyone else).
export function founderStatMult(founder, staffId, statKey) {
  const perk = founder?.perk;
  return perk && founder.id === staffId && perk.stat === statKey ? 1 + (perk.statPct ?? 0) / 100 : 1;
}

export function createGameProjects({ bus, world, clock = null, charge = null, founder = () => null, B = PROJECT_BALANCE }) {
  const staff = world.staffSystem;
  // A worker's stats with the founder perk applied (outputs), and the perk's own numbers.
  const statsOf = (s) => {
    const f = founder();
    if (!f || f.id !== s.id) return s.stats;
    const out = { ...s.stats };
    out[f.perk.stat] = (out[f.perk.stat] ?? 0) * founderStatMult(f, s.id, f.perk.stat);
    return out;
  };
  const founderIn = (ids) => {
    const f = founder();
    return f && ids.includes(f.id) ? f : null;
  };
  const catalogue = new JobHistory({ bus }); // finished games (data only for now)
  const phases = B.phases.map((p) => ({ id: p.id, name: PHASE_NAMES[p.id], weights: p.weights }));

  const withRng = (job, fn) => {
    const r = new Rng(1);
    r.setState(job.data.rng);
    const v = fn(r);
    job.data.rng = r.getState();
    return v;
  };
  const onDutyTeam = (job) => system.teamOf(job).filter((s) => world.onDuty(s.id));
  const qualityOf = (acc) => {
    const q = {};
    for (const key of Object.keys(B.outputMix)) q[key] = acc.days ? qualityCurve(acc.sum[key] / acc.days, B.curveK) : 0;
    return q;
  };

  const system = new ProjectSystem({
    bus,
    staff,
    history: catalogue,
    phases,
    rules: { progressBase: 0, progressDivisor: B.progressDivisor, checkpoints: [] },
    hooks: {
      // Only leads on duty work; someone on a break adds nothing that day.
      workerModifier: (job, phase, s) => (world.onDuty(s.id) ? 1 : 0),
      statModifier: (job, phase, s, k) => founderStatMult(founder(), s.id, k),
      onPhaseStart: (job) => {
        job.phaseTarget = B.scopes[job.data.scope].totalWork * B.phases[job.phaseIndex].share;
        job.data.acc = { sum: {}, days: 0 };
      },
      onDay: (job) => {
        const team = onDutyTeam(job);
        const d = job.data;
        const today = B.scopes[d.scope].baseCostPerDay;
        d.cost += today;
        charge?.(today, `Production: ${job.name}`);
        if (!team.length) return; // everyone on a break: no work, no bugs, no ideas
        const members = team.map((s) => ({ stats: statsOf(s), mult: staff.workMultiplier(s) }));
        const str = outputStrengths(members, B);
        d.acc.days++;
        for (const [k, v] of Object.entries(str)) d.acc.sum[k] = (d.acc.sum[k] ?? 0) + v;
        const bestCode = Math.max(...team.map((s) => s.stats.code ?? 0));
        const avgEnergy = team.reduce((t, s) => t + s.energy, 0) / team.length;
        const bugFixPct = staff.groupEffect(team, 'bugFixPct');
        const bugMult = 1 + (founderIn(team.map((s) => s.id))?.perk.bugPct ?? 0) / 100;
        withRng(job, (r) => {
          const made = rollCount(bugsForDay({ scope: d.scope, phaseIndex: job.phaseIndex, bestCode, avgEnergy }, B) * bugMult, r);
          if (made) {
            d.bugs += made;
            bus?.emit('project:bug', { job, count: made });
          }
          const fixed = Math.min(d.bugs, rollCount(fixesForDay({ phaseIndex: job.phaseIndex, bestCode, bugFixPct }, B), r));
          if (fixed) {
            d.bugs -= fixed;
            bus?.emit('project:fix', { job, count: fixed });
          }
          if (r.next() < B.breakthrough.chancePerDay) {
            const keys = Object.keys(B.outputMix);
            const key = keys[Math.floor(r.next() * keys.length)];
            const points = B.breakthrough.min + Math.floor(r.next() * (B.breakthrough.max - B.breakthrough.min + 1));
            d.bonus[key] = (d.bonus[key] ?? 0) + points;
            d.breakthroughs.push({ day: job.day, key, points });
            bus?.emit('project:breakthrough', { job, key, points });
          }
        });
      },
      onPhaseComplete: (job) => {
        job.data.phaseQuality.push(qualityOf(job.data.acc));
      },
      onComplete: (job) => {
        const d = job.data;
        const bonus = { ...d.bonus };
        for (const [k, v] of Object.entries(founderIn(job.slots)?.perk.outputBonus ?? {})) bonus[k] = (bonus[k] ?? 0) + v;
        for (const id of job.slots) {
          const s = staff.get(id);
          if (s) s.assigned = false;
        }
        return {
          title: job.name,
          scope: d.scope,
          recipe: { ...d.recipe },
          audio: d.audio,
          budget: d.budget,
          outputs: outputsFrom({ phaseQuality: d.phaseQuality, audio: d.audio, bonus }, B),
          bugs: d.bugs,
          breakthroughs: d.breakthroughs.length,
          cost: Math.round(d.cost),
          cover: coverFor(d.recipe), // the art key (a parked family shows its fallback's picture)
          coverFamily: coverFamilyFor(d.recipe), // Milestone 6: one of the 30 families
          reviewSeed: d.rng, // locked at Gold Master: reviews come from this, so a reload never changes them
        };
      },
      now: () => (clock ? clock.now() : null),
    },
  });

  const api = {
    system,
    catalogue,
    phases,
    get active() {
      return system.jobs[0] ?? null;
    },

    // Start a game. setup: { title, recipe: { genre, theme, gameplay, technology, artDirection, feature },
    //   scope, audio, budget, team: [staffId] }. seed: the studio's seeded Rng (one number is taken from it).
    start(setup, rng) {
      const job = system.createJob({ type: 'game', name: setup.title, phaseTarget: 1, slots: setup.team.length, data: {} });
      job.slots = [...setup.team];
      job.data = {
        scope: setup.scope,
        recipe: { ...setup.recipe },
        audio: setup.audio,
        budget: setup.budget,
        startedDay: clock?.totalDays ?? 0,
        rng: new Rng(Math.floor(rng.next() * 4294967296)).getState(),
        cost: B.audio[setup.audio]?.cost ?? 0,
        bugs: 0,
        bonus: {},
        breakthroughs: [],
        phaseQuality: [],
        acc: { sum: {}, days: 0 },
      };
      for (const id of job.slots) {
        const s = staff.get(id);
        if (s) s.assigned = true;
      }
      if (job.data.cost) charge?.(job.data.cost, `Audio package: ${setup.title}`);
      return system.start(job);
    },

    // The live view of a job: phase, progress per phase, days, outputs so far, bugs, cost.
    view(job = api.active) {
      if (!job) return null;
      const d = job.data;
      const frac = job.phaseTarget ? job.phaseProgress / job.phaseTarget : 0;
      return {
        title: job.name,
        phaseIndex: job.phaseIndex,
        phaseName: phases[job.phaseIndex].name,
        phaseFrac: clamp(frac, 0, 1),
        phaseFracs: phases.map((_, i) => (i < job.phaseIndex ? 1 : i === job.phaseIndex ? clamp(frac, 0, 1) : 0)),
        totalFrac: clamp((B.phases.slice(0, job.phaseIndex).reduce((t, p) => t + p.share, 0) + B.phases[job.phaseIndex].share * clamp(frac, 0, 1)), 0, 1),
        days: job.day,
        outputs: outputsFrom({ phaseQuality: d.phaseQuality, currentQuality: qualityOf(d.acc), currentIndex: job.phaseIndex, currentFrac: frac, audio: d.audio, bonus: d.bonus }, B),
        bugs: d.bugs,
        breakthroughs: d.breakthroughs.length,
        cost: Math.round(d.cost),
        recipe: d.recipe,
        team: [...job.slots],
      };
    },

    serialize: () => ({ projects: system.serialize(), catalogue: catalogue.serialize() }),
    load(data) {
      system.load(data?.projects);
      catalogue.load(data?.catalogue);
    },
  };

  // Projects work after the studio's day (Energy, breaks) has been settled, in the same order every time.
  bus.on('clock:day', () => system.dailyTick());
  return api;
}
