// Own engine (Milestone 16, bible §19). Saved with the studio. Every number is in data/engines.js.
//
// Engine projects run like game projects (core ProjectSystem, three phases, mostly Programmers' CODE), one at a time,
// at the Engine Lab (F18, research 3D Rendering) or the Code Station (F02) before then. Their own ProjectSystem has
// no event bus, so a finished engine never looks like a finished game; they emit 'engine:start' / 'engine:complete'.
// People on an engine project can't be on a game, a course or be let go (busy).
//
// A finished New Engine / Major Version is a version (v1, v2…) with the eight attributes: from the team's quality
// (like a game's outputs) × each attribute's share + the ENG research done, the strength attributes only from their
// tier; its tier = the highest ENGINE_TIERS row whose research is done (6 is locked). Tool Upgrade / Porting Layer
// add to the current version (v1.1…); a Research Prototype gives RP. Older versions stay usable; every version ages
// (attributes × max(0.6, 1 − 5% a year)).
//
// In a game: New Game may pick an own-engine version (if it has strength for the recipe's Technology). Stability
// lowers bugs, Tooling speeds progress (both from the start); at the end the Technology's strength moves Graphics,
// Performance moves Polish, the tier adds Innovation; Portability makes porting cheaper at release.
// Support cost: each month, every version used by a game in the works or a game still selling costs upkeep (ledger:
// "Own engine").
import { ProjectSystem } from '../../../../core/ProjectSystem.js';
import { ENGINE_ATTRS, ENGINE_TIERS, ENGINE_PROJECTS, ENGINE_PHASES, ENGINE_BALANCE as E, engineProjectById } from '../../data/engines.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r1 = (x) => Math.round(x);

// The attributes a version gets (pure, tested). q: team quality 0–100; done: Set of research ids; tier.
export function attrsFor(q, done, tier) {
  const a = {};
  for (const { key } of ENGINE_ATTRS) {
    const need = E.needs[key];
    const open = key === 'd3' ? tier >= need.tier : need ? tier >= need.tier || done.has(need.research) : true;
    if (!open) {
      a[key] = 0;
      continue;
    }
    let v = q * E.share[key];
    for (const [id, bonus] of Object.entries(E.research)) if (done.has(id)) v += bonus[key] ?? 0;
    v += E.tierBonus[key]?.[tier] ?? 0;
    a[key] = r1(clamp(v, 0, 100));
  }
  return a;
}
// The tier research allows now.
export function tierFor(done) {
  let t = 1;
  for (const row of ENGINE_TIERS) if (!row.locked && row.research.every((id) => done.has(id))) t = Math.max(t, row.tier);
  return t;
}
// A version's attributes after ageing.
export function aged(version, today, daysPerYear) {
  const years = Math.max(0, (today - version.builtDay) / daysPerYear);
  const f = Math.max(E.ageMin, 1 - E.agePerYear * years);
  return Object.fromEntries(Object.entries(version.attrs).map(([k, v]) => [k, r1(v * f)]));
}
// What an engine version does to a game (pure): { bugPct, progressPct, output: { graphics, polish, innovation } }.
export function gameEffects(attrs, tier, technology) {
  const G = E.game;
  const s = attrs[E.techStrength[technology] ?? 'd2'] ?? 0;
  return {
    bugPct: +(attrs.stability * G.bugPctPerStability).toFixed(2),
    progressPct: +(attrs.tooling * G.progressPctPerTooling).toFixed(2),
    output: { graphics: r1((s - G.pivot) * G.graphicsPer), polish: r1((attrs.performance - G.pivot) * G.polishPer), innovation: tier * G.innovationPerTier },
  };
}

export function createEngines({ bus, clock, world, business, projects, research, studioName = () => 'Studio', extraBusy = () => null }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;
  const daysPerYear = () => clock.daysPerMonth * clock.monthsPerYear;
  const done = () => research?.researched() ?? new Set();
  let engines = []; // { id, name, versions: [{ id, major, minor, label, tier, attrs, builtDay }] }
  let nextId = 1;

  const system = new ProjectSystem({
    bus: null,
    staff,
    phases: ENGINE_PHASES.map((p) => ({ id: p.id, name: p.name, weights: p.weights })),
    rules: { progressBase: 0, progressDivisor: E.progressDivisor, checkpoints: [] },
    hooks: {
      workerModifier: (job, phase, s) => (world.onDuty(s.id) ? 1 : 0),
      progressModifier: () => 1 + (world.effect('engineResearchPct') ?? 0) / 100, // the Engine Lab: +15%
      onPhaseStart: (job) => {
        job.phaseTarget = engineProjectById(job.data.kind).work * ENGINE_PHASES[job.phaseIndex].share;
      },
      onDay: (job) => {
        const p = engineProjectById(job.data.kind);
        job.data.cost += p.costPerDay;
        business.economy.spend('credits', p.costPerDay, `Engine: ${job.name}`, 'engine');
        const team = system.teamOf(job).filter((s) => world.onDuty(s.id));
        if (!team.length) return;
        job.data.codeSum += Math.max(...team.map((s) => (s.stats.code ?? 0) * staff.workMultiplier(s)));
        job.data.codeDays++;
      },
      onComplete: (job) => finish(job),
      now: () => clock.now?.() ?? null,
    },
  });
  const active = () => system.jobs[0] ?? null;
  const engineById = (id) => engines.find((e) => e.id === id) ?? null;
  const current = (e) => e?.versions.at(-1) ?? null;
  const versionOf = (engineId, versionId) => engineById(engineId)?.versions.find((v) => v.id === versionId) ?? null;

  function finish(job) {
    const d = job.data;
    const p = engineProjectById(d.kind);
    const q = d.codeDays ? 100 * (1 - Math.exp(-d.codeSum / d.codeDays / E.curveK)) : 0;
    let e = engineById(d.engineId);
    let version = null;
    if (d.kind === 'newEngine' || d.kind === 'majorVersion') {
      if (!e) {
        e = { id: `E${nextId++}`, name: d.name, versions: [] };
        engines.push(e);
      }
      const major = (current(e)?.major ?? 0) + 1;
      const tier = tierFor(done());
      version = { id: `${e.id}v${major}`, major, minor: 0, label: `v${major}`, tier, attrs: attrsFor(q, done(), tier), builtDay: today() };
      e.versions.push(version);
    } else if (p.gains && e) {
      const v = current(e);
      for (const [k, g] of Object.entries(p.gains)) v.attrs[k] = clamp(v.attrs[k] + g, 0, 100);
      v.minor++;
      v.label = `v${v.major}.${v.minor}`;
      version = v;
    } else if (p.rp) {
      const tier = current(e)?.tier ?? 1;
      research?.system.addRp(p.rp.base + p.rp.perTier * tier, `Engine research: ${job.name}`, today());
    }
    bus.emit('engine:complete', { job, engine: e, version, kind: d.kind });
    return { engineId: e?.id ?? null, versionId: version?.id ?? null };
  }

  // --- starting a project ------------------------------------------------------------------------------------------
  // Why this kind can't start now (null = it can).
  function startWhy(kind, team = []) {
    const p = engineProjectById(kind);
    if (!p) return 'Unknown';
    if (active()) return `Already building: ${active().name}`;
    if (!E.facilities.some((id) => world.stationById(id))) return 'Needs a Code Station or the Engine Lab';
    const e = engines[0] ?? null;
    if (kind === 'newEngine' && e) return 'You have an engine: build its next version';
    if (kind !== 'newEngine' && kind !== 'researchPrototype' && !e) return 'Build a New Engine first';
    if (business.credits < p.costPerDay * 10) return `Needs ${(p.costPerDay * 10).toLocaleString('en-GB')} Credits`;
    if (team.length && busyWhy(team)) return busyWhy(team);
    return null;
  }
  const busyWhy = (team) => {
    for (const id of team) {
      const job = projects.jobs.find((j) => j.slots.includes(id));
      if (job) return `${staff.get(id)?.name ?? id} is making ${job.name}`;
      if (world.workerById(id)?.away) return `${staff.get(id)?.name ?? id} is away on a course`;
      if (extraBusy(id)) return `${staff.get(id)?.name ?? id}: ${extraBusy(id).toLowerCase()}`; // Milestone 17: a contract
    }
    return null;
  };
  // Start one. team: staff ids (at least one). Returns { ok, why, job }.
  function start(kind, team, name = null) {
    const why = startWhy(kind, team) ?? (team.length ? null : 'Pick at least one person');
    if (why) return { ok: false, why };
    const e = engines[0] ?? null;
    const p = engineProjectById(kind);
    const engineName = e?.name ?? (name?.trim() || `${studioName().split(' ')[0]} Engine`);
    const label = kind === 'newEngine' ? `${engineName} v1` : kind === 'majorVersion' ? `${engineName} v${(current(e)?.major ?? 0) + 1}` : `${engineName}: ${p.name}`;
    const job = system.createJob({ type: 'engine', name: label, phaseTarget: 1, slots: team.length, data: {} });
    job.slots = [...team];
    job.data = { kind, engineId: e?.id ?? null, name: engineName, cost: 0, codeSum: 0, codeDays: 0, startedDay: today() };
    system.start(job);
    bus.emit('engine:start', { job });
    return { ok: true, job };
  }

  // --- games -------------------------------------------------------------------------------------------------------
  // Every version a New Game can pick for this Technology: [{ engine, version, attrs (aged), ok, why }].
  function choices(technology) {
    const key = E.techStrength[technology] ?? 'd2';
    return engines.flatMap((e) =>
      e.versions.map((v) => {
        const attrs = aged(v, today(), daysPerYear());
        const why = !technology ? null : attrs[key] > 0 ? null : `No ${ENGINE_ATTRS.find((a) => a.key === key).name}`;
        return { engine: e, version: v, attrs, ok: !why, why, label: `${e.name} ${v.label}` };
      }),
    );
  }
  // The snapshot a game keeps (fixed when it starts): { engineId, versionId, label, tier, attrs, fx }.
  function forGame(versionId, technology) {
    const e = engines.find((x) => x.versions.some((v) => v.id === versionId));
    const v = e?.versions.find((x) => x.id === versionId);
    if (!v) return null;
    const attrs = aged(v, today(), daysPerYear());
    return { engineId: e.id, versionId: v.id, label: `${e.name} ${v.label}`, tier: v.tier, attrs, fx: gameEffects(attrs, v.tier, technology) };
  }
  // Porting cost multiplier for a finished game (its engine's portability).
  const portMult = (record) => {
    const pa = record?.result?.engine?.attrs?.portability ?? 0;
    return 1 + (pa * E.portCostPctPerPortability) / 100;
  };

  // --- upkeep ------------------------------------------------------------------------------------------------------
  // The versions in use now: a game in the works, or a released game still selling.
  function liveVersions() {
    const ids = new Set();
    for (const j of projects.jobs) if (j.data.engine?.versionId) ids.add(j.data.engine.versionId);
    for (const r of projects.catalogue.list()) if (r.result.engine?.versionId && r.release && business.statusOf(r) === 'Selling') ids.add(r.result.engine.versionId);
    return [...ids];
  }
  const upkeepOf = (versionId) => {
    const e = engines.find((x) => x.versions.some((v) => v.id === versionId));
    const v = e?.versions.find((x) => x.id === versionId);
    return v ? E.upkeep.base + E.upkeep.perTier * v.tier : 0;
  };
  bus.on('clock:month', () => {
    for (const id of liveVersions()) {
      const cost = upkeepOf(id);
      if (cost) business.economy.spend('credits', cost, `Own engine upkeep: ${engines.find((x) => x.versions.some((v) => v.id === id))?.name} ${id.split('v')[1] ? `v${id.split('v')[1]}` : ''}`.trim(), 'engine');
    }
  });
  bus.on('clock:day', () => system.dailyTick()); // after the games (created later than the projects)

  return {
    system,
    get engines() {
      return engines;
    },
    get active() {
      return active();
    },
    engineById,
    current,
    versionOf,
    startWhy,
    start,
    choices,
    forGame,
    portMult,
    liveVersions,
    upkeepOf,
    aged: (v) => aged(v, today(), daysPerYear()),
    tierNow: () => tierFor(done()),
    jobOf: (id) => system.jobs.find((j) => j.slots.includes(id)) ?? null,
    busyIds: () => system.jobs.flatMap((j) => j.slots),
    view() {
      const j = active();
      if (!j) return null;
      const frac = j.phaseTarget ? clamp(j.phaseProgress / j.phaseTarget, 0, 1) : 0;
      const total = ENGINE_PHASES.slice(0, j.phaseIndex).reduce((t, p) => t + p.share, 0) + ENGINE_PHASES[j.phaseIndex].share * frac;
      return { name: j.name, kind: j.data.kind, phase: ENGINE_PHASES[j.phaseIndex].name, totalFrac: total, team: [...j.slots], cost: j.data.cost };
    },
    rename(id, name) {
      const e = engineById(id);
      const n = `${name ?? ''}`.trim().slice(0, 24);
      if (!e || !n) return false;
      e.name = n;
      return true;
    },
    projectTypes: ENGINE_PROJECTS,
    newGame() {
      engines = [];
      nextId = 1;
      system.load(null);
    },
    serialize: () => JSON.parse(JSON.stringify({ engines, nextId, projects: system.serialize() })),
    load(data) {
      engines = JSON.parse(JSON.stringify(data?.engines ?? []));
      nextId = data?.nextId ?? 1;
      system.load(data?.projects ?? null);
    },
  };
}
