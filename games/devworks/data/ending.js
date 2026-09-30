// The Year-20 ending and New Game+ (Milestone 33, bible §56, §43, §3; plan review C "M33"; setup spec §8). Plain data.
//
// The ending ALWAYS happens after Year 20, Month 12 (plan review C): winning C10 raises the grade and the title, it is
// not needed to reach the ending. The grade is core GradeEngine: nine categories with bible §56's maxima, each made of
// parts (a fact, the value for full points, an optional floor below which it scores 0; points × (value − floor) ÷
// (full − floor), kept between 0 and the part's points). No part reads hardware, so a software-only run can reach S.
export const ENDING = {
  endYear: 20,
  total: 1000,
  bands: [
    { id: 'D', min: 0 },
    { id: 'C', min: 550 },
    { id: 'B', min: 675 },
    { id: 'A', min: 800 },
    { id: 'S', min: 900 },
  ],
  categories: [
    {
      id: 'games',
      name: 'Games / Reviews / Sales',
      max: 220,
      parts: [
        { fact: 'releases', label: 'Games released', full: 30, points: 50 },
        { fact: 'bestReview', label: 'Best review', floor: 60, full: 95, points: 50 },
        { fact: 'topReviewAvg', label: 'Average review of your best 10', floor: 55, full: 90, points: 60 },
        { fact: 'lifetimeCopies', label: 'Copies sold, all games', full: 40000000, points: 60 },
      ],
    },
    {
      id: 'awards',
      name: 'Awards',
      max: 160,
      parts: [
        { fact: 'awardWins', label: 'Awards won', full: 25, points: 60 },
        { fact: 'awardKinds', label: 'Different awards won (C01–C10)', full: 8, points: 40 },
        { fact: 'c10Won', label: 'Game of the Year / Studio of the Year (C10)', full: 1, points: 60 },
      ],
    },
    {
      id: 'staff',
      name: 'Staff',
      max: 120,
      parts: [
        { fact: 'staffCount', label: 'Staff at the end', full: 24, points: 30 },
        { fact: 'staffAvgLevel', label: 'Average staff level', floor: 1, full: 10, points: 40 },
        { fact: 'legendaryHired', label: 'Legendary / Prestige people hired', full: 4, points: 30 },
        { fact: 'founderStayed', label: 'Founder with you all the way', full: 1, points: 20 },
      ],
    },
    {
      id: 'research',
      name: 'Research / Engines',
      max: 120,
      parts: [
        { fact: 'researchedVisible', label: 'Research topics done', full: 36, points: 70 },
        { fact: 'engineVersions', label: 'Own engine versions built', full: 6, points: 30 },
        { fact: 'engineCustomers', label: 'Engine licence customers', full: 10, points: 20 },
      ],
    },
    {
      id: 'franchises',
      name: 'Franchises',
      max: 100,
      parts: [
        { fact: 'bigFranchises', label: 'Franchises with 3+ released games', full: 4, points: 40 },
        { fact: 'legendaryFranchises', label: 'Legendary franchises', full: 2, points: 40 },
        { fact: 'bestFranchiseCopies', label: 'Copies of your biggest franchise', full: 10000000, points: 20 },
      ],
    },
    {
      id: 'finance',
      name: 'Finance / Business',
      max: 90,
      parts: [
        { fact: 'credits', label: 'Credits at the end', full: 50000000, points: 30 },
        { fact: 'solvent', label: 'No debt at the end', full: 1, points: 30 },
        { fact: 'profitableYears', label: 'Years with income above costs', full: 15, points: 30 },
      ],
    },
    {
      id: 'studio',
      name: 'Studio',
      max: 70,
      parts: [
        { fact: 'stage', label: 'Studio stage', floor: 1, full: 5, points: 40 },
        { fact: 'facilities', label: 'Facilities in the studio', full: 30, points: 30 },
      ],
    },
    {
      id: 'fans',
      name: 'Fan Trust / Prestige',
      max: 70,
      parts: [
        { fact: 'fanTrust', label: 'Fan Trust', floor: 40, full: 90, points: 40 },
        { fact: 'rankIndex', label: 'Highest rank (S = full)', full: 5, points: 30 },
      ],
    },
    {
      id: 'discovery',
      name: 'Discovery',
      max: 50,
      parts: [
        { fact: 'combosFound', label: 'Combos found this run', full: 10, points: 30 },
        { fact: 'secretsFound', label: 'Secrets found this run', full: 6, points: 20 },
      ],
    },
  ],
  // The run's title: by grade; winning C10 adds "Studio of the Year".
  titles: { S: 'Industry Legend', A: 'Global Powerhouse', B: 'Respected Studio', C: 'Solid Independent', D: 'Survivor' },
  c10Title: 'Studio of the Year',
  // The ceremony's pace (seconds): each category fills in turn; a tap skips to the next step.
  ceremony: { recapSec: 3.5, perCategorySec: 0.7, gradeSec: 2.5, singularitySec: 4, creditsSec: 6 },
  logo: 'studio_logo_banx_gamex', // assets/images/brand (a copy of the series art/brand logo): the end card
  ngArt: 'dev_brand_06', // NG+ / Prestige key art (the NG+ offer)
  archiveMax: 12, // legacy summaries kept by the account
};

// New Game+ (bible §43), for core NgPlusSystem. Levels NG+1–3 (later runs stay on NG+3 rules).
//   always: account-wide, copied into every new run (§43's list; Studio Tokens by setup spec §8)
//   chosen: what the player picks on the NG+ setup screen
//   reset:  named so nothing is forgotten — §43's resets first, then everything else a run owns
export const NGPLUS = {
  maxLevel: 3,
  fields: {
    always: [
      { id: 'combos', label: 'Combos discovered' },
      { id: 'secretRecipes', label: 'Secret recipes and discoveries' },
      { id: 'achievements', label: 'Achievements' },
      { id: 'hallOfFame', label: 'Hall of Fame' },
      { id: 'records', label: 'Account records' },
      { id: 'prestigeTokens', label: 'Prestige Tokens' },
      { id: 'staffIdentities', label: 'Staff you have worked with' },
      { id: 'legacySummaries', label: 'Legacy summaries of finished runs' },
      { id: 'studioTokens', label: 'Studio Tokens' },
    ],
    chosen: [
      { id: 'legacyStaff', label: 'Legacy Staff' },
      { id: 'blueprints', label: 'Legacy Game Blueprints' },
      { id: 'facilityBlueprint', label: 'Discounted facility blueprint' },
    ],
    reset: [
      { id: 'credits', label: 'Credits' },
      { id: 'rank', label: 'Rank and Fame' },
      { id: 'studioStage', label: 'Studio stage' },
      { id: 'studioLayout', label: 'Studio layout (facilities)' },
      { id: 'contracts', label: 'Contracts' },
      { id: 'activeProjects', label: 'Active projects' },
      { id: 'sponsors', label: 'Sponsors' },
      { id: 'publishers', label: 'Publisher deals' },
      { id: 'visibleResearch', label: 'Research' },
      { id: 'consoles', label: 'Consoles' },
      { id: 'installBase', label: 'Console install base' },
      { id: 'platformRelationships', label: 'Platform relationships' },
      { id: 'staff', label: 'Staff (other than Legacy Staff)' },
      { id: 'catalogue', label: 'Released games' },
      { id: 'franchises', label: 'Franchises (other than blueprints)' },
      { id: 'engines', label: 'Own engines' },
      { id: 'fanTrust', label: 'Fan Trust' },
      { id: 'calendar', label: 'The calendar' },
    ],
  },
  legacy: { picksByLevel: [0, 1, 2, 3] },
  blueprints: { byLevel: [0, 1, 1, 2] },
  researchPctByLevel: [0, 15, 25, 35], // of the finished run's research (the RP its done topics cost), back as RP
  facilityBlueprintByLevel: [0, 0, 1, 1], // NG+2 adds it; NG+3 keeps it (levels build on each other)
  facilityDiscountPct: 50, // the blueprint facility's first purchase in the new run
  blueprintFansPct: 25, // a blueprint franchise starts with this share of its old fans
  ultimatePathsAt: 3, // PROJECT ONE / PROJECT X / Studio Singularity (Milestone 31) read the NG+ level
};

// Prestige Tokens' first spend (Milestone 33): a small shop on the NG+ setup screen. Paid when the new run starts.
// Nothing here can be a secret, an award or a prestige unlock (the test checks every item's effect kind).
export const TOKEN_SHOP = [
  { id: 'extraLegacy', name: 'Extra Legacy Staff pick', price: 3, effect: { kind: 'extraPick', what: 'legacy' }, line: 'Bring one more person from the finished run.' },
  { id: 'extraBlueprint', name: 'Extra Legacy Blueprint', price: 2, effect: { kind: 'extraPick', what: 'blueprints' }, line: 'Carry one more game as a template.' },
  { id: 'startFacility', name: 'Starting facility', price: 2, effect: { kind: 'startFacility', options: ['F12', 'F13', 'F07'] }, line: 'The new studio opens with one of these already built.' },
];
export const TOKEN_EFFECT_KINDS = ['extraPick', 'startFacility'];
export const tokenItemById = (id) => TOKEN_SHOP.find((t) => t.id === id) ?? null;
