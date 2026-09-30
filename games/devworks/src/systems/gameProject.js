// Game projects (Milestones 3–7): one game at a time, made in five phases (on screen: milestones) on core
// ProjectSystem, with DEVWORKS rules plugged in through its hooks. Every number is in data/balance.js
// (PROJECT_BALANCE), where the formulas are also written out in words.
//
// Determinism: a project carries its own seeded random state (job.data.rng), taken from the studio's seeded Rng
// when it starts and saved with it, and everything runs on whole days. The same save and choices give the same
// progress, bugs, breakthroughs and outputs. The state at Gold Master becomes the game's review seed (bible §14).
// Money (Milestone 4): charge(amount, reason) pays the audio package at the start and production every day.
// Founder perk (Milestone 5b, data/setup.js): founder() → { id, perk } or null. While the founder is on the team their
// perk stat counts statPct more (progress and outputs), bugs made change by bugPct while they are on duty, a finished
// game they are credited on gets the outputBonus, and (Tess) the schedule slip narrows by scheduleVariancePct.
//
// Milestone 7: six scopes; budget focus per phase (a change waits for the next milestone); milestone role weights per
// scope (prodShift); a seeded schedule slip and a deadline; bugs from scope, recipe complexity, low Code, tiredness,
// schedule pressure, focus and crunch; decision points at Beta (end of Alpha / Beta) and Gold (end of Gold Master):
// Ship / Delay / Cut Feature / Outsource QA / Crunch. While a decision is open nobody works on the game (the studio
// pauses the clock and asks). Traits with outputBonus (Good Feel, Strong Shapes, Sharp Dialogue) add to the game.
// Crunch days are kept per person (staffHistory) for their staff card.
//
// Milestone 10: project types (Original / Sequel / Spin-off / Remake / Remaster, FRANCHISE_BALANCE.types): the work and
// daily cost scale with the type; a Remake / Remaster starts from the old game's outputs (floor, then its bonus). The
// finished game carries its type, franchise (ipId) and the game it came from (source).
//
// Milestone 11: facility effects (world.effect, data/facilities.js): statPct.<stat> on that stat's progress, progressPct
// and phasePct.<phase> on progress, bugFixPct on fixing, output.* / outputLarge.* points and outputPct.graphics on the
// finished game.
//
// Milestone 13: game lanes (bible §35: S2 / S3 have 2). Every job runs on its own; jobs lists them, active is the
// first (the one the studio's card shows), decisionJob the first waiting for a Beta / Gold choice. Nobody can be on
// two games at once (busyIds).
//
// Milestone 15: combos (src/systems/combos.js): fixed from the recipe when the game starts — output points at the end,
// production cost, QA load (bugs) and the cover nudge; the finished game carries its combos and the launch effects.
//
// Milestone 16: an own-engine version (setup.engine, engineFor → src/systems/engines.js forGame): fixed when the game
// starts — Stability lowers bugs, Tooling speeds progress — and at the end its strength for the recipe's Technology
// moves Graphics, Performance moves Polish, the tier adds Innovation. The finished game remembers the engine.
//
// Events on the bus: 'project:start' / 'project:phase' / 'project:complete' (core), plus 'project:bug' { count },
// 'project:fix' { count }, 'project:breakthrough' { key, points }, 'project:decision' { job, point } and
// 'project:decided' { job, point, choice }.
import { ProjectSystem } from '../../../../core/ProjectSystem.js';
import { JobHistory } from '../../../../core/JobHistory.js';
import { Rng } from '../../../../core/Rng.js';
import { PROJECT_BALANCE, FRANCHISE_BALANCE } from '../../data/balance.js';
import { PHASE_NAMES, OUTPUTS } from '../../data/projects.js';
import { STAT_KEYS } from '../../data/staff.js';
import { coverFor, coverFamilyFor } from '../../data/covers.js';
import { combosFor, comboEffects } from './combos.js';
import { LOCALISATION } from '../../data/global.js';

// --- the formulas (pure, tested in tests/devworks) -----------------------------------------------------
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const LAST = PROJECT_BALANCE.phases.length - 1;
const BETA_END = PROJECT_BALANCE.phases.findIndex((p) => p.id === 'alphaBeta');

// A team strength (roughly the stat level behind an output) → a quality 0–100 that flattens towards 100.
export function qualityCurve(strength, K = PROJECT_BALANCE.curveK) {
  return strength > 0 ? 100 * (1 - Math.exp(-strength / K)) : 0;
}

// The milestone role weights for a phase of a scope: the phase's weights × (1 − prodShift), then PROD + prodShift.
export function phaseWeights(scope, phaseIndex, B = PROJECT_BALANCE) {
  const base = B.phases[phaseIndex].weights;
  const shift = B.scopes[scope]?.prodShift ?? 0;
  const out = {};
  for (const k of STAT_KEYS) out[k] = (base[k] ?? 0) * (1 - shift);
  out.prod += shift;
  return out;
}

export const focusOf = (id, B = PROJECT_BALANCE) => B.budgetFocus[id] ?? {};

// Recipe complexity (bible §20): the scope's own plus each element's; a cut feature package no longer counts.
export function recipeComplexity(recipe, scope = 'tiny', cut = false, B = PROJECT_BALANCE) {
  let c = B.scopes[scope]?.complexity ?? 0;
  for (const [family, id] of Object.entries(recipe ?? {})) if (!(cut && family === 'feature')) c += B.complexity[id] ?? 0;
  return c;
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
// current: this phase's quality so far and how far through it is. AUDIO = the package. bonus = breakthroughs and
// other points. Milestone 7: phaseFocus[i] = the budget focus phase i ran with (quality / innovation %), scope adds
// its qualityBonus, polishCap (Outsource QA) limits POLISH.
export function outputsFrom({ phaseQuality = [], currentQuality = null, currentIndex = 0, currentFrac = 0, audio = 'none', bonus = {}, phaseFocus = [], scope = null, polishCap = null }, B = PROJECT_BALANCE) {
  const out = {};
  const mult = (i, key) => {
    const f = focusOf(phaseFocus[i] ?? 'balanced', B);
    return (1 + (f.qualityPct ?? 0) / 100) * (key === 'innovation' ? 1 + (f.innovationPct ?? 0) / 100 : 1);
  };
  const extra = scope ? (B.scopes[scope]?.qualityBonus ?? 0) : 0;
  for (const { key } of OUTPUTS) {
    if (key === 'audio') {
      out.audio = Math.round(clamp(B.audio[audio]?.value ?? 0, 0, 100));
      continue;
    }
    let built = 0;
    phaseQuality.forEach((q, i) => (built += B.phases[i].emphasis[key] * (q[key] ?? 0) * mult(i, key)));
    if (currentQuality) built += B.phases[currentIndex].emphasis[key] * (currentQuality[key] ?? 0) * clamp(currentFrac, 0, 1) * mult(currentIndex, key);
    let v = clamp(B.outputStart + ((100 - B.outputStart) * Math.min(100, built)) / 100 + extra + (bonus[key] ?? 0), 0, 100);
    if (key === 'polish' && polishCap != null) v = Math.min(v, polishCap);
    out[key] = Math.round(v);
  }
  return out;
}

// Bugs made in one worked day (before the seeded roll of the fraction). Milestone 7: × (1 + complexity) × schedule
// pressure (behind = how far the work trails the calendar, 0–1) × (1 + bugPct / 100) from focus and crunch.
export function bugsForDay({ scope = 'tiny', phaseIndex, bestCode, avgEnergy, complexity = 0, behind = 0, bugPct = 0 }, B = PROJECT_BALANCE) {
  const low = clamp(1.6 - bestCode / B.bugs.lowCodeRef, 0.6, 1.6);
  const tired = 1 + (B.bugs.tiredWeight * (100 - avgEnergy)) / 100;
  const pressure = 1 + (B.schedule.pressureBugPct / 100) * clamp(behind, 0, 1);
  return B.scopes[scope].bugsPerDay * B.phases[phaseIndex].bugMult * low * tired * (1 + complexity) * pressure * (1 + bugPct / 100);
}

// Bugs fixed in one worked day (before the roll). bugFixPct from traits (Bug Hunter).
export function fixesForDay({ phaseIndex, bestCode, bugFixPct = 0 }, B = PROJECT_BALANCE) {
  return B.phases[phaseIndex].fixPerDay * (bestCode / B.bugs.fixCodeRef) * (1 + bugFixPct / 100);
}

// How many days a team should need for a scope: each phase's work ÷ the team's daily progress at full strength,
// ÷ dutyFactor (breaks). teamStats: [stats]. Used for the deadline (× 1 + buffer).
export function estimateDays(teamStats, scope, B = PROJECT_BALANCE) {
  if (!teamStats.length) return Infinity;
  let days = 0;
  B.phases.forEach((p, i) => {
    const w = phaseWeights(scope, i, B);
    let score = 0;
    for (const st of teamStats) for (const k of STAT_KEYS) score += (st[k] ?? 0) * w[k];
    days += (B.scopes[scope].totalWork * p.share) / (score / B.progressDivisor);
  });
  return days / B.schedule.dutyFactor;
}

// The seeded slip range after the perks: variancePct < 0 narrows it (Tess, the Producer Desk), > 0 widens it.
export function slipRange(variancePct = 0, B = PROJECT_BALANCE) {
  const k = Math.max(0, 1 + variancePct / 100);
  return { min: B.schedule.slip.min * k, max: B.schedule.slip.max * k };
}

// Whole number from a fraction with a seeded roll: 1.3 → 1, or 2 with 30% chance.
const rollCount = (x, rng) => Math.floor(x) + (rng.next() < x - Math.floor(x) ? 1 : 0);

// --- the system ---------------------------------------------------------------------------------------
// The founder's perk as a multiplier on one of a worker's stats (1 for everyone else).
export function founderStatMult(founder, staffId, statKey) {
  const perk = founder?.perk;
  return perk && founder.id === staffId && perk.stat === statKey ? 1 + (perk.statPct ?? 0) / 100 : 1;
}

// studioVariancePct() → the studio's own schedule effect (the Producer Desk while it stands).
// Milestone 29: recipeBonus(recipe) → a known secret recipe's bonus ({ output, tailPct, franchisePct, recipes }) or null,
// fixed when the game starts like a combo.
export function createGameProjects({ engineFor = () => null, recipeBonus = () => null, bus, world, clock = null, charge = null, founder = () => null, studioVariancePct = () => 0, B = PROJECT_BALANCE }) {
  const staff = world.staffSystem;
  const fx = (key) => world.effect?.(key) ?? 0; // Milestone 11: the facilities' effects
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
  const catalogue = new JobHistory({ bus }); // finished games
  let staffHistory = {}; // staffId → { crunchDays, crunches } (Milestone 7)
  const phases = B.phases.map((p) => ({ id: p.id, name: PHASE_NAMES[p.id], weights: Object.fromEntries(STAT_KEYS.map((k) => [k, 1])) }));
  const today = () => clock?.totalDays ?? 0;

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
  // How far through the whole project (0–1).
  const totalFrac = (job) => {
    const frac = job.phaseTarget ? clamp(job.phaseProgress / job.phaseTarget, 0, 1) : 0;
    return clamp(B.phases.slice(0, job.phaseIndex).reduce((t, p) => t + p.share, 0) + B.phases[job.phaseIndex].share * frac, 0, 1);
  };
  // Schedule pressure: how far the work trails the calendar (0 = on or ahead of it).
  const behindOf = (job) => {
    const d = job.data;
    if (d.deadlineDay == null) return 0;
    const span = Math.max(1, d.deadlineDay - d.startedDay);
    return Math.max(0, (today() - d.startedDay) / span - totalFrac(job));
  };
  // Old saves (Milestones 3–6) have none of the Milestone 7 fields.
  function normalise(job) {
    const d = job.data;
    d.focus ??= d.budget ?? 'balanced';
    d.pendingFocus ??= null;
    d.phaseFocus ??= Array.from({ length: job.phaseIndex + 1 }, () => d.focus);
    d.workScale ??= 1;
    d.deadlineDay ??= null;
    d.cut ??= false;
    d.outsourced ??= false;
    d.polishCap ??= null;
    d.delays ??= 0;
    d.crunchLeft ??= 0;
    d.crunchDays ??= 0;
    d.crunched ??= false;
    d.decision ??= null;
    d.decisions ??= [];
    d.hype ??= 0;
    d.combos ??= []; // Milestone 15 (a game started before it keeps none)
    d.engine ??= null; // Milestone 16
    d.deal ??= null; // Milestone 17: a publisher deal (its id)
    d.localised ??= null; // Milestone 21: null | 'studio' (paid by the studio) | 'publisher' (a global deal pays it)
    d.type ??= 'original'; // Milestone 10
    d.costMult ??= 1;
    return job;
  }
  const decisionOpen = (job) => !!job?.data.decision;

  const system = new ProjectSystem({
    bus,
    staff,
    history: catalogue,
    phases,
    rules: { progressBase: 0, progressDivisor: B.progressDivisor, checkpoints: [] },
    hooks: {
      // Only leads on duty work; someone on a break adds nothing that day; nobody works while a decision waits.
      workerModifier: (job, phase, s) => (world.onDuty(s.id) && !decisionOpen(job) ? 1 : 0),
      // The milestone role weights for this scope and phase, and the founder perk.
      statModifier: (job, phase, s, k) => phaseWeights(job.data.scope, job.phaseIndex, B)[k] * founderStatMult(founder(), s.id, k) * (1 + fx(`statPct.${k}`) / 100),
      progressModifier: (job) => (1 + (job.data.engine?.fx.progressPct ?? 0) / 100) * (job.data.crunchLeft > 0 ? 1 + B.decisions.crunch.progressPct / 100 : 1) * (1 + (fx('progressPct') + fx(`phasePct.${B.phases[job.phaseIndex].id}`)) / 100),
      onPhaseStart: (job) => {
        const d = job.data;
        if (d.pendingFocus) [d.focus, d.pendingFocus] = [d.pendingFocus, null];
        d.phaseFocus[job.phaseIndex] = d.focus;
        job.phaseTarget = B.scopes[d.scope].totalWork * B.phases[job.phaseIndex].share * d.workScale;
        d.acc = { sum: {}, days: 0 };
      },
      onDay: (job) => {
        const d = job.data;
        const focus = focusOf(d.focus, B);
        const cost = Math.round(B.scopes[d.scope].baseCostPerDay * (1 + (focus.costPct ?? 0) / 100) * d.costMult);
        d.cost += cost;
        charge?.(cost, `Production: ${job.name}`);
        if (decisionOpen(job)) return; // waiting for the player: no work, no bugs, no ideas
        // Gold Master done: stop just short and ask (Ship / Delay / Cut / Outsource).
        if (job.phaseIndex === LAST && job.phaseProgress >= job.phaseTarget) {
          job.phaseProgress = job.phaseTarget * 0.999999;
          openDecision(job, 'gold');
        }
        const team = onDutyTeam(job);
        if (!team.length) return; // everyone on a break: no work, no bugs, no ideas
        const members = team.map((s) => ({ stats: statsOf(s), mult: staff.workMultiplier(s) }));
        const str = outputStrengths(members, B);
        d.acc.days++;
        for (const [k, v] of Object.entries(str)) d.acc.sum[k] = (d.acc.sum[k] ?? 0) + v;
        const crunching = d.crunchLeft > 0;
        if (crunching) {
          d.crunchLeft--;
          d.crunchDays++;
          for (const s of team) {
            staff.changeMorale(s, B.decisions.crunch.moraleDay);
            const h = (staffHistory[s.id] ||= { crunchDays: 0, crunches: 0 });
            h.crunchDays++;
          }
        }
        const bestCode = Math.max(...team.map((s) => s.stats.code ?? 0));
        const avgEnergy = team.reduce((t, s) => t + s.energy, 0) / team.length;
        const bugFixPct = staff.groupEffect(team, 'bugFixPct') + fx('bugFixPct') + (['FEA02', 'FEA03'].includes(d.recipe.feature) ? fx('onlineQaPct') : 0); // Milestone 18: NovaNet
        const founderBug = 1 + (founderIn(team.map((s) => s.id))?.perk.bugPct ?? 0) / 100;
        const bugPct = (focus.bugPct ?? 0) + (crunching ? B.decisions.crunch.bugPct : 0) + comboEffects(d.combos).bugPct + (d.engine?.fx.bugPct ?? 0); // Milestone 15: QA load; Milestone 16: engine Stability
        const complexity = recipeComplexity(d.recipe, d.scope, d.cut, B);
        const behind = behindOf(job);
        withRng(job, (r) => {
          const made = rollCount(bugsForDay({ scope: d.scope, phaseIndex: job.phaseIndex, bestCode, avgEnergy, complexity, behind, bugPct }, B) * founderBug, r);
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
        if (job.phaseIndex === BETA_END) openDecision(job, 'beta');
      },
      onComplete: (job) => {
        const d = job.data;
        const team = system.teamOf(job);
        const bonus = { ...d.bonus };
        const add = (map) => {
          for (const [k, v] of Object.entries(map ?? {})) bonus[k] = (bonus[k] ?? 0) + v;
        };
        add(founderIn(job.slots)?.perk.outputBonus);
        add(staff.groupEffectMap(team, 'outputBonus')); // Milestone 7: Good Feel, Strong Shapes, Sharp Dialogue
        const cfx = comboEffects(d.combos); // Milestone 15
        add(cfx.output);
        add(d.secretRecipe?.output); // Milestone 29: a secret recipe
        add(d.engine?.fx.output); // Milestone 16: the own engine
        for (const id of job.slots) {
          const s = staff.get(id);
          if (s) s.assigned = false;
        }
        const finishedDay = today();
        // Milestone 10: a Remake / Remaster keeps at least the old game's outputs × floor, then adds its bonus.
        const outputs = outputsFrom({ phaseQuality: d.phaseQuality, audio: d.audio, bonus, phaseFocus: d.phaseFocus, scope: d.scope, polishCap: d.polishCap }, B);
        // Milestone 11: facilities add points (and the Art Render Farm makes Graphics stronger).
        const large = ['large', 'blockbuster', 'mega'].includes(d.scope);
        for (const k of Object.keys(outputs)) outputs[k] = Math.round(clamp(outputs[k] * (1 + fx(`outputPct.${k}`) / 100) + fx(`output.${k}`) + (large ? fx(`outputLarge.${k}`) : 0), 0, 100));
        if (d.polishCap != null) outputs.polish = Math.min(outputs.polish, d.polishCap);
        const T = FRANCHISE_BALANCE.types[d.type] ?? FRANCHISE_BALANCE.types.original;
        if (d.sourceOutputs && T.floor) {
          for (const k of Object.keys(outputs)) if (k !== 'audio') outputs[k] = Math.round(clamp(Math.max(outputs[k], d.sourceOutputs[k] * T.floor) + (T.bonus?.[k] ?? 0), 0, 100));
          if (d.polishCap != null) outputs.polish = Math.min(outputs.polish, d.polishCap);
        }
        const hypePcts = d.phaseFocus.map((f) => focusOf(f, B).hypePct ?? 0);
        return {
          title: job.name,
          scope: d.scope,
          recipe: { ...d.recipe },
          audio: d.audio,
          budget: d.budget,
          budgetByPhase: [...d.phaseFocus],
          outputs,
          bugs: d.bugs,
          breakthroughs: d.breakthroughs.length,
          cost: Math.round(d.cost),
          cover: d.projectOne ? 'cover_27' : coverFor(d.recipe, cfx.cover), // Milestone 31: PROJECT ONE's cover (Prestige Mixed Media)
          projectOne: !!d.projectOne, // the art key (a parked family shows its fallback's picture); Milestone 15: a combo's nudge
          coverFamily: coverFamilyFor(d.recipe, cfx.cover), // Milestone 6: one of the 30 families
          combos: [...d.combos], // Milestone 15: what the launch and the franchise read
          engine: d.engine ? { engineId: d.engine.engineId, versionId: d.engine.versionId, label: d.engine.label, tier: d.engine.tier, attrs: { ...d.engine.attrs } } : null, // Milestone 16
          comboFx: { casualPct: cfx.casualPct, corePct: cfx.corePct, tailPct: cfx.tailPct + (d.secretRecipe?.tailPct ?? 0), trust: cfx.trust, franchisePct: cfx.franchisePct + (d.secretRecipe?.franchisePct ?? 0), artAwardScore: cfx.artAwardScore, hardwareDemandPct: cfx.hardwareDemandPct },
          reviewSeed: d.rng, // locked at Gold Master: reviews come from this, so a reload never changes them
          // Milestone 7: the schedule and the choices made.
          startedDay: d.startedDay,
          finishedDay,
          deadlineDay: d.deadlineDay,
          lateDays: d.deadlineDay == null ? 0 : Math.max(0, finishedDay - d.deadlineDay),
          slip: d.slip ?? 0,
          decisions: d.decisions.map((x) => ({ ...x })),
          cut: d.cut,
          outsourced: d.outsourced,
          localised: d.localised ?? null, // Milestone 21
          crunchDays: d.crunchDays,
          hypeDelta: d.hype, // Milestone 9 reads these (Hype)
          hypePct: Math.round(hypePcts.reduce((a, b) => a + b, 0) / Math.max(1, hypePcts.length)),
          type: d.type, // Milestone 10: the project type, its franchise and the game it came from
          ipId: d.ipId ?? null,
          source: d.source ?? null,
        };
      },
      now: () => (clock ? clock.now() : null),
    },
  });

  function openDecision(job, point) {
    job.data.decision = { point, day: today() };
    bus?.emit('project:decision', { job, point });
  }

  // The choices open at the current decision point: [{ id, ok, why }].
  function options(job = api.decisionJob ?? api.active) {
    const d = job?.data;
    if (!d?.decision) return [];
    const point = d.decision.point;
    const why = {
      ship: null,
      delay: d.delays >= B.decisions.delay.maxUses ? `Already delayed ${d.delays} times` : null,
      cut: d.cut ? 'Already cut' : null,
      outsource: d.outsourced ? 'Already outsourced' : null,
      crunch: point === 'gold' ? 'Nothing left to rush' : d.crunched ? 'Already crunched' : null,
    };
    return Object.entries(why).map(([id, w]) => ({ id, ok: !w, why: w }));
  }

  // The player's choice at a decision point. Returns true when it was applied.
  function decide(choice, job = api.decisionJob ?? api.active) {
    const d = job?.data;
    if (!d?.decision) return false;
    const opt = options(job).find((o) => o.id === choice);
    if (!opt?.ok) return false;
    const point = d.decision.point;
    const D = B.decisions;
    const total = B.scopes[d.scope].totalWork;
    const remainingGold = () => Math.max(0, job.phaseTarget - job.phaseProgress);
    d.decisions.push({ point, choice, day: today() });
    let keepOpen = false;
    if (choice === 'delay') {
      d.delays++;
      job.phaseTarget += (total * D.delay.workPct) / 100; // Gold Master (we are in it at both points)
      d.bonus.polish = (d.bonus.polish ?? 0) + D.delay.polish;
      d.hype += D.delay.hype;
    } else if (choice === 'cut') {
      d.cut = true;
      const gone = Math.round((d.bugs * D.cut.bugsPct) / 100);
      d.bugs -= gone;
      if (gone) bus?.emit('project:fix', { job, count: gone });
      job.phaseTarget = job.phaseProgress + remainingGold() * (1 - D.cut.workPct / 100);
      d.bonus.innovation = (d.bonus.innovation ?? 0) - D.cut.innovation;
      d.hype += D.cut.hype;
      keepOpen = point === 'gold';
    } else if (choice === 'outsource') {
      d.outsourced = true;
      const price = B.scopes[d.scope].baseCostPerDay * D.outsource.costDays;
      d.cost += price;
      charge?.(price, `Outsourced QA: ${job.name}`);
      const gone = Math.round((d.bugs * D.outsource.bugsPct) / 100);
      d.bugs -= gone;
      if (gone) bus?.emit('project:fix', { job, count: gone });
      job.phaseTarget = job.phaseProgress + remainingGold() * (1 - D.outsource.workPct / 100);
      d.polishCap = D.outsource.polishCap;
      keepOpen = point === 'gold';
    } else if (choice === 'crunch') {
      d.crunched = true;
      d.crunchLeft = D.crunch.days;
      for (const id of job.slots) (staffHistory[id] ||= { crunchDays: 0, crunches: 0 }).crunches++;
    }
    d.decision = keepOpen ? d.decision : null;
    bus?.emit('project:decided', { job, point, choice });
    if (choice === 'ship' && point === 'gold') system.completePhase(job); // → "Game finished!"
    return true;
  }

  // Energy: Push Quality and Crunch make the team's work more tiring (the studio asks every working day).
  world.setEnergyLossMultiplier?.((s) => {
    const job = system.jobs.find((j) => j.slots.includes(s.id)); // Milestone 13: their own game
    if (!job) return 1;
    const f = focusOf(job.data.focus, B);
    return (1 + (f.energyPct ?? 0) / 100) * (job.data.crunchLeft > 0 ? 1 + B.decisions.crunch.energyPct / 100 : 1);
  });

  const api = {
    system,
    catalogue,
    phases,
    options,
    decide,
    get active() {
      return system.jobs[0] ?? null;
    },
    // Milestone 13: every game in the works (one per lane), the first one waiting for a choice, and who is busy.
    get jobs() {
      return system.jobs;
    },
    get decisionJob() {
      return system.jobs.find((j) => j.data.decision) ?? null;
    },
    get decision() {
      return api.decisionJob?.data.decision ?? null;
    },
    busyIds: () => system.jobs.flatMap((j) => j.slots),
    jobById: (id) => system.jobs.find((j) => j.id === id) ?? null,
    get staffHistory() {
      return staffHistory;
    },

    // What a team would need for a scope (and project type, Milestone 10): { days, deadlineDays } (the New Game screen).
    estimate(teamIds, scope, type = 'original', localised = false) {
      const days = estimateDays(teamIds.map((id) => staff.get(id)).filter(Boolean).map(statsOf), scope, B) * (FRANCHISE_BALANCE.types[type]?.workMult ?? 1) * (localised ? 1 + LOCALISATION.workPct / 100 : 1); // Milestone 21
      return { days, deadlineDays: Math.round(days * (1 + B.schedule.buffer)) };
    },

    // Start a game. setup: { title, recipe: { genre, theme, gameplay, technology, artDirection, feature },
    //   scope, audio, budget, team: [staffId], type?, ipId?, source? (Milestone 10: catalogue number of the old game) }. rng: the studio's seeded Rng (one number is taken from it).
    start(setup, rng) {
      const job = system.createJob({ type: 'game', name: setup.title, phaseTarget: 1, slots: setup.team.length, data: {} });
      job.slots = [...setup.team];
      const seed = Math.floor(rng.next() * 4294967296);
      const slipRng = new Rng(`${seed}|slip`);
      const variance = (founderIn(job.slots)?.perk.scheduleVariancePct ?? 0) + studioVariancePct() + (focusOf(setup.budget, B).variancePct ?? 0);
      const range = slipRange(variance, B);
      const slip = +(range.min + slipRng.next() * (range.max - range.min)).toFixed(4);
      const type = FRANCHISE_BALANCE.types[setup.type] ? setup.type : 'original';
      const T = FRANCHISE_BALANCE.types[type];
      const src = setup.source != null ? catalogue.get(setup.source) : null;
      const combos = combosFor(setup.recipe); // Milestone 15
      const cfx = comboEffects(combos);
      // Milestone 21: localisation — more work; the studio pays more a day unless a global deal pays it.
      const loc = setup.localise === 'publisher' ? 'publisher' : setup.localise === 'on' ? 'studio' : null;
      const locWork = loc ? 1 + LOCALISATION.workPct / 100 : 1;
      const locCost = loc === 'studio' ? 1 + (LOCALISATION.costPct * (1 + fx('localisationCostPct') / 100)) / 100 : 1;
      const est = api.estimate(job.slots, setup.scope, type, !!loc);
      job.data = {
        scope: setup.scope,
        recipe: { ...setup.recipe },
        audio: setup.audio,
        budget: setup.budget,
        focus: setup.budget,
        pendingFocus: null,
        phaseFocus: [],
        startedDay: today(),
        deadlineDay: today() + est.deadlineDays,
        slip,
        workScale: (1 + slip) * T.workMult * locWork,
        localised: loc,
        type,
        costMult: +(T.costMult * (1 + cfx.costPct / 100) * locCost).toFixed(4), // Milestone 15: a combo's production cost; Milestone 21: localisation
        combos,
        secretRecipe: recipeBonus(setup.recipe) ?? null, // Milestone 29
        projectOne: !!setup.projectOne, // Milestone 31: the PROJECT ONE template
        engine: setup.engine ? engineFor(setup.engine, setup.recipe.technology) : null, // Milestone 16: a snapshot
        deal: setup.deal ?? null, // Milestone 17: the publisher deal this game is made under (src/systems/publishers.js)
        ipId: setup.ipId ?? null,
        source: src ? src.number : null,
        sourceOutputs: src && T.floor ? { ...src.result.outputs } : null,
        rng: new Rng(seed).getState(),
        cost: Math.round((B.audio[setup.audio]?.cost ?? 0) * (1 + fx(`audioCostPct.${setup.audio}`) / 100)), // Milestone 18: EchoSound
        bugs: 0,
        bonus: {},
        breakthroughs: [],
        phaseQuality: [],
        acc: { sum: {}, days: 0 },
        cut: false,
        outsourced: false,
        polishCap: null,
        delays: 0,
        crunchLeft: 0,
        crunchDays: 0,
        crunched: false,
        decision: null,
        decisions: [],
        hype: 0,
      };
      for (const id of job.slots) {
        const s = staff.get(id);
        if (s) s.assigned = true;
      }
      if (job.data.cost) charge?.(job.data.cost, `Audio package: ${setup.title}`);
      return system.start(job);
    },

    // Budget focus: takes effect when the next milestone starts (bible §12: only at milestone boundaries).
    setFocus(id, job = api.active) {
      if (!job || !B.budgetFocus[id]) return false;
      job.data.pendingFocus = id === job.data.focus ? null : id;
      return true;
    },

    // The live view of a job: phase, progress per phase, days, outputs so far, bugs, cost, schedule.
    view(job = api.active) {
      if (!job) return null;
      const d = job.data;
      const frac = job.phaseTarget ? job.phaseProgress / job.phaseTarget : 0;
      const done = totalFrac(job);
      const elapsed = today() - d.startedDay;
      // Projected finish from the pace so far (the first days have no pace yet: the deadline stands in).
      const projected = done > 0.02 ? d.startedDay + Math.round(elapsed / done) : d.deadlineDay;
      return {
        id: job.id,
        title: job.name,
        scope: d.scope,
        phaseIndex: job.phaseIndex,
        phaseName: phases[job.phaseIndex].name,
        phaseFrac: clamp(frac, 0, 1),
        phaseFracs: phases.map((_, i) => (i < job.phaseIndex ? 1 : i === job.phaseIndex ? clamp(frac, 0, 1) : 0)),
        totalFrac: done,
        days: job.day,
        outputs: outputsFrom({ phaseQuality: d.phaseQuality, currentQuality: qualityOf(d.acc), currentIndex: job.phaseIndex, currentFrac: frac, audio: d.audio, bonus: d.bonus, phaseFocus: d.phaseFocus, scope: d.scope, polishCap: d.polishCap }, B),
        bugs: d.bugs,
        breakthroughs: d.breakthroughs.length,
        cost: Math.round(d.cost),
        recipe: d.recipe,
        team: [...job.slots],
        focus: d.focus,
        pendingFocus: d.pendingFocus,
        deadlineDay: d.deadlineDay,
        projectedDay: projected,
        status: d.deadlineDay == null ? 'none' : today() > d.deadlineDay ? 'late' : projected > d.deadlineDay ? 'behind' : 'onTrack',
        crunchLeft: d.crunchLeft,
        decision: d.decision,
        cut: d.cut,
        outsourced: d.outsourced,
      };
    },

    serialize: () => ({ projects: system.serialize(), catalogue: catalogue.serialize(), staffHistory: JSON.parse(JSON.stringify(staffHistory)) }),
    load(data) {
      system.load(data?.projects);
      catalogue.load(data?.catalogue);
      staffHistory = JSON.parse(JSON.stringify(data?.staffHistory ?? {}));
      system.jobs.forEach(normalise);
    },
  };

  // Projects work after the studio's day (Energy, breaks) has been settled, in the same order every time.
  bus.on('clock:day', () => system.dailyTick());
  return api;
}
