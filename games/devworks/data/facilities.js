// The 35 facilities (Milestone 11, bible §36): role, unlock, cost and effect exactly as the table, plus what the
// studio needs to place them: size (footprint in cells) and seats (the spots in front where someone stands to use it,
// relative to the footprint; they must stay reachable). Plain data only.
//
// effects: the facility's effect as data, summed over every facility standing in the studio (world.effect(key)); the
// systems ask for a key and never know which facility gave it. Keys:
//   statPct.<stat>        that stat counts this % more towards a game's progress (code / des / art / wrt)
//   phasePct.<phase>      that milestone goes this % faster (prototype)
//   progressPct           every milestone goes this % faster
//   scheduleVariancePct   schedule slip range narrows (−) by this %
//   bugFixPct             bugs fixed this % faster
//   restEnergyPct         Energy comes back this % faster in the Break Area
//   output.<key>          a finished game gets these points (audio / story / audienceFit)
//   outputLarge.graphics  the same, for Large and bigger games only (motion capture)
//   outputPct.graphics    Graphics built this % stronger
//   hypePct               marketing actions bring this % more Hype
//   fanTrustGainPct       Fan Trust gains this % bigger
//   certFailPct           certification fail chance changes by this % (−12 = 12% less)
//   launchSalesPct        launch sales this % higher
//   later: the facility's effect belongs to a later milestone (named); it is stored and shown, nothing reads it yet.
//
// unlock: { start } | { rank } | { year } | { research: [ids] } | { trophies } | { story } (a released game with this
//   Story or more) | { secret } (hidden until found). Several keys = all of them.
export const FACILITY_ROLES = ['Maker', 'Specialist', 'Thinker', 'Rest', 'Front desk', 'Support', 'Showcase', 'Arena link', 'Secret'];

const seat1 = (w, h) => [{ dc: Math.floor(w / 2), dr: h }];

export const FACILITIES = [
  { id: 'F01', name: 'Starter Desks', role: 'Maker', unlock: { start: true }, cost: 1200, line: 'Required for one active game project', effects: {} },
  { id: 'F02', name: 'Code Station', role: 'Specialist', unlock: { start: true }, cost: 1400, line: 'Programming milestone speed +8%', effects: { 'statPct.code': 8 }, size: { w: 2, h: 2 } },
  { id: 'F03', name: 'Design Board', role: 'Specialist', unlock: { start: true }, cost: 1300, line: 'Design milestone speed +8%', effects: { 'statPct.des': 8 } },
  { id: 'F04', name: 'Art Station', role: 'Specialist', unlock: { start: true }, cost: 1400, line: 'Art milestone speed +8%', effects: { 'statPct.art': 8 } },
  { id: 'F05', name: 'Writer Corner', role: 'Specialist', unlock: { start: true }, cost: 1200, line: 'Writing milestone speed +8%', effects: { 'statPct.wrt': 8 } },
  { id: 'F06', name: 'Producer Desk', role: 'Thinker', unlock: { start: true }, cost: 1300, line: 'Schedule variance -5%', effects: { scheduleVariancePct: -5 } },
  { id: 'F07', name: 'Test Bench', role: 'Specialist', unlock: { rank: 'D' }, cost: 1600, line: 'QA bug removal +8%', effects: { bugFixPct: 8 }, size: { w: 2, h: 2 } },
  { id: 'F08', name: 'Break Area', role: 'Rest', unlock: { start: true }, cost: 1000, line: 'Energy recovery +20%', effects: { restEnergyPct: 20 } },
  { id: 'F09', name: 'Recruitment Desk', role: 'Front desk', unlock: { start: true }, cost: 1100, line: 'Hiring/recruitment access', effects: {}, size: { w: 2, h: 1 } }, // Milestone 13: tap it for the board
  { id: 'F10', name: 'Meeting Table', role: 'Thinker', unlock: { start: true }, cost: 1000, line: 'Prototype knowledge +5', effects: { 'phasePct.prototype': 5 }, size: { w: 2, h: 2 } },
  { id: 'F11', name: 'Server Rack', role: 'Support', unlock: { research: ['ENG1'] }, cost: 1800, line: 'Build/compile speed +6%', effects: { progressPct: 6 }, size: { w: 1, h: 1 } },
  { id: 'F12', name: 'Recording Booth', role: 'Specialist', unlock: { rank: 'D' }, cost: 2200, line: 'Audio package quality +5', effects: { 'output.audio': 5 }, size: { w: 2, h: 2 } },
  { id: 'F13', name: 'Marketing Wall', role: 'Front desk', unlock: { rank: 'D' }, cost: 1800, line: 'Marketing campaign planning', effects: { hypePct: 10 } },
  { id: 'F14', name: 'Showcase Shelf', role: 'Showcase', unlock: { start: true }, cost: 900, line: 'Back-catalogue/franchise display', effects: {} },
  { id: 'F15', name: 'Awards Cabinet', role: 'Arena link', unlock: { trophies: 1 }, cost: 1500, line: 'Award reputation +5%', effects: { awardFamePct: 5 }, later: 'Milestone 19 (awards)', size: { w: 1, h: 2 } },
  { id: 'F16', name: 'Motion Capture Corner', role: 'Specialist', unlock: { rank: 'C' }, cost: 5200, line: 'Large 3D project animation +8', effects: { 'outputLarge.graphics': 8 }, size: { w: 3, h: 2 } },
  { id: 'F17', name: 'QA Lab', role: 'Specialist', unlock: { rank: 'C' }, cost: 5500, line: 'Bug removal +15%', effects: { bugFixPct: 15 }, size: { w: 3, h: 2 } },
  { id: 'F18', name: 'Engine Lab', role: 'Specialist', unlock: { research: ['ENG3'] }, cost: 6500, line: 'Own-engine research +15%', effects: { engineResearchPct: 15 }, later: 'the own-engine milestone', size: { w: 3, h: 2 } },
  { id: 'F19', name: 'Art Render Farm', role: 'Specialist', unlock: { research: ['ART3'] }, cost: 6200, line: 'Graphics production +12%', effects: { 'outputPct.graphics': 12 }, size: { w: 2, h: 2 } },
  { id: 'F20', name: 'Narrative Room', role: 'Specialist', unlock: { story: 70 }, cost: 5200, line: 'Story projects +10', effects: { 'output.story': 10 }, size: { w: 2, h: 2 } },
  { id: 'F21', name: 'User Research Lab', role: 'Thinker', unlock: { rank: 'B' }, cost: 5800, line: 'Audience Fit knowledge +10', effects: { 'output.audienceFit': 10 }, size: { w: 2, h: 2 } },
  { id: 'F22', name: 'Localisation Suite', role: 'Support', unlock: { rank: 'B' }, cost: 5400, line: 'Global localisation cost -15%', effects: { localisationCostPct: -15 }, later: 'global releases', size: { w: 2, h: 2 } },
  { id: 'F23', name: 'Community Room', role: 'Front desk', unlock: { rank: 'B' }, cost: 5600, line: 'Fan Trust recovery +12%', effects: { fanTrustGainPct: 12 }, size: { w: 2, h: 2 } },
  { id: 'F24', name: 'Media Studio', role: 'Front desk', unlock: { rank: 'B' }, cost: 6000, line: 'Trailer/marketing Hype +10%', effects: { hypePct: 10 }, size: { w: 2, h: 2 } },
  { id: 'F25', name: 'Engine Build Farm', role: 'Specialist', unlock: { research: ['ENG5'] }, cost: 7600, line: 'Compile/project time -10%', effects: { progressPct: 10 }, size: { w: 2, h: 2 } },
  { id: 'F26', name: 'Publishing Office', role: 'Front desk', unlock: { rank: 'A' }, cost: 8200, line: 'Publish external pitches', effects: {}, later: 'Milestone 17 (publishing)', size: { w: 3, h: 2 } },
  { id: 'F27', name: 'Executive Boardroom', role: 'Thinker', unlock: { rank: 'A' }, cost: 8500, line: 'Major deals +1 offer', effects: { dealOffers: 1 }, later: 'Milestone 18 (deals)', size: { w: 3, h: 2 } },
  { id: 'F28', name: 'Hardware Prototype Lab', role: 'Maker', unlock: { year: 11, research: ['HW2'] }, cost: 10000, line: 'Unlock first console prototype', effects: {}, later: 'the hardware milestones', size: { w: 3, h: 3 } },
  { id: 'F29', name: 'Dev Kit Lab', role: 'Specialist', unlock: { research: ['HW3'] }, cost: 9000, line: 'Third-party support +10%', effects: { thirdPartyPct: 10 }, later: 'the hardware milestones', size: { w: 3, h: 2 } },
  { id: 'F30', name: 'Certification Lab', role: 'Specialist', unlock: { research: ['HW4'] }, cost: 9400, line: 'Console defect/certification risk -12%', effects: { certFailPct: -12 }, size: { w: 3, h: 2 } },
  { id: 'F31', name: 'Distribution Hub', role: 'Support', unlock: { rank: 'A' }, cost: 8000, line: 'Physical/digital launch efficiency +10%', effects: { launchSalesPct: 10 }, size: { w: 3, h: 2 } },
  { id: 'F32', name: 'Storefront Ops', role: 'Front desk', unlock: { year: 15, research: ['BUS6'] }, cost: 9000, line: 'Unlock own digital storefront', effects: {}, later: 'the storefront milestone', size: { w: 2, h: 2 } },
  { id: 'F33', name: 'Museum / Hall of Fame', role: 'Showcase', unlock: { year: 12, trophies: 5 }, cost: 7600, line: 'NG+ legacy archive +1', effects: { legacyArchive: 1 }, later: 'NG+ (Milestone 33)', size: { w: 3, h: 2 } },
  { id: 'F34', name: 'Black Box R&D', role: 'Secret', unlock: { secret: 'SEC-FAC-01' }, cost: 18000, line: 'Prestige engine/hardware research +20%', effects: { prestigeResearchPct: 20 }, later: 'the secrets', size: { w: 3, h: 3 } },
  { id: 'F35', name: 'The Vault', role: 'Secret', unlock: { secret: 'SEC-FAC-02' }, cost: 22000, line: 'PROJECT ONE / PROJECT X clue hub', effects: {}, later: 'the secrets', size: { w: 3, h: 3 } },
].map((f) => {
  const size = f.size ?? { w: 2, h: 2 };
  return { ...f, art: `facility_${f.id.toLowerCase()}`, size, seats: f.role === 'Showcase' || f.role === 'Secret' || f.role === 'Arena link' ? [] : seat1(size.w, size.h) };
});
export const facilityById = (id) => FACILITIES.find((f) => f.id === id) ?? null;

// Selling pays this share of the build price back (bible §36: 50%).
export const SELL_BACK_PCT = 50;
// Facilities that can't be sold: the studio can't work without them.
export const KEEP = { F01: 'The team needs its desks', F08: 'The team needs somewhere to rest' };

// Studio stages (bible §35, S1–S3 now; S4 / S5 come with Milestone 22). The room grows away from the back walls, so
// every placement stays where it was. cols / rows: the floor grid. cost: Credits to move up (plan review B: the bible
// gives none). shell: the stage's picture (the room itself is drawn by code, plan review A8). unlock: what it needs;
// awards: awards come in Milestone 19, so S3 has a debug unlock until then. look: the room's colours by code.
export const STAGES = [
  { id: 1, name: 'Rented Office', cols: 10, rows: 14, staffCap: 6, lanes: 1, cost: 0, shell: null, unlock: {}, line: 'Cramped single-room office; cheap and personal.' },
  { id: 2, name: 'Indie Loft', cols: 14, rows: 18, staffCap: 10, lanes: 2, cost: 6000, shell: 'studio_shell_upgrade_01', unlock: { rank: 'D', released: 2 }, line: 'Open-plan loft, proper meeting/recording corners.', look: { wallFace: '#E9C9A8', wallSide: '#D9B28E', floorA: '#C99E6E', floorB: '#C09467', grout: '#A87E52' } },
  { id: 3, name: 'Professional Studio', cols: 18, rows: 22, staffCap: 16, lanes: 2, cost: 18000, shell: 'studio_shell_upgrade_02', unlock: { rank: 'C', awards: 1 }, line: 'Dedicated departments, QA and media rooms.', look: { wallFace: '#EAF0F2', wallSide: '#D8E1E6', floorA: '#CFC6B8', floorB: '#C7BDAE', grout: '#AFA391' } },
];
export const stageById = (id) => STAGES.find((s) => s.id === id) ?? STAGES[0];
