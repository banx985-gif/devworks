// The studio as a business (Milestone 4): Credits (core EconomySystem: one ledger line for every change, debt as
// Emergency Credit), salaries every month, project costs every day, releasing a finished game (reviews, then sales
// every day), Fame and rank (core ReputationSystem: the rank never drops), Fan Trust, and OpenDesk's audience
// (core MarketSystem, one segment per platform, rolled each month). Every number is in data/balance.js.
//
// Day order is fixed, so the same save and choices always give the same result: the studio settles Energy and
// breaks, projects work (and pay their cost), then released games sell. Month ends: interest on any debt, then
// salaries.
//
// Milestone 8: 12 platforms (src/systems/platformMarket.js), release on one or more (porting, QA overhead,
// certification that can fail and delay the launch), sales per platform from its install base and audience fit.
//
// Milestone 9 (src/systems/marketing.js, saved here): marketing actions build each game's Hype before launch; at launch
// Hype sets Fan Expectation (the review's expectation penalty), adds sales and shapes the curve with word of mouth; a
// same-genre competitor release that month cuts the launch week; Fan Trust moves with the review, bugs at launch,
// overhype and delays.
//
// Milestone 10 (src/systems/franchises.js, saved here): every game belongs to a franchise; at launch the franchise's
// fatigue lowers the review and sales and its fanbase adds players (Sequels most); a Remaster sells cheaper; each
// month the back catalogue sells a little, with a spike after another game of the franchise launches.
//
// Milestone 11: facility effects — fanTrustGainPct on Fan Trust gains, certFailPct on certification fail chances,
// launchSalesPct on sales.
//
// Milestone 15: a combo game's launch effects (result.comboFx): casual / core audience sales on platforms of that
// audience group, a longer sales tail, Fan Trust.
//
// Milestone 17: a game made under a publisher deal (result.deal) must release on the deal's platform when it can, and
// the publisher's reach adds launch sales (on PC only for OpenGate). The share of sales is taken in publishers.js.
//
// Milestone 20: addPlatform (a post-launch Port): the new platform's porting cost and certification as at release (a
// fail delays it), then it sells there from its launch day on its own curve, with the game's original review.
//
// Milestone 21: a localised game (result.localised) sells LOCALISATION.salesPct more at launch (+ BUS4 through the effect
// query 'localisedSalesPct'); a global publisher's reach (globalReach) counts only up to reachCapPct on a game that isn't
// localised. The multiplier is kept on record.release.localisation.
//
// Milestone 26 (src/systems/distribution.js, set with setDistribution): each release picks a distribution mode — its
// sales this year, curve shape, pressing cost (paid at release) and margin per copy (record.release.distribution);
// Early Access doesn't launch the game yet (the distribution system keeps it in record.ea until launchNow).
//
// Events: 'game:certifying' { record }, 'game:released' { record }, 'sales:day' { record, copies, revenue } (per game with sales that day),
// plus core's 'economy:change' / 'economy:debt' / 'reputation:change' / 'reputation:rankUp'.
import { EconomySystem } from '../../../../core/EconomySystem.js';
import { ReputationSystem } from '../../../../core/ReputationSystem.js';
import { MarketSystem } from '../../../../core/MarketSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { PROJECT_BALANCE, ECONOMY, RELEASE, REVIEW_BALANCE, SALES_BALANCE, FAME, FAN_TRUST, SPEED_UNLOCKS } from '../../data/balance.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { PLATFORMS, platformById, allPlatforms } from '../../data/platforms.js';
import { PLATFORM_BALANCE } from '../../data/balance.js';
import { createPlatformMarket, releasable } from './platformMarket.js';
import { reviewGame } from './reviews.js';
import { startSales, sellDay, statusOn } from './sales.js';
import { createMarketing, launchTrust, fanExpectationFor } from './marketing.js';
import { createFranchises, typeOf } from './franchises.js';
import { AUDIENCE_GROUPS } from '../../data/combos.js';
import { ENGINE_BALANCE } from '../../data/engines.js';
import { platformById as platformOf } from '../../data/platforms.js';
import { LOCALISATION } from '../../data/global.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const PERFECT_COVER = { score: 97 }; // Milestone 37

export function createBusiness({ bus, clock, world, projects }) {
  const economy = new EconomySystem({
    bus,
    currencies: { credits: { name: 'Credits' }, tokens: { name: 'Studio Tokens' } },
    // No closure: nothing ends the studio (bible §3). The Rescue Investor comes in a later milestone.
    debt: { warnBelow: 0, limit: ECONOMY.emergencyCeiling, monthlyInterestPct: ECONOMY.monthlyInterestPct, closureMonths: Infinity, blockedWhileNegative: [] },
    now: () => clock.totalDays,
    maxLines: ECONOMY.ledgerLines, // Milestone 39: a 20-year save stays small (it was ~1 MB a year)
  });
  // Milestone 39: the month book — every game month's Credits in / out by category and its closing balance, kept as
  // lines are written, so the ledger itself can fold its old lines. months() reads it.
  let book = new Map();
  const bookLine = (l) => {
    if (l.currency !== 'credits') return;
    const m = Math.floor(l.day / clock.daysPerMonth);
    let e = book.get(m);
    if (!e) book.set(m, (e = { index: m, byCategory: {}, income: 0, costs: 0, endBalance: 0 }));
    e.byCategory[l.category] = (e.byCategory[l.category] ?? 0) + l.amount;
    if (l.amount > 0) e.income += l.amount;
    else e.costs += l.amount;
    e.endBalance = l.balance;
  };
  bus.on('economy:change', bookLine);
  const rebuildBook = () => {
    book = new Map();
    for (const l of economy.ledger) bookLine(l);
  };
  const reputation = new ReputationSystem({ bus, ranks: FAME.ranks });
  const market = new MarketSystem({
    rng: new Rng('devworks-market'),
    segments: PLATFORMS.map((p) => ({ id: p.id, name: p.name, ...SALES_BALANCE.platforms[p.id].demand })),
    rules: SALES_BALANCE.market,
    bus,
  });
  const state = { fanTrust: FAN_TRUST.start, hype: REVIEW_BALANCE.start.hype, fanExpectation: REVIEW_BALANCE.start.fanExpectation, fameCarry: 0, shipped: 0 };

  const games = () => projects.catalogue.list();
  let dist = null; // Milestone 26: the distribution system (setDistribution)
  // One day of sales for a released game: every platform it is on (a game from before Milestone 8 has one sales
  // state), added up on record.sales.
  function sellRecord(record) {
    const s = record.sales;
    if (!s.byPlatform) return sellDay(s);
    let copies = 0;
    let revenue = 0;
    for (const st of Object.values(s.byPlatform)) {
      const d = sellDay(st);
      copies += d.copies;
      revenue += d.revenue;
    }
    s.copies += copies;
    s.revenue += revenue;
    s.days++;
    return { copies, revenue };
  }
  const released = () => games().filter((r) => r.release);
  // The sales curve a game runs on (Milestone 9: its own; older games the Milestone 4 one).
  const firstCurve = (record) => (record.sales.byPlatform ? Object.values(record.sales.byPlatform)[0]?.curve : record.sales.curve) ?? SALES_BALANCE.curve;

  const platforms = createPlatformMarket(); // Milestone 8: the 12 platforms' committed curves
  // Milestone 9: campaigns, Hype and the release calendar.
  const marketing = createMarketing({ bus, clock, projects, economy, state, hypeEffect: () => world.effect?.('hypePct') ?? 0, rankIndex: () => reputation.highestRankIndex, costPct: () => world.effect?.('marketingCostPct') ?? 0 }); // Milestone 18: Crown Finance
  const franchises = createFranchises({ bus, clock, projects, marketing }); // Milestone 10

  // seed: the run's own seed for the platform market (committed, saved). Tests pass a fixed one.
  function newGame({ seed = 'devworks-run' } = {}) {
    platforms.newGame(seed);
    marketing.newGame(seed);
    franchises.newGame();
    economy.reset();
    book = new Map();
    economy.add('credits', ECONOMY.startCredits, 'Starting funds', 'start');
    if (ECONOMY.startTokens) economy.add('tokens', ECONOMY.startTokens, 'Starting tokens', 'start');
    reputation.load(null);
    Object.assign(state, { fanTrust: FAN_TRUST.start, hype: REVIEW_BALANCE.start.hype, fanExpectation: REVIEW_BALANCE.start.fanExpectation, fameCarry: 0, shipped: 0 });
    market.start();
  }

  // Money the projects spend (audio package, daily production).
  const charge = (amount, reason) => economy.spend('credits', amount, reason, 'project');

  // What releasing a game on these platforms would take (Milestone 8): each platform's buyers, fit and niche bonus,
  // its certification (days, fee, a seeded fail and its delay), the porting cost and QA overhead of every platform
  // after the first, and the launch day. Pure: the same game, platforms and day always give the same plan.
  function releasePlan(number, ids = [RELEASE.platform], day = clock.totalDays, mode = 'balanced') {
    const record = projects.catalogue.get(number);
    if (!record) return { ok: false, why: 'No such game' };
    const g = record.result;
    const P = PLATFORM_BALANCE;
    const sc = PROJECT_BALANCE.scopes[g.scope] ?? PROJECT_BALANCE.scopes.tiny;
    ids = allPlatforms().map((p) => p.id).filter((id) => ids.includes(id)); // catalogue order, no repeats (Milestone 24: your console too)
    if (!ids.length) return { ok: false, why: 'Pick at least one platform' };
    const list = ids.map((id, i) => {
      const p = platformById(id);
      const st = platforms.state(id, day);
      const f = P.friendliness[p.friendliness];
      const r = new Rng(`${g.reviewSeed}|cert|${id}`);
      const failed = !p.open && r.next() < f.failChance * (1 + (world.effect?.('certFailPct') ?? 0) / 100);
      const delay = failed ? P.failDelay.min + Math.floor(r.next() * (P.failDelay.max - P.failDelay.min + 1)) : 0;
      return {
        id,
        name: p.name,
        status: st.status,
        base: st.base,
        buyers: Math.round(st.base * P.buyerPct),
        fit: P.genreFit[g.recipe?.genre]?.[p.group] ?? 1,
        own: !!p.own, // Milestone 24: your own console
        niche: st.status === 'Declining' ? 1 + P.nicheBonusPct / 100 : 1,
        cert: p.open ? null : { days: f.certDays + delay, fee: f.certFee, failed, delay },
        port: i === 0 ? 0 : Math.round(sc.baseCostPerDay * P.portDays * f.portMult),
      };
    });
    const closed = list.find((x) => !releasable(x.status));
    const extra = ids.length - 1;
    const plan = {
      ok: !closed,
      why: closed ? `${closed.name} is ${closed.status === 'Dead' ? 'no longer sold' : 'not out yet'}` : null,
      platforms: list,
      // Milestone 16: an own engine's Portability makes porting cheaper.
      portCost: Math.round(list.reduce((t, x) => t + x.port, 0) * Math.max(0, 1 + ((g.engine?.attrs?.portability ?? 0) * ENGINE_BALANCE.portCostPctPerPortability) / 100)),
      certFees: list.reduce((t, x) => t + (x.cert?.fee ?? 0), 0),
      extraBugs: extra ? Math.max(extra, Math.round((g.bugs * P.qaBugsPct * extra) / 100)) : 0,
      certDays: Math.max(0, ...list.map((x) => x.cert?.days ?? 0)),
    };
    plan.cost = plan.portCost + plan.certFees;
    // Milestone 17: the publisher's platform (waived when it can't be released on now).
    const need = g.deal?.platform;
    if (plan.ok && need && !ids.includes(need) && releasable(platforms.state(need, day).status)) {
      plan.ok = false;
      plan.why = `${g.deal.name} wants it on ${platformById(need)?.name ?? need}`;
    }
    plan.launchDay = day + plan.certDays;
    // Milestone 26: the distribution mode — retail pressing is paid at release; Early Access has its own rules.
    plan.distribution = mode;
    plan.pressing = dist ? dist.pressingCost(record, mode) : 0;
    plan.cost += plan.pressing;
    if (plan.ok && mode === 'earlyAccess') {
      const why = dist ? dist.eaWhy(record, ids) : 'Not open';
      if (why) Object.assign(plan, { ok: false, why });
    }
    return plan;
  }

  // Release a finished game on one or more platforms (Milestone 8). Porting and certification are paid now; a game on
  // open platforms only launches today, otherwise when the slowest certification passes. Returns the record.
  function release(number, ids = [RELEASE.platform], mode = 'balanced') {
    const record = projects.catalogue.get(number);
    if (!record || record.release || record.cert || record.ea) return null;
    const plan = releasePlan(number, ids, clock.totalDays, mode);
    if (!plan.ok) return null;
    if (plan.portCost) economy.spend('credits', plan.portCost, `Porting: ${record.result.title}`, 'release');
    if (plan.certFees) economy.spend('credits', plan.certFees, `Certification: ${record.result.title}`, 'release');
    if (plan.pressing) economy.spend('credits', plan.pressing, `Pressing and shipping: ${record.result.title}`, 'release'); // Milestone 26
    if (mode === 'earlyAccess') return dist.startEA(record, plan);
    if (plan.certDays > 0) {
      record.cert = { plan, startDay: clock.totalDays, launchDay: plan.launchDay };
      bus.emit('game:certifying', { record });
      return record;
    }
    return launch(record, plan);
  }

  // The game goes on sale: reviews (from its locked seed, seeing any QA overhead bugs), Fame, Fan Trust, and sales on
  // every platform from tomorrow.
  function launch(record, plan) {
    const g = record.result;
    // Milestone 9: the game's Hype is frozen now and sets what the fans expect.
    const hype = marketing.launch(record.jobId);
    const fanExpectation = fanExpectationFor(hype);
    const clash = marketing.clashFor(g.recipe?.genre, clock.totalDays);
    const fr = franchises.effectFor(record); // Milestone 10: fatigue and fans
    const review = reviewGame({ ...g, bugs: g.bugs + plan.extraBugs }, { fanExpectation, fatiguePenalty: fr?.reviewPenalty ?? 0 });
    const sc0 = PROJECT_BALANCE.scopes[g.scope] ?? PROJECT_BALANCE.scopes.tiny; // Milestone 7: price and reach by scope
    const sc = { ...sc0, price: Math.round(sc0.price * typeOf(g.type).priceMult) }; // Milestone 10: a Remaster sells cheaper
    const ids = plan.platforms.map((x) => x.id);
    delete record.cert;
    record.release = {
      day: clock.totalDays,
      platform: ids[0],
      platforms: ids,
      price: sc.price,
      model: 'selfDigital',
      reviews: review.outlets,
      score: review.score,
      fanExpectation,
      hype,
      franchise: fr ? { ipId: g.ipId, fatigue: fr.fatigue, fanbase: fr.fanbase, salesMult: fr.salesMult, reviewPenalty: fr.reviewPenalty, relief: fr.relief } : null,
      clash: clash ? { title: clash.competitor.title, studio: clash.competitor.studio, big: clash.competitor.big, pct: clash.pct } : null,
      qaBugs: plan.extraBugs,
      cost: plan.cost,
      certFailed: plan.platforms.filter((x) => x.cert?.failed).map((x) => x.id),
    };
    const byPlatform = {};
    const locMult = g.localised ? 1 + (LOCALISATION.salesPct + (world.effect?.('localisedSalesPct') ?? 0)) / 100 : 1; // Milestone 21
    const reach = g.deal ? (g.deal.globalReach && !g.localised ? Math.min(g.deal.salesPct ?? 0, LOCALISATION.reachCapPct) : g.deal.salesPct ?? 0) : 0;
    record.release.localisation = { localised: g.localised ?? null, salesMult: +locMult.toFixed(4), reachPct: reach, capped: !!(g.deal?.globalReach && !g.localised && (g.deal.salesPct ?? 0) > reach) };
    // Milestone 26: the distribution mode (Balanced changes nothing); a game coming out of Early Access has fewer buyers left.
    const fx = dist ? dist.effectsNow(plan.distribution ?? 'balanced') : null;
    const distMult = (fx?.salesMult ?? 1) * (plan.fromEA ? dist.EA.fullLaunchPct / 100 : 1);
    record.release.distribution = fx ? { mode: fx.mode, physicalPct: fx.physicalPct, salesMult: +distMult.toFixed(4), digitalFrac: fx.digitalFrac, netMult: fx.netMult, pressing: plan.pressing ?? 0 } : null;
    const cfx = g.comboFx ?? {}; // Milestone 15
    const audiencePct = (id) => {
      const grp = platformOf(id)?.group;
      return (AUDIENCE_GROUPS.casual.includes(grp) ? cfx.casualPct ?? 0 : 0) + (AUDIENCE_GROUPS.core.includes(grp) ? cfx.corePct ?? 0 : 0);
    };
    for (const x of plan.platforms) {
      byPlatform[x.id] = startSales({ tailPct: cfx.tailPct ?? 0, score: review.score, fit: g.outputs.audienceFit, trust: state.fanTrust, demand: market.demand(x.id), platform: x.id, reviewSeed: x === plan.platforms[0] ? g.reviewSeed : `${g.reviewSeed}|${x.id}`, day: clock.totalDays, salesMult: sc.salesMult * x.fit * x.niche * (fr?.salesMult ?? 1) * (1 + (world.effect?.('launchSalesPct') ?? 0) / 100) * (1 + audiencePct(x.id) / 100) * (1 + (g.deal && (!g.deal.pcOnly || x.id === 'P01') ? reach : 0) / 100) * locMult * distMult, price: sc.price, audience: x.buyers, hype, clash });
      if (fx && !dist.isNeutral(fx)) {
        byPlatform[x.id].curve = dist.shapeCurve(byPlatform[x.id].curve, fx.curve);
        if (fx.netMult !== 1) byPlatform[x.id].netMult = fx.netMult;
      }
    }
    record.sales = { byPlatform, platform: ids[0], releasedDay: clock.totalDays, lifetime: +Object.values(byPlatform).reduce((t, s) => t + s.lifetime, 0).toFixed(3), copies: 0, revenue: 0, days: 0 };
    state.shipped++;
    const trust = launchTrust({ score: review.score, fanExpectation, hype, bugs: g.bugs + plan.extraBugs });
    if (cfx.trust) trust.total = +(trust.total + cfx.trust).toFixed(4), (trust.combo = cfx.trust); // Milestone 15
    record.release.trust = trust;
    const gain = trust.total > 0 ? trust.total * (1 + (world.effect?.('fanTrustGainPct') ?? 0) / 100) : trust.total; // Community Room
    state.fanTrust = +clamp(state.fanTrust + gain, 0, 100).toFixed(2);
    franchises.launched(record, fr);
    // Milestone 37: a perfect launch — reviewed 97+ with no bugs — earns the Perfect Game cover family (cover_30).
    if (record.release.score >= PERFECT_COVER.score && (record.result.bugs ?? 0) === 0 && !record.result.projectOne) Object.assign(record.result, { cover: 'cover_30', coverFamily: 'cover_30', coverOverride: 'perfect' });
    bus.emit('game:released', { record }); // first, so the reviews are shown before any rank-up they bring
    reputation.add(Math.max(0, review.score * FAME.release.perPoint - FAME.release.minus), `Released ${g.title}`);
    return record;
  }

  // Milestone 20: a Port. Returns { ok, why, launchDay, cost }.
  function addPlatform(number, id) {
    const record = projects.catalogue.get(number);
    const on = record?.release?.platforms ?? (record?.release ? [record.release.platform] : []);
    if (!record?.release || on.includes(id) || (record.pendingPorts ?? []).some((x) => x.id === id)) return { ok: false, why: 'Not possible' };
    const plan = releasePlan(number, [on[0], id]);
    const x = plan.platforms?.find((p) => p.id === id);
    if (!x || !releasable(x.status)) return { ok: false, why: `${platformById(id)?.name ?? id} isn't on sale` };
    const cost = x.port + (x.cert?.fee ?? 0);
    if (cost) economy.spend('credits', cost, `Port: ${record.result.title} to ${x.name}`, 'release');
    const launchDay = clock.totalDays + (x.cert?.days ?? 0);
    (record.pendingPorts ||= []).push({ id, launchDay, buyers: x.buyers, fit: x.fit, niche: x.niche });
    return { ok: true, launchDay, cost };
  }
  function launchPorts() {
    for (const record of released()) {
      for (const p of [...(record.pendingPorts ?? [])]) {
        if (clock.totalDays < p.launchDay) continue;
        record.pendingPorts = record.pendingPorts.filter((x) => x !== p);
        const g = record.result;
        const sc = PROJECT_BALANCE.scopes[g.scope] ?? PROJECT_BALANCE.scopes.tiny;
        record.sales.byPlatform ||= {};
        record.sales.byPlatform[p.id] = startSales({ score: record.release.score, fit: g.outputs.audienceFit, trust: state.fanTrust, demand: market.demand(p.id), platform: p.id, reviewSeed: `${g.reviewSeed}|port|${p.id}`, day: clock.totalDays, salesMult: sc.salesMult * p.fit * p.niche, price: record.release.price, audience: p.buyers, hype: 0, clash: null });
        record.release.platforms = [...(record.release.platforms ?? [record.release.platform]), p.id];
        bus.emit('game:ported', { record, platform: p.id });
      }
    }
  }

  bus.on('clock:day', () => {
    marketing.daily();
    launchPorts(); // Milestone 20 // Milestone 9: Hype fades and campaigns add theirs, before anything launches today
    // Certified games launch (Milestone 8).
    for (const record of games()) if (record.cert && clock.totalDays >= record.cert.launchDay) launch(record, record.cert.plan);
    for (const record of released()) {
      const { copies, revenue } = sellRecord(record);
      if (!copies) continue;
      economy.add('credits', revenue, `Sales: ${record.result.title}`, 'sales');
      state.fameCarry += copies / FAME.copiesPerFame;
      const whole = Math.floor(state.fameCarry);
      if (whole > 0) {
        state.fameCarry = +(state.fameCarry - whole).toFixed(6);
        reputation.add(whole, 'Copies sold', { quiet: true });
      }
      bus.emit('sales:day', { record, copies, revenue });
    }
  });

  bus.on('clock:month', () => {
    economy.monthEnd(); // Emergency Credit interest on anything owed
    const pay = world.staffSystem.staff.reduce((t, s) => t + s.salary, 0);
    if (pay) economy.spend('credits', pay, `Salaries (${world.staffSystem.staff.length} staff)`, 'salaries');
    // Milestone 10: the back catalogue.
    for (const { record, copies, revenue } of franchises.month()) {
      if (revenue) economy.add('credits', revenue, `Back catalogue: ${record.result.title}`, 'catalogue');
      state.fameCarry += copies / FAME.copiesPerFame;
      bus.emit('catalogue:month', { record, copies, revenue });
    }
    const whole = Math.floor(state.fameCarry);
    if (whole > 0) {
      state.fameCarry = +(state.fameCarry - whole).toFixed(6);
      reputation.add(whole, 'Copies sold', { quiet: true });
    }
    market.rollMonth();
  });

  // Speed unlocks (bible §4): is this speed open yet? And the one-line reason when it is not.
  function speedOpen(speed) {
    const rule = SPEED_UNLOCKS[speed];
    if (!rule) return true;
    if (rule.shipped && state.shipped >= rule.shipped) return true;
    if (rule.rank && reputation.highestRankIndex >= rankIndexOf(FAME.ranks, rule.rank)) return true;
    if (rule.year && clock.year >= rule.year) return true;
    return false;
  }
  function speedLockReason(speed) {
    const rule = SPEED_UNLOCKS[speed];
    if (!rule || speedOpen(speed)) return null;
    if (rule.shipped) return `${speed}× opens after your first released game.`;
    return `${speed}× opens at Rank ${rule.rank} or in Year ${rule.year}.`;
  }

  return {
    economy,
    speedOpen,
    speedLockReason,
    reputation,
    market,
    state,
    charge,
    release,
    launchNow: (record, plan) => launch(record, plan), // Milestone 26: Early Access full launch
    setDistribution: (d) => (dist = d),
    get distribution() {
      return dist;
    },
    newGame,
    get credits() {
      return economy.balance('credits');
    },
    get tokens() {
      return economy.balance('tokens');
    },
    get rank() {
      return reputation.ranks[reputation.highestRankIndex];
    },
    get fame() {
      return reputation.value;
    },
    get inDebt() {
      return economy.inDebt;
    },
    platforms,
    marketing,
    franchises,
    releasePlan,
    addPlatform, // Milestone 20
    unreleased: () => games().filter((r) => !r.release && !r.cert),
    certifying: () => games().filter((r) => r.cert),
    released,
    statusOf: (record) => (record.cert ? 'Certifying' : record.ea && !record.release ? 'Early Access' : !record.release ? 'Not released' : statusOn(Math.max(0, record.sales.days - 1), SALES_BALANCE, firstCurve(record))),

    // Ledger by game month (month 1 = days 0–27): { month, year, lines, byCategory, income, costs, net, endBalance }.
    months() {
      return [...book.values()].sort((a, b) => b.index - a.index).map((e) => ({ ...e, byCategory: { ...e.byCategory }, net: e.income + e.costs, year: Math.floor(e.index / clock.monthsPerYear) + 1, month: (e.index % clock.monthsPerYear) + 1 }));
    },

    serialize: () => ({ monthBook: [...book.values()], economy: economy.serialize(), reputation: reputation.serialize(), market: market.serialize(), platforms: platforms.serialize(), marketing: marketing.serialize(), franchises: franchises.serialize(), state: { ...state } }),
    load(data) {
      if (!data) {
        newGame(); // a save from before Milestone 4: start the books now
        franchises.load(null); // and its games' franchises
        return;
      }
      economy.load(data.economy);
      // Milestone 39: the month book (a save from before it: rebuilt from its full ledger), then the ledger folds.
      if (Array.isArray(data.monthBook)) book = new Map(data.monthBook.map((e) => [e.index, JSON.parse(JSON.stringify(e))]));
      else rebuildBook();
      if (economy.ledger.length > economy.maxLines) economy._fold();
      reputation.load(data.reputation);
      if (!market.load(data.market)) market.start();
      // A market saved before Milestone 8 knows only P01: the new platforms start mid-range.
      for (const sg of market.segments) {
        if (market.base[sg.id] == null) market.base[sg.id] = Math.round((sg.min + sg.max) / 2);
        if (market.demandNow[sg.id] == null) market.demandNow[sg.id] = market.base[sg.id];
      }
      platforms.load(data.platforms);
      marketing.load(data.marketing);
      franchises.load(data.franchises); // a save from before Milestone 10: rebuilt from the catalogue
      Object.assign(state, data.state);
    },
  };
}
