// Achievements, the Hall of Fame and account records (Milestone 32, bible §39 / §36 F33 / §43). Account-wide: kept in
// their own account record (SAVE.achievementsKey), shared by every slot and every run, saved whenever something changes.
//
// Achievements: the 40 of data/achievements.js on core/AchievementSystem (checked on trigger events; once earned,
// earned for good; the reward is paid once per account — never again on reload, re-earn or NG+). The facts are the
// secrets' registry (src/systems/secrets.js) plus the few only achievements need (below).
// Hall of Fame: games reviewed 90+, or 1,000,000+ copies, or a Game of the Year; engines licensed to 10+ customers;
// consoles with 1,000,000+ units. Each entry keeps its picture, its numbers at induction (updated while its run goes on)
// and its credited staff; entries are never removed. SEC-FAC-04 reads the counts.
// Account records (core AccountRecords): data/achievements.js RECORD_DEFS, each with the run that set it.
//
// Events: core's 'achievement:unlocked', 'halloffame:entry' { entry }.
import { AchievementSystem } from '../../../../core/AchievementSystem.js';
import { AccountRecords } from '../../../../core/AccountRecords.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { ACHIEVEMENTS, HALL_OF_FAME as H, RECORD_DEFS } from '../../data/achievements.js';
import { FAME } from '../../data/balance.js';
import { staffDefById } from '../../data/staff.js';

export function createAchievements({ bus, clock, world, business, projects, secrets, awards = () => null, global = () => null, engines = () => null, sponsors = () => null, consoles = () => null, hardware = () => null, research = () => null, runId = () => 'run', ngPlus = () => 0, saveAccount = null }) {
  const today = () => clock.totalDays;
  const released = () => projects.catalogue.list().filter((r) => r.release);
  const copiesOf = (r) => (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0);
  const launchBugs = (r) => (r.result.bugs ?? 0) + (r.release?.qaBugs ?? 0);
  let hall = []; // [{ key, kind, name, art, numbers, staff, runId, ngPlus, year, day }]
  const records = new AccountRecords({ bus, defs: RECORD_DEFS, now: () => ({ day: today(), runId: runId() }) });

  // --- facts ---------------------------------------------------------------------------------------------------------
  // In the Black: game years (complete ones) whose income beat their costs.
  function profitableYears() {
    const byYear = {};
    for (const m of business.months?.() ?? []) {
      if (m.year >= clock.year) continue;
      byYear[m.year] = (byYear[m.year] ?? 0) + m.net;
    }
    return Object.values(byYear).filter((n) => n > 0).length;
  }
  const winsBy = (id) => (awards()?.wins ?? []).filter((w) => w.award === id);
  const titleRec = (t) => released().find((r) => r.result.title === t);
  const c06 = (side) => winsBy('C06').filter((w) => {
    const o = titleRec(w.title)?.result.outputs ?? {};
    return side === 'story' ? (o.story ?? 0) >= (o.graphics ?? 0) : (o.graphics ?? 0) > (o.story ?? 0);
  }).length;
  const engineOf = (versionId) => `${versionId ?? ''}`.split('v')[0];
  function customersByEngine() {
    const g = global()?.state;
    const out = {};
    for (const l of [...(g?.licenceHistory ?? []), ...(global()?.licences ?? [])]) {
      const e = engineOf(l.versionId);
      (out[e] ||= new Set()).add(l.id);
    }
    return Object.fromEntries(Object.entries(out).map(([k, s]) => [k, s.size]));
  }
  const sponsorTier = () => {
    const s = sponsors();
    if (!s) return -1;
    const ids = new Set([...(s.deals ?? []).map((d) => d.id), ...(s.history ?? []).map((h) => h.id)]);
    return Math.max(-1, ...[...ids].map((id) => s.tierOf(id)), ...(s.deals ?? []).map((d) => d.tier ?? 0));
  };
  const own = {
    gamesFinished: () => projects.catalogue.list().length,
    profitableYears,
    hits: () => released().filter((r) => r.release.score >= 80 && (r.sales?.revenue ?? 0) + (r.catalogue?.revenue ?? 0) >= (r.result.cost ?? 0)).length,
    bestCopies: () => Math.max(0, ...released().map(copiesOf)),
    totalCopies: () => released().reduce((t, r) => t + copiesOf(r), 0),
    sequels: () => released().filter((r) => r.result.type === 'sequel').length,
    remakes: () => released().filter((r) => r.result.type === 'remake').length,
    expansions: () => released().filter((r) => (r.support?.addons ?? []).length > 0).length,
    bugFree: () => released().filter((r) => launchBugs(r) === 0).length,
    patchHeroes: () => released().filter((r) => launchBugs(r) >= 10 && r.support && r.support.bugsLeft === 0).length,
    wordOfMouth: () => (secrets.fact('games') ?? []).filter((g) => g.chartWeeks >= 1 && g.marketingPct <= 5).length,
    narrativeWins: () => c06('story'),
    artWins: () => c06('art'),
    engines: () => engines()?.engines?.length ?? 0,
    engineCustomers: () => global()?.customers ?? global()?.state?.customers ?? 0,
    externalReleased: () => (global()?.external ?? []).filter((p) => p.result).length,
    externalHits: () => (global()?.external ?? []).filter((p) => p.result?.hit).length,
    sponsorTier,
    blockbusters: () => released().filter((r) => r.result.scope === 'blockbuster').length,
    megas: () => released().filter((r) => r.result.scope === 'mega').length,
    prototypes: () => hardware()?.prototypes?.length ?? 0,
    consolesLaunched: () => consoles()?.consoles?.length ?? 0,
    'hallOfFame.total': () => hall.length,
  };
  const facts = { get: (name) => (name in own ? own[name]() : secrets.fact(name)), has: (name) => name in own || secrets.facts.has(name) };

  const persist = () => saveAccount?.({ achievements: ach.serialize(), hallOfFame: hall, records: records.serialize() });
  const ach = new AchievementSystem({
    bus,
    defs: ACHIEVEMENTS,
    facts,
    now: () => ({ day: today(), year: clock.year, month: clock.month, runId: runId(), ngPlus: ngPlus() }),
    pay: (line) => {
      if (line.currency === 'rp') research()?.system?.addRp?.(line.amount, 'Achievement', today());
    },
  });
  bus.on('achievement:unlocked', () => persist());

  // --- the Hall of Fame -------------------------------------------------------------------------------------------------
  const staffNames = (r) => (r.team ?? []).map((m) => staffDefById(m.id)?.name ?? world.staffSystem.get(m.id)?.name).filter(Boolean);
  function induct(key, entry) {
    const cur = hall.find((e) => e.key === key);
    if (cur) {
      if (cur.runId === runId()) cur.numbers = { ...cur.numbers, ...entry.numbers }; // its numbers go on growing in its own run
      return false;
    }
    const e = { key, ...entry, runId: runId(), ngPlus: ngPlus(), year: clock.year, day: today() };
    hall.push(e);
    bus.emit('halloffame:entry', { entry: e });
    return true;
  }
  function checkHall() {
    let added = false;
    const gotyTitles = new Set(winsBy('C10').map((w) => w.title));
    for (const r of released()) {
      const copies = copiesOf(r);
      if (r.release.score >= H.gameReview || copies >= H.gameCopies || gotyTitles.has(r.result.title)) {
        const why = [r.release.score >= H.gameReview && `reviewed ${r.release.score}`, copies >= H.gameCopies && `${copies.toLocaleString('en-GB')} copies`, gotyTitles.has(r.result.title) && 'Game of the Year'].filter(Boolean);
        added = induct(`game:${runId()}:${r.number}`, { kind: 'game', name: r.result.title, art: r.result.cover, numbers: { review: r.release.score, copies, revenue: (r.sales?.revenue ?? 0) + (r.catalogue?.revenue ?? 0) }, why, staff: staffNames(r) }) || added;
      }
    }
    const byEngine = customersByEngine();
    for (const e of engines()?.engines ?? []) {
      const n = byEngine[e.id] ?? 0;
      if (n >= H.engineCustomers) added = induct(`engine:${runId()}:${e.id}`, { kind: 'engine', name: e.name, art: 'dev_ui_11', numbers: { customers: n, versions: e.versions?.length ?? 1 }, why: [`licensed to ${n} customers`], staff: [] }) || added;
    }
    for (const c of consoles()?.consoles ?? []) {
      if (c.sold >= H.consoleUnits) added = induct(`console:${runId()}:${c.id}`, { kind: 'console', name: consoles().modelName?.(c) ?? c.name, art: c.art, numbers: { units: c.sold, installBase: c.installBase, profit: c.income - c.costs }, why: [`${c.sold.toLocaleString('en-GB')} sold`], staff: [] }) || added;
    }
    if (added) {
      ach.notify('hallOfFame');
      persist();
    }
    return added;
  }

  // --- account records ------------------------------------------------------------------------------------------------
  function checkRecords() {
    let changed = false;
    const sub = (id, v, info = {}) => {
      if (typeof v === 'number' && Number.isFinite(v) && records.submit(id, v, { ...info, ngPlus: ngPlus(), year: clock.year })) changed = true;
    };
    for (const g of secrets.fact('games') ?? []) {
      sub('bestReview', g.score, { title: g.title });
      if (g.firstMonthCopies != null) sub('bestFirstMonth', g.firstMonthCopies, { title: g.title });
      sub('bestLifetime', g.copies, { title: g.title });
    }
    const seasons = {};
    for (const w of awards()?.wins ?? []) seasons[w.year] = (seasons[w.year] ?? 0) + 1;
    for (const [y, n] of Object.entries(seasons)) sub('mostAwardsSeason', n, { season: +y });
    sub('highestRank', business.reputation.highestRankIndex, { rank: FAME.ranks[business.reputation.highestRankIndex]?.id });
    for (const c of consoles()?.consoles ?? []) sub('biggestInstallBase', c.installBase, { console: c.name });
    sub('secretsFound', secrets.fact('secretsEver') ?? 0);
    sub('prestigeTokens', secrets.prestigeTokens ?? 0);
    if (changed) persist();
  }
  bus.on('reputation:rankUp', () => {
    if (business.reputation.highestRankIndex >= rankIndexOf(FAME.ranks, 'A') && records.submit('fastestRankA', today(), { ngPlus: ngPlus(), year: clock.year })) persist();
  });

  // --- trigger events -------------------------------------------------------------------------------------------------
  const tick = (event) => {
    checkHall();
    checkRecords();
    ach.notify(event);
  };
  bus.on('game:released', () => tick('gameReleased'));
  bus.on('project:complete', () => ach.notify('projectComplete'));
  bus.on('clock:month', () => tick('monthEnd'));
  bus.on('clock:year', () => tick('yearEnd'));
  bus.on('award:won', () => tick('awardWon'));
  bus.on('studio:stage', () => ach.notify('stageUp'));
  bus.on('console:launched', () => ach.notify('consoleLaunched'));
  bus.on('engine:complete', () => ach.notify('engineComplete'));
  bus.on('hardware:prototype', () => ach.notify('hardwarePrototype'));
  bus.on('external:released', () => ach.notify('external'));
  bus.on('licence:signed', () => tick('licence'));
  bus.on('sponsor:ended', () => ach.notify('sponsor'));
  bus.on('support:done', () => ach.notify('support'));
  bus.on('franchise:legendary', () => ach.notify('franchise'));

  return {
    system: ach,
    facts,
    records,
    get hall() {
      return hall;
    },
    hallCounts: () => ({ games: hall.filter((e) => e.kind === 'game').length, engines: hall.filter((e) => e.kind === 'engine').length, consoles: hall.filter((e) => e.kind === 'console').length, total: hall.length }),
    checkHall,
    checkRecords,
    checkAll: () => {
      checkHall();
      checkRecords();
      return ach.checkAll();
    },
    // For the screens: every achievement with its state (all 40 are visible; secrets never appear here).
    list: () => ACHIEVEMENTS.map((d) => ({ def: d, earned: ach.account.unlocked[d.id] ?? null, progress: ach.progress(d) })),
    count: () => ach.count,
    total: () => ACHIEVEMENTS.length,
    serializeAccount: () => ({ achievements: ach.serialize(), hallOfFame: JSON.parse(JSON.stringify(hall)), records: records.serialize() }),
    loadAccount(data) {
      ach.resetAccount();
      ach.load(data?.achievements ?? null);
      hall = JSON.parse(JSON.stringify(data?.hallOfFame ?? []));
      records.records = {};
      records.load(data?.records ?? null);
    },
  };
}
