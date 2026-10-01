// Requested games (Milestone 40c, Aaron's play-feel notes §5). Saved with the studio; every number in
// data/requests.js.
//
// The Request Board (Create → Requests) holds 2–3 requests from publishers, platform holders, sponsors or the fans.
// The first appear once the studio has released its first game; the board refreshes at every month end. A request
// sets the genre (sometimes a theme), the scope, a points target (the seven outputs' total, or one named stat), a
// deadline and the pay; beating the target by REQUESTS.bonusAt also pays the bonus. Starting one (New Game with
// setup.request) locks those slots; the request rides on the game (job.data.request).
// When the game is finished: hit (target met by the deadline) → the pay (+ the bonus), Fame, a better relation with
// whoever asked, and 'request:result' (the reward drop listens); missed → half the pay, a small relation and Fan Trust
// dip. Never a lock or a game over. Either way the game releases and sells normally; whoever asked takes sharePct of
// its sales.
//
// makeRequest(ctx, rng) is pure: ctx describes the studio (what is open, its stage, its best team's estimates, what it
// has made), so the no-impossible check runs it a thousand times in Node.
import { Rng } from '../../../../core/Rng.js';
import { REQUESTS as R } from '../../data/requests.js';
import { ELEMENTS, elementById } from '../../data/elements.js';
import { SCOPES } from '../../data/projects.js';
import { PROJECT_BALANCE } from '../../data/balance.js';
import { PUBLISHERS } from '../../data/publishers.js';
import { SPONSORS } from '../../data/sponsors.js';

const SCOPE_ORDER = SCOPES.map((s) => s.id);
const OUT_KEYS = ['gameplay', 'graphics', 'story', 'audio', 'innovation', 'polish', 'audienceFit'];
export const totalOf = (outputs) => OUT_KEYS.reduce((t, k) => t + (outputs?.[k] ?? 0), 0);
const qb = (scope) => PROJECT_BALANCE.scopes[scope]?.qualityBonus ?? 0;

// The best this studio has made, brought to a scope: a bigger game's outputs carry its scope's quality bonus, so a
// smaller request takes that off (never below 0).
export function bestFor(released, scope, stat = null) {
  let best = 0;
  for (const r of released) {
    const o = r.result?.outputs;
    if (!o) continue;
    const diff = Math.max(0, qb(r.result.scope) - qb(scope));
    const v = stat ? (o[stat] ?? 0) - diff : totalOf(o) - diff * 6;
    best = Math.max(best, v);
  }
  return Math.max(0, best);
}

// ctx: { openGenres, openThemes, scopes (open, for this stage), estimate(scope) → days for the studio's best team,
//        released (catalogue records), askers: { publisher: [names], platform: [names], sponsor: [names] }, day, year }
export function makeRequest(ctx, rng, id = 'R1') {
  const pickW = (list) => {
    let roll = rng.next() * list.reduce((t, x) => t + x.weight, 0);
    return list.find((x) => (roll -= x.weight) <= 0) ?? list[0];
  };
  const pick = (list) => list[Math.floor(rng.next() * list.length)];
  if (!ctx.openGenres.length || !ctx.scopes.length || !ctx.released.length) return null;
  const kinds = R.askers.filter((a) => a.kind === 'fans' || (ctx.askers[a.kind] ?? []).length);
  const asker = pickW(kinds);
  const who = asker.kind === 'fans' ? 'Your fans' : pick(ctx.askers[asker.kind]);
  const genre = pick(ctx.openGenres);
  const theme = ctx.openThemes.length && rng.next() < R.themeChance ? pick(ctx.openThemes) : null;
  const scope = pick(ctx.scopes);
  const days = ctx.estimate(scope);
  if (!(days > 0) || !Number.isFinite(days)) return null;
  const deadlineDays = Math.ceil(days * R.deadline.slack + R.deadline.plusDays);
  const stat = rng.next() < R.statChance ? pick(R.stats) : null;
  const best = bestFor(ctx.released, scope, stat);
  const f = R.targetFactor.min + rng.next() * (R.targetFactor.max - R.targetFactor.min);
  const points = Math.max(stat ? 10 : 70, Math.floor(best * f));
  if (points > best) return null; // nothing this studio has made reaches it: skip rather than ask the impossible
  const pay = R.pay[scope];
  return {
    id,
    asker: { kind: asker.kind, name: who },
    genre,
    theme,
    scope,
    target: { stat, points },
    deadlineDays,
    pay,
    bonus: Math.round((pay * R.bonusPct) / 100),
    sharePct: R.sharePct,
    offeredDay: ctx.day,
  };
}

export const describeTarget = (t) => (t.stat ? `${t.stat === 'audienceFit' ? 'Audience Fit' : t.stat[0].toUpperCase() + t.stat.slice(1)} ${t.points}+` : `${t.points}+ points (all seven outputs)`);

export function createRequests({ bus, clock, world, projects, business, elements, seed = () => 'devworks' }) {
  let s = fresh();
  function fresh() {
    return { board: [], active: {}, history: [], relations: {}, nextId: 1, unlocked: false, seen: 0, rng: null };
  }
  const today = () => clock.totalDays;
  const rngNow = () => {
    const r = new Rng(`${seed()}|requests`);
    if (s.rng != null) r.setState(s.rng);
    return r;
  };
  const released = () => projects.catalogue.list().filter((r) => r.release && r.result?.outputs);
  function context() {
    const open = (fam) => ELEMENTS.filter((e) => e.family === fam && elements.isOpen(e.id)).map((e) => e.id);
    const stage = world.stage;
    const scopes = (R.scopeByStage[stage] ?? ['tiny']).filter((id) => elements.scopeOpen(id));
    // The studio's best team for a scope: its strongest people, up to the scope's usual team.
    const staff = [...world.staffSystem.staff].sort((a, b) => (b.level ?? 1) - (a.level ?? 1));
    const estimate = (scope) => {
      const sc = SCOPES.find((x) => x.id === scope);
      const team = staff.slice(0, Math.max(1, sc.team.max)).map((x) => x.id);
      return projects.estimate(team, scope).days;
    };
    return {
      openGenres: open('genre'),
      openThemes: open('theme'),
      scopes,
      estimate,
      released: released(),
      askers: {
        publisher: PUBLISHERS.map((p) => p.name),
        platform: business.platforms.active(today()).filter((p) => !p.own).map((p) => p.name),
        sponsor: SPONSORS.map((x) => x.name),
      },
      day: today(),
      year: clock.year,
    };
  }
  function refresh() {
    if (!s.unlocked) return;
    const rng = rngNow();
    const ctx = context();
    const n = R.board.min + Math.floor(rng.next() * (R.board.max - R.board.min + 1));
    const board = [];
    for (let i = 0; i < n * 4 && board.length < n; i++) {
      const q = makeRequest(ctx, rng, `R${s.nextId}`);
      if (q && !board.some((x) => x.genre === q.genre && x.scope === q.scope)) {
        board.push(q);
        s.nextId++;
      }
    }
    s.rng = rng.getState();
    s.board = board;
    s.seen = 0;
    bus.emit('requests:board', { board });
  }

  bus.on('game:released', () => {
    if (!s.unlocked && released().length >= R.afterReleases) {
      s.unlocked = true;
      refresh();
    }
  });
  bus.on('clock:month', () => refresh());
  // A game started for a request: it leaves the board and rides on the game.
  bus.on('project:start', ({ job }) => {
    const id = job?.data?.request;
    const q = id && s.board.find((x) => x.id === id);
    if (!q) return;
    s.board = s.board.filter((x) => x !== q);
    s.active[job.id] = { ...q, jobId: job.id, startDay: today(), deadlineDay: today() + q.deadlineDays };
  });
  bus.on('project:complete', ({ record }) => {
    const q = record && s.active[record.jobId];
    if (!q) return;
    delete s.active[record.jobId];
    const points = q.target.stat ? record.result.outputs?.[q.target.stat] ?? 0 : totalOf(record.result.outputs);
    const onTime = today() <= q.deadlineDay;
    const hit = onTime && points >= q.target.points;
    const bonus = hit && points >= q.target.points * R.bonusAt;
    const paid = hit ? q.pay + (bonus ? q.bonus : 0) : Math.round((q.pay * R.missPayPct) / 100);
    business.economy.add('credits', paid, `Request: ${q.asker.name} (${hit ? (bonus ? 'beaten' : 'hit') : 'missed'})`, 'requests');
    const key = q.asker.name;
    const rel = (s.relations[key] ?? 0) + (hit ? R.relation.hit : R.relation.miss);
    s.relations[key] = Math.max(-R.relation.max, Math.min(R.relation.max, rel));
    let fame = 0;
    if (hit) {
      fame = R.fame.hit + R.fame.perScope * SCOPE_ORDER.indexOf(q.scope);
      business.reputation.add(fame, `Request: ${q.asker.name}`);
    } else business.state.fanTrust = Math.max(0, business.state.fanTrust - R.trustDip);
    const result = { id: q.id, asker: q.asker, target: q.target, points, onTime, hit, bonus, paid, fame, sharePct: q.sharePct };
    record.result.request = result;
    s.history.push({ ...result, title: record.result.title, day: today() });
    if (s.history.length > 60) s.history.shift();
    bus.emit('request:result', { record, result });
  });
  // Whoever asked takes their share of the sales.
  const cut = (record, revenue) => {
    const q = record.result?.request;
    if (!q || !revenue) return;
    const share = Math.round((revenue * q.sharePct) / 100);
    if (share) business.economy.spend('credits', share, `Request share (${q.sharePct}%): ${q.asker.name}`, 'requests');
  };
  bus.on('sales:day', ({ record, revenue }) => cut(record, revenue));
  bus.on('catalogue:month', ({ record, revenue }) => cut(record, revenue));

  return {
    get board() {
      return s.board;
    },
    get active() {
      return s.active;
    },
    get history() {
      return s.history;
    },
    get unlocked() {
      return s.unlocked;
    },
    get unseen() {
      return s.unlocked ? Math.max(0, s.board.length - s.seen) : 0;
    },
    markSeen() {
      s.seen = s.board.length;
    },
    relationOf: (name) => s.relations[name] ?? 0,
    byId: (id) => s.board.find((x) => x.id === id) ?? null,
    context,
    refresh,
    // The request a game in the works was made for, and how it is going (the live build panel).
    viewFor(job) {
      const q = job && s.active[job.id];
      if (!q) return null;
      const v = projects.view(job);
      const points = q.target.stat ? v.outputs[q.target.stat] ?? 0 : totalOf(v.outputs);
      return { request: q, points, target: q.target.points, daysLeft: q.deadlineDay - today(), passed: points >= q.target.points, label: describeTarget(q.target) };
    },
    describe: (q) => `${elementById(q.genre)?.name ?? ''}${q.theme ? ` + ${elementById(q.theme)?.name ?? ''}` : ''} · ${SCOPES.find((x) => x.id === q.scope)?.name ?? q.scope} · ${describeTarget(q.target)} · ${q.deadlineDays} days`,
    newGame() {
      s = fresh();
    },
    serialize: () => JSON.parse(JSON.stringify(s)),
    load(data) {
      s = { ...fresh(), ...(data ? JSON.parse(JSON.stringify(data)) : {}) };
      // A save from before Milestone 40c: open once the studio has released a game.
      if (!data && released().length >= R.afterReleases) s.unlocked = true;
    },
  };
}
