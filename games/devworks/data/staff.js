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

// The Milestone 2–5 starting team (Alex, Mina, Tess): the default layout, and the team of every save from before 5b.
export const STARTERS = ['PRG01', 'DSN01', 'PRO01'].map(startStaffById);
