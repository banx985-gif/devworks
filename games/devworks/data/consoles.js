// Console launch and market (Milestone 24, bible §32 price / manufacturing / dev kits / royalties / failure / recovery,
// §34 install base and third-party support). Plain data only; the rules are src/systems/consoles.js. Every number is a
// placeholder (plan review B), listed in the build log. Generations 2–3 and revisions are Milestone 25.
export const CONSOLE = {
  platformId: 'OWN1', // the player's Gen-1 console as a platform in the market (Milestone 8)
  forms: {
    home: { name: 'Home console', art: 'console_visual_01', group: 'allAges' },
    handheld: { name: 'Handheld', art: 'console_visual_02', group: 'casualCore' },
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
  market: { size: 250000, reach: { home: 1, handheld: 0.85 }, adoption: 0.035, valueExp: 1.6, valueMin: 0.15, valueMax: 2.5, libBase: 0.5, perFirstParty: 0.12, perThirdParty: 0.04, libMax: 2.2, timingPct: 10, timingMax: 30, defectAdoption: 2 },
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
    { id: 'revisedModel', name: 'Revised model', cost: 40000, cooldown: null, reliability: 12, unitCostPct: -10, line: 'Sturdier parts: Reliability +12, 10% cheaper to make.' },
    { id: 'devKit', name: 'Improved dev kit', cost: 25000, cooldown: null, devFriendly: 12, line: 'Developer Friendliness +12: more third-party games.' },
    { id: 'exclusives', name: 'Killer exclusives', cost: 50000, cooldown: 6, games: 3, interest: 10, line: 'Pay for 3 exclusive third-party games; interest +10.' },
    { id: 'marketing', name: 'Marketing push', cost: 40000, cooldown: 3, adoptionPct: 30, months: 3, line: 'Adoption +30% for 3 months.' },
    { id: 'reduce', name: 'Reduce manufacturing', cost: 0, cooldown: 0, line: 'One production step down: less unsold stock.' },
  ],
  safety: { margin: 5000 }, // console spending never takes the studio within this of the Emergency Credit line
  launchArt: 'dev_event_11',
  launchVfx: 'dev_vfx_10',
  defectVfx: 'dev_vfx_11',
};
export const recoveryById = (id) => CONSOLE.recovery.find((r) => r.id === id) ?? null;
