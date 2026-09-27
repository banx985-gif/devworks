// The run's studio profile (Milestone 5b): the studio name, the Studio Director, the studio colour, the Founding
// Developer and their history (spec §4), the NG+ level and the play time. Saved with the campaign as `studio`.
//
// Founder history (spec §4): continuous employment, years employed (from the day they were hired) and the games
// credited are kept now; engines, consoles, awards, franchises, the ending and Legacy start empty and are filled by
// later milestones. The founder's flag is permanent for the run.
//
// Also here, pure and tested: the Slot 1 migration of a pre-5b save (migrateToV2), a slot card's summary
// (slotSummary), and the recruit filter that keeps the founder (and anyone employed) out of recruitment.
import { FOUNDER_FLAG, LEGACY_SETUP, founderById, colourById } from '../../data/setup.js';
import { startStaffById } from '../../data/staff.js';
import { CALENDAR, FAME } from '../../data/balance.js';

const DAYS_PER_YEAR = CALENDAR.daysPerMonth * CALENDAR.monthsPerYear;

export function newProfile({ studio, director, colour, founder }, { hiredDay = 0, gamesCredited = [] } = {}) {
  return {
    name: studio,
    director,
    colour,
    ngPlus: 0,
    playSec: 0,
    createdAt: Date.now(),
    founder: {
      id: founder,
      flag: FOUNDER_FLAG,
      hiredDay,
      continuous: true,
      leftDay: null,
      gamesCredited: [...gamesCredited], // catalogue numbers
      engines: [],
      consoles: [],
      awards: [],
      franchises: [],
      ending: null,
      legacy: false,
    },
  };
}

// Save version 1 → 2 (a save from before Milestone 5b, in Slot 1): the default studio, with Alex Byte as Founder,
// credited on every game Alex worked on.
export function migrateToV2(record) {
  const data = record.data;
  const f = LEGACY_SETUP.founder;
  const games = (data.games?.catalogue?.records ?? []).filter((r) => (r.team ?? []).some((m) => m.id === f)).map((r) => r.number);
  return { ...record, data: { ...data, studio: newProfile(LEGACY_SETUP, { gamesCredited: games }) } };
}

// What a slot card shows, from a save's data (spec §7).
export function slotSummary(data) {
  const p = data?.studio;
  if (!p) return null;
  const pts = data.business?.reputation;
  const rankId = rankOf(pts);
  const founder = startStaffById(p.founder?.id);
  return {
    studio: p.name,
    director: p.director,
    colour: colourById(p.colour).hex,
    founderId: p.founder?.id,
    founderName: founder?.name ?? '',
    founderArt: founder?.art ?? null,
    year: data.clock?.year ?? 1,
    month: data.clock?.month ?? 1,
    rank: rankId,
    ngPlus: p.ngPlus ?? 0,
    playSec: p.playSec ?? 0,
  };
}
// The rank from the saved reputation (core ReputationSystem keeps the highest rank index reached).
function rankOf(rep) {
  const i = rep?.highestRankIndex;
  if (typeof i === 'number' && FAME.ranks[i]) return FAME.ranks[i].id;
  const fame = rep?.value ?? 0;
  let id = FAME.ranks[0].id;
  for (const r of FAME.ranks) if (fame >= r.min) id = r.id;
  return id;
}

export const playTimeLabel = (sec) => {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

// Recruitment (Milestone 13) draws from this: never the founder, never anyone already employed (spec §9).
export function recruitable(defs, profile, employedIds = []) {
  return defs.filter((d) => d.id !== profile?.founder?.id && !employedIds.includes(d.id));
}

export function createStudioProfile({ bus, clock }) {
  let p = null;
  const api = {
    get data() {
      return p;
    },
    get name() {
      return p?.name ?? '';
    },
    get colour() {
      return colourById(p?.colour).hex;
    },
    // { id, perk } for the project system, or null.
    founder() {
      const f = p && founderById(p.founder.id);
      return f ? { id: f.id, perk: f.perk } : null;
    },
    isFounder: (id) => !!p && p.founder.id === id,
    yearsEmployed(totalDays = clock?.totalDays ?? 0) {
      if (!p) return 0;
      const until = p.founder.leftDay ?? totalDays;
      return Math.max(0, (until - p.founder.hiredDay) / DAYS_PER_YEAR);
    },
    create(setup) {
      p = newProfile(setup, { hiredDay: clock?.totalDays ?? 0 });
    },
    load(data) {
      p = data ? JSON.parse(JSON.stringify(data)) : null;
    },
    serialize: () => (p ? JSON.parse(JSON.stringify(p)) : null),
    addPlayTime(sec) {
      if (p) p.playSec += sec;
    },
  };
  // A finished game credits the founder when they were on its team.
  bus.on('project:complete', ({ record }) => {
    if (p && (record.team ?? []).some((m) => m.id === p.founder.id) && !p.founder.gamesCredited.includes(record.number)) p.founder.gamesCredited.push(record.number);
  });
  // Nobody leaves yet; when they can, the founder's run of continuous employment ends here.
  bus.on('staff:removed', ({ staff }) => {
    if (p && staff.id === p.founder.id && p.founder.continuous) {
      p.founder.continuous = false;
      p.founder.leftDay = clock?.totalDays ?? 0;
    }
  });
  return api;
}
