// DEVWORKS staff content (Milestone 2): stats, roles, tiers, traits and the start staff. Plain data only.
// Bible §9 (system) and §10 (roster). Milestone 5b: all five start staff (one per role, any of them can found the
// studio) are here; the starting team comes from the founder picked (data/setup.js). The other 45 come later.

// The five work stats, in display order. Visible range 1–999.
export const STATS = [
  { key: 'code', label: 'CODE', name: 'Code' },
  { key: 'des', label: 'DES', name: 'Design' },
  { key: 'art', label: 'ART', name: 'Art' },
  { key: 'wrt', label: 'WRT', name: 'Writing' },
  { key: 'prod', label: 'PROD', name: 'Production' },
];
export const STAT_KEYS = STATS.map((s) => s.key);

export const ROLES = {
  PRG: { name: 'Programmer', primaryStat: 'code' },
  DSN: { name: 'Designer', primaryStat: 'des' },
  ART: { name: 'Artist', primaryStat: 'art' },
  WRT: { name: 'Writer', primaryStat: 'wrt' },
  PRO: { name: 'Producer', primaryStat: 'prod' },
};

export const TIERS = {
  standard: { name: 'Standard', statCap: 220, traitSlots: 1 },
  rare: { name: 'Rare', statCap: 300, traitSlots: 1 },
  elite: { name: 'Elite', statCap: 400, traitSlots: 2 },
  legendary: { name: 'Legendary', statCap: 520, traitSlots: 2 },
  secret: { name: 'Secret', statCap: 650, traitSlots: 3 },
};

// Trait effects are not numbered in the bible: these are placeholders. energyLossPct and bugFixPct since Milestone 2;
// outputBonus (Milestone 7): points added to a finished game's outputs when that person is on its core team.
export const TRAITS = {
  bugHunter: { name: 'Bug Hunter', text: 'Spots bugs early: +10% bug fixing.', effects: { bugFixPct: 10 } },
  goodFeel: { name: 'Good Feel', text: 'Games just feel right: +3 Gameplay on games they work on.', effects: { outputBonus: { gameplay: 3 } } },
  calmSchedule: { name: 'Calm Schedule', text: 'Stays calm under deadlines: loses 10% less Energy while working.', effects: { energyLossPct: -10 } },
  strongShapes: { name: 'Strong Shapes', text: 'Bold, readable art: +3 Graphics on games they work on.', effects: { outputBonus: { graphics: 3 } } },
  sharpDialogue: { name: 'Sharp Dialogue', text: 'Lines that land: +3 Story on games they work on.', effects: { outputBonus: { story: 3 } } },
  // Milestone 13: the recruits' traits (placeholders on the same effect keys; Milestone 14 does the full trait pass).
  cleanCode: { name: 'Clean Code', text: 'Tidy code: +8% bug fixing.', effects: { bugFixPct: 8 } },
  playerFirst: { name: 'Player First', text: 'Designs for the player: +2 Audience Fit on games they work on.', effects: { outputBonus: { audienceFit: 2 } } },
  colourSense: { name: 'Colour Sense', text: 'A good eye for colour: +2 Graphics on games they work on.', effects: { outputBonus: { graphics: 2 } } },
  worldBuilder: { name: 'World Builder', text: 'Rich settings: +2 Story on games they work on.', effects: { outputBonus: { story: 2 } } },
  budgetHawk: { name: 'Budget Hawk', text: 'Watches every Credit: loses 8% less Energy while working.', effects: { energyLossPct: -8 } },
  toolsmith: { name: 'Toolsmith', text: 'Builds tools that help: +3 Polish on games they work on.', effects: { outputBonus: { polish: 3 } } },
  systemsEye: { name: 'Systems Eye', text: 'Sees how the parts fit: +3 Gameplay on games they work on.', effects: { outputBonus: { gameplay: 3 } } },
  animator: { name: 'Animator', text: 'Everything moves well: +3 Graphics on games they work on.', effects: { outputBonus: { graphics: 3 } } },
  questWeaver: { name: 'Quest Weaver', text: 'Quests worth doing: +3 Story on games they work on.', effects: { outputBonus: { story: 3 } } },
  teamGlue: { name: 'Team Glue', text: 'Keeps everyone going: loses 12% less Energy while working.', effects: { energyLossPct: -12 } },
  optimizer: { name: 'Optimizer', text: 'Makes it run smoothly: +12% bug fixing.', effects: { bugFixPct: 12 } },
  balanceSense: { name: 'Balance Sense', text: 'Fair and fun: +3 Polish on games they work on.', effects: { outputBonus: { polish: 3 } } },
  styleChameleon: { name: 'Style Chameleon', text: 'Any style: +3 Innovation on games they work on.', effects: { outputBonus: { innovation: 3 } } },
  comedyBeat: { name: 'Comedy Beat', text: 'Knows a good joke: +3 Audience Fit on games they work on.', effects: { outputBonus: { audienceFit: 3 } } },
  publisherSense: { name: 'Publisher Sense', text: 'Knows the market: +3 Audience Fit on games they work on.', effects: { outputBonus: { audienceFit: 3 } } },
  systemsThinker: { name: 'Systems Thinker', text: 'Big-picture code: +15% bug fixing.', effects: { bugFixPct: 15 } },
  featureCutter: { name: 'Feature Cutter', text: 'Cuts what doesn’t work: +5 Polish on games they work on.', effects: { outputBonus: { polish: 5 } } },
  threeDMaster: { name: '3D Master', text: 'Stunning 3D: +5 Graphics on games they work on.', effects: { outputBonus: { graphics: 5 } } },
  branchingMind: { name: 'Branching Mind', text: 'Stories that branch: +5 Story on games they work on.', effects: { outputBonus: { story: 5 } } },
  launchCaptain: { name: 'Launch Captain', text: 'Steady hands at launch: loses 15% less Energy while working.', effects: { energyLossPct: -15 } },
  architectureLead: { name: 'Architecture Lead', text: 'Solid foundations: +20% bug fixing.', effects: { bugFixPct: 20 } },
  creativeDirector: { name: 'Creative Director', text: 'A clear vision: +5 Innovation on games they work on.', effects: { outputBonus: { innovation: 5 } } },
  artDirector: { name: 'Art Director', text: 'One look for the whole game: +6 Graphics on games they work on.', effects: { outputBonus: { graphics: 6 } } },
  narrativeLead: { name: 'Narrative Lead', text: 'Leads the writing: +6 Story on games they work on.', effects: { outputBonus: { story: 6 } } },
  executiveProducer: { name: 'Executive Producer', text: 'Runs a tight ship: loses 20% less Energy while working.', effects: { energyLossPct: -20 } },
};

// The start staff (bible §10, fixed 26 Sept; plan review A1; Milestone 5b adds Niko and Sam). station = the facility
// they work at: the Artist at the Art Station (F04), the Writer at the Writer Corner (F05).
export const START_STAFF = [
  {
    id: 'PRG01',
    name: 'Alex Byte',
    role: 'PRG',
    tier: 'standard',
    startLevel: 1,
    stats: { code: 99, des: 65, art: 76, wrt: 54, prod: 65 },
    salary: 500,
    traits: ['bugHunter'],
    art: 'staff_prg01',
    station: 'F01',
  },
  {
    id: 'DSN01',
    name: 'Mina Hart',
    role: 'DSN',
    tier: 'standard',
    startLevel: 1,
    stats: { code: 61, des: 117, art: 83, wrt: 61, prod: 72 },
    salary: 500,
    traits: ['goodFeel'],
    art: 'staff_dsn01',
    station: 'F03',
  },
  {
    id: 'ART01',
    name: 'Niko Bell',
    role: 'ART',
    tier: 'standard',
    startLevel: 1,
    stats: { code: 68, des: 79, art: 102, wrt: 68, prod: 79 },
    salary: 500,
    traits: ['strongShapes'],
    art: 'staff_art01',
    station: 'F04',
  },
  {
    id: 'WRT01',
    name: 'Sam Reed',
    role: 'WRT',
    tier: 'standard',
    startLevel: 1,
    stats: { code: 75, des: 86, art: 64, wrt: 120, prod: 86 },
    salary: 500,
    traits: ['sharpDialogue'],
    art: 'staff_wrt01',
    station: 'F05',
  },
  {
    id: 'PRO01',
    name: 'Tess Grant',
    role: 'PRO',
    tier: 'standard',
    startLevel: 1,
    stats: { code: 82, des: 60, art: 71, wrt: 82, prod: 105 },
    salary: 500,
    traits: ['calmSchedule'],
    art: 'staff_pro01',
    station: 'F06',
  },
];
export const startStaffById = (id) => START_STAFF.find((d) => d.id === id) ?? null;

// Milestone 13: the people recruitment can find (bible §10). Only the rows that prove each eligibility rule are here;
// the full 50 (the other Rares, Legendary and Secret staff, signatures, art checks) is Milestone 14.
//   eligibility: { start: true }            Standard: on the boards from day one (a Start Candidate; the five founders
//                                           who weren't picked are Standards too)
//                { rank: 'D' }              Rare: the studio has reached Rank D
//                { roleGames: n }           Rare "role milestone": n released games with someone of their role on
//                                           the team (RECRUIT.roleMilestone)
//                { rank: 'B', roleFacility: true }   Elite: Rank B and their role's facility in the studio
//                                           (RECRUIT.roleFacilities)
//                { rank: 'A', major: true } Elite: Rank A and a major achievement (plan review: a Million Seller or a
//                                           C04+ award win; awards are Milestone 19)
// startCandidate: the second Standard of each role (spec §9: the early tutorial recruits, shown first).
const person = (id, name, role, tier, startLevel, s, salary, trait, eligibility, extra = {}) => ({
  id,
  name,
  role,
  tier,
  startLevel,
  stats: { code: s[0], des: s[1], art: s[2], wrt: s[3], prod: s[4] },
  salary,
  traits: [trait],
  art: `staff_${id.toLowerCase()}`,
  eligibility,
  ...extra,
});
export const RECRUITS = [
  person('PRG02', 'Priya Chen', 'PRG', 'standard', 2, [112, 78, 56, 67, 78], 550, 'cleanCode', { start: true }, { startCandidate: true }),
  person('DSN02', 'Theo Page', 'DSN', 'standard', 2, [74, 130, 63, 74, 85], 550, 'playerFirst', { start: true }, { startCandidate: true }),
  person('ART02', 'Maya Crest', 'ART', 'standard', 2, [81, 59, 115, 81, 59], 550, 'colourSense', { start: true }, { startCandidate: true }),
  person('WRT02', 'Noor Hale', 'WRT', 'standard', 2, [55, 66, 77, 100, 66], 550, 'worldBuilder', { start: true }, { startCandidate: true }),
  person('PRO02', 'Arun Cole', 'PRO', 'standard', 2, [62, 73, 84, 62, 118], 550, 'budgetHawk', { start: true }, { startCandidate: true }),
  person('PRG03', 'Milo Stack', 'PRG', 'rare', 4, [190, 123, 134, 145, 123], 1000, 'toolsmith', { rank: 'D' }),
  person('DSN03', 'Leila Moss', 'DSN', 'rare', 4, [119, 175, 141, 119, 130], 1000, 'systemsEye', { rank: 'D' }),
  person('ART03', 'Hana Vale', 'ART', 'rare', 4, [126, 137, 193, 126, 137], 1000, 'animator', { rank: 'D' }),
  person('WRT03', 'Mei Wynn', 'WRT', 'rare', 4, [133, 144, 122, 178, 144], 1000, 'questWeaver', { rank: 'D' }),
  person('PRO03', 'Kira Lane', 'PRO', 'rare', 4, [140, 151, 129, 140, 196], 1000, 'teamGlue', { rank: 'D' }),
  person('PRG04', 'Tessa Kern', 'PRG', 'rare', 6, [170, 136, 147, 125, 136], 1050, 'optimizer', { roleGames: 2 }),
  person('DSN04', 'Ben Rowan', 'DSN', 'rare', 6, [132, 188, 121, 132, 143], 1050, 'balanceSense', { roleGames: 2 }),
  person('ART04', 'Leo Shade', 'ART', 'rare', 6, [139, 150, 173, 139, 150], 1050, 'styleChameleon', { roleGames: 2 }),
  person('WRT04', 'Oscar Vale', 'WRT', 'rare', 6, [146, 124, 135, 191, 124], 1050, 'comedyBeat', { roleGames: 2 }),
  person('PRO04', 'Joel Stone', 'PRO', 'rare', 6, [120, 131, 142, 120, 176], 1050, 'publisherSense', { roleGames: 2 }),
  person('PRG07', 'Keira Node', 'PRG', 'elite', 14, [321, 252, 230, 241, 252], 2150, 'systemsThinker', { rank: 'B', roleFacility: true }),
  person('DSN07', 'Nia Voss', 'DSN', 'elite', 14, [248, 339, 237, 248, 259], 2150, 'featureCutter', { rank: 'B', roleFacility: true }),
  person('ART07', 'Selene Ink', 'ART', 'elite', 14, [255, 233, 324, 255, 233], 2150, 'threeDMaster', { rank: 'B', roleFacility: true }),
  person('WRT07', 'Talia Verse', 'WRT', 'elite', 14, [229, 240, 251, 309, 240], 2150, 'branchingMind', { rank: 'B', roleFacility: true }),
  person('PRO07', 'Eva Crown', 'PRO', 'elite', 14, [236, 247, 258, 236, 327], 2150, 'launchCaptain', { rank: 'B', roleFacility: true }),
  person('PRG08', 'Dax Lumen', 'PRG', 'elite', 17, [334, 232, 243, 254, 232], 2200, 'architectureLead', { rank: 'A', major: true }),
  person('DSN08', 'Luca Reed', 'DSN', 'elite', 17, [261, 319, 250, 261, 239], 2200, 'creativeDirector', { rank: 'A', major: true }),
  person('ART08', 'Ren Mori', 'ART', 'elite', 17, [235, 246, 337, 235, 246], 2200, 'artDirector', { rank: 'A', major: true }),
  person('WRT08', 'Dorian Pike', 'WRT', 'elite', 17, [242, 253, 231, 322, 253], 2200, 'narrativeLead', { rank: 'A', major: true }),
  person('PRO08', 'Cassian Ward', 'PRO', 'elite', 17, [249, 260, 238, 249, 340], 2200, 'executiveProducer', { rank: 'A', major: true }),
];
// Everyone the game knows (start staff first). The five founders are Standard recruits too when not picked.
export const ROSTER = [...START_STAFF.map((d) => ({ ...d, eligibility: { start: true } })), ...RECRUITS];
export const staffDefById = (id) => ROSTER.find((d) => d.id === id) ?? null;

// The Milestone 2–5 starting team (Alex, Mina, Tess): the default layout, and the team of every save from before 5b.
export const STARTERS = ['PRG01', 'DSN01', 'PRO01'].map(startStaffById);
