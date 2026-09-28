// Awards (Milestone 19, bible §28). Saved with the studio. Numbers in data/awards.js.
//
// Why not core CompetitionSystem: it scores a machine and a pilot over segments (robot races); an award here compares
// finished games. The parts that fit are reused: core Rankings (the league table of award results) and core TrophyCase
// (each award's trophy, awarded the first time it is won); the rivals come from src/systems/rivals.js (core
// RivalSystem strength curves).
//
// Every visible award is held once a year at the end of its month (C10 only in Year 20). The field: the player's games
// released in the 12 months up to the ceremony, if the award is open to the studio (unlock) and a game meets the entry,
// and every rival whose releases that season meet it. Each entry is scored by the award's measure ± a seeded jitter
// (the run's seed + award + year), best first. The result is stored the moment it is announced — a reload never
// changes it (and the seed would give the same anyway). A win: Fame, the trophy (Awards Cabinet), a count towards the
// studio stages (business.state.awards) and, C04 and up, the major awards (Elite recruitment); plus the award's extra
// ('award:won' — the game hands out RP, a recruitment refresh, an Elite, a publisher offer, the Year-20 hook).
// C11 / C12 are secret: never held, never shown.
//
// Events: 'award:result' { award, result }, 'award:won' { award, result }.
import { Rng } from '../../../../core/Rng.js';
import { Rankings } from '../../../../core/Rankings.js';
import { TrophyCase } from '../../../../core/TrophyCase.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { AWARDS, VISIBLE_AWARDS, awardById, AWARD_BALANCE as A } from '../../data/awards.js';
import { FAME } from '../../data/balance.js';
import { platformById } from '../../data/platforms.js';

const tech = (o) => Math.max(o.graphics ?? 0, ((o.graphics ?? 0) + (o.polish ?? 0)) / 2); // plan review: C05
const value = (o, key) => (key === 'tech' ? tech(o) : o[key] ?? 0);

// A season's entries for one entrant (pure): games [{ title, review, outputs, scope, platforms }] → { score, title } or
// null when nothing meets the entry.
export function entryFor(award, games) {
  const e = award.entry;
  let ok = games;
  if (e.scopes) ok = ok.filter((g) => e.scopes.includes(g.scope));
  if (e.review) ok = ok.filter((g) => g.review >= e.review);
  if (e.output) ok = ok.filter((g) => e.output.some((k) => value(g.outputs, k) >= e.min));
  if (e.successful) {
    const good = games.filter((g) => g.review >= A.successfulReview).sort((a, b) => b.review - a.review);
    if (good.length < e.successful) return null;
    return { score: (good[0].review + good[1].review) / 2, title: good[0].title };
  }
  if (e.platformFamily) {
    const good = games.filter((g) => g.review >= A.successfulReview);
    let best = null;
    const families = new Set(good.flatMap((g) => g.platforms.map((p) => platformById(p)?.holder ?? p)));
    for (const f of families) {
      const on = good.filter((g) => g.platforms.some((p) => (platformById(p)?.holder ?? p) === f)).sort((a, b) => b.review - a.review);
      if (on.length < e.platformFamily) continue;
      const s = on.slice(0, e.platformFamily).reduce((t, g) => t + g.review, 0) / e.platformFamily;
      if (!best || s > best.score) best = { score: s, title: on[0].title };
    }
    return best;
  }
  if (!ok.length) return null;
  const measure = (g) => (award.score === 'review' ? g.review : award.score === 'gameplay' ? g.outputs.gameplay : award.score === 'tech' ? tech(g.outputs) : Math.max(g.outputs.story ?? 0, g.outputs.graphics ?? 0));
  const best = [...ok].sort((a, b) => measure(b) - measure(a) || a.title.localeCompare(b.title))[0];
  return { score: measure(best), title: best.title };
}

export function createAwards({ bus, clock, business, projects, rivals, seed = () => 'devworks-run', studioName = () => 'Your studio', hasEngine = () => false }) {
  const rankings = new Rankings({ bus: null, points: A.rankingPoints, focusId: 'player' });
  const trophies = new TrophyCase({ bus, trophies: VISIBLE_AWARDS.map((a) => ({ id: a.id, name: a.name, art: a.trophy, rule: { award: a.id } })) });
  let results = {}; // `${id}-Y${year}` → result
  let wins = []; // { award, year, title, day }
  const monthIndex = () => Math.floor(clock.totalDays / clock.daysPerMonth);
  const rankIndex = () => business.reputation.highestRankIndex;
  const playerGames = (fromDay, toDay) =>
    projects.catalogue
      .list()
      .filter((r) => r.release && r.release.day >= fromDay && r.release.day < toDay)
      .map((r) => ({ title: r.result.title, review: r.release.score, outputs: r.result.outputs, scope: r.result.scope, platforms: r.release.platforms ?? [r.release.platform] }));

  // Why the studio can't enter this award yet (null = open). year: the ceremony's year.
  function lockWhy(a, year = clock.year) {
    const u = a.unlock;
    if (u.secret) return 'Secret';
    const why = [];
    if (u.rank && rankIndex() < rankIndexOf(FAME.ranks, u.rank)) why.push(`Rank ${u.rank}`);
    if (u.trophies && wins.length < u.trophies) why.push(`${u.trophies} trophies`);
    if (u.year && year < u.year) why.push(`Year ${u.year}`);
    if (u.engineOrGraphics && !hasEngine() && !projects.catalogue.list().some((r) => r.release && (r.result.outputs?.graphics ?? 0) >= u.engineOrGraphics)) why.push(`an own engine or a released game with Graphics ${u.engineOrGraphics}+`);
    return why.length ? `Needs ${why.join(' + ')}` : null;
  }

  // Hold one award for the season ending with month index m (0-based). Returns the result (stored and locked).
  function hold(a, m) {
    const year = Math.floor(m / 12) + 1;
    const key = `${a.id}-Y${year}`;
    if (results[key]) return results[key];
    const fromMonth = m - A.seasonMonths + 1;
    const field = [];
    const why = lockWhy(a, year);
    const mine = why ? null : entryFor(a, playerGames(fromMonth * clock.daysPerMonth, (m + 1) * clock.daysPerMonth));
    if (mine && a.entry.record && wins.length < 5) mine.score = -1; // C10: a studio record (5 trophies) too
    if (mine && mine.score >= 0) field.push({ id: 'player', name: studioName(), ...mine });
    for (const r of rivals.visible()) {
      const rel = rivals.between(fromMonth, m).filter((x) => x.rival === r.id).map((x) => ({ title: x.title, review: x.review, outputs: x.outputs, scope: r.id === 'R01' ? 'small' : 'standard', platforms: [x.platform] }));
      const e = rel.length ? entryFor(a, rel) : null;
      if (e) field.push({ id: r.id, name: r.name, ...e });
    }
    const rng = new Rng(`${seed()}|award|${a.id}|${year}`);
    for (const f of [...field].sort((x, y) => x.id.localeCompare(y.id))) f.score = +(f.score + (rng.next() * 2 - 1) * A.jitter).toFixed(2);
    field.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
    const top = field.slice(0, A.fieldSize).map((f, i) => ({ ...f, place: i + 1 }));
    const result = { award: a.id, year, month: m, entrants: top, winner: top[0]?.id ?? null, playerPlace: top.find((f) => f.id === 'player')?.place ?? null, playerWhy: why ?? (mine ? null : 'No game met the entry this season'), day: clock.totalDays };
    results[key] = result;
    if (top.length) rankings.record(top.map((f) => ({ id: f.id, place: f.place })), a.fame / 100);
    if (result.winner && result.winner !== 'player') rivals.addAward(result.winner, { award: a.id, year, title: top[0].title });
    if (result.winner === 'player') win(a, result);
    bus.emit('award:result', { award: a, result });
    return result;
  }
  function win(a, result) {
    wins.push({ award: a.id, year: result.year, title: result.entrants[0].title, day: clock.totalDays });
    business.state.awards = (business.state.awards ?? 0) + 1; // the studio stages (Milestone 11) and the Awards Cabinet
    if (a.major) business.state.majorAwards = (business.state.majorAwards ?? 0) + 1; // Elite recruitment (Milestone 13)
    business.reputation.add(a.fame, `Award: ${a.name}`);
    trophies.check((rule) => wins.some((w) => w.award === rule.award), { day: clock.totalDays, eventId: a.id });
    bus.emit('award:won', { award: a, result });
  }
  // Month end: every award held in the month that just ended.
  bus.on('clock:month', () => {
    const m = monthIndex() - 1;
    if (m < 0) return;
    const moy = (m % 12) + 1;
    const year = Math.floor(m / 12) + 1;
    rivals.catchUp();
    for (const a of VISIBLE_AWARDS) if (a.month === moy && (!a.finale || year === 20)) hold(a, m);
  });

  // The next time an award is held: { month (index), year, day }.
  function nextOf(a, fromMonth = monthIndex()) {
    for (let m = fromMonth; m < fromMonth + 12 * 20; m++) if ((m % 12) + 1 === a.month && (!a.finale || Math.floor(m / 12) + 1 === 20)) return { month: m, year: Math.floor(m / 12) + 1, day: (m + 1) * clock.daysPerMonth };
    return null;
  }

  return {
    rankings,
    trophies,
    visible: () => VISIBLE_AWARDS,
    award: awardById,
    lockWhy,
    hold,
    nextOf,
    get wins() {
      return wins;
    },
    results: () => results,
    lastResult(id) {
      const list = Object.values(results).filter((r) => r.award === id).sort((a, b) => b.year - a.year);
      return list[0] ?? null;
    },
    // Rankings: studios (the player and every visible rival seen so far) by award points, trophies and copies.
    table() {
      const ids = ['player', ...rivals.active().map((r) => r.id)];
      const copies = (id) => (id === 'player' ? projects.catalogue.list().reduce((t, r) => t + (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0), 0) : rivals.history(id).releases.reduce((t, x) => t + x.copies, 0));
      const releases = (id) => (id === 'player' ? projects.catalogue.list().filter((r) => r.release).length : rivals.history(id).releases.length);
      const trophiesOf = (id) => (id === 'player' ? wins.length : rivals.history(id).awards.length);
      return ids
        .map((id) => ({ id, name: id === 'player' ? studioName() : rivals.rival(id).name, points: rankings.rows[id]?.points ?? 0, trophies: trophiesOf(id), releases: releases(id), copies: copies(id) }))
        .sort((a, b) => b.points - a.points || b.trophies - a.trophies || b.copies - a.copies || a.id.localeCompare(b.id))
        .map((r, i) => ({ ...r, position: i + 1 }));
    },
    newGame() {
      rankings.reset();
      trophies.reset();
      results = {};
      wins = [];
    },
    serialize: () => JSON.parse(JSON.stringify({ rankings: rankings.serialize(), trophies: trophies.serialize(), results, wins })),
    load(data) {
      rankings.load(data?.rankings ?? null);
      trophies.load(data?.trophies ?? null);
      results = JSON.parse(JSON.stringify(data?.results ?? {}));
      wins = JSON.parse(JSON.stringify(data?.wins ?? []));
    },
  };
}

export { AWARDS };
