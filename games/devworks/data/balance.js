// DEVWORKS numbers (Milestone 2). Plain data only; placeholders are marked and will be tuned with the economy.

// Calendar, bible §4: 12 months × 28 days, 1 day = 2.5 s at 1×. The speeds are the top bar's Pause / 1× / 2× / 4×.
// (Bible §4 unlocks 2× after the first shipped game and 4× at Rank C / Year 4; games ship from Milestone 4,
// so every speed is open for now.)
export const CALENDAR = {
  daysPerMonth: 28,
  monthsPerYear: 12,
  secondsPerDay: 2.5,
  speeds: [1, 2, 4],
};

// Staff condition (bible §9: Energy and Morale 0–100; nobody resigns). Rates are placeholders (the bible gives none):
// a worker at 100 Energy works about 14 days (~35 s at 1×) before heading to the Break Area, and rests about 5 days.
export const STAFF_BALANCE = {
  startEnergy: 100,
  startMorale: 75,
  workEnergyLoss: { min: 4, max: 6 }, // per working day
  restEnergyGain: 12, // per resting day, before the Break Area's bonus
  tiredBelow: 30, // Energy under this: "tired" icon, and they go to rest
  stressedBelow: 25, // Morale under this: "low morale" icon
  backToWorkAt: 90, // Energy at which a resting worker goes back to their station
  unassignedMorale: { afterMonths: 2, perMonth: 0 }, // no Morale loss for being idle until projects exist (Milestone 3)
};

// Top bar placeholders until the economy exists.
export const START_WALLET = { credits: 5000, tokens: 0, rank: 'E' };

// --- Game projects (Milestone 3). The bible gives no numbers here (plan review B, M3 row): all placeholders. ---
// How it works (src/systems/gameProject.js):
//   Progress: each day every lead who is on duty (at or heading to their station, not on a break) adds
//     Σ(stat × phase weight) × workMultiplier (Energy/Morale, core StaffSystem), and the team's total ÷ progressDivisor
//     is that day's progress. A phase needs totalWork × its share. Tiny with the three starters ≈ 2 game months.
//   Outputs (0–100): each day the on-duty leads' best stat in each key is mixed per output (outputMix) and scaled by
//     their average workMultiplier; a phase's quality for an output = 100 × (1 − e^(−average / curveK)). The finished
//     value = start + (100 − start) × Σ over phases (emphasis × quality / 100) + breakthroughs. Each output's
//     emphasis adds up to 1 over the five phases, so a phase only builds its share. AUDIO = the audio package only.
//   Bugs: each worked day adds scope bugsPerDay × phase bugMult × low-Code factor × tiredness factor (the fraction is
//     rolled, seeded). Alpha/Beta and Gold Master also fix fixPerDay × (team Code ÷ fixCodeRef) × (1 + bugFixPct).
//   Breakthroughs: a seeded roll each worked day; a hit adds min–max points to one random output (not AUDIO).
//   Cost: tracked only (the ledger is Milestone 4) — the audio package up front, then each worked day the leads'
//     salaries ÷ days per month plus the scope's base daily cost.
export const PROJECT_BALANCE = {
  scopes: {
    tiny: { totalWork: 112, bugsPerDay: 0.4, baseCostPerDay: 15 },
  },
  progressDivisor: 100,
  // Phases in order. weights: which staff stats drive progress (sum 1). emphasis: how much of each output this phase
  // builds (each output sums to 1 over the five phases). Design heavy early, Code heavy in Alpha/Beta, Production
  // (PROD) throughout.
  phases: [
    {
      id: 'prototype',
      share: 0.15,
      weights: { des: 0.5, prod: 0.3, code: 0.2 },
      emphasis: { gameplay: 0.35, graphics: 0.1, story: 0.15, innovation: 0.4, polish: 0, audienceFit: 0.2 },
      bugMult: 0.6,
      fixPerDay: 0,
    },
    {
      id: 'verticalSlice',
      share: 0.15,
      weights: { des: 0.35, art: 0.35, code: 0.15, prod: 0.15 },
      emphasis: { gameplay: 0.25, graphics: 0.25, story: 0.2, innovation: 0.3, polish: 0.05, audienceFit: 0.2 },
      bugMult: 0.8,
      fixPerDay: 0,
    },
    {
      id: 'production',
      share: 0.35,
      weights: { code: 0.3, art: 0.25, des: 0.2, wrt: 0.15, prod: 0.1 },
      emphasis: { gameplay: 0.25, graphics: 0.45, story: 0.45, innovation: 0.2, polish: 0.15, audienceFit: 0.3 },
      bugMult: 1.2,
      fixPerDay: 0,
    },
    {
      id: 'alphaBeta',
      share: 0.2,
      weights: { code: 0.55, prod: 0.25, des: 0.2 },
      emphasis: { gameplay: 0.1, graphics: 0.1, story: 0.1, innovation: 0.05, polish: 0.4, audienceFit: 0.2 },
      bugMult: 0.5,
      fixPerDay: 0.9,
    },
    {
      id: 'goldMaster',
      share: 0.15,
      weights: { code: 0.4, prod: 0.4, des: 0.2 },
      emphasis: { gameplay: 0.05, graphics: 0.1, story: 0.1, innovation: 0.05, polish: 0.4, audienceFit: 0.1 },
      bugMult: 0.2,
      fixPerDay: 0.7,
    },
  ],
  // Which staff stats make each output (sum 1). AUDIO is not here: it comes from the audio package.
  outputMix: {
    gameplay: { des: 0.6, code: 0.25, prod: 0.15 },
    graphics: { art: 0.75, code: 0.15, des: 0.1 },
    story: { wrt: 0.7, des: 0.3 },
    innovation: { des: 0.4, code: 0.3, art: 0.15, wrt: 0.15 },
    polish: { code: 0.45, prod: 0.4, des: 0.15 },
    audienceFit: { prod: 0.45, des: 0.35, wrt: 0.2 },
  },
  outputStart: 5, // every output starts here (0–100)
  curveK: 180, // quality curve: a team strength of 180 reaches 63% of the way to 100
  audio: {
    none: { value: 5, cost: 0 },
    basic: { value: 35, cost: 300 },
  },
  bugs: {
    lowCodeRef: 150, // low-Code factor = clamp(1.6 − best Code ÷ this, 0.6, 1.6)
    tiredWeight: 1, // tiredness factor = 1 + tiredWeight × (100 − average Energy) ÷ 100
    fixCodeRef: 100, // fixing speed scales with the best Code ÷ this
  },
  breakthrough: { chancePerDay: 0.05, min: 3, max: 6 },
};
