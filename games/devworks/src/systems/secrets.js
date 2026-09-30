// The secret engine for DEVWORKS (Milestone 28, bible §40; the 50 secrets are Milestone 29). core/SecretEngine.js
// checks the rules; this file gives it the facts (read by name), keeps the exact counters the secrets need (plan
// review C), fires the trigger events, runs the rewards once and only once, and keeps the cross-run account record
// (its own save key, so every run and slot shares it). The rules are data/secrets.js (SECRETS; SYNTHETIC_SECRETS only
// for the Milestone 28 tests and ?synthetic=1).
//
// Facts (all measured by the game; nothing a premium purchase — Studio Tokens, VIP, store stubs — can move):
//   year · yearsDone · ngPlus · rank (highest rank index) · stage · credits · solvent · fanTrust · releases · games
//   (released games in release order, see summary()) · awards (award ids won) · awardCount · awardWins ({ award, year,
//   number, art, stage }) · platforms · researched · researchedVisible · facilities · discoveries · combosFound ·
//   combosFoundCount · hw.<key> (Milestone 25 console stats; hw.consoles, hw.hits) · employed.founder /
//   employed.<staffId> · startersContinuous · startersAllContinuous · legendaryEmployed · prestigeEmployed ·
//   legendaryHiredEver · legendaryFranchises · externalHits · sponsorsActive · crunch.days / crunch.games ·
//   crunchedGames · gamesAfterCrunch3 · technicalBest · crashIncidents · loadingComplaints · chartWeeks · history ·
//   clues · saviourGenres · sweepSeasons · rivalUpsets · ghostlightDefeats · researchPrototypes · hallOfFame.* ·
//   secretsEver · secretsRun · secretTechsEver · secretCombosEver · hwSecretsEver · secretEver / secretRun (id lists)
//   · clueStage.<id> · prestigeEngineTech · legacyStaffRuns · legacyOnC10 · flags.<id> · account.<fact>.
// The M28 measurements are unchanged (COUNTERS): Technical, launch stability, crash incident, loading complaint, player
// score, #1 chart week. Milestone 29 adds: marketing spend % (the game's marketing ÷ its production cost), first-month
// copies (28 days after launch), commercial failure (revenue after 168 days below its production cost), fast patching
// (support brought bugs under 5 within 84 days of launch; abandoned = support ended before that) and the team's
// average Morale when a game is finished. Continuous employment = never left since hired (founders: Milestone 5b).
// Clue stages: 1 rumour, 2 hint, 3 nearly explicit (the rule's clueStages), 4 the recipe (found, in any run).
// Rewards (core/UnlockActions, and an account ledger so nothing is ever granted twice — not after loading an older
// save, not in a later run): arrival (a Legendary / Prestige person arrives: the dev_event_13 moment and a special
// card for 56 days), recipe (a secret combo's bonus on every later game with that recipe), tech (a secret
// technology), part (a Prestige hardware part), unlock (a flag later milestones open: F34, F35, C11, C12, Ghostlight,
// PROJECT ONE / X …), prestigeTokens, cosmetic, accolade, accountFlag, fanTrust (now, and +N at every new run),
// flag (this run).
//
// Events: core's 'secret:unlocked' / 'secret:clue'; 'secret:arrival' { staffId, rule }.
import { SecretEngine, FactRegistry } from '../../../../core/SecretEngine.js';
import { UnlockRunner } from '../../../../core/UnlockActions.js';
import { COUNTERS as K, SECRET_REWARD_CURRENCIES, SECRET_RECIPES, FAMILY_GENRES } from '../../data/secrets.js';
import { staffDefById, PRESTIGE_TIERS } from '../../data/staff.js';
import { platformById } from '../../data/platforms.js';
import { RESEARCH } from '../../data/research.js';

const DAYS_YEAR = (clock) => clock.daysPerMonth * clock.monthsPerYear;
const r2 = (x) => +x.toFixed(2);
const FIRST_MONTH = 28;
const FAIL_DAYS = 168;
const PATCH_DAYS = 84;
const matches = (recipe, need) => Object.entries(need).every(([slot, ids]) => ids.includes(recipe?.[slot]));

export function createSecrets({ bus, clock, world, business, projects, rules = [], profile = () => null, awards = () => null, combos = () => null, consoles = () => null, studioEvents = () => null, research = () => null, franchises = () => null, global = () => null, engines = () => null, sponsors = () => null, runId = () => 'run', saveAccount = null }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;
  const blank = () => ({ games: {}, crashIncidents: 0, loadingComplaints: 0, chart: { start: 0, copies: {}, weeks: 0 }, chartByGame: {}, history: [], hired: {}, left: {}, flags: {}, starters: [], legendaryHired: [], awardStages: {}, researchPrototypes: 0 });
  let counters = blank();

  // --- the facts ---------------------------------------------------------------------------------------------------
  const released = () =>
    projects.catalogue
      .list()
      .filter((r) => r.release)
      .sort((a, b) => a.release.day - b.release.day || a.number - b.number);
  const yearOf = (day) => Math.floor(day / DAYS_YEAR(clock)) + 1;
  function summary(r) {
    const c = counters.games[r.number] ?? measure(r);
    const o = r.result.outputs ?? {};
    const rec = r.result.recipe ?? {};
    const plats = [...(r.release.platforms ?? [r.release.platform])];
    const copies = (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0);
    const mk = business.marketing?.campaign?.(r.jobId)?.log ?? [];
    const spend = mk.reduce((t, x) => t + (x.cost ?? 0), 0);
    const prev = r.result.type === 'sequel' && r.result.ipId ? released().filter((x) => x.result.ipId === r.result.ipId && x.release.day < r.release.day).at(-1) : null;
    const relYear = yearOf(r.release.day);
    return {
      number: r.number,
      title: r.result.title,
      score: r.release.score,
      playerScore: r.support?.playerScore ?? r.release.score,
      gameplay: o.gameplay ?? 0,
      graphics: o.graphics ?? 0,
      story: o.story ?? 0,
      innovation: o.innovation ?? 0,
      polish: o.polish ?? 0,
      audienceFit: o.audienceFit ?? 0,
      technical: c.technical,
      stability: c.stability,
      crash: c.crash,
      scope: r.result.scope,
      genre: rec.genre,
      theme: rec.theme,
      play: rec.gameplay,
      tech: rec.technology,
      art: rec.artDirection,
      feature: rec.feature,
      type: r.result.type ?? 'original',
      ownEngine: !!r.result.engine,
      lateDays: r.result.lateDays ?? 0,
      platforms: plats,
      copies,
      crunchDays: r.result.crunchDays ?? 0,
      morale: c.morale ?? null,
      bugs: (r.result.bugs ?? 0) + (r.release.qaBugs ?? 0),
      reviewGain: prev ? r.release.score - prev.release.score : null,
      marketingPct: r.result.cost ? r2((spend / r.result.cost) * 100) : 0,
      chartWeeks: counters.chartByGame[r.number] ?? 0,
      firstMonthCopies: c.firstMonth ?? null,
      salesMultiple: c.firstMonth ? r2(copies / c.firstMonth) : null,
      failed: !!c.failed,
      patchedFast: !!c.patchedFast,
      abandoned: !!c.abandoned,
      launchTrust: c.launchTrust ?? null,
      online: rec.feature === 'FEA03' || rec.technology === 'TEC05',
      exclusiveOwn: plats.length === 1 && !!platformById(plats[0])?.own,
      family: FAMILY_GENRES.includes(rec.genre),
      finalYear: plats.some((id) => platformById(id)?.era?.to === relYear),
      deal: !!r.result.deal,
    };
  }
  // The exact measurements of one release (plan review C), fixed at launch.
  function measure(r) {
    const o = r.result.outputs ?? {};
    const technical = r2(((o.graphics ?? 0) + (o.polish ?? 0)) / 2);
    const bugs = (r.result.bugs ?? 0) + (r.release?.qaBugs ?? 0);
    const stability = Math.max(0, Math.min(100, 100 - K.stabilityPerBug * bugs));
    return { technical, stability, crash: stability < K.crashBelow, loading: K.loadingScopes.includes(r.result.scope) && technical < K.loadingBelow };
  }
  const yearsSince = (from, until = today()) => r2(Math.max(0, (until - from) / DAYS_YEAR(clock)));
  function employedYears(who) {
    if (who === 'founder') {
      const p = profile();
      return p?.yearsEmployed ? r2(p.yearsEmployed(today())) : 0;
    }
    if (counters.left[who] != null || !staff.get(who)) return 0;
    return yearsSince(counters.hired[who] ?? 0);
  }
  const continuous = (id) => !!staff.get(id) && counters.left[id] == null;
  const hwStats = () => {
    const s = consoles()?.secretStats?.() ?? { consoles: [], generations: 0, profitableGenerations: 0, handheldRevision: false };
    const sold = s.consoles.filter((x) => x.units > 0);
    const list = consoles()?.consoles ?? [];
    return { ...s, hits: list.filter((c) => c.verdict === 'hit').length, bestDefectRate: sold.length ? Math.min(...sold.map((x) => x.defectRatePct)) : null, maxUnits: Math.max(0, ...s.consoles.map((x) => x.units)), peakDevFriendly: Math.max(0, ...s.consoles.map((x) => x.peakDevFriendly)), thirdPartyReleases: s.consoles.reduce((t, x) => t + x.thirdPartyReleases, 0), missedLaunch: s.consoles.some((x) => x.missedLaunch) };
  };
  const byTitle = () => Object.fromEntries(released().map((r) => [r.result.title, r]));
  function awardWins() {
    const t = byTitle();
    return (awards()?.wins ?? []).map((w, i) => {
      const r = t[w.title];
      return { award: w.award, year: w.year, title: w.title, number: r?.number ?? null, art: r?.result.recipe?.artDirection ?? null, stage: counters.awardStages[`${w.award}-${w.year}-${i}`] ?? counters.awardStages[`${w.award}-${w.year}`] ?? null };
    });
  }
  // A game wins a Gameplay award (C03), a craft award (C05 / C06) and Game of the Year (C10) in one season.
  function sweepSeasons() {
    const by = {};
    for (const w of awardWins()) ((by[`${w.year}|${w.title}`] ||= new Set())).add(w.award);
    return Object.values(by).filter((s) => s.has('C03') && (s.has('C05') || s.has('C06')) && s.has('C10')).length;
  }
  // Beat a rival release whose review was at least 8 above your game's pre-release forecast (its fan expectation).
  function rivalUpsets() {
    const t = byTitle();
    let n = 0;
    for (const res of Object.values(awards()?.results?.() ?? {})) {
      const me = res.entrants?.find((e) => e.id === 'player');
      const rec = me && t[me.title];
      if (!rec) continue;
      const forecast = rec.release.fanExpectation ?? 0;
      if (res.entrants.some((e) => e.id !== 'player' && e.place > me.place && (e.review ?? e.score) >= forecast + 8)) n++;
    }
    return n;
  }
  const ghostlightDefeats = () => Object.values(awards()?.results?.() ?? {}).filter((res) => ['C06', 'C09'].includes(res.award) && res.playerPlace != null && res.entrants.some((e) => e.id === 'R08' && e.place > res.playerPlace)).length;
  // Three commercial failures in a genre, then an 85+ review in it.
  function saviourGenres() {
    const fails = {};
    const saved = new Set();
    for (const g of released().map(summary)) {
      if (!g.genre) continue;
      if (g.score >= 85 && (fails[g.genre] ?? 0) >= 3) saved.add(g.genre);
      if (g.failed) fails[g.genre] = (fails[g.genre] ?? 0) + 1;
    }
    return saved.size;
  }
  function gamesAfterCrunch3() {
    const list = released().map(summary);
    let n = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].crunchDays > 0) n++;
      if (n >= 3) return list.slice(i + 1);
    }
    return [];
  }
  const hallOfFame = () => ({
    games: released().filter((r) => r.release.score >= 85).length,
    engines: engines()?.engines?.length ?? 0,
    consoles: hwStats().hits,
  });
  const rulesIn = (prefix) => engine.rules.filter((r) => r.id.startsWith(prefix));
  const everCount = (list) => list.filter((r) => engine.everUnlocked(r.id)).length;
  const tierOf = (id) => staffDefById(id)?.tier;
  const facts = new FactRegistry()
    .define('year', () => clock.year)
    .define('yearsDone', () => r2(today() / DAYS_YEAR(clock)))
    .define('ngPlus', () => profile()?.ngPlus ?? 0)
    .define('rank', () => business.reputation.highestRankIndex)
    .define('stage', () => world.stage)
    .define('credits', () => business.credits)
    .define('solvent', () => !business.inDebt && business.credits >= 0)
    .define('fanTrust', () => business.state.fanTrust)
    .define('releases', () => released().length)
    .define('games', () => released().map(summary))
    .define('awards', () => (awards()?.wins ?? []).map((w) => w.award))
    .define('awardCount', () => (awards()?.wins ?? []).length)
    .define('awardWins', () => awardWins())
    .define('platforms', () => [...new Set(released().flatMap((r) => r.release.platforms ?? [r.release.platform]))])
    .define('researched', () => [...(research()?.researched?.() ?? [])])
    .define('researchedVisible', () => [...(research()?.researched?.() ?? [])].filter((id) => RESEARCH.some((x) => x.id === id)).length)
    .define('facilities', () => world.stations.map((s) => s.id))
    .define('discoveries', () => combos()?.found?.().filter((x) => x.inRun).length ?? 0)
    .define('combosFound', () => combos()?.found?.().filter((x) => x.inRun).map((x) => x.combo.id) ?? [])
    .define('combosFoundCount', () => combos()?.found?.().filter((x) => x.inRun).length ?? 0)
    .define('startersContinuous', () => counters.starters.filter(continuous).length)
    .define('startersAllContinuous', () => counters.starters.length > 0 && counters.starters.every(continuous))
    .define('legendaryEmployed', () => staff.staff.filter((s) => PRESTIGE_TIERS.includes(tierOf(s.id))).length)
    .define('prestigeEmployed', () => staff.staff.filter((s) => tierOf(s.id) === 'secret').length)
    .define('legendaryHiredEver', () => counters.legendaryHired.length)
    .define('legendaryFranchises', () => (franchises()?.list?.() ?? []).filter((ip) => ip.status === 'legendary' || ip.legendaryDay != null).length)
    .define('externalHits', () => (global()?.external ?? []).filter((p) => p.result?.hit).length)
    .define('sponsorsActive', () => (sponsors()?.deals ?? []).filter((d) => today() <= d.endDay).map((d) => d.id))
    .define('crunch.days', () => released().reduce((t, r) => t + (r.result.crunchDays ?? 0), 0) + projects.jobs.reduce((t, j) => t + (j.data.crunchDays ?? 0), 0))
    .define('crunch.games', () => released().filter((r) => (r.result.crunchDays ?? 0) > 0).length)
    .define('crunchedGames', () => released().filter((r) => (r.result.crunchDays ?? 0) > 0).length)
    .define('gamesAfterCrunch3', () => gamesAfterCrunch3())
    .define('technicalBest', () => Math.max(0, ...released().map((r) => summary(r).technical)))
    .define('crashIncidents', () => counters.crashIncidents)
    .define('loadingComplaints', () => counters.loadingComplaints)
    .define('chartWeeks', () => counters.chart.weeks)
    .define('history', () => [...counters.history])
    .define('clues', () => (studioEvents()?.clues ?? []).map((c) => c.id))
    .define('saviourGenres', () => saviourGenres())
    .define('sweepSeasons', () => sweepSeasons())
    .define('rivalUpsets', () => rivalUpsets())
    .define('ghostlightDefeats', () => ghostlightDefeats())
    .define('researchPrototypes', () => counters.researchPrototypes)
    .define('secretsEver', () => engine.rules.filter((r) => engine.everUnlocked(r.id)).length)
    .define('secretsRun', () => Object.keys(engine.run.unlocked).length)
    .define('secretTechsEver', () => everCount(rulesIn('SEC-TECH-')))
    .define('secretCombosEver', () => everCount(rulesIn('SEC-COMBO-')))
    .define('hwSecretsEver', () => everCount(rulesIn('SEC-HW-').filter((r) => r.id !== 'SEC-HW-06')))
    .define('secretEver', () => engine.rules.filter((r) => engine.everUnlocked(r.id)).map((r) => r.id))
    .define('secretRun', () => Object.keys(engine.run.unlocked))
    .define('prestigeEngineTech', () => !!engine.account.flags.tech?.prestigeBuildSystem)
    .define('legacyStaffRuns', () => profile()?.legacyRuns ?? 0) // NG+ carry-over is Milestone 33: 0 until then
    .define('legacyOnC10', () => !!profile()?.legacyOnC10)
    .defineGroup('hw', (key) => hwStats()[key])
    .defineGroup('hallOfFame', (key) => hallOfFame()[key])
    .defineGroup('employed', (who) => employedYears(who))
    .defineGroup('clueStage', (id) => stageOf(id))
    .defineGroup('flags', (id) => !!counters.flags[id])
    .defineGroup('account', (name) => engine.accountFact(name));

  // --- rewards, once ------------------------------------------------------------------------------------------------
  let engine = null;
  const acct = () => engine.account.flags;
  const ledger = () => (acct().paid ||= {});
  // An account reward: granted at most once per account, whatever save is loaded and whichever run finds it.
  const once = (a, fn) => {
    const key = `${a.secret}:${a.type}:${a.id}`;
    if (ledger()[key] != null) return false;
    ledger()[key] = today();
    fn();
    persistAccount(); // saved at once: the account ledger is what keeps a reward from being granted twice
    return true;
  };
  const add = (bag, id, v = true) => ((acct()[bag] ||= {})[id] ??= v);
  const runner = new UnlockRunner({
    bus,
    handlers: {
      prestigeTokens: (a) => once(a, () => (acct().prestigeTokens = (acct().prestigeTokens ?? 0) + (a.amount ?? 1))),
      flag: (a) => (counters.flags[a.id] = today()),
      accountFlag: (a) =>
        once(a, () => {
          add('flagsSet', a.id, today());
          acct()[a.id] ??= today();
        }),
      arrival: (a) =>
        once(a, () => {
          add('arrivals', a.id, today());
          bus.emit('secret:arrival', { staffId: a.id, rule: engine.byId[a.secret] });
        }),
      recipe: (a) => once(a, () => add('recipes', a.id, today())),
      tech: (a) => once(a, () => add('tech', a.id, today())),
      part: (a) => once(a, () => add('parts', a.id, today())),
      unlock: (a) => once(a, () => add('unlocks', a.id, today())),
      cosmetic: (a) => once(a, () => add('cosmetics', a.id, today())),
      accolade: (a) => once(a, () => add('accolades', a.id, today())),
      fanTrust: (a) =>
        once(a, () => {
          add('fanTrustBonus', a.id, a.amount);
          business.state.fanTrust = +Math.min(100, business.state.fanTrust + a.amount).toFixed(2);
        }),
    },
  });
  engine = new SecretEngine({ bus, rules, facts, runner, ngPlus: () => profile()?.ngPlus ?? 0, currencyTypes: SECRET_REWARD_CURRENCIES, now: () => ({ day: today(), year: clock.year, runId: runId() }) });
  const persistAccount = () => saveAccount?.(engine.serializeAccount());
  bus.on('secret:unlocked', () => {
    engine.setRunFact('secretsFound', Object.keys(engine.run.unlocked));
    persistAccount();
    queueMicrotask?.(() => notify('secretFound'));
  });

  // --- counters and trigger events ------------------------------------------------------------------------------------
  const notify = (event, payload = {}) => engine.notify(event, payload);
  const gameC = (n) => (counters.games[n] ||= {});
  bus.on('project:complete', ({ record }) => {
    const team = (record.team ?? []).map((m) => staff.get(m.id)).filter(Boolean);
    if (team.length) gameC(record.number).morale = r2(team.reduce((t, s) => t + (s.morale ?? 0), 0) / team.length);
  });
  bus.on('game:released', ({ record }) => {
    const m = measure(record);
    Object.assign(gameC(record.number), m, { launchTrust: business.state.fanTrust, releasedDay: today() });
    if (m.crash) counters.crashIncidents++;
    if (m.loading) counters.loadingComplaints++;
    notify('gameReleased', { game: summary(record) });
  });
  bus.on('support:done', ({ record, effects }) => {
    const c = record && counters.games[record.number];
    if (c && effects?.ended && c.releasedDay != null && today() - c.releasedDay < PATCH_DAYS && !c.patchedFast) c.abandoned = true;
  });
  bus.on('milestone:reached', ({ def }) => {
    if (def?.on && !counters.history.includes(def.on)) counters.history.push(def.on);
    notify('milestone', { step: def?.on });
  });
  bus.on('award:won', ({ award, result }) => {
    counters.awardStages[`${award?.id}-${result?.year}`] ??= world.stage;
    notify('awardWon', { award: award?.id });
  });
  bus.on('staff:hired', ({ staff: s }) => {
    counters.hired[s.id] = today();
    delete counters.left[s.id];
    if (PRESTIGE_TIERS.includes(tierOf(s.id)) && !counters.legendaryHired.includes(s.id)) counters.legendaryHired.push(s.id);
    notify('hired', { id: s.id });
  });
  bus.on('staff:removed', ({ staff: s }) => {
    counters.left[s.id] = today();
    notify('staffLeft', { id: s.id });
  });
  bus.on('console:launched', () => notify('consoleLaunched'));
  bus.on('research:prototype', () => counters.researchPrototypes++); // Research Prototype projects (a later milestone fires it)
  bus.on('event:resolved', ({ instance }) => {
    if ((instance?.choices?.[instance.choice] ?? []).some((e) => e.type === 'clue')) notify('eventClue');
  });
  // #1 chart weeks: copies per game over each 7-day week (the best seller of a week over the line gets the week).
  bus.on('sales:day', ({ record, copies }) => {
    counters.chart.copies[record.number] = (counters.chart.copies[record.number] ?? 0) + copies;
  });
  bus.on('clock:day', () => {
    const ch = counters.chart;
    if (today() - ch.start >= K.chartDays) {
      const entries = Object.entries(ch.copies);
      const best = entries.reduce((b, e) => (e[1] > (b?.[1] ?? -1) ? e : b), null);
      if (best && best[1] >= K.chartBase + K.chartPerYear * clock.year) {
        ch.weeks++;
        counters.chartByGame[best[0]] = (counters.chartByGame[best[0]] ?? 0) + 1;
      }
      ch.start = today();
      ch.copies = {};
    }
    // Per-game milestones after launch: first-month copies, fast patching, commercial failure.
    for (const r of released()) {
      const c = counters.games[r.number];
      if (!c || c.releasedDay == null) continue;
      const age = today() - c.releasedDay;
      if (c.firstMonth == null && age >= FIRST_MONTH) c.firstMonth = r.sales?.copies ?? 0;
      if (!c.patchedFast && !c.abandoned && age <= PATCH_DAYS && r.support && (r.support.bugsLeft ?? Infinity) < 5 && measureBugs(r) >= 5) c.patchedFast = true;
      if (c.failed == null && age >= FAIL_DAYS) c.failed = (r.sales?.revenue ?? 0) < (r.result.cost ?? 0);
    }
  });
  const measureBugs = (r) => (r.result.bugs ?? 0) + (r.release?.qaBugs ?? 0);
  bus.on('clock:month', () => {
    notify('monthEnd');
    if (consoles()?.consoles?.length) notify('consoleMonth');
  });
  bus.on('clock:year', () => notify('yearEnd'));

  // --- what rewards open elsewhere (read by the game) -----------------------------------------------------------------
  const has = (bag, id) => acct()[bag]?.[id] != null; // (a reward granted on day 0 is stored as 0)
  // A known secret recipe's bonus for a recipe: { output, tailPct, franchisePct } or null.
  function recipeBonus(recipe) {
    const out = { output: {}, tailPct: 0, franchisePct: 0, recipes: [] };
    for (const [id, r] of Object.entries(SECRET_RECIPES)) {
      if (!has('recipes', id) || !matches(recipe, r.need)) continue;
      out.recipes.push(id);
      for (const [k, v] of Object.entries(r.bonus.output ?? {})) out.output[k] = (out.output[k] ?? 0) + v;
      out.tailPct += r.bonus.tailPct ?? 0;
      out.franchisePct += r.bonus.franchisePct ?? 0;
    }
    return out.recipes.length ? out : null;
  }

  // --- what the player (and the debug inspector) sees -------------------------------------------------------------------
  const stageOf = (id) => (engine.unlockedInRun(id) || engine.account.history[id] ? 4 : engine.run.clues[id] ?? 0);
  const valueText = (v) => (v === undefined || v === null ? '—' : Array.isArray(v) ? `[${v.join(', ')}]` : typeof v === 'number' ? `${r2(v)}` : `${v}`);
  function condLine(p, kind = 'need') {
    if (p.group) return { ok: p.ok, text: `${p.group === 'all' ? 'All of' : 'Any of'}: ${p.parts.map((x) => `${x.ok ? '✓' : '✗'} ${x.cond.label ?? x.cond.fact}`).join(' · ')}` };
    const need = Array.isArray(p.need) ? `[${p.need.join(', ')}]` : p.need;
    const label = p.cond.label ?? `${p.cond.fact} ${p.cond.op} ${valueText(p.cond.value)}`;
    const forbid = kind === 'forbid';
    return { ok: forbid ? !p.ok : p.ok, text: `${label}: ${forbid ? (p.ok ? 'happened — blocks it' : 'not happened') : `${valueText(p.value)} of ${valueText(need)}${p.eased ? ' (eased)' : ''}`}${p.known === false ? ' (unknown fact)' : ''}` };
  }
  // why-false inspector: every condition, its live value and what is needed; the first failing part named.
  function why(id) {
    const rule = engine.byId[id];
    if (!rule) return null;
    const res = engine.evaluate(rule, { event: 'inspect', payload: {} });
    const lines = [
      ...(rule.ngPlusMin ? [{ ok: res.ng.ok, text: `NG+${res.ng.need} (now NG+${res.ng.value})` }] : []),
      ...res.all.map((p) => condLine(p)),
      ...(res.any.length ? [{ ok: res.anyOk, text: `Any of: ${res.any.map((p) => `${p.ok ? '✓' : '✗'} ${p.cond.label ?? p.cond.fact} (${valueText(p.value)})`).join(' · ')}` }] : []),
      ...res.forbids.map((p) => condLine(p, 'forbid')),
    ];
    return { id, name: rule.name, ok: res.ok, stage: stageOf(id), found: engine.unlockedInRun(id), eased: res.eased, lines, failing: lines.filter((l) => !l.ok).map((l) => l.text), open: engine.open(rule), triggers: rule.triggerEvents ?? [] };
  }
  // The Rumour Archive: every secret with a clue (stage 1–3) or found (stage 4, with its recipe and reward).
  function rumours() {
    return engine.rules
      .map((rule) => {
        const stage = stageOf(rule.id);
        if (!stage) return null;
        const text = stage < 4 ? rule.clueStages?.[stage - 1]?.text ?? '…' : null;
        return { id: rule.id, name: stage >= 4 ? rule.name : '???', category: rule.category, group: rule.group ?? rule.category, stage, text, reward: stage >= 4 ? rule.rewardText ?? null : null, recipe: stage >= 4 ? [...(rule.ngPlusMin ? [`NG+${rule.ngPlusMin}`] : []), ...why(rule.id).lines.filter((l) => !/^NG\+/.test(l.text)).map((l) => l.text.replace(/: [^:]*$/, ''))] : null, found: engine.unlockedInRun(rule.id) };
      })
      .filter(Boolean);
  }

  return {
    engine,
    runner,
    facts,
    fact: (name) => facts.get(name, {}),
    notify,
    why,
    rumours,
    stageOf,
    recipeBonus,
    summary,
    // What the rewards have opened (account-wide): arrivals, recipes, tech, parts, unlocks, cosmetics, accolades.
    opened: (bag, id) => has(bag, id),
    // Milestone 30: a reward outside the rules (an award's Prestige Tokens, the software-endgame flag), granted at most
    // once for its key in this account — reloading an older save and winning again grants nothing.
    grantOnce(key, fn) {
      if (ledger()[key] != null) return false;
      ledger()[key] = today();
      fn();
      persistAccount();
      return true;
    },
    addTokens: (n) => (acct().prestigeTokens = (acct().prestigeTokens ?? 0) + n),
    setOpened: (bag, id) => add(bag, id, today()),
    openedList: (bag) => Object.keys(acct()[bag] ?? {}),
    get counters() {
      return counters;
    },
    get prestigeTokens() {
      return acct().prestigeTokens ?? 0;
    },
    measure,
    newGame() {
      engine.resetRun();
      runner.reset();
      counters = blank();
      for (const s of staff.staff) counters.hired[s.id] = today();
      counters.starters = staff.staff.map((s) => s.id).sort();
      // Permanent Fan Trust rewards (SEC-BEH-03) apply at every new run.
      const bonus = Object.values(acct().fanTrustBonus ?? {}).reduce((t, v) => t + v, 0);
      if (bonus) business.state.fanTrust = +Math.min(100, business.state.fanTrust + bonus).toFixed(2);
    },
    serialize: () => JSON.parse(JSON.stringify({ run: engine.serializeRun(), runner: runner.serialize(), counters })),
    load(data) {
      engine.loadRun(data?.run ?? null);
      runner.reset();
      if (data?.runner) runner.load(data.runner);
      counters = data?.counters ? { ...blank(), ...JSON.parse(JSON.stringify(data.counters)) } : blank();
      // A save from before Milestone 28 / 29: the people already there count from their start; releases are measured
      // now; the starters are the people there since day 0.
      if (!data?.counters) {
        for (const s of staff.staff) counters.hired[s.id] ??= 0;
        for (const r of released()) {
          const m = measure(r);
          Object.assign(gameC(r.number), m, { releasedDay: r.release.day });
          if (m.crash) counters.crashIncidents++;
          if (m.loading) counters.loadingComplaints++;
        }
      }
      if (!counters.starters.length) counters.starters = Object.entries(counters.hired).filter(([, d]) => d === 0).map(([id]) => id).sort();
    },
    serializeAccount: () => engine.serializeAccount(),
    loadAccount: (data) => engine.loadAccount(data ?? null),
  };
}
