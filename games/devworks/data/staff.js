// DEVWORKS staff content (Milestone 2): stats, roles, tiers, traits and the start staff. Plain data only.
// Milestone 14: all 50 of bible §10 (ROSTER), every trait with a small effect, signature traits for Legendary / Secret.
// Bible §9 (system) and §10 (roster). Milestone 5b: all five start staff (one per role, any of them can found the
// studio) are here; the starting team comes from the founder picked (data/setup.js).

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
  legendary: { name: 'Legendary', statCap: 520, traitSlots: 2, signature: true }, // "2 + signature" (bible §9)
  secret: { name: 'Secret', statCap: 650, traitSlots: 3, signature: true }, // "3 + signature"
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
  // Milestone 14: the later Rares.
  engineMind: { name: 'Engine Mind', text: 'Thinks in engines: +3 Innovation on games they work on.', effects: { outputBonus: { innovation: 3 } } },
  fastCompiler: { name: 'Fast Compiler', text: 'Never waits for a build: +10% bug fixing.', effects: { bugFixPct: 10 } },
  prototypeFast: { name: 'Prototype Fast', text: 'Quick to try ideas: +3 Innovation on games they work on.', effects: { outputBonus: { innovation: 3 } } },
  economyBrain: { name: 'Economy Brain', text: 'Rewards that feel fair: +3 Gameplay on games they work on.', effects: { outputBonus: { gameplay: 3 } } },
  fastConcept: { name: 'Fast Concept', text: 'Sketches in minutes: learns 15% faster (XP).', effects: { xpGainPct: 15 } },
  lightingEye: { name: 'Lighting Eye', text: 'Light that sets the mood: +3 Graphics on games they work on.', effects: { outputBonus: { graphics: 3 } } },
  loreKeeper: { name: 'Lore Keeper', text: 'Every detail fits: +3 Story on games they work on.', effects: { outputBonus: { story: 3 } } },
  characterVoice: { name: 'Character Voice', text: 'People you remember: +2 Story and +2 Audience Fit on games they work on.', effects: { outputBonus: { story: 2, audienceFit: 2 } } },
  marketingRead: { name: 'Marketing Read', text: 'Knows what players want: +3 Audience Fit on games they work on.', effects: { outputBonus: { audienceFit: 3 } } },
  scopeKnife: { name: 'Scope Knife', text: 'Cuts the fat: +3 Polish on games they work on.', effects: { outputBonus: { polish: 3 } } },
  // Signature traits (Legendary / Secret staff; bible §9: "2 + signature" / "3 + signature"). Defined now; their owners
  // arrive with the secrets (Milestones 28–29). A signature never copies (mentoring) and doesn't use a trait slot.
  codeArchitect: { name: 'Code Architect', signature: true, text: 'Signature: +25% bug fixing and +5 Polish on games they work on.', effects: { bugFixPct: 25, outputBonus: { polish: 5 } } },
  designLegend: { name: 'Design Legend', signature: true, text: 'Signature: +8 Gameplay on games they work on.', effects: { outputBonus: { gameplay: 8 } } },
  visualLegend: { name: 'Visual Legend', signature: true, text: 'Signature: +8 Graphics on games they work on.', effects: { outputBonus: { graphics: 8 } } },
  storyLegend: { name: 'Story Legend', signature: true, text: 'Signature: +8 Story on games they work on.', effects: { outputBonus: { story: 8 } } },
  studioLegend: { name: 'Studio Legend', signature: true, text: 'Signature: loses 25% less Energy and +4 Polish on games they work on.', effects: { energyLossPct: -25, outputBonus: { polish: 4 } } },
  impossibleBuild: { name: 'Impossible Build', signature: true, text: 'Signature: +35% bug fixing and +6 Innovation on games they work on.', effects: { bugFixPct: 35, outputBonus: { innovation: 6 } } },
  perfectLoop: { name: 'Perfect Loop', signature: true, text: 'Signature: +10 Gameplay and +4 Polish on games they work on.', effects: { outputBonus: { gameplay: 10, polish: 4 } } },
  dreamRender: { name: 'Dream Render', signature: true, text: 'Signature: +10 Graphics and +4 Innovation on games they work on.', effects: { outputBonus: { graphics: 10, innovation: 4 } } },
  impossibleEnding: { name: 'Impossible Ending', signature: true, text: 'Signature: +10 Story and +4 Audience Fit on games they work on.', effects: { outputBonus: { story: 10, audienceFit: 4 } } },
  futureProof: { name: 'Future Proof', signature: true, text: 'Signature: loses 30% less Energy and +5 Audience Fit on games they work on.', effects: { energyLossPct: -30, outputBonus: { audienceFit: 5 } } },
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

// Milestone 13: the people recruitment can find (bible §10); Milestone 14 completes the 50.
//   eligibility: { start: true }            Standard: on the boards from day one (a Start Candidate; the five founders
//                                           who weren't picked are Standards too)
//                { rank: 'D' }              Rare: the studio has reached Rank D
//                { roleGames: n }           Rare "role milestone": n released games with someone of their role on
//                                           the team (RECRUIT.roleMilestone)
//                { rank: 'B', roleFacility: true }   Elite: Rank B and their role's facility in the studio
//                                           (RECRUIT.roleFacilities)
//                { rank: 'A', major: true } Elite: Rank A and a major achievement (plan review: a Million Seller or a
//                                           C04+ award win; awards are Milestone 19)
//                { secret: 'SEC-STAFF-…' }  Legendary / Secret: only through that secret (Milestones 28–29)
// startCandidate: the second Standard of each role (spec §9: the early tutorial recruits, shown first).
const person = (id, name, role, tier, startLevel, s, salary, trait, eligibility, extra = {}) => ({
  id,
  name,
  role,
  tier,
  startLevel,
  stats: { code: s[0], des: s[1], art: s[2], wrt: s[3], prod: s[4] },
  salary,
  traits: Array.isArray(trait) ? [...trait] : [trait],
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
  // Milestone 14: the rest of bible §10. The later role-milestone Rares need more released games with their role on the
  // team (xx05: 4, xx06: 6 — placeholders; the bible only says "role milestone").
  person('PRG05', 'Juno Park', 'PRG', 'rare', 8, [183, 149, 127, 138, 149], 1100, 'engineMind', { roleGames: 4 }),
  person('PRG06', 'Omar Vale', 'PRG', 'rare', 10, [196, 129, 140, 151, 129], 1150, 'fastCompiler', { roleGames: 6 }),
  person('DSN05', 'Zara Vale', 'DSN', 'rare', 8, [145, 168, 134, 145, 123], 1100, 'prototypeFast', { roleGames: 4 }),
  person('DSN06', 'Finn Cross', 'DSN', 'rare', 10, [125, 181, 147, 125, 136], 1150, 'economyBrain', { roleGames: 6 }),
  person('ART05', 'Imani West', 'ART', 'rare', 8, [119, 130, 186, 119, 130], 1100, 'fastConcept', { roleGames: 4 }),
  person('ART06', 'Rue Park', 'ART', 'rare', 10, [132, 143, 166, 132, 143], 1150, 'lightingEye', { roleGames: 6 }),
  person('WRT05', 'Freya Moss', 'WRT', 'rare', 8, [126, 137, 148, 171, 137], 1100, 'loreKeeper', { roleGames: 4 }),
  person('WRT06', 'Eli Hart', 'WRT', 'rare', 10, [139, 150, 128, 184, 150], 1150, 'characterVoice', { roleGames: 6 }),
  person('PRO05', 'Amaya Price', 'PRO', 'rare', 8, [133, 144, 122, 133, 189], 1100, 'marketingRead', { roleGames: 4 }),
  person('PRO06', 'Soren March', 'PRO', 'rare', 10, [146, 124, 135, 146, 169], 1150, 'scopeKnife', { roleGames: 6 }),
  // Legendary and Secret (Prestige) staff: gated by their SEC-STAFF secret (Milestones 28–29). The bible names only their
// signature trait; each also carries their role's Elite trait as the normal one (placeholder: tiers allow 2 / 3 + a
// signature, and every row needs at least one normal trait). Until then nobody can
  // find or hire them; ?debug=1 can preview their card only.
  person('PRG09', 'Dr. Ada Flux', 'PRG', 'legendary', 21, [409, 340, 351, 329, 340], 4050, ['systemsThinker', 'codeArchitect'], { secret: 'SEC-STAFF-L1' }),
  person('DSN09', 'Sora Quill', 'DSN', 'legendary', 21, [336, 427, 325, 336, 347], 4050, ['featureCutter', 'designLegend'], { secret: 'SEC-STAFF-L2' }),
  person('ART09', 'Aurelia Frame', 'ART', 'legendary', 21, [343, 354, 412, 343, 354], 4050, ['threeDMaster', 'visualLegend'], { secret: 'SEC-STAFF-L3' }),
  person('WRT09', 'Cass Story', 'WRT', 'legendary', 21, [350, 328, 339, 430, 328], 4050, ['branchingMind', 'storyLegend'], { secret: 'SEC-STAFF-L4' }),
  person('PRO09', 'Mira Sterling', 'PRO', 'legendary', 21, [324, 335, 346, 324, 415], 4050, ['launchCaptain', 'studioLegend'], { secret: 'SEC-STAFF-L5' }),
  person('PRG10', 'Zero Lin', 'PRG', 'secret', 24, [522, 453, 431, 442, 453], 5700, ['systemsThinker', 'impossibleBuild'], { secret: 'SEC-STAFF-S1' }),
  person('DSN10', 'Pixel Grey', 'DSN', 'secret', 24, [449, 507, 438, 449, 427], 5700, ['featureCutter', 'perfectLoop'], { secret: 'SEC-STAFF-S2' }),
  person('ART10', 'Ghost Palette', 'ART', 'secret', 24, [456, 434, 525, 456, 434], 5700, ['threeDMaster', 'dreamRender'], { secret: 'SEC-STAFF-S3' }),
  person('WRT10', 'Oracle Quill', 'WRT', 'secret', 24, [430, 441, 452, 510, 441], 5700, ['branchingMind', 'impossibleEnding'], { secret: 'SEC-STAFF-S4' }),
  person('PRO10', 'One Kane', 'PRO', 'secret', 24, [437, 448, 426, 437, 528], 5700, ['launchCaptain', 'futureProof'], { secret: 'SEC-STAFF-S5' }),
];
// Tiers that only arrive through a secret: never on a board, never hired before then (Milestone 14).
export const PRESTIGE_TIERS = ['legendary', 'secret'];
// The SEC-STAFF secrets (bible §41) the gated rows may name.
export const STAFF_SECRETS = ['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3', 'S4', 'S5'].map((k) => `SEC-STAFF-${k}`);
// Everyone the game knows (start staff first). The five founders are Standard recruits too when not picked.
export const ROSTER = [...START_STAFF.map((d) => ({ ...d, eligibility: { start: true } })), ...RECRUITS];
export const staffDefById = (id) => ROSTER.find((d) => d.id === id) ?? null;

// The Milestone 2–5 starting team (Alex, Mina, Tess): the default layout, and the team of every save from before 5b.
export const STARTERS = ['PRG01', 'DSN01', 'PRO01'].map(startStaffById);
