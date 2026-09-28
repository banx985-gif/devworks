// Own engine (Milestone 16, bible §19). Plain data only; the rules are src/systems/engines.js. The bible gives the
// attributes, the five project types and the six milestone tiers; every number here is a placeholder (plan review B)
// and is listed in the build log.

// The eight attributes (0–100).
export const ENGINE_ATTRS = [
  { key: 'performance', name: 'Performance' },
  { key: 'tooling', name: 'Tooling' },
  { key: 'stability', name: 'Stability' },
  { key: 'portability', name: 'Portability' },
  { key: 'd2', name: '2D strength' },
  { key: 'd3', name: '3D strength' },
  { key: 'online', name: 'Online strength' },
  { key: 'world', name: 'World / streaming' },
];

// Milestone tiers (bible §19). An engine version gets the highest tier whose research is done when it is finished.
// Tier 6 is prestige: locked (its secret comes later).
export const ENGINE_TIERS = [
  { tier: 1, name: 'Internal Tools', research: [] },
  { tier: 2, name: 'Custom 2D', research: ['ENG1'] },
  { tier: 3, name: 'Early 3D', research: ['ENG3'] },
  { tier: 4, name: 'Advanced 3D', research: ['ENG3', 'ART4'] },
  { tier: 5, name: 'Online / Streaming', research: ['ENG4', 'ENG5'] },
  { tier: 6, name: 'Prestige Toolchain', research: [], locked: true },
];

// Engine projects (bible §19): work (progress needed, like a game's totalWork), cost per day, and what they do.
//   New Engine       the first version (v1) — only when the studio has no engine
//   Major Version    the next version (v2, v3…) built fresh from today's team and research; older versions stay usable
//   Tool Upgrade     the current version gets +tooling / +stability (a minor version, e.g. v1.1)
//   Porting Layer    the current version gets +portability (a minor version)
//   Research Prototype  no new version: research points
// Phases (the M3 phase system, three of them): the weights say who counts — mostly Programmers.
export const ENGINE_PROJECTS = [
  { id: 'newEngine', name: 'New Engine', work: 160, costPerDay: 60, line: 'Build your own engine: version 1.' },
  { id: 'majorVersion', name: 'Major Version', work: 200, costPerDay: 80, line: 'The next version, built with today’s team and research.' },
  { id: 'toolUpgrade', name: 'Tool Upgrade', work: 80, costPerDay: 50, line: 'Better tools: Tooling +8, Stability +5 on the current version.', gains: { tooling: 8, stability: 5 } },
  { id: 'portingLayer', name: 'Porting Layer', work: 90, costPerDay: 50, line: 'Portability +12 on the current version: cheaper porting.', gains: { portability: 12 } },
  { id: 'researchPrototype', name: 'Research Prototype', work: 60, costPerDay: 40, line: 'An experiment: research points (60 + 20 per engine tier).', rp: { base: 60, perTier: 20 } },
];
export const engineProjectById = (id) => ENGINE_PROJECTS.find((p) => p.id === id) ?? null;
export const ENGINE_PHASES = [
  { id: 'design', name: 'Design', share: 0.25, weights: { code: 0.6, des: 0.25, prod: 0.15 } },
  { id: 'build', name: 'Build', share: 0.5, weights: { code: 0.8, prod: 0.2 } },
  { id: 'harden', name: 'Hardening', share: 0.25, weights: { code: 0.7, prod: 0.3 } },
];

export const ENGINE_BALANCE = {
  progressDivisor: 75, // like games: Σ(stat × weight) ÷ this = a day's progress
  facilities: ['F18', 'F02'], // needed in the studio to start one: the Engine Lab (research ENG3) or the Code Station
  // Attributes when a version is finished: q = 100 × (1 − e^(−team code strength ÷ curveK)) from the team's average
  // daily best CODE (like a game's outputs), then each attribute = q × its share + research bonuses, capped at 100.
  curveK: 150,
  share: { performance: 0.8, tooling: 0.6, stability: 0.7, portability: 0.5, d2: 0.8, d3: 0.7, online: 0.6, world: 0.6 },
  // Strength attributes need their tier (below it they are 0): 2D tier 1+, 3D tier 3+, online and world tier 5
  // (or their own research: ENG4 online, ENG5 world).
  needs: { d3: { tier: 3 }, online: { tier: 5, research: 'ENG4' }, world: { tier: 5, research: 'ENG5' } },
  research: { ENG1: { d2: 10 }, ENG2: { tooling: 12, stability: 5 }, ENG3: { d3: 10 }, ENG4: { online: 10 }, ENG5: { world: 10 }, ENG6: { performance: 8, tooling: 8 }, PRO2: { stability: 10 }, ART4: { d3: 8 } },
  tierBonus: { d3: { 4: 12 } }, // Advanced 3D: 3D strength +12
  // Ageing: every attribute × max(ageMin, 1 − agePerYear × years since the version was built).
  agePerYear: 0.05,
  ageMin: 0.6,
  // In a game (Milestone 16): the strength the recipe's Technology leans on (below), and what it does.
  techStrength: { TEC01: 'd2', TEC02: 'd2', TEC03: 'd3', TEC04: 'd3', TEC05: 'online', TEC06: 'world', TEC07: 'performance', TEC08: 'performance' },
  game: {
    graphicsPer: 0.15, // Graphics + (strength − pivot) × this
    pivot: 40,
    polishPer: 0.1, // Polish + (performance − pivot) × this
    innovationPerTier: 1, // Innovation + tier
    bugPctPerStability: -0.2, // bugs made: stability × this % (stability 60 → −12%)
    progressPctPerTooling: 0.1, // progress: tooling × this % (tooling 60 → +6%)
  },
  portCostPctPerPortability: -0.4, // porting cost at release: portability × this % (portability 50 → −20%)
  // Support cost: each month, for each version used by a game in the works or a game still selling ("live").
  upkeep: { base: 150, perTier: 40 },
};
