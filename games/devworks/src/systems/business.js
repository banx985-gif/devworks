// The studio as a business (Milestone 4): Credits (core EconomySystem: one ledger line for every change, debt as
// Emergency Credit), salaries every month, project costs every day, releasing a finished game (reviews, then sales
// every day), Fame and rank (core ReputationSystem: the rank never drops), Fan Trust, and OpenDesk's audience
// (core MarketSystem, one segment per platform, rolled each month). Every number is in data/balance.js.
//
// Day order is fixed, so the same save and choices always give the same result: the studio settles Energy and
// breaks, projects work (and pay their cost), then released games sell. Month ends: interest on any debt, then
// salaries.
//
// Events: 'game:released' { record }, 'sales:day' { record, copies, revenue } (per game with sales that day),
// plus core's 'economy:change' / 'economy:debt' / 'reputation:change' / 'reputation:rankUp'.
import { EconomySystem } from '../../../../core/EconomySystem.js';
import { ReputationSystem } from '../../../../core/ReputationSystem.js';
import { MarketSystem } from '../../../../core/MarketSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { ECONOMY, RELEASE, REVIEW_BALANCE, SALES_BALANCE, FAME, FAN_TRUST, SPEED_UNLOCKS } from '../../data/balance.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { PLATFORMS } from '../../data/platforms.js';
import { reviewGame } from './reviews.js';
import { startSales, sellDay, statusOn } from './sales.js';

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
  const released = () => games().filter((r) => r.release);

  function newGame() {
    economy.reset();
    economy.add('credits', ECONOMY.startCredits, 'Starting funds', 'start');
    if (ECONOMY.startTokens) economy.add('tokens', ECONOMY.startTokens, 'Starting tokens', 'start');
    reputation.load(null);
    Object.assign(state, { fanTrust: FAN_TRUST.start, hype: REVIEW_BALANCE.start.hype, fanExpectation: REVIEW_BALANCE.start.fanExpectation, fameCarry: 0, shipped: 0 });
    market.start();
  }

  // Money the projects spend (audio package, daily production).
  const charge = (amount, reason) => economy.spend('credits', amount, reason, 'project');

  // Release a finished game: reviews (from its locked seed), Fame, Fan Trust, then it goes on sale tomorrow.
  function release(number) {
    const record = projects.catalogue.get(number);
    if (!record || record.release) return null;
    const g = record.result;
    const review = reviewGame(g, { fanExpectation: state.fanExpectation });
    record.release = {
      day: clock.totalDays,
      platform: RELEASE.platform,
      price: RELEASE.price,
      model: 'selfDigital',
      reviews: review.outlets,
      score: review.score,
      fanExpectation: state.fanExpectation,
    };
    record.sales = startSales({ score: review.score, fit: g.outputs.audienceFit, trust: state.fanTrust, demand: market.demand(RELEASE.platform), platform: RELEASE.platform, reviewSeed: g.reviewSeed, day: clock.totalDays });
    state.shipped++;
    state.fanTrust = +clamp(state.fanTrust + (review.score - FAN_TRUST.pivot) * FAN_TRUST.perPoint, 0, 100).toFixed(2);
    bus.emit('game:released', { record }); // first, so the reviews are shown before any rank-up they bring
    reputation.add(Math.max(0, review.score * FAME.release.perPoint - FAME.release.minus), `Released ${g.title}`);
    return record;
  }

  bus.on('clock:day', () => {
    for (const record of released()) {
      const { copies, revenue } = sellDay(record.sales);
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
    unreleased: () => games().filter((r) => !r.release),
    released,
    statusOf: (record) => (!record.release ? 'Not released' : statusOn(Math.max(0, record.sales.days - 1))),

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

    serialize: () => ({ economy: economy.serialize(), reputation: reputation.serialize(), market: market.serialize(), state: { ...state } }),
    load(data) {
      if (!data) {
        newGame(); // a save from before Milestone 4: start the books now
        return;
      }
      economy.load(data.economy);
      reputation.load(data.reputation);
      if (!market.load(data.market)) market.start();
      Object.assign(state, data.state);
    },
  };
}
