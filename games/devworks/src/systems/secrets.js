// The secret engine for DEVWORKS (Milestone 28, bible §40). core/SecretEngine.js checks the rules; this file gives it
// the facts (read by name), keeps the exact counters the secrets need (plan review C), fires the trigger events,
// runs the rewards once and only once, and keeps the cross-run account record (its own save key, so every run and
// slot shares it). Only synthetic test rules are loaded for now (data/secrets.js); the real 50 come in Milestone 29.
//
// Facts: year · ngPlus · credits · releases · games (released games in release order: { number, title, score,
//   playerScore, technical, stability, scope, genre, theme, type, platforms, copies, crunchDays, bugs }) · awards
//   (award ids won) · awardCount · platforms (ids released on) · discoveries (combos found this run) · hw.<key>
//   (the console stats of Milestone 25) · employed.founder / employed.<staffId> (years employed without a break) ·
//   crunch.days / crunch.games · technicalBest · crashIncidents · loadingComplaints · chartWeeks · history (the
//   milestone steps in the order they happened) · clues (event clues, Milestone 27) · flags.<id> · account.<fact>.
// Clue stages: 1 rumour, 2 hint, 3 nearly explicit (from the rule's clueStages), 4 the recipe (once found: the exact
//   conditions, forever, from the account history).
// Rewards (core/UnlockActions): prestigeTokens (account; never paid twice for the same secret, even after loading an
//   older save), flag (this run), accountFlag (every run from now on).
//
// Events: core's 'secret:unlocked' / 'secret:clue'.
import { SecretEngine, FactRegistry } from '../../../../core/SecretEngine.js';
import { UnlockRunner } from '../../../../core/UnlockActions.js';
import { COUNTERS as K, SECRET_REWARD_CURRENCIES } from '../../data/secrets.js';

const DAYS_YEAR = (clock) => clock.daysPerMonth * clock.monthsPerYear;
const r2 = (x) => +x.toFixed(2);

export function createSecrets({ bus, clock, world, business, projects, rules = [], profile = () => null, awards = () => null, combos = () => null, consoles = () => null, studioEvents = () => null, runId = () => 'run', saveAccount = null }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;
  const blank = () => ({ games: {}, crashIncidents: 0, loadingComplaints: 0, chart: { start: 0, copies: {}, weeks: 0 }, history: [], hired: {}, left: {}, flags: {} });
  let counters = blank();

  // --- the facts ---------------------------------------------------------------------------------------------------
  const released = () =>
    projects.catalogue
      .list()
      .filter((r) => r.release)
      .sort((a, b) => a.release.day - b.release.day || a.number - b.number);
  function summary(r) {
    const c = counters.games[r.number] ?? measure(r);
    return { number: r.number, title: r.result.title, score: r.release.score, playerScore: r.support?.playerScore ?? r.release.score, technical: c.technical, stability: c.stability, scope: r.result.scope, genre: r.result.recipe?.genre, theme: r.result.recipe?.theme, type: r.result.type ?? 'original', platforms: [...(r.release.platforms ?? [r.release.platform])], copies: (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0), crunchDays: r.result.crunchDays ?? 0, bugs: (r.result.bugs ?? 0) + (r.release.qaBugs ?? 0) };
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
  const hwStats = () => {
    const s = consoles()?.secretStats?.() ?? { consoles: [], generations: 0, profitableGenerations: 0, handheldRevision: false };
    const sold = s.consoles.filter((x) => x.units > 0);
    return { ...s, bestDefectRate: sold.length ? Math.min(...sold.map((x) => x.defectRatePct)) : null, maxUnits: Math.max(0, ...s.consoles.map((x) => x.units)), peakDevFriendly: Math.max(0, ...s.consoles.map((x) => x.peakDevFriendly)), thirdPartyReleases: s.consoles.reduce((t, x) => t + x.thirdPartyReleases, 0), missedLaunch: s.consoles.some((x) => x.missedLaunch) };
  };
  const facts = new FactRegistry()
    .define('year', () => clock.year)
    .define('ngPlus', () => profile()?.ngPlus ?? 0)
    .define('credits', () => business.credits)
    .define('releases', () => released().length)
    .define('games', () => released().map(summary))
    .define('awards', () => (awards()?.wins ?? []).map((w) => w.award))
    .define('awardCount', () => (awards()?.wins ?? []).length)
    .define('platforms', () => [...new Set(released().flatMap((r) => r.release.platforms ?? [r.release.platform]))])
    .define('discoveries', () => combos()?.found?.().filter((x) => x.inRun).length ?? 0)
    .define('crunch.days', () => released().reduce((t, r) => t + (r.result.crunchDays ?? 0), 0) + projects.jobs.reduce((t, j) => t + (j.data.crunchDays ?? 0), 0))
    .define('crunch.games', () => released().filter((r) => (r.result.crunchDays ?? 0) > 0).length)
    .define('technicalBest', () => Math.max(0, ...released().map((r) => summary(r).technical)))
    .define('crashIncidents', () => counters.crashIncidents)
    .define('loadingComplaints', () => counters.loadingComplaints)
    .define('chartWeeks', () => counters.chart.weeks)
    .define('history', () => [...counters.history])
    .define('clues', () => (studioEvents()?.clues ?? []).map((c) => c.id))
    .defineGroup('hw', (key) => hwStats()[key])
    .defineGroup('employed', (who) => employedYears(who))
    .defineGroup('flags', (id) => !!counters.flags[id])
    .defineGroup('account', (name) => engine.accountFact(name));

  // --- rewards, once ------------------------------------------------------------------------------------------------
  let engine = null;
  const paid = () => (engine.account.flags.paid ||= {});
  const runner = new UnlockRunner({
    bus,
    handlers: {
      prestigeTokens: (a) => {
        const key = `${a.secret}:${a.id}`;
        if (paid()[key]) return; // never twice for one secret, whatever save is loaded
        paid()[key] = today();
        engine.account.flags.prestigeTokens = (engine.account.flags.prestigeTokens ?? 0) + (a.amount ?? 1);
      },
      flag: (a) => (counters.flags[a.id] = today()),
      accountFlag: (a) => (engine.account.flags[a.id] ??= today()),
    },
  });
  engine = new SecretEngine({ bus, rules, facts, runner, ngPlus: () => profile()?.ngPlus ?? 0, currencyTypes: SECRET_REWARD_CURRENCIES, now: () => ({ day: today(), year: clock.year, runId: runId() }) });
  const persistAccount = () => saveAccount?.(engine.serializeAccount());
  bus.on('secret:unlocked', () => {
    engine.setRunFact('secretsFound', Object.keys(engine.run.unlocked));
    persistAccount();
  });

  // --- counters and trigger events ------------------------------------------------------------------------------------
  const notify = (event, payload = {}) => engine.notify(event, payload);
  bus.on('game:released', ({ record }) => {
    const m = measure(record);
    counters.games[record.number] = m;
    if (m.crash) counters.crashIncidents++;
    if (m.loading) counters.loadingComplaints++;
    notify('gameReleased', { game: summary(record) });
  });
  bus.on('milestone:reached', ({ def }) => {
    if (def?.on && !counters.history.includes(def.on)) counters.history.push(def.on);
    notify('milestone', { step: def?.on });
  });
  bus.on('award:won', ({ award }) => notify('awardWon', { award: award?.id }));
  bus.on('staff:hired', ({ staff: s }) => {
    counters.hired[s.id] = today();
    delete counters.left[s.id];
    notify('hired', { id: s.id });
  });
  bus.on('staff:removed', ({ staff: s }) => {
    counters.left[s.id] = today();
    notify('staffLeft', { id: s.id });
  });
  bus.on('console:launched', () => notify('consoleLaunched'));
  bus.on('event:resolved', ({ instance }) => {
    if ((instance?.choices?.[instance.choice] ?? []).some((e) => e.type === 'clue')) notify('eventClue');
  });
  // #1 chart weeks: copies per game over each 7-day week.
  bus.on('sales:day', ({ record, copies }) => {
    counters.chart.copies[record.number] = (counters.chart.copies[record.number] ?? 0) + copies;
  });
  bus.on('clock:day', () => {
    const ch = counters.chart;
    if (today() - ch.start >= K.chartDays) {
      const best = Math.max(0, ...Object.values(ch.copies));
      if (best >= K.chartBase + K.chartPerYear * clock.year) ch.weeks++;
      ch.start = today();
      ch.copies = {};
    }
  });
  bus.on('clock:month', () => {
    notify('monthEnd');
    if (consoles()?.consoles?.length) notify('consoleMonth');
  });
  bus.on('clock:year', () => notify('yearEnd'));

  // --- what the player (and the debug inspector) sees -------------------------------------------------------------------
  const stageOf = (id) => (engine.unlockedInRun(id) || engine.account.history[id] ? 4 : engine.run.clues[id] ?? 0);
  const valueText = (v) => (v === undefined ? '—' : Array.isArray(v) ? `[${v.join(', ')}]` : typeof v === 'number' ? `${r2(v)}` : `${v}`);
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
  // The Rumour Archive: every secret with a clue (stage 1–3) or found (stage 4, with its recipe).
  function rumours() {
    return engine.rules
      .map((rule) => {
        const stage = stageOf(rule.id);
        if (!stage) return null;
        const text = stage < 4 ? rule.clueStages?.[stage - 1]?.text ?? '…' : null;
        return { id: rule.id, name: stage >= 4 ? rule.name : '???', category: rule.category, stage, text, recipe: stage >= 4 ? why(rule.id).lines.map((l) => l.text.replace(/:.*$/, '')) : null, found: engine.unlockedInRun(rule.id) };
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
    get counters() {
      return counters;
    },
    get prestigeTokens() {
      return engine.account.flags.prestigeTokens ?? 0;
    },
    measure,
    newGame() {
      engine.resetRun();
      runner.reset();
      counters = blank();
      for (const s of staff.staff) counters.hired[s.id] = today();
    },
    serialize: () => JSON.parse(JSON.stringify({ run: engine.serializeRun(), runner: runner.serialize(), counters })),
    load(data) {
      engine.loadRun(data?.run ?? null);
      runner.reset();
      if (data?.runner) runner.load(data.runner);
      counters = data?.counters ? { ...blank(), ...JSON.parse(JSON.stringify(data.counters)) } : blank();
      // A save from before Milestone 28: the people already there count from today; releases are measured now.
      if (!data?.counters) {
        for (const s of staff.staff) counters.hired[s.id] ??= 0;
        for (const r of released()) {
          const m = measure(r);
          counters.games[r.number] = m;
          if (m.crash) counters.crashIncidents++;
          if (m.loading) counters.loadingComplaints++;
        }
      }
    },
    serializeAccount: () => engine.serializeAccount(),
    loadAccount: (data) => engine.loadAccount(data ?? null),
  };
}
