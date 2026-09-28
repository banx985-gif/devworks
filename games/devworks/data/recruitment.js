// Recruitment, training and mentoring (Milestone 13, bible §11). Plain data only. The bible gives the channels, the
// board of 3, the 56-day free refresh, the stage cap (§35, plan review A5) and the course names; every number below
// that it doesn't give is a placeholder (plan review B) and is listed in the build log.

// Channels (bible §11). rank: the rank that opens it. weights: how often each tier is drawn for a card (a tier with
// nobody eligible right now is skipped). refreshCost: Credits for a paid refresh on this channel, doubled for every
// paid refresh already bought this month (escalating monthly cost; a new month starts again at the base).
// Special Arrival is condition-driven: nobody picks it; conditions add one extra card (core RecruitmentSystem's
// special card) that stays SPECIAL_DAYS days. Milestone 13 uses it only for the missing-role hint (a Start Candidate);
// Legendary / Secret arrivals come with the secrets.
export const CHANNELS = [
  { id: 'local', name: 'Local Network', rank: null, roles: ['PRG', 'DSN', 'ART', 'WRT', 'PRO'], weights: { standard: 1 }, refreshCost: 300, line: 'Friends of friends: Standard staff.' },
  { id: 'agency', name: 'Agency Search', rank: 'D', roles: ['PRG', 'DSN', 'ART', 'WRT', 'PRO'], weights: { standard: 1, rare: 1 }, refreshCost: 800, line: 'An agency finds Standard and Rare staff.' },
  { id: 'national', name: 'National Scout', rank: 'C', roles: ['PRG', 'DSN', 'ART', 'WRT', 'PRO'], weights: { standard: 1, rare: 3, elite: 1 }, refreshCost: 1800, line: 'Scouts across the country: mostly Rare, some Elite.' },
  { id: 'global', name: 'Global Head Hunt', rank: 'A', roles: ['PRG', 'DSN', 'ART', 'WRT', 'PRO'], weights: { rare: 2, elite: 3 }, refreshCost: 4000, line: 'The best in the world: Rare and Elite.' },
];
export const channelById = (id) => CHANNELS.find((c) => c.id === id) ?? null;
export const SPECIAL_DAYS = 56;

export const RECRUIT = {
  boardSize: 3,
  freeRefreshDays: 56, // bible §11: the board refreshes itself (free) every 56 game days
  refreshEscalation: 2, // each paid refresh in the same month costs this many times the last one
  reappearChance: 0.1, // someone who was let go can turn up on a later board (core RecruitmentSystem)
  // Rare "role milestone" (bible §10): this many released games with someone of the role on the team.
  roleMilestone: 2,
  // Elite "Rank B + role facility": the facility of their role that must stand in the studio.
  roleFacilities: { PRG: 'F18', DSN: 'F21', ART: 'F16', WRT: 'F20', PRO: 'F22' },
  // Elite "Rank A + major achievement" (plan review, M13 row): a Million Seller or a C04+ award win (Milestone 19).
  millionSeller: 1000000,
  // Where a new hire works: a free station of their role first, else any free work station. With none free, their
  // role's station is built for them (its price is paid on hiring) when it can be.
  roleStations: { PRG: 'F02', DSN: 'F03', ART: 'F04', WRT: 'F05', PRO: 'F06' },
};

// Training courses (bible §11 list). effect: core TrainingSystem's shape — 'stat' (one stat), 'lowest' (the `count`
// lowest stats), 'all' (every stat) — gains min–max, clamped to the tier cap. days: away from work (off the studio
// floor, not on any game). requires: { research } — a topic researched first, or { franchise } — a franchise with this
// many released games. limit: once per worker per year.
export const COURSES = [
  { id: 'bootcamp', name: 'Programming Bootcamp', cost: 900, days: 14, effect: { kind: 'stat', stat: 'code', min: 8, max: 14 }, art: 'dev_vfx_02' },
  { id: 'designWorkshop', name: 'Systems Design Workshop', cost: 900, days: 14, effect: { kind: 'stat', stat: 'des', min: 8, max: 14 }, art: 'dev_vfx_02' },
  { id: 'artPipeline', name: 'Art Pipeline Course', cost: 900, days: 14, effect: { kind: 'stat', stat: 'art', min: 8, max: 14 }, art: 'dev_vfx_02' },
  { id: 'narrativeLab', name: 'Narrative Lab', cost: 900, days: 14, effect: { kind: 'stat', stat: 'wrt', min: 8, max: 14 }, art: 'dev_vfx_02' },
  { id: 'leadership', name: 'Production Leadership', cost: 900, days: 14, effect: { kind: 'stat', stat: 'prod', min: 8, max: 14 }, art: 'dev_vfx_02' },
  { id: 'crossDiscipline', name: 'Cross-Discipline Week', cost: 700, days: 7, effect: { kind: 'lowest', count: 2, min: 4, max: 8 }, art: 'dev_vfx_02' },
  { id: 'engineSpecialisation', name: 'Engine Specialisation', cost: 2400, days: 28, effect: { kind: 'stat', stat: 'code', min: 14, max: 22 }, requires: { research: 'ENG2' }, art: 'dev_vfx_02' },
  { id: 'franchiseMentorship', name: 'Franchise Mentorship', cost: 2000, days: 21, effect: { kind: 'all', min: 2, max: 5 }, requires: { franchise: 2 }, art: 'dev_vfx_02' },
].map((c) => ({ ...c, currency: 'credits', limit: { perWorkerPerYear: 1 } }));
// How many people can be on a course at once.
export const TRAINING_SLOTS = 2;

// Mentoring (bible §11): an Elite (or higher) mentors one worker of a lower tier. Each day both work on the same game
// the mentee gets xpPerDay XP; after tagDays such shared days they learn one of the mentor's traits (a "specialty tag": extra, not using a trait
// slot, one per person)
// that they don't have yet. Signature traits never copy.
export const MENTORING = {
  mentorTiers: ['elite', 'legendary', 'secret'],
  xpPerDay: 4,
  tagDays: 60,
};

// Missing-role hints (spec §9): a role counts as "leaned on" by a scope when one of its phases gives the role's stat
// at least this weight; the New Game screen then shows how many more days the game takes without it and surfaces a
// Start Candidate of that role (a special card on the board).
export const HINTS = { leanWeight: 0.15 };
