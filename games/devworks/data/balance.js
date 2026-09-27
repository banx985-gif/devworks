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
  tiredIconUntil: 60, // the tired icon stays up from "tired" until Energy is back above this (Milestone 4)
  unassignedMorale: { afterMonths: 2, perMonth: 0 }, // no Morale loss for being idle until projects exist (Milestone 3)
};


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
//   Cost (paid from Credits since Milestone 4): the audio package up front, then the scope's production cost every
//     day the project runs. Salaries are paid monthly for everyone, project or not.
export const PROJECT_BALANCE = {
  // Scopes (Milestone 7, bible §12; plan review B: the bible gives no numbers). totalWork = progress needed (the three
  // starters make about 2 a day, so Tiny ≈ 2 months, Small ≈ 4, Standard ≈ 7 with the same team; more staff = faster).
  // baseCostPerDay = production cost each day (salaries are paid monthly). price and salesMult: bigger games sell for
  // more and to more players. qualityBonus: points a finished game's outputs get from the extra content (not AUDIO).
  // prodShift: bigger projects lean more on Production (the milestone role weights: every phase's weights × (1 −
  // shift), then PROD + shift). complexity: added to the bug multiplier.
  scopes: {
    tiny: { totalWork: 112, bugsPerDay: 0.4, baseCostPerDay: 30, price: 12, salesMult: 1, qualityBonus: 0, prodShift: 0, complexity: 0 },
    small: { totalWork: 210, bugsPerDay: 0.36, baseCostPerDay: 55, price: 18, salesMult: 1.6, qualityBonus: 3, prodShift: 0, complexity: 0.05 },
    standard: { totalWork: 400, bugsPerDay: 0.4, baseCostPerDay: 110, price: 30, salesMult: 2.8, qualityBonus: 6, prodShift: 0.05, complexity: 0.1 },
    large: { totalWork: 720, bugsPerDay: 0.45, baseCostPerDay: 220, price: 45, salesMult: 4.8, qualityBonus: 9, prodShift: 0.1, complexity: 0.2 },
    blockbuster: { totalWork: 1150, bugsPerDay: 0.5, baseCostPerDay: 420, price: 60, salesMult: 8, qualityBonus: 12, prodShift: 0.15, complexity: 0.3 },
    mega: { totalWork: 1700, bugsPerDay: 0.55, baseCostPerDay: 800, price: 70, salesMult: 12, qualityBonus: 15, prodShift: 0.2, complexity: 0.4 },
  },
  // Budget focus (bible §12, exact): costPct on the daily production cost; qualityPct on every output a phase builds
  // (not AUDIO); innovationPct on INNOVATION only; bugPct on bugs made; energyPct on the team's working Energy loss;
  // hypePct is stored on the game for Milestone 9 (Hype); variancePct widens the schedule slip. Each phase keeps the
  // focus it started with: a change waits for the next milestone.
  budgetFocus: {
    lean: { costPct: -20, qualityPct: -8, bugPct: 5 },
    balanced: {},
    pushQuality: { costPct: 25, qualityPct: 10, energyPct: 10 },
    marketingHeavy: { costPct: -5, hypePct: 15, bugPct: 3 },
    experimental: { innovationPct: 12, variancePct: 8, bugPct: 8 },
  },
  // Recipe complexity (bible §20: bugs rise with complexity): added to the bug multiplier for each element used.
  complexity: { TEC03: 0.08, TEC04: 0.15, TEC05: 0.12, TEC06: 0.2, TEC07: 0.12, TEC08: 0.15, ADR04: 0.08, FEA02: 0.05, FEA03: 0.15, FEA04: 0.2, FEA05: 0.08, FEA06: 0.12, FEA07: 0.1 },
  // Schedule (Milestone 7). At the start the work is stretched by a seeded slip between min and max (so a project can
  // come in early or late); the Producer founder perk (Tess, −5%) and the Producer Desk (F06, −5%) narrow it, the
  // Experimental focus widens it. Deadline = the estimate for this team (their stats at full strength, ÷ dutyFactor
  // for breaks) × (1 + buffer). Pressure: while the work is behind the calendar, bugs rise by pressureBugPct % × how
  // far behind (as a fraction of the whole project).
  schedule: { slip: { min: -0.08, max: 0.15 }, dutyFactor: 0.83, buffer: 0.08, pressureBugPct: 80 },
  // The choices at Beta (end of Alpha / Beta) and Gold (end of Gold Master), bible §20. Ship carries on / finishes.
  //   delay: Gold Master gets workPct % of the total work again (more fixing days) and +polish; hype for M9; maxUses
  //   cut: the feature package is cut: its complexity goes, bugs −bugsPct %, remaining Gold work −workPct %,
  //        INNOVATION −innovation; once
  //   outsource: costs costDays × the scope's daily cost; bugs −bugsPct % at once, remaining Gold work −workPct %;
  //        POLISH can't finish above polishCap (the supplier's quality); once
  //   crunch: for `days` worked days progress +progressPct %, Energy loss +energyPct %, Morale moraleDay a day, bugs
  //        +bugPct %; added to each worker's crunch history; never forced; Beta only (at Gold nothing is left to rush)
  decisions: {
    delay: { workPct: 8, polish: 3, hype: -5, maxUses: 2 }, // + POLISH points per delay
    cut: { bugsPct: 30, workPct: 25, innovation: 4, hype: -8 },
    outsource: { costDays: 20, bugsPct: 60, workPct: 40, polishCap: 72 },
    crunch: { days: 14, progressPct: 50, energyPct: 30, moraleDay: -1.5, bugPct: 20 },
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

// --- Money, release, reviews, sales, Fame (Milestone 4). The bible gives shapes, not numbers (plan review B). ---

// Credits. 15,000 covers one Tiny game (about 3,000 salaries + 1,980 production and audio over 2 months) and still
// survives one or two flops (bible §1). Below 0, Emergency Credit runs (bible §3): interest each month on what is
// owed. The Rescue Investor (6 months over the ceiling) comes later, so nothing closes the studio yet.
export const ECONOMY = {
  startCredits: 15000,
  startTokens: 0,
  emergencyCeiling: -20000, // the emergency credit line (the Rescue Investor will watch this)
  monthlyInterestPct: 3,
};

// One price and one release model (self-publish, digital). The store keeps a share of every copy.
export const RELEASE = { price: 12, storeCutPct: 30, platform: 'P01' };

// Reviews (bible §14 contract on the 0–100 outputs, plan review A3):
//   genre score = weighted average of the seven outputs (genre weights × the outlet's taste)
//   bug penalty = max × (1 − e^(−bugs / scale)) for the scope
//   expectation penalty = max(0, Fan Expectation − genre score) × expectationWeight
//   innovation bonus = (INNOVATION − 50) × innovationPerPoint
//   outlet score = clamp(0–100, genre score + innovation bonus − bug penalty − expectation penalty + bias ± jitter)
// The jitter comes from the game's review seed, locked at Gold Master: a reload never changes a review.
export const REVIEW_BALANCE = {
  // Genre stat weights (Milestone 6): what each genre's players care about among the seven outputs. 1 = normal.
  genreWeights: {
    default: { gameplay: 1, graphics: 1, story: 1, audio: 0.6, innovation: 0.8, polish: 1, audienceFit: 1 },
    GEN01: { gameplay: 1.5, graphics: 1, story: 0.4, audio: 0.8, innovation: 0.8, polish: 1.3, audienceFit: 1 }, // Platformer
    GEN02: { gameplay: 1.1, graphics: 0.9, story: 1.5, audio: 0.8, innovation: 0.7, polish: 0.8, audienceFit: 1 }, // RPG
    GEN03: { gameplay: 1.5, graphics: 0.6, story: 0.6, audio: 0.5, innovation: 1.1, polish: 1, audienceFit: 1 }, // Strategy
    GEN04: { gameplay: 1.3, graphics: 0.7, story: 0.4, audio: 0.5, innovation: 1.2, polish: 1, audienceFit: 1.2 }, // Simulation
    GEN05: { gameplay: 1.3, graphics: 1.4, story: 0.3, audio: 0.9, innovation: 0.7, polish: 1.2, audienceFit: 1 }, // Racing
    GEN06: { gameplay: 1.5, graphics: 1.2, story: 0.6, audio: 0.9, innovation: 0.7, polish: 1.1, audienceFit: 1 }, // Action
    GEN07: { gameplay: 0.9, graphics: 1.1, story: 1.5, audio: 0.9, innovation: 0.9, polish: 0.8, audienceFit: 1 }, // Adventure
    GEN08: { gameplay: 1.4, graphics: 0.8, story: 0.5, audio: 0.7, innovation: 1.1, polish: 1.2, audienceFit: 1 }, // Puzzle
    GEN09: { gameplay: 1.4, graphics: 1.2, story: 0.2, audio: 0.8, innovation: 0.6, polish: 1.2, audienceFit: 1.3 }, // Sports
    GEN10: { gameplay: 1, graphics: 1.1, story: 1.2, audio: 1.4, innovation: 1, polish: 0.8, audienceFit: 0.9 }, // Horror
  },
  // Each outlet's taste: multipliers on the genre weights, and a small bias.
  outlets: {
    criticalPath: { weights: { story: 1.4, innovation: 1.3 }, bias: -3 }, // the hard critic
    joyPad: { weights: { gameplay: 1.4, audienceFit: 1.2 }, bias: 2 }, // the fun one
    playerVoice: { weights: { audienceFit: 1.6, gameplay: 1.2 }, bias: 1 }, // the players' view
    techPlay: { weights: { graphics: 1.6, polish: 1.5 }, bias: -1 }, // the tech one
  },
  jitter: 3, // ± points per outlet, from the review seed
  // Bigger games are judged with more patience for bugs (Milestone 7): the scale grows with the scope.
  bugPenalty: { tiny: { max: 25, scale: 10 }, small: { max: 25, scale: 18 }, standard: { max: 27, scale: 32 }, large: { max: 29, scale: 55 }, blockbuster: { max: 31, scale: 90 }, mega: { max: 33, scale: 140 } },
  expectationWeight: 0.5,
  innovationPerPoint: 0.08,
  lowScore: 45, // below this the line names the weakest output instead of praising the best
  buggyAt: 8, // this many bugs or more: the line is about bugs
  start: { hype: 0, fanExpectation: 10 }, // start low; Milestone 9 grows them
};

// Sales (bible §30): lifetime copies = platform audience × appeal, spread over a launch spike, a decay and a long
// tail (three shares adding up to 1, each fading over its own number of days). appeal =
//   (review / 100)^reviewExp × reviewScale  ×  (fitBase + fitPer × AUDIENCE FIT)
//   × (trustBase + trustPer × Fan Trust)  ×  platform demand ÷ 100 (core MarketSystem, one segment per platform).
// Each day's copies wobble by ± jitter from the game's own seeded sales state; fractions carry over to the next day.
// Status: "Selling" while the spike + decay still sell more than the tail, then "Long tail".
export const SALES_BALANCE = {
  // audience: the old (Milestone 4) fixed P01 audience, still used by games that went on sale before Milestone 8.
  // Since Milestone 8 a platform's buyers = its install base × PLATFORM_BALANCE.buyerPct. demand: the monthly market
  // (core MarketSystem, one segment per platform).
  platforms: {
    P01: { audience: 2000, demand: { min: 85, max: 115 } },
    ...Object.fromEntries(['P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11', 'P12'].map((id) => [id, { demand: { min: 80, max: 120 } }])),
  },
  market: { drift: 8, trendChance: 0.15, trendSegments: [1, 1], trendShift: 10, trendMonths: [1, 2], floor: 60, ceiling: 140 },
  curve: {
    spike: { share: 0.3, days: 5 },
    decay: { share: 0.5, days: 35 },
    tail: { share: 0.2, days: 300 },
  },
  reviewExp: 1.5,
  reviewScale: 1.1,
  fitBase: 0.7,
  fitPer: 0.006,
  trustBase: 0.8,
  trustPer: 0.004,
  jitter: 0.15,
};

// --- Platform market (Milestone 8, bible §17). The bible gives the table, not the numbers: all placeholders. ---
// Install base (players who own the platform), from src/systems/platformMarket.js:
//   y = years since the start of the calendar; the era runs from (from − 1) to `to`, both moved by the run's committed
//   shift (whole months). u = how far through its era (0–1).
//   normal:  u < growthEnd: startShare → 1 (smooth);  up to peakEnd: 1 (Peak);  to the era's end: down to endShare
//            (Declining);  after it: Dead (no new releases; the base keeps fading by fadeYears)
//   evergreen (to: null): startShare → 1 over the years (1 − e^(−years / evergreenYears)); Growing, then Peak for good
//   base = peak × shape × the run's committed success (success.min–max; P01, the open PC, never varies)
// Committed at the start of a run from its own seed and saved, so a reload never changes a platform's fortunes.
// Sales: a platform's buyers = install base on release day × buyerPct; × the genre's fit with the platform's audience
// (genreFit, 1 = neutral); × (1 + nicheBonusPct %) on Declining hardware (few new games: bible §17 niche).
// Multi-platform: every platform after the first costs portDays × the scope's daily cost × the friendliness's portMult
// and adds qaBugsPct % of the game's bugs (at least 1) — the reviews see them. Certification (not on open platforms):
// certDays and a fee by friendliness, failChance to fail once (seeded from the game and platform: a reload never
// changes it), which adds failDelay days. The game launches everywhere when the slowest platform passes.
export const PLATFORM_BALANCE = {
  buyerPct: 0.1,
  shape: { growthEnd: 0.35, peakEnd: 0.6, endShare: 0.3, fadeYears: 1 },
  evergreenYears: 4,
  success: { min: 0.75, max: 1.3 },
  shiftMonths: 4, // an era can start and end up to this many months early or late
  platforms: {
    P01: { peak: 60000, startShare: 0.3333, fixed: true }, // 20,000 players on day one = the Milestone 4 audience of 2,000
    P02: { peak: 70000, startShare: 0.35 },
    P03: { peak: 110000, startShare: 0.3 },
    P04: { peak: 90000, startShare: 0.2 },
    P05: { peak: 140000, startShare: 0.2 },
    P06: { peak: 230000, startShare: 0.2 },
    P07: { peak: 170000, startShare: 0.2 },
    P08: { peak: 210000, startShare: 0.2 },
    P09: { peak: 330000, startShare: 0.2 },
    P10: { peak: 250000, startShare: 0.2 },
    P11: { peak: 400000, startShare: 0.15 },
    P12: { peak: 360000, startShare: 0.15 },
  },
  nicheBonusPct: 25,
  friendliness: {
    'Very High': { certDays: 2, certFee: 150, failChance: 0.05, portMult: 0.6 },
    High: { certDays: 4, certFee: 300, failChance: 0.1, portMult: 0.8 },
    Medium: { certDays: 7, certFee: 500, failChance: 0.2, portMult: 1.1 },
  },
  failDelay: { min: 3, max: 6 },
  portDays: 10,
  qaBugsPct: 10,
  // Genre × platform audience: how well a genre sells to each audience (1 = neutral).
  genreFit: {
    GEN01: { kidsCasual: 1.3, allAges: 1.2, core: 0.9, coreHardcore: 0.8, casualCore: 1.1 }, // Platformer
    GEN02: { kidsCasual: 0.8, allAges: 1, core: 1.2, coreHardcore: 1.2, casualCore: 1 }, // RPG
    GEN03: { kidsCasual: 0.6, allAges: 0.8, core: 1.1, coreHardcore: 1.3, casualCore: 0.9 }, // Strategy
    GEN04: { kidsCasual: 0.9, allAges: 1, core: 1, coreHardcore: 1.2, casualCore: 1.1 }, // Simulation
    GEN05: { kidsCasual: 1, allAges: 1.1, core: 1.2, coreHardcore: 1, casualCore: 1 }, // Racing
    GEN06: { kidsCasual: 0.9, allAges: 1, core: 1.3, coreHardcore: 1.1, casualCore: 1 }, // Action
    GEN07: { kidsCasual: 1, allAges: 1.1, core: 1, coreHardcore: 1, casualCore: 1 }, // Adventure
    GEN08: { kidsCasual: 1.3, allAges: 1.1, core: 0.8, coreHardcore: 1, casualCore: 1.3 }, // Puzzle
    GEN09: { kidsCasual: 1, allAges: 1.3, core: 1.1, coreHardcore: 0.8, casualCore: 1.1 }, // Sports
    GEN10: { kidsCasual: 0.5, allAges: 0.8, core: 1.2, coreHardcore: 1.2, casualCore: 0.9 }, // Horror
  },
};

// Fame and Fan Trust (bible §21) and ranks (bible §8). The rank never drops (core ReputationSystem).
export const FAME = {
  ranks: [
    { id: 'E', min: 0 },
    { id: 'D', min: 300 },
    { id: 'C', min: 1100 },
    { id: 'B', min: 3000 },
    { id: 'A', min: 6500 },
    { id: 'S', min: 11000 },
  ],
  release: { perPoint: 3, minus: 60 }, // Fame at release = max(0, review × 3 − 60)
  copiesPerFame: 20, // then +1 Fame for every 20 copies sold
};
export const FAN_TRUST = { start: 50, pivot: 55, perPoint: 0.3 }; // release: + (review − 55) × 0.3, kept 0–100

// --- Marketing, Hype, Fan Trust, the release calendar (Milestone 9, bible §21 / §30). All placeholders. ---
// Hype (0–100) belongs to one game. Actions (data/marketing.js) add their Hype over their days, × (1 + boostPct %) for
// the Marketing-Heavy focus (M7's hypePct) and the Marketing Wall (wallPct); Delay / Cut Feature take their M7 Hype
// off at once. Before launch Hype fades by decayPct % a day (so a campaign just before launch counts most); at launch
// it is frozen on the game.
//   Fan Expectation = expectation.base + hype × expectation.perHype. The review contract's expectation penalty
//     (REVIEW_BALANCE.expectationWeight) then bites: a weak game with big Hype reviews worse.
//   Sales: lifetime × (1 + hype / 100 × hypeSalesPct / 100), and the launch spike's share grows by spikePerHype × hype
//     / 100 (hyped games sell up front).
//   Word of mouth: strength = clamp((review − wom.from) / (wom.full − wom.from), 0, 1) × (1 − hype / 100 × wom.hypeDamp).
//     It adds a slow "word of mouth" part to the sales curve (share = strength × wom.share, rising for about wom.days
//     and fading after), shrinks the launch spike (× 1 − strength × wom.quietSpike: nobody knew it was coming), stretches the decay and the tail (× 1 + strength × decayStretch / tailStretch) and adds
//     strength × wom.bonusPct % to lifetime sales. A strong, quiet game keeps selling long after its launch month.
//     With no Hype and a review under wom.from the curve is exactly the Milestone 4 one.
// Fan Trust (studio, 0–100) at launch: the review (FAN_TRUST, below), − trust.bugPer × bugs over trust.bugFree (at
// most trust.bugMax), − trust.overhypePer × how far the review falls short of Fan Expectation beyond
// trust.overhypeGrace (at most trust.overhypeMax); + trust.metPer × hype / 100 when a hyped game meets its
// expectation. Each Delay costs trust.delay at once.
// Release calendar: every month gets 0–2 placeholder competitor releases (chances in `competitors.count`), each big
// with chance `bigChance`. A launch in the same month as a same-genre release loses clash.bigPct % (big) or
// clash.smallPct % (small) of its launch week (the first clash.days days).
export const MARKETING_BALANCE = {
  decayPct: 0.8,
  wallPct: 10,
  expectation: { base: 10, perHype: 0.8 },
  hypeSalesPct: 50,
  spikePerHype: 0.2,
  wom: { from: 60, full: 85, hypeDamp: 0.85, share: 0.45, quietSpike: 0.5, days: 30, decayStretch: 0.6, tailStretch: 1, bonusPct: 35 },
  trust: { bugFree: 5, bugPer: 0.4, bugMax: 8, overhypeGrace: 5, overhypePer: 0.3, overhypeMax: 12, metPer: 3, delay: 1.5 },
  competitors: { count: [0.35, 0.45, 0.2], bigChance: 0.3 }, // chance of 0, 1, 2 releases in a month
  clash: { days: 7, bigPct: 40, smallPct: 12 },
};

// --- Franchises and the back catalogue (Milestone 10, bible §12 / §18). All placeholders. ---
// Project types: workMult on the work (so the days), costMult on the daily cost, priceMult on the price a copy.
//   fanShare: how much of the franchise's fanbase a new entry gets (Original none). fatigueAdd: fatigue its launch
//   adds to the franchise. Remake / Remaster: floor = the old game's outputs × floor are the least the new one gets
//   (then + bonus), and the old game must have been out minAgeDays.
// Franchise points = lifetime copies (all its games, back catalogue included) × review average ÷ 70; the status
//   comes from the points (data/franchises.js). Fanbase (0–100) = 100 × (1 − e^(−points / fanScale)).
// A new entry with a fanbase: starts with fanbase × startHype × fanShare Hype (the fans are waiting) and sells
//   × (1 + fanbase / 100 × fanSalesPct / 100 × fanShare).
// Fatigue (0–100) fades with time: now = stored × e^(−days since / fatigueDays). At a launch the fatigue is first cut
//   by relief.tech (other Technology than the last game), relief.art (other Art Direction) and relief.genre (other
//   genre), then costs fatigueSalesPct % × fatigue / 100 of sales and fatigueReview × fatigue review points; then the
//   entry's fatigueAdd is added.
// Back catalogue: every month a game that has been out catalogue.afterDays sells catalogue.monthlyPct % of its
//   expected lifetime copies again, at catalogue.pricePct % of its price; when another game of its franchise launches
//   it gets a spike of catalogue.spikePct % of its lifetime copies, sold at the next month's end.
export const FRANCHISE_BALANCE = {
  types: {
    original: { workMult: 1, costMult: 1, priceMult: 1, fanShare: 0, fatigueAdd: 25 },
    sequel: { workMult: 1, costMult: 1, priceMult: 1, fanShare: 1, fatigueAdd: 30 },
    spinoff: { workMult: 1, costMult: 1, priceMult: 1, fanShare: 0.5, fatigueAdd: 15 },
    remake: { workMult: 0.75, costMult: 0.85, priceMult: 1, fanShare: 0.7, fatigueAdd: 20, floor: 0.85, bonus: { graphics: 6, innovation: 3 }, minAgeDays: 672 },
    remaster: { workMult: 0.35, costMult: 0.5, priceMult: 0.6, fanShare: 0.5, fatigueAdd: 10, floor: 1, bonus: { graphics: 8, polish: 6 }, minAgeDays: 336 },
  },
  pointsReviewRef: 70,
  fanScale: 2500,
  startHype: 0.5,
  fanSalesPct: 80,
  fatigueDays: 200,
  fatigueSalesPct: 50,
  fatigueReview: 0.12,
  relief: { tech: 20, art: 10, genre: 15 },
  catalogue: { afterDays: 336, monthlyPct: 0.4, pricePct: 60, spikePct: 8 },
};

// Speed unlocks (bible §4): 2× after the first shipped game; 4× at Rank C or Year 4.
export const SPEED_UNLOCKS = { 2: { shipped: 1 }, 4: { rank: 'C', year: 4 } };
