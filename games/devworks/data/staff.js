// DEVWORKS staff content (Milestone 2): stats, roles, tiers, traits and the three starters. Plain data only.
// Bible §9 (system) and §10 (roster). Only the starting team is here; candidates and the other 47 come later.

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

// Trait effects are not numbered in the bible: these are placeholders. Only energyLossPct does anything yet
// (core StaffSystem reads it); the others wait for projects and bugs.
export const TRAITS = {
  bugHunter: { name: 'Bug Hunter', text: 'Spots bugs early: +10% bug fixing.', effects: { bugFixPct: 10 } },
  goodFeel: { name: 'Good Feel', text: 'Games just feel right: +5 Fun on projects they design.', effects: { funBonus: 5 } },
  calmSchedule: { name: 'Calm Schedule', text: 'Stays calm under deadlines: loses 10% less Energy while working.', effects: { energyLossPct: -10 } },
};

// The starting team (bible §10, fixed 26 Sept; plan review A1). station = the facility they work at.
export const STARTERS = [
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
