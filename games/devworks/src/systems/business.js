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
// Events: 'game:certifying' { record }, 'game:released' { record }, 'sales:day' { record, copies, revenue } (per game with sales that day),
// plus core's 'economy:change' / 'economy:debt' / 'reputation:change' / 'reputation:rankUp'.
import { EconomySystem } from '../../../../core/EconomySystem.js';
import { ReputationSystem } from '../../../../core/ReputationSystem.js';
import { MarketSystem } from '../../../../core/MarketSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { PROJECT_BALANCE, ECONOMY, RELEASE, REVIEW_BALANCE, SALES_BALANCE, FAME, FAN_TRUST, SPEED_UNLOCKS } from '../../data/balance.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { PLATFORMS, platformById } from '../../data/platforms.js';
import { PLATFORM_BALANCE } from '../../data/balance.js';
import { createPlatformMarket, releasable } from './platformMarket.js';
import { reviewGame } from './reviews.js';
import { startSales, sellDay, statusOn } from './sales.js';
import { createMarketing, launchTrust, fanExpectationFor } from './marketing.js';
import { createFranchises, typeOf } from './franchises.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createBusiness({ bus, clock, world, projects }) {
  const economy = new EconomySystem({
    bus,
    currencies: { credits: { name: 'Credits' }, tokens: { name: 'Studio Tokens' } },
    // No closure: nothing ends the studio (bible §3). The Rescue Investor comes in a later milestone.
    debt: { warnBelow: 0, limit: ECONOMY.emergencyCeiling, monthlyInterestPct: ECONOMY.monthlyInterestPct, closureMonths: Infinity, blockedWhileNegative: [] },
    now: () => clock.totalDays,
  });
  const reputation = new ReputationSystem({ bus, ranks: FAME.ranks });
  const market = new MarketSystem({
    rng: new Rng('devworks-market'),
    segments: PLATFORMS.map((p) => ({ id: p.id, name: p.name, ...SALES_BALANCE.platforms[p.id].demand })),
    rules: SALES_BALANCE.market,
    bus,
  });
  const state = { fanTrust: FAN_TRUST.start, hype: REVIEW_BALANCE.start.hype, fanExpectation: REVIEW_BALANCE.start.fanExpectation, fameCarry: 0, shipped: 0 };

  const games = () => projects.catalogue.list();
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
  const marketing = createMarketing({ bus, clock, projects, economy, state, hypeEffect: () => world.effect?.('hypePct') ?? 0, rankIndex: () => reputation.highestRankIndex });
  const franchises = createFranchises({ bus, clock, projects, marketing }); // Milestone 10

  // seed: the run's own seed for the platform market (committed, saved). Tests pass a fixed one.
  function newGame({ seed = 'devworks-run' } = {}) {
    platforms.newGame(seed);
    marketing.newGame(seed);
    franchises.newGame();
    economy.reset();
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
  function releasePlan(number, ids = [RELEASE.platform], day = clock.totalDays) {
    const record = projects.catalogue.get(number);
    if (!record) return { ok: false, why: 'No such game' };
    const g = record.result;
    const P = PLATFORM_BALANCE;
    const sc = PROJECT_BALANCE.scopes[g.scope] ?? PROJECT_BALANCE.scopes.tiny;
    ids = PLATFORMS.map((p) => p.id).filter((id) => ids.includes(id)); // catalogue order, no repeats
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
      portCost: list.reduce((t, x) => t + x.port, 0),
      certFees: list.reduce((t, x) => t + (x.cert?.fee ?? 0), 0),
      extraBugs: extra ? Math.max(extra, Math.round((g.bugs * P.qaBugsPct * extra) / 100)) : 0,
      certDays: Math.max(0, ...list.map((x) => x.cert?.days ?? 0)),
    };
    plan.cost = plan.portCost + plan.certFees;
    plan.launchDay = day + plan.certDays;
    return plan;
  }

  // Release a finished game on one or more platforms (Milestone 8). Porting and certification are paid now; a game on
  // open platforms only launches today, otherwise when the slowest certification passes. Returns the record.
  function release(number, ids = [RELEASE.platform]) {
    const record = projects.catalogue.get(number);
    if (!record || record.release || record.cert) return null;
    const plan = releasePlan(number, ids);
    if (!plan.ok) return null;
    if (plan.portCost) economy.spend('credits', plan.portCost, `Porting: ${record.result.title}`, 'release');
    if (plan.certFees) economy.spend('credits', plan.certFees, `Certification: ${record.result.title}`, 'release');
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
    for (const x of plan.platforms) {
      byPlatform[x.id] = startSales({ score: review.score, fit: g.outputs.audienceFit, trust: state.fanTrust, demand: market.demand(x.id), platform: x.id, reviewSeed: x === plan.platforms[0] ? g.reviewSeed : `${g.reviewSeed}|${x.id}`, day: clock.totalDays, salesMult: sc.salesMult * x.fit * x.niche * (fr?.salesMult ?? 1) * (1 + (world.effect?.('launchSalesPct') ?? 0) / 100), price: sc.price, audience: x.buyers, hype, clash });
    }
    record.sales = { byPlatform, platform: ids[0], releasedDay: clock.totalDays, lifetime: +Object.values(byPlatform).reduce((t, s) => t + s.lifetime, 0).toFixed(3), copies: 0, revenue: 0, days: 0 };
    state.shipped++;
    const trust = launchTrust({ score: review.score, fanExpectation, hype, bugs: g.bugs + plan.extraBugs });
    record.release.trust = trust;
    const gain = trust.total > 0 ? trust.total * (1 + (world.effect?.('fanTrustGainPct') ?? 0) / 100) : trust.total; // Community Room
    state.fanTrust = +clamp(state.fanTrust + gain, 0, 100).toFixed(2);
    franchises.launched(record, fr);
    bus.emit('game:released', { record }); // first, so the reviews are shown before any rank-up they bring
    reputation.add(Math.max(0, review.score * FAME.release.perPoint - FAME.release.minus), `Released ${g.title}`);
    return record;
  }

  bus.on('clock:day', () => {
    marketing.daily(); // Milestone 9: Hype fades and campaigns add theirs, before anything launches today
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
    unreleased: () => games().filter((r) => !r.release && !r.cert),
    certifying: () => games().filter((r) => r.cert),
    released,
    statusOf: (record) => (record.cert ? 'Certifying' : !record.release ? 'Not released' : statusOn(Math.max(0, record.sales.days - 1), SALES_BALANCE, firstCurve(record))),

    // Ledger by game month (month 1 = days 0–27): { month, year, lines, byCategory, income, costs, net, endBalance }.
    months(daysPerMonth = clock.daysPerMonth) {
      const out = new Map();
      for (const l of economy.ledger) {
        if (l.currency !== 'credits') continue;
        const m = Math.floor(l.day / daysPerMonth);
        const e = out.get(m) ?? { index: m, byCategory: {}, income: 0, costs: 0, endBalance: 0 };
        e.byCategory[l.category] = (e.byCategory[l.category] ?? 0) + l.amount;
        if (l.amount > 0) e.income += l.amount;
        else e.costs += l.amount;
        e.endBalance = l.balance;
        out.set(m, e);
      }
      return [...out.values()].sort((a, b) => b.index - a.index).map((e) => ({ ...e, net: e.income + e.costs, year: Math.floor(e.index / clock.monthsPerYear) + 1, month: (e.index % clock.monthsPerYear) + 1 }));
    },

    serialize: () => ({ economy: economy.serialize(), reputation: reputation.serialize(), market: market.serialize(), platforms: platforms.serialize(), marketing: marketing.serialize(), franchises: franchises.serialize(), state: { ...state } }),
    load(data) {
      if (!data) {
        newGame(); // a save from before Milestone 4: start the books now
        franchises.load(null); // and its games' franchises
        return;
      }
      economy.load(data.economy);
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
