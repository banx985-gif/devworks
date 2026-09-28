// Recruitment and careers (Milestone 13, bible §10–§11; spec §9 for the missing-role hints). Saved with the studio.
//
// Board: core RecruitmentSystem, 3 cards from one channel (Local Network; Agency Search at Rank D; National Scout at
// Rank C; Global Head Hunt at Rank A). It refreshes itself for free every 56 game days (from the channel picked last);
// a paid refresh costs the channel's price, doubled for each paid refresh already bought this month. Studio Tokens and
// the rewarded-ad refresh are hooks for Milestone 36 (refreshWith). No refresh ever bypasses eligibility: a card is
// only ever someone eligible right now (data/staff.js ROSTER `eligibility`), not employed and not already on the board;
// the Standard cards show the Start Candidates first (roles the studio lacks before the others). The founder is
// employed, so never a card. Special Arrival: a condition adds a fourth card that stays 56 days (core `special`);
// Milestone 13's only condition is the missing-role hint. Legendary / Secret arrivals are off.
//
// Hiring: up to the studio stage's cap (6 / 10 / 16, bible §35 — the only cap). The hire walks in to a free work
// station (their role's first); with none free, their role's station is built for them and paid on hiring. Salaries
// are paid monthly with everyone's (business). Letting go needs a confirm (the screen asks); nobody resigns by
// themselves; someone on a game or away on a course can't be let go until that's over.
//
// Careers (core CareerRecords): every person who has worked here keeps a record — stints (continuous employment),
// games credited, genres and themes, franchises, awards (hook for Milestone 19), trainings, mentoring links; crunch
// exposure is read from the projects (staffHistory). The founder's Founding Developer flag is shown from the profile.
//
// Milestone 14: all 50 staff. Legendary / Secret staff are gated by their SEC-STAFF secret (Milestones 28–29): never
// in a pool, never a special arrival, never hired — not even by the debug spawn, which only previews their card.
//
// Events: core's 'recruit:*', plus 'staff:hired' (world) and 'staff:letGo' { id, name }.
import { RecruitmentSystem } from '../../../../core/RecruitmentSystem.js';
import { CareerRecords } from '../../../../core/CareerRecords.js';
import { Rng } from '../../../../core/Rng.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { FAME } from '../../data/balance.js';
import { ROSTER, staffDefById, ROLES, STAT_KEYS, PRESTIGE_TIERS } from '../../data/staff.js';
import { CHANNELS, channelById, RECRUIT, SPECIAL_DAYS, HINTS } from '../../data/recruitment.js';
import { facilityById } from '../../data/facilities.js';
import { estimateDays, phaseWeights } from './gameProject.js';
import { PROJECT_BALANCE } from '../../data/balance.js';

export const ROLE_ORDER = ['PRG', 'DSN', 'ART', 'WRT', 'PRO'];
const TIER_ORDER = ['standard', 'rare', 'elite', 'legendary', 'secret'];
export const tierRank = (tier) => TIER_ORDER.indexOf(tier);

// Why this person can't be found yet (null = eligible). ctx: { rankIndex, roleGames(role), hasFacility(id), major }.
export function eligibilityWhy(def, ctx) {
  const e = def.eligibility ?? {};
  if (e.secret || PRESTIGE_TIERS.includes(def.tier)) return 'Arrives only through a secret (later)'; // Milestone 14: gated
  if (e.start) return null;
  const why = [];
  if (e.rank && ctx.rankIndex < rankIndexOf(FAME.ranks, e.rank)) why.push(`Rank ${e.rank}`);
  if (e.roleGames && ctx.roleGames(def.role) < e.roleGames) why.push(`${e.roleGames} released games with a ${ROLES[def.role].name} on the team`);
  if (e.roleFacility && !ctx.hasFacility(RECRUIT.roleFacilities[def.role])) why.push(`a ${facilityById(RECRUIT.roleFacilities[def.role])?.name ?? 'role facility'}`);
  if (e.major && !ctx.major) why.push('a Million Seller or a major award');
  if (!e.rank && !e.roleGames && !e.roleFacility && !e.major) why.push('a special arrival');
  return why.length ? `Needs ${why.join(' + ')}` : null;
}

export function createRecruitment({ bus, clock, world, business, projects, profile, shop }) {
  const today = () => clock.totalDays;
  const released = () => projects.catalogue.list().filter((r) => r.release);
  const state = { channel: 'local', lastFreeDay: 0, paid: { month: -1, count: 0 } };

  // --- eligibility ---------------------------------------------------------------------------------------------
  const ctx = () => ({
    rankIndex: business.reputation.highestRankIndex,
    roleGames: (role) => released().filter((r) => (r.team ?? []).some((m) => m.role === role)).length,
    hasFacility: (id) => !!world.stationById(id),
    major: released().some((r) => (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0) >= RECRUIT.millionSeller) || (business.state.majorAwards ?? 0) > 0,
  });
  const employed = (id) => !!world.staffSystem.get(id);
  const why = (def, c = ctx()) => eligibilityWhy(def, c);
  const eligible = (def, c = ctx()) => !why(def, c);
  const missingRoles = () => ROLE_ORDER.filter((r) => !world.staffSystem.staff.some((s) => s.role === r));

  // Who could be drawn for a card of this tier on this channel right now.
  function pool(ch, tier, taken = new Set(board.cards.map((c) => c.personId))) {
    const c = ctx();
    return ROSTER.filter((d) => d.tier === tier && ch.roles.includes(d.role) && !employed(d.id) && !taken.has(d.id) && eligible(d, c));
  }

  const board = new RecruitmentSystem({
    rng: new Rng('devworks-recruit'),
    bus,
    channels: CHANNELS,
    boardSize: RECRUIT.boardSize,
    reappearChance: RECRUIT.reappearChance,
    freeManualPerYear: 0,
    autoRefresh: () => false, // DEVWORKS refreshes by day (every 56), not by month: see the day tick
    hooks: {
      // A tier with nobody eligible is never drawn.
      tierWeights: (ch) => Object.fromEntries(Object.entries(ch.weights).map(([t, w]) => [t, pool(ch, t).length ? w : 0])),
      makeCandidate: (ch, tier, rng) => {
        const list = pool(ch, tier);
        if (!list.length) return { empty: true, tier, role: null };
        // Standard: every Standard not employed is a Start Candidate (the five second Standards and the founders not
        // picked). Roles the studio lacks come first, their second Standard (Priya, Theo, Maya, Noor, Arun) before all.
        const miss = missingRoles();
        const groups = [list.filter((d) => d.startCandidate && miss.includes(d.role)), list.filter((d) => miss.includes(d.role)), list];
        const g = groups.find((x) => x.length);
        return cardOf(rng.pick(g));
      },
    },
  });
  const cardOf = (def) => ({ personId: def.id, name: def.name, role: def.role, tier: def.tier });
  // A card can turn out empty (the pool ran dry within one refresh); a returning former worker who is no longer
  // eligible (or was hired back meanwhile) is dropped too.
  const tidy = () => {
    const c = ctx();
    board.board = board.board.filter((x) => !x.empty && !employed(x.personId) && staffDefById(x.personId) && eligible(staffDefById(x.personId), c));
  };

  // --- channels and refreshes ----------------------------------------------------------------------------------
  const channelWhy = (id) => {
    const ch = channelById(id);
    if (!ch) return 'Unknown channel';
    if (ch.rank && business.reputation.highestRankIndex < rankIndexOf(FAME.ranks, ch.rank)) return `Opens at Rank ${ch.rank}`;
    return null;
  };
  const monthNow = () => Math.floor(today() / clock.daysPerMonth);
  const paidThisMonth = () => (state.paid.month === monthNow() ? state.paid.count : 0);
  const refreshCost = (id = state.channel) => Math.round((channelById(id)?.refreshCost ?? 0) * RECRUIT.refreshEscalation ** paidThisMonth());
  const freeInDays = () => Math.max(0, state.lastFreeDay + RECRUIT.freeRefreshDays - today());

  function doRefresh(id, reason) {
    board.refresh(id, reason);
    tidy();
  }
  // Pick the channel the next refresh uses.
  function setChannel(id) {
    if (channelWhy(id)) return false;
    state.channel = id;
    return true;
  }
  // A paid refresh now (Credits). Returns { ok, why }.
  function refresh(id = state.channel) {
    const block = channelWhy(id);
    if (block) return { ok: false, why: block };
    const cost = refreshCost(id);
    if (business.credits < cost) return { ok: false, why: `Needs ${cost.toLocaleString('en-GB')} Credits` };
    business.economy.spend('credits', cost, `Recruitment: ${channelById(id).name} refresh`, 'hiring');
    state.paid = { month: monthNow(), count: paidThisMonth() + 1 };
    state.channel = id;
    doRefresh(id, 'paid');
    return { ok: true, cost };
  }
  // Milestone 36 hook: a refresh paid with a Studio Token or a rewarded ad (never bypasses eligibility either).
  function refreshWith(kind, id = state.channel) {
    if (channelWhy(id)) return { ok: false, why: channelWhy(id) };
    if (kind === 'token') {
      if (business.tokens < 1) return { ok: false, why: 'Needs a Studio Token' };
      business.economy.spend('tokens', 1, 'Recruitment refresh', 'hiring');
    } else if (kind !== 'ad') return { ok: false, why: 'Unknown' };
    doRefresh(id, kind);
    return { ok: true };
  }

  // --- hiring ----------------------------------------------------------------------------------------------------
  const cap = () => world.staffCap;
  const full = () => world.staffSystem.staff.length >= cap();
  // Where they would work: { station } (free), { build: facility id, cost } (their role's station, built for them), or
  // { why }.
  function seatFor(role) {
    const st = world.freeStationFor(role);
    if (st) return { station: st.id, name: st.def.name };
    const id = RECRUIT.roleStations[role];
    const s = shop?.status(id);
    if (s && !s.owned && !s.hidden && !s.why) return { build: id, cost: s.def.cost, name: s.def.name };
    if (s && !s.owned && s.why && /Credits$/.test(s.why)) return { why: `Needs ${s.def.cost.toLocaleString('en-GB')} Credits for a ${s.def.name} to work at` };
    return { why: 'No free station: build one in Build Mode' };
  }
  // Can this card be hired now? { ok, why, seat }.
  function hireCheck(cardId) {
    const card = board.get(cardId);
    const def = card && staffDefById(card.personId);
    if (!def) return { ok: false, why: 'Gone' };
    if (employed(def.id)) return { ok: false, why: 'Already works here' };
    if (full()) return { ok: false, why: `The studio is full (${world.staffSystem.staff.length} of ${cap()}): move up a stage for more room` };
    const w = why(def);
    if (w) return { ok: false, why: w };
    if (PRESTIGE_TIERS.includes(def.tier)) return { ok: false, why: 'Arrives only through a secret (later)' };
    const seat = seatFor(def.role);
    if (seat.why) return { ok: false, why: seat.why, seat };
    return { ok: true, why: null, seat, def };
  }
  function hire(cardId) {
    const chk = hireCheck(cardId);
    if (!chk.ok) return chk;
    let station = chk.seat.station;
    if (chk.seat.build) {
      const r = shop.buy(chk.seat.build);
      if (!r.ok) return { ok: false, why: r.why };
      station = r.station.id;
    }
    board.take(cardId);
    const w = world.hire(chk.def, station);
    careers.join(w.staff, today());
    return { ok: true, worker: w, built: chk.seat.build ?? null };
  }

  // --- letting go ------------------------------------------------------------------------------------------------
  const busyWith = (id) => projects.jobs.find((j) => j.slots.includes(id)) ?? null;
  function letGoWhy(id) {
    const w = world.workerById(id);
    if (!w) return 'Not in the studio';
    const job = busyWith(id);
    if (job) return `Making ${job.name}: finish it first`;
    if (w.away) return 'Away on a training course';
    if (world.staffSystem.staff.length <= 1) return 'The studio needs someone';
    return null;
  }
  function letGo(id) {
    const block = letGoWhy(id);
    if (block) return { ok: false, why: block };
    const s = world.fire(id); // core emits 'staff:removed' (the profile ends the founder's continuous run)
    careers.leave(id, today());
    board.release({ personId: s.id, name: s.name, role: s.role, tier: s.tier });
    bus.emit('staff:letGo', { id: s.id, name: s.name });
    return { ok: true };
  }

  // --- careers ---------------------------------------------------------------------------------------------------
  const careers = new CareerRecords({ bus, counters: ['games', 'trainings'] });
  const extras = (r) => {
    r.games ??= [];
    r.genres ??= {};
    r.themes ??= {};
    r.franchises ??= [];
    r.awards ??= [];
    r.mentors ??= [];
    r.mentees ??= [];
    return r;
  };
  const join = careers.join.bind(careers);
  careers.join = (person, day) => extras(join(person, day));
  // Games credited (everyone on the team of a finished game).
  function credit(record) {
    for (const m of record.team ?? []) {
      const r = careers.get(m.id);
      if (!r || r.games.includes(record.number)) continue;
      r.games.push(record.number);
      careers.bump(m.id, 'games');
      const g = record.result?.recipe ?? {};
      if (g.genre) r.genres[g.genre] = (r.genres[g.genre] ?? 0) + 1;
      if (g.theme) r.themes[g.theme] = (r.themes[g.theme] ?? 0) + 1;
    }
  }
  bus.on('project:complete', ({ record }) => credit(record));
  // Franchise experience: once the franchise is known (after 'project:complete' made or joined it).
  bus.on('game:released', ({ record }) => {
    const ip = record.result?.ipId;
    if (!ip) return;
    for (const m of record.team ?? []) {
      const r = careers.get(m.id);
      if (r && !r.franchises.includes(ip)) r.franchises.push(ip);
    }
  });
  // An old save (before Milestone 13): everyone here joined on day 0 (the founder on their hired day), credited on
  // the games they made.
  function rebuildCareers() {
    careers.reset();
    for (const s of world.staffSystem.staff) careers.join(s, profile?.isFounder(s.id) ? profile.data.founder.hiredDay : 0);
    for (const r of projects.catalogue.list()) credit(r);
  }
  // What a staff card shows: { stints, daysEmployed, continuous, games: [{ number, title }], genres, themes, crunch,
  //   trainings, mentors, mentees, franchises, awards, founder }.
  function careerOf(id) {
    const r = careers.get(id);
    if (!r) return null;
    const h = projects.staffHistory[id] ?? { crunchDays: 0, crunches: 0 };
    return {
      record: r,
      daysEmployed: careers.daysEmployed(id, today()),
      continuous: r.stints.length === 1 && careers.isCurrent(id),
      since: r.stints.at(-1)?.from ?? 0,
      games: r.games.map((n) => ({ number: n, title: projects.catalogue.get(n)?.result?.title ?? `Game ${n}` })),
      genres: r.genres,
      themes: r.themes,
      franchises: r.franchises.map((id) => business.franchises.byId(id)?.name).filter(Boolean),
      awards: r.awards,
      crunchDays: h.crunchDays,
      crunches: h.crunches,
      trainings: r.counters.trainings ?? 0,
      mentors: r.mentors,
      mentees: r.mentees,
      founder: !!profile?.isFounder(id),
    };
  }

  // --- missing-role hints (spec §9) -------------------------------------------------------------------------------
  // Roles a scope leans on (one of its phases gives the role's stat at least HINTS.leanWeight).
  const leansOn = (scope, role) => PROJECT_BALANCE.phases.some((_, i) => phaseWeights(scope, i)[ROLES[role].primaryStat] >= HINTS.leanWeight);
  // The Start Candidate to suggest for a role: the second Standard of the role, else any Standard free to hire.
  const suggestFor = (role) => ROSTER.find((d) => d.role === role && d.startCandidate && !employed(d.id)) ?? ROSTER.find((d) => d.role === role && d.tier === 'standard' && !employed(d.id)) ?? null;
  // For the New Game screen: every role the studio has nobody for that this scope leans on, with how many more days
  // the game takes without them (the team's estimate vs the same team plus the suggested candidate).
  function hints(teamIds, scope) {
    const stats = teamIds.map((id) => world.staffSystem.get(id)?.stats).filter(Boolean);
    const base = estimateDays(stats, scope);
    return missingRoles()
      .filter((role) => leansOn(scope, role))
      .map((role) => {
        const def = suggestFor(role);
        const withThem = def ? estimateDays([...stats, def.stats], scope) : base;
        return { role, roleName: ROLES[role].name, stat: STAT_KEYS.includes(ROLES[role].primaryStat) ? ROLES[role].primaryStat : null, extraDays: Number.isFinite(base) ? Math.max(0, Math.round(base - withThem)) : null, candidate: def };
      });
  }
  // Special Arrival (condition-driven): put this person on the board as the extra card for 56 days.
  function specialArrival(personId, note) {
    const def = staffDefById(personId);
    if (!def || employed(personId) || board.cards.some((c) => c.personId === personId) || why(def)) return board.cards.find((c) => c.personId === personId) ?? null;
    return board.addSpecial(cardOf(def), { day: today(), days: SPECIAL_DAYS, note });
  }
  // The missing-role hint: surface the Start Candidate for a role the studio lacks.
  function surface(role) {
    const def = suggestFor(role);
    return def ? specialArrival(def.id, `Start Candidate: your studio has no ${ROLES[role].name}`) : null;
  }

  // --- the day ---------------------------------------------------------------------------------------------------
  bus.on('clock:day', () => {
    board.dailyTick(today());
    if (freeInDays() === 0) {
      state.lastFreeDay = today();
      if (channelWhy(state.channel)) state.channel = 'local';
      doRefresh(state.channel, 'auto');
    }
  });

  function newGame() {
    board.reset();
    Object.assign(state, { channel: 'local', lastFreeDay: today(), paid: { month: -1, count: 0 } });
    doRefresh('local', 'start');
    careers.reset();
    for (const s of world.staffSystem.staff) careers.join(s, today());
  }

  return {
    board,
    careers,
    state,
    channels: CHANNELS,
    channelWhy,
    setChannel,
    refresh,
    refreshWith,
    refreshCost,
    freeInDays,
    get cards() {
      return board.cards;
    },
    cardDef: (card) => staffDefById(card?.personId),
    eligible,
    eligibilityWhy: (def) => why(def),
    spawnable: (def) => !!def && !PRESTIGE_TIERS.includes(def.tier), // Milestone 14: the debug spawn
    pool: (channelId, tier) => pool(channelById(channelId), tier, new Set()),
    missingRoles,
    hireCheck,
    hire,
    seatFor,
    letGoWhy,
    letGo,
    careerOf,
    hints,
    surface,
    specialArrival,
    suggestFor,
    newGame,
    // ?debug=1 / tests: someone joins without the board or the rules (to try mentoring with an Elite early).
    debugJoin(personId) {
      const def = staffDefById(personId);
      if (!def || employed(personId) || full() || PRESTIGE_TIERS.includes(def.tier)) return null; // prestige: preview only
      let st = world.freeStationFor(def.role);
      for (const id of [RECRUIT.roleStations[def.role], ...Object.values(RECRUIT.roleStations), 'F10', 'F09', 'F07', 'F12', 'F11']) st ??= world.addStation(id);
      if (!st) return null;
      const w = world.hire(def, st.id);
      careers.join(w.staff, today());
      return w;
    },
    serialize: () => JSON.parse(JSON.stringify({ board: board.serialize(), careers: careers.serialize(), state })),
    // A save from before Milestone 13: a fresh Local Network board and careers rebuilt from the catalogue.
    load(data) {
      if (!data) {
        board.reset();
        Object.assign(state, { channel: 'local', lastFreeDay: today(), paid: { month: -1, count: 0 } });
        doRefresh('local', 'start');
        rebuildCareers();
        return;
      }
      board.load(data.board);
      Object.assign(state, { channel: 'local', lastFreeDay: today(), paid: { month: -1, count: 0 } }, data.state ?? {});
      if (!careers.load(data.careers)) rebuildCareers();
      for (const r of Object.values(careers.records)) extras(r);
    },
  };
}
