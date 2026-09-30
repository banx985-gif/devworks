// Console launch and market (Milestone 24, bible §32 price / manufacturing / dev kits / royalties / failure / recovery,
// §34 install base and third-party support). Plain data only; the rules are src/systems/consoles.js. Every number is a
// placeholder (plan review B), listed in the build log. Milestone 25 adds generations 2–3, revisions and backwards
// compatibility (CONSOLE.generations, CONSOLE.revisions, CONSOLE.backCompat).
export const CONSOLE = {
  platformId: 'OWN1', // the player's Gen-1 console as a platform in the market (Milestone 8); Gen 2 is OWN2, Gen 3 OWN3
  // minGen: the first generation that can take the form (the hybrid is a Gen-3 idea).
  forms: {
    home: { name: 'Home console', art: 'console_visual_01', group: 'allAges' },
    handheld: { name: 'Handheld', art: 'console_visual_02', group: 'casualCore' },
    hybrid: { name: 'Hybrid', art: 'console_visual_05', group: 'allAges', minGen: 3 },
  },
  // Money per console: making one costs the prototype's parts' unit cost × unitCostMult (fewer per unit in bigger
  // monthly runs: − volumePct per doubling above 1,000 a month, at most volumeMax); it sells for the launch price.
  unitCostMult: 0.1,
  volumePct: 4,
  volumeMax: 16,
  priceSteps: [29, 39, 49, 59, 69, 79, 89, 99, 119, 149],
  // What players think it is worth: base + perPerformance × Performance + perAppeal × Launch Appeal (Credits).
  fairPrice: { base: 20, perPerformance: 0.5, perAppeal: 0.2 },
  productionSteps: [0, 1000, 2500, 5000, 10000, 20000], // consoles made a month
  storagePerUnit: 0.4, // Credits a month for each unsold console in the warehouse
  royaltySteps: [5, 10, 15, 20, 25, 30], // % of third-party games' sales the platform holder takes
  devKits: {
    open: { name: 'Open (free dev kits)', interest: 15, feePerGame: 0 },
    standard: { name: 'Standard dev kits', interest: 0, feePerGame: 3000 },
    strict: { name: 'Strict (costly dev kits)', interest: -15, feePerGame: 6000 },
  },
  marketing: {
    none: { name: 'No launch marketing', cost: 0, mult: 0.8 },
    standard: { name: 'Launch campaign', cost: 30000, mult: 1 },
    big: { name: 'Big launch campaign', cost: 90000, mult: 1.35 },
  },
  // Install base (bible §34). Each month: sales = (market − install base) × adoption, limited by stock.
  //   market   = size × (0.5 + Launch Appeal ÷ 100) × the form's reach
  //   adoption = base × value × library × marketing × reliability × timing (× a marketing push)
  //   value    = (Launch Appeal ÷ 60) × (fair price ÷ price)^valueExp, within [valueMin, valueMax]
  //   library  = libBase + perFirstParty × your games on it (launch titles in the first 3 months count twice)
  //              + perThirdParty × third-party games, at most libMax
  //   reliability = 1 − defect% × defectAdoption; timing = 1 − timingPct × rival platforms launched in the last year
  market: { size: 250000, reach: { home: 1, handheld: 0.85, hybrid: 0.95 }, adoption: 0.035, valueExp: 1.6, valueMin: 0.15, valueMax: 2.5, libBase: 0.5, perFirstParty: 0.12, perThirdParty: 0.04, libMax: 2.2, timingPct: 10, timingMax: 30, defectAdoption: 2 },
  // Defects: defect% = (100 − Reliability) × defectPerPoint × (1 − the Certification Lab's certFailPct); each month a
  // defect wave comes with chance defect% × waveChance (seeded): repairs = install base × defect% × repairPerUnit
  // Credits (at most repairMax) and Fan Trust − trustHit.
  defects: { perPoint: 0.25, waveChance: 3, repairPerUnit: 2, repairMax: 60000, trustHit: 3 },
  // Third-party interest 0–100 (bounded loop): it moves `pull` of the way to a target each month:
  //   target = installWeight × min(100, install base ÷ installPer) + devWeight × Developer Friendliness
  //            + royaltyWeight × (30 − royalty%) ÷ 25 × 100 + toolsWeight × (100 with an own engine, else 40)
  //            + prestigeWeight × rank index × 20 + the dev-kit policy + the Dev Kit Lab's thirdPartyPct
  // New third-party games a month = interest ÷ 100 × gamesPerMonth; each sells for gameMonths, paying the royalty on
  // (install base ÷ 1,000) × royaltyPerThousand Credits a month × royalty% ÷ 10; the library holds at most libraryMax.
  thirdParty: { pull: 0.25, installWeight: 0.35, installPer: 1000, devWeight: 0.3, royaltyWeight: 0.2, toolsWeight: 0.1, prestigeWeight: 0.05, gamesPerMonth: 1.2, gameMonths: 12, royaltyPerThousand: 40, libraryMax: 60 },
  // Status as a platform: Growing for the first growingMonths, then Peak while a month sells ≥ peakPct of the best one,
  // else Declining.
  growingMonths: 12,
  peakPct: 50,
  // The verdict at verdictMonth: a hit with install base ≥ hitBase and a profit ≥ 0; a flop under flopBase or
  // losing more than flopLoss; else steady.
  verdictMonth: 12,
  hitBase: 60000,
  flopBase: 20000,
  flopLoss: 150000,
  // Failure reasons (bible §32), shown when they hold.
  reasons: { priceOverPct: 25, lineupMonths: 6, lineupMin: 2, thirdPartyMin: 30, thirdPartyAfter: 6, defectPct: 9, devFriendlyMin: 50, oversupplyMonths: 3, timingRivals: 2 },
  // Recovery (bible §32). cooldown: months before it can be used again (null = once).
  recovery: [
    { id: 'priceCut', name: 'Price cut', cost: 0, cooldown: 0, line: 'One price step down.' },
    { id: 'revisedModel', name: 'Revised model', cost: 40000, cooldown: null, revision: 'slim', line: 'A slim revision: Reliability +12, 15% cheaper to make, a new look.' },
    { id: 'devKit', name: 'Improved dev kit', cost: 25000, cooldown: null, devFriendly: 12, line: 'Developer Friendliness +12: more third-party games.' },
    { id: 'exclusives', name: 'Killer exclusives', cost: 50000, cooldown: 6, games: 3, interest: 10, line: 'Pay for 3 exclusive third-party games; interest +10.' },
    { id: 'marketing', name: 'Marketing push', cost: 40000, cooldown: 3, adoptionPct: 30, months: 3, line: 'Adoption +30% for 3 months.' },
    { id: 'reduce', name: 'Reduce manufacturing', cost: 0, cooldown: 0, line: 'One production step down: less unsold stock.' },
  ],
  // Milestone 25 — revisions (bible §32 "recovery via revised model"): once per console, on sale. Slim = the
  // "Revised model" recovery. The new model gets its own look (art by generation) and name (family + suffix).
  revisions: {
    slim: { name: 'Slim model', suffix: 'Slim', cost: 40000, reliability: 12, unitCostPct: -15, usability: 0, appeal: 2, line: 'Reliability +12, 15% cheaper to make, a new look.' },
    portable: { name: 'Portable model', suffix: 'Go', cost: 55000, reliability: 6, unitCostPct: -5, usability: 15, appeal: 6, reachPlus: 0.15, line: 'Usability +15, Reliability +6, 5% cheaper; it reaches handheld players too.' },
  },
  // Milestone 25 — generations (bible §32: up to 3). A new generation is a new prototype (built after the current one
  // launched) launched from the Console Portfolio; its name is the family + the generation number ("Nova 2"). The one
  // before goes Declining on the market (legacy): it keeps selling at legacyAdoption of its old pace, third-party
  // studios bring legacyThirdParty of their new games, and after legacyMonths it is retired (stock written off).
  // Each generation's market is size × marketMult[gen − 1] (the audience grows), so every install base stays bounded.
  generations: {
    max: 3,
    minMonths: 12, // the current generation must be on sale this long before the next one launches
    marketMult: [1, 1.25, 1.5],
    legacyAdoption: 0.35,
    legacyThirdParty: 0.3,
    legacyProduction: 2500, // the old generation's monthly run is cut to at most this
    legacyMonths: 36,
    goodwill: 0.25, // third-party interest carried to the next generation (backwards compatibility: backCompat.goodwill)
    reuseWorkPct: 8, // a hardware prototype needs this much less work for each part already built into an earlier prototype
    art: [
      { home: 'console_visual_01', handheld: 'console_visual_02', hybrid: 'console_visual_05', revision: 'console_visual_04' },
      { model: 'console_visual_03', revision: 'console_visual_04' },
      { model: 'console_visual_05', revision: 'console_visual_06' },
    ],
  },
  // Backwards compatibility (a plan choice from Gen 2): the engineering once, and each console costs unitCostPct more
  // to make; the old generations' libraries count for the new one (libraryShare of their games) and more third-party
  // goodwill comes across.
  backCompat: { cost: 20000, unitCostPct: 8, libraryShare: 0.5, goodwill: 0.6 },
  // Secret hooks (HW-01…HW-05, Milestone 28 gives the rewards): the stats are recorded per console. A launch "misses"
  // when its first 6 months sell under target6 (market × target6Pct%) by missPct% or more.
  hooks: { target6Pct: 20, missPct: 30, hitScore: 85, exclusiveScore: 80 },
  projectXArt: 'console_visual_08', // Milestone 31: the PROJECT X console
  safety: { margin: 5000 }, // console spending never takes the studio within this of the Emergency Credit line
  launchArt: 'dev_event_11',
  launchVfx: 'dev_vfx_10',
  defectVfx: 'dev_vfx_11',
};
export const recoveryById = (id) => CONSOLE.recovery.find((r) => r.id === id) ?? null;
