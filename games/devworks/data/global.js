// Global business (Milestone 21, bible §19 licensing, §23 global publishers, §26 publishing other studios, §27
// acquisitions; research PRO3 / BUS4 / BUS5). Plain data only; the rules are src/systems/globalBusiness.js (and the
// localisation option in gameProject.js / business.js). The bible names the parts and the caps (3 external projects,
// 2 acquisitions, licensing capped and decaying); every number is a placeholder (plan review B), listed in the log.

// Localisation: a New Game option once PRO3 (Localisation) is researched or a Localisation Suite (F22) stands.
//   costPct   production costs this % more (the Localisation Suite's localisationCostPct lowers it)
//   workPct   the game needs this % more work
//   salesPct  a localised game sells this % more at launch (the world's other regions)
//   bus4Pct   + this % more with BUS4 (Global Distribution) researched — localised games only
//   reachCapPct  without localisation a global publisher's reach (Atlas, Meridian: salesPct) counts at most this %
export const LOCALISATION = {
  research: 'PRO3',
  facility: 'F22',
  costPct: 18,
  workPct: 6,
  salesPct: 25,
  bus4Pct: 10,
  reachCapPct: 5,
};

// Global publisher deals (extends data/publishers.js, M17): from Rank A the publishers marked globalReach offer
// "Global deals": their reach is this much bigger, the advance richer, and the publisher pays the localisation (the
// game is localised for free).
export const GLOBAL_DEALS = { rank: 'A', reachPct: 30, advanceMult: 1.3 };

// Passive income cap (bible §44: "late passive income is capped / diminishing"). Engine licences,
// external publishing returns and an acquired catalogue are passive. They are paid only at month ends; in each game
// year passive income may be at most sharePct of all that year's income (checked at every payment against the year so
// far, so it can only get safer as the year goes on); anything over it is not paid ("held back", shown on screen).
export const PASSIVE = { categories: ['licensing', 'external', 'acquisition'], sharePct: 30 };

// Engine licensing (bible §19; Rank B + BUS5). Offers come each month while a version still has licence value.
//   value(version) = the average of its aged Performance, Tooling, Stability and Portability × (1 + tierPct × tier)
//   fee a month = value × feePerPoint × ageFactor × the slot factor (the 1st licence 100%, each next one × slotDecay)
//   ageFactor = max(0, 1 − decayPerYear × the version's age in years): a version stops earning after ~3 years
//   upfront = feeMonths × the fee at signing; support = supportPct of the signing fee, every month the licence runs
export const LICENSING = {
  rank: 'B',
  research: 'BUS5',
  maxActiveByRank: { B: 2, A: 3, S: 4 },
  termMonths: 12,
  feePerPoint: 9,
  tierPct: 15,
  decayPerYear: 0.3,
  slotDecay: 0.8,
  upfrontMonths: 2,
  supportPct: 25,
  offersPerMonth: 1,
  maxOffers: 2,
  offerMonths: 2,
  minValue: 20,
  customers: ['Moonbeam Arcade', 'Paper Rocket Games', 'Jolly Kraken Studio', 'Tiny Comet Interactive', 'Velvet Joystick', 'Sunny Loop Studio', 'Copper Kite Studio', 'Maple Circuit Games', 'Blue Heron Works', 'Lantern Byte', 'Pocket Orbit', 'Quiet Fox Games', 'Harbor Light Studio', 'Tangerine Pixel'],
  tenCustomers: 10, // the "Ten Engine Customers" achievement hook
};

// Publishing other studios (bible §26; Rank A + a Publishing Office F26). Pitch cards each month; at most maxActive
// funded projects (in development or still paying back). Results are simulated (no second studio).
//   budget = budgetBase × (0.6 + 0.2 × reputation) × the seeded 0.8–1.4 · schedule 6–14 months
//   review = 48 + 6 × reputation + the seeded −12…+12 − 5 per risk tag (+ engine bonus, − risk softening)
//   copies = budget × copiesPerCredit × (review / 60)^3 × the marketing mult; revenue = copies × price × 70%
//   the studio's share (sharePct) is paid over payMonths, a bit less each month (payDecay), as passive income
export const EXTERNAL = {
  rank: 'A',
  facility: 'F26',
  maxActive: 3,
  pitchesPerMonth: 1, // + the Executive Boardroom's dealOffers
  maxPitches: 3,
  pitchMonths: 2,
  budgetBase: 24000,
  monthsMin: 6,
  monthsMax: 14,
  reviewBase: 48,
  reviewPerRep: 6,
  reviewSpread: 12,
  riskPenalty: 5,
  copiesPerCredit: 0.13,
  price: 20,
  netPct: 70,
  sharePct: 45,
  payMonths: 6,
  payDecay: 0.75,
  hitReview: 80,
  hitFame: 200,
  choices: [
    { id: 'reject', name: 'Reject', line: 'Pass on this pitch.' },
    { id: 'fund', name: 'Fund', line: 'Pay the budget; share the sales.' },
    { id: 'fundEngine', name: 'Fund + Engine', line: 'Also give them your engine: better reviews, less risk (support cost a month).', reviewBonus: 6, riskSoften: 1, supportPerMonth: 300, needsEngine: true },
    { id: 'fundMarketing', name: 'Fund + Marketing', line: 'Also pay for their marketing: +50% sales.', extraPct: 35, salesMult: 1.5 },
  ],
  riskTags: [
    { id: 'firstTeam', name: 'First-time team' },
    { id: 'scopeCreep', name: 'Scope creep' },
    { id: 'newTech', name: 'Unproven tech' },
    { id: 'crunch', name: 'Crunch culture' },
    { id: 'crowded', name: 'Crowded genre' },
  ],
  studios: ['Moonbeam Arcade', 'Paper Rocket Games', 'Jolly Kraken Studio', 'Tiny Comet Interactive', 'Velvet Joystick', 'Sunny Loop Studio', 'Copper Kite Studio', 'Maple Circuit Games', 'Blue Heron Works', 'Lantern Byte', 'Pocket Orbit', 'Quiet Fox Games'],
};

// Lightweight acquisitions (bible §27): rare late opportunities, at most max ever. No floorplans: buying one grants
// exactly one thing.
//   ip            a franchise with fans already (basePoints: franchise points before any game of yours)
//   staff         a staff candidate (a Rare or Elite not in the studio) arrives on the recruitment board
//   catalogue     old games that pay monthly (monthly, falling by decayPct a month, for months) — passive income
//   tools         an engine / tool licence: every game's progress +progressPct and bug fixing +bugFixPct for good
//   relationship  a publishing relationship: one extra publisher offer every month
export const ACQUISITIONS = {
  max: 2,
  rank: 'A',
  year: 9, // from Rank A or Year 9, whichever comes first
  chancePerMonth: 0.06,
  offerMonths: 2,
  targets: [
    { id: 'AQ1', studio: 'Starfall Interactive', grant: 'ip', price: 60000, ipName: 'Starfall Saga', genre: 'GEN06', theme: 'THM05', basePoints: 8000, line: 'Their space-opera franchise joins yours, fans included.' },
    { id: 'AQ2', studio: 'Brass Owl Games', grant: 'staff', price: 30000, line: 'Their lead developer joins your recruitment board.' },
    { id: 'AQ3', studio: 'Retro Vault', grant: 'catalogue', price: 45000, monthly: 3500, decayPct: 4, months: 36, line: 'A catalogue of old games that keeps selling for three years.' },
    { id: 'AQ4', studio: 'Cogwheel Tools', grant: 'tools', price: 40000, progressPct: 4, bugFixPct: 6, line: 'Their engine tools: every game is made 4% faster, bugs fixed 6% faster.' },
    { id: 'AQ5', studio: 'Harbor Light Studio', grant: 'relationship', price: 35000, line: 'Their publisher contacts: one extra publisher offer every month.' },
    { id: 'AQ6', studio: 'Pixel Orchard', grant: 'ip', price: 50000, ipName: 'Orchard Tales', genre: 'GEN07', theme: 'THM08', basePoints: 5000, line: 'A cosy adventure franchise with a loyal fanbase.' },
  ],
};
export const acquisitionById = (id) => ACQUISITIONS.targets.find((t) => t.id === id) ?? null;
export const externalChoiceById = (id) => EXTERNAL.choices.find((c) => c.id === id) ?? null;
