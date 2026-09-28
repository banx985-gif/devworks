// Console launch and market (Milestone 24, bible §32 / §34). Saved with the studio. Every number is in data/consoles.js.
//
// From a prototype that passed validation (Milestone 23), a launch plan: form (home / handheld), launch price, monthly
// manufacturing, dev-kit policy, royalty rate, launch marketing and launch titles (your games in development). Launch
// pays the marketing and makes the first month's consoles; the console then joins the platform market as a platform
// (id OWN1): your games — and any Port — can release on it, and they sell to its install base like any platform.
//
// Each month end, in a fixed order: manufacture (money permitting), sell (demand from value, library, marketing,
// reliability, timing; limited by stock), store what is left, maybe a defect wave (seeded), third-party interest moves
// towards its target (bounded), new third-party games and their royalties and dev-kit fees, a snapshot, the failure
// reasons that hold, and at month 12 the verdict. Recovery actions change the plan or buy help.
//
// Safety (the Milestone 4 rule): console spending never takes the studio within CONSOLE.safety.margin of the Emergency
// Credit line — manufacturing is cut back (and says so) and the other costs are paid only as far as that allows — so a
// flop can never lock the save. Money goes on the ledger as "hardware".
//
// Events: 'console:launched' { console }, 'console:defects' { console, cost }, 'console:verdict' { console, verdict }.
import { Rng } from '../../../../core/Rng.js';
import { registerPlatform, unregisterPlatform, PLATFORMS } from '../../data/platforms.js';
import { releasable } from './platformMarket.js';
import { CONSOLE as K, recoveryById } from '../../data/consoles.js';
import { ECONOMY } from '../../data/balance.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r2 = (x) => +x.toFixed(2);

// Pure pieces (tested).
export const fairPriceOf = (ratings) => Math.round(K.fairPrice.base + K.fairPrice.perPerformance * ratings.performance + K.fairPrice.perAppeal * ratings.launchAppeal);
export const defectPctOf = (reliability, certLabPct = 0) => r2(Math.max(0, (100 - reliability) * K.defects.perPoint * (1 + certLabPct / 100)));
export function unitCostOf(ratings, production, revisedPct = 0) {
  const doublings = production > 1000 ? Math.log2(production / 1000) : 0;
  const volume = Math.min(K.volumeMax, K.volumePct * doublings);
  return r2(ratings.unitCost * K.unitCostMult * (1 - volume / 100) * (1 + revisedPct / 100));
}
export function valueOf(ratings, price) {
  return clamp((ratings.launchAppeal / 60) * Math.pow(fairPriceOf(ratings) / price, K.market.valueExp), K.market.valueMin, K.market.valueMax);
}

export function createConsoles({ bus, clock, world, business, projects, hardware, engines = () => null, studioName = () => 'Studio', seed = () => 'devworks-run' }) {
  const today = () => clock.totalDays;
  const month = () => Math.floor(today() / clock.daysPerMonth);
  const eco = () => business.economy;
  let consoles = []; // at most one (Gen 1) for now
  let plan = null; // the launch plan being made: { prototypeId, form, price, production, devKit, royalty, marketing, launchTitles: [jobId] }
  let rng = new Rng('devworks-consoles');

  // --- money that never passes the safety line --------------------------------------------------------------------
  const room = () => Math.max(0, business.credits - (ECONOMY.emergencyCeiling + K.safety.margin));
  function spendSafe(c, amount, reason) {
    amount = Math.round(amount);
    const pay = Math.max(0, Math.min(amount, room()));
    if (pay > 0) eco().spend('credits', pay, reason, 'hardware');
    c.costs += pay;
    return pay;
  }
  function earn(c, amount, reason, key) {
    amount = Math.round(amount);
    if (amount <= 0) return 0;
    eco().add('credits', amount, reason, 'hardware');
    c.income += amount;
    c.incomeBy[key] = (c.incomeBy[key] ?? 0) + amount;
    return amount;
  }

  // --- the platform ------------------------------------------------------------------------------------------------
  const own = () => consoles.find((c) => c.status !== 'retired') ?? null;
  function platformDef(c) {
    const f = K.forms[c.form];
    return { id: c.platformId, name: c.name, holder: studioName(), era: { from: Math.floor(c.launchDay / (clock.daysPerMonth * clock.monthsPerYear)) + 1, to: null }, audienceLabel: f.name, group: f.group, friendliness: 'Very High', identity: `Your own ${f.name.toLowerCase()}`, art: f.art, open: true, own: true };
  }
  function statusOf(c, day = today()) {
    if (!c || day < c.launchDay) return 'Upcoming';
    if (c.status === 'retired') return 'Dead';
    const months = c.history.length;
    if (months < K.growingMonths) return 'Growing';
    const best = Math.max(...c.history.map((h) => h.sold));
    return (c.history.at(-1)?.sold ?? 0) >= (best * K.peakPct) / 100 ? 'Peak' : 'Declining';
  }
  business.platforms.setCustom?.({
    has: (id) => consoles.some((c) => c.platformId === id),
    state: (id, day) => {
      const c = consoles.find((x) => x.platformId === id);
      return { base: c ? c.installBase : 0, status: statusOf(c, day), u: 0 };
    },
  });
  const register = () => {
    for (const c of consoles) registerPlatform(platformDef(c));
  };

  // --- the plan -----------------------------------------------------------------------------------------------------
  const validPrototypes = () => hardware.prototypes.filter((p) => p.validation.passed);
  function launchWhy() {
    if (own()) return 'Your console is already on sale (new generations come later)';
    if (!validPrototypes().length) return 'Needs a prototype that passed validation (Create → Hardware)';
    return null;
  }
  function ensurePlan() {
    if (launchWhy() && !own()) return null;
    if (!plan || !hardware.prototypes.some((p) => p.id === plan.prototypeId && p.validation.passed)) {
      const p = validPrototypes().at(-1);
      if (!p) return null;
      plan = { prototypeId: p.id, form: 'home', price: K.priceSteps[3], production: K.productionSteps[3], devKit: 'standard', royalty: K.royaltySteps[2], marketing: 'standard', launchTitles: [] };
    }
    return plan;
  }
  const protoOf = (id) => hardware.prototypes.find((p) => p.id === id) ?? null;
  // Step a plan setting (or a launched console's price / production): key, dir ±1 (or a value for devKit / marketing /
  // form / prototypeId).
  function setPlan(key, v) {
    const p = ensurePlan();
    if (!p) return false;
    const step = (list, cur, d) => list[clamp(list.indexOf(cur) + d, 0, list.length - 1)];
    if (key === 'price') p.price = step(K.priceSteps, p.price, v);
    else if (key === 'production') p.production = step(K.productionSteps, p.production, v);
    else if (key === 'royalty') p.royalty = step(K.royaltySteps, p.royalty, v);
    else if (key === 'devKit' && K.devKits[v]) p.devKit = v;
    else if (key === 'marketing' && K.marketing[v]) p.marketing = v;
    else if (key === 'form' && K.forms[v]) p.form = v;
    else if (key === 'prototypeId' && validPrototypes().some((x) => x.id === v)) p.prototypeId = v;
    else if (key === 'launchTitle') p.launchTitles = p.launchTitles.includes(v) ? p.launchTitles.filter((x) => x !== v) : [...p.launchTitles, v];
    else return false;
    return true;
  }
  // What the plan would do: { unitCost, fairPrice, value, marketingCost, firstBatchCost, defectPct }.
  function planPreview() {
    const p = ensurePlan();
    const proto = p && protoOf(p.prototypeId);
    if (!proto) return null;
    const unitCost = unitCostOf(proto.ratings, p.production);
    return { plan: p, prototype: proto, unitCost, fairPrice: fairPriceOf(proto.ratings), value: r2(valueOf(proto.ratings, p.price)), margin: r2(p.price - unitCost), marketingCost: K.marketing[p.marketing].cost, firstBatchCost: Math.round(unitCost * p.production), defectPct: defectPctOf(proto.ratings.reliability, world.effect?.('certFailPct') ?? 0) };
  }

  // --- launch -------------------------------------------------------------------------------------------------------
  function launch() {
    const why = launchWhy();
    if (why) return { ok: false, why };
    const pv = planPreview();
    if (!pv) return { ok: false, why: 'No plan' };
    const p = pv.plan;
    const proto = pv.prototype;
    const c = {
      id: `C${consoles.length + 1}`,
      platformId: K.platformId,
      name: proto.family,
      gen: 1,
      prototypeId: proto.id,
      parts: { ...proto.parts },
      ratings: { ...proto.ratings },
      form: p.form,
      price: p.price,
      production: p.production,
      devKit: p.devKit,
      royalty: p.royalty,
      marketing: p.marketing,
      launchTitles: [...p.launchTitles],
      launchDay: today(),
      launchMonth: month(),
      status: 'launched',
      installBase: 0,
      sold: 0,
      stock: 0,
      made: 0,
      interest: 0,
      thirdParty: [], // { month, count } — games still selling
      thirdPartyTotal: 0,
      exclusives: 0,
      carry: 0,
      bonus: { reliability: 0, devFriendly: 0, unitCostPct: 0, adoptionPct: 0, adoptionMonths: 0 },
      used: {}, // recovery id → month last used
      history: [], // { month, sold, installBase, stock, income, costs, interest, thirdParty }
      income: 0,
      incomeBy: {},
      costs: 0,
      defectWaves: 0,
      reasons: [],
      verdict: null,
      notes: [],
    };
    consoles.push(c);
    registerPlatform(platformDef(c));
    spendSafe(c, K.marketing[c.marketing].cost, `Console marketing: ${c.name}`);
    manufacture(c);
    plan = null;
    bus.emit('console:launched', { console: c });
    return { ok: true, console: c };
  }

  // --- the month --------------------------------------------------------------------------------------------------
  const ratingsNow = (c) => ({ ...c.ratings, reliability: clamp(c.ratings.reliability + c.bonus.reliability, 0, 100), devFriendly: clamp(c.ratings.devFriendly + c.bonus.devFriendly, 0, 100) });
  const defectPct = (c) => defectPctOf(ratingsNow(c).reliability, world.effect?.('certFailPct') ?? 0);
  function manufacture(c) {
    if (!c.production) return 0;
    const unit = unitCostOf(c.ratings, c.production, c.bonus.unitCostPct);
    const units = Math.min(c.production, Math.floor(room() / unit));
    if (units < c.production) c.notes.push({ month: month(), text: units ? `Only ${units.toLocaleString('en-GB')} consoles made: not enough Credits` : 'Manufacturing paused: not enough Credits' });
    if (units > 0) spendSafe(c, units * unit, `Manufacturing: ${units.toLocaleString('en-GB')} × ${c.name}`);
    c.stock += units;
    c.made += units;
    return units;
  }
  const monthsOut = (c) => month() - c.launchMonth;
  // Your games on it (launch titles released in the first 3 months count twice).
  function firstParty(c) {
    let n = 0;
    for (const r of projects.catalogue.list()) {
      const on = r.release?.platforms ?? [];
      if (!on.includes(c.platformId)) continue;
      n += c.launchTitles.includes(r.jobId) && r.release.day - c.launchDay <= 3 * clock.daysPerMonth ? 2 : 1;
    }
    return n;
  }
  const thirdPartyCount = (c) => c.thirdParty.reduce((t, g) => t + g.count, 0) + c.exclusives;
  // Rival platforms that launched in the last year (bad timing).
  const rivalLaunches = () => PLATFORMS.filter((p) => {
    const st = business.platforms.state(p.id, today());
    const then = business.platforms.state(p.id, Math.max(0, today() - clock.daysPerMonth * clock.monthsPerYear));
    return releasable(st.status) && then.status === 'Upcoming';
  }).length;
  function demandOf(c) {
    const r = ratingsNow(c);
    const M = K.market;
    const market = M.size * (0.5 + r.launchAppeal / 100) * (M.reach[c.form] ?? 1);
    const value = valueOf(r, c.price);
    const library = Math.min(M.libMax, M.libBase + M.perFirstParty * firstParty(c) + M.perThirdParty * thirdPartyCount(c));
    const mkt = K.marketing[c.marketing].mult * (c.bonus.adoptionMonths > 0 ? 1 + c.bonus.adoptionPct / 100 : 1);
    const rel = Math.max(0.5, 1 - (defectPct(c) / 100) * M.defectAdoption);
    const timing = 1 - Math.min(M.timingMax, M.timingPct * rivalLaunches()) / 100;
    const adoption = M.adoption * value * library * mkt * rel * timing;
    const exact = Math.max(0, market - c.installBase) * adoption + c.carry;
    return { market, value, library, mkt, rel, timing, adoption, exact };
  }
  function thirdPartyTarget(c) {
    const T = K.thirdParty;
    const r = ratingsNow(c);
    const t = T.installWeight * Math.min(100, c.installBase / T.installPer) + T.devWeight * r.devFriendly + T.royaltyWeight * clamp(((30 - c.royalty) / 25) * 100, 0, 100) + T.toolsWeight * (engines()?.engines?.length ? 100 : 40) + T.prestigeWeight * business.reputation.highestRankIndex * 20 + K.devKits[c.devKit].interest + (world.effect?.('thirdPartyPct') ?? 0);
    return clamp(t, 0, 100);
  }
  function reasonsFor(c, d) {
    const R = K.reasons;
    const r = ratingsNow(c);
    const fair = fairPriceOf(r);
    const out = [];
    if (c.price > fair * (1 + R.priceOverPct / 100)) out.push({ id: 'price', text: `Bad price: ${c.price} Credits for a console players think is worth about ${fair}` });
    if (monthsOut(c) >= 1 && monthsOut(c) <= R.lineupMonths && firstParty(c) < R.lineupMin) out.push({ id: 'lineup', text: `Weak launch lineup: ${firstParty(c)} of your games on it (at least ${R.lineupMin} helps)` });
    if (monthsOut(c) >= R.thirdPartyAfter && c.interest < R.thirdPartyMin) out.push({ id: 'thirdParty', text: `Low third-party support: interest ${Math.round(c.interest)} of 100` });
    if (defectPct(c) >= R.defectPct) out.push({ id: 'defects', text: `Defects: ${defectPct(c)}% of consoles fail` });
    if (r.devFriendly < R.devFriendlyMin) out.push({ id: 'devFriendly', text: `Poor developer friendliness (${r.devFriendly}): few studios make games for it` });
    const sold = c.history.at(-1)?.sold ?? 0;
    if (c.stock > Math.max(1000, sold * R.oversupplyMonths)) out.push({ id: 'oversupply', text: `Oversupply: ${c.stock.toLocaleString('en-GB')} consoles unsold in the warehouse` });
    if (rivalLaunches() >= R.timingRivals) out.push({ id: 'timing', text: `Bad timing: ${rivalLaunches()} rival platforms launched this year` });
    void d;
    return out;
  }
  function monthEnd(c) {
    if (c.status !== 'launched' || month() <= c.launchMonth) return;
    const inc0 = c.income;
    const cost0 = c.costs;
    // 1. Sell from stock (last month's make is in the warehouse).
    const d = demandOf(c);
    const want = Math.floor(d.exact);
    c.carry = r2(d.exact - want);
    const sold = Math.min(want, c.stock);
    c.stock -= sold;
    c.sold += sold;
    c.installBase += sold;
    earn(c, sold * c.price, `Console sales: ${sold.toLocaleString('en-GB')} × ${c.name}`, 'consoles');
    // 2. Storage for what is left.
    if (c.stock > 0) spendSafe(c, c.stock * K.storagePerUnit, `Warehouse: ${c.stock.toLocaleString('en-GB')} unsold ${c.name}`);
    // 3. A defect wave (seeded)?
    const dp = defectPct(c);
    if (c.installBase > 0 && rng.chance(Math.min(0.9, (dp / 100) * K.defects.waveChance))) {
      const cost = spendSafe(c, Math.min(K.defects.repairMax, c.installBase * (dp / 100) * K.defects.repairPerUnit), `Repairs: ${c.name} defects`);
      business.state.fanTrust = +clamp(business.state.fanTrust - K.defects.trustHit, 0, 100).toFixed(2);
      c.defectWaves++;
      bus.emit('console:defects', { console: c, cost });
    }
    // 4. Third-party interest, games, royalties, dev-kit fees.
    const T = K.thirdParty;
    c.interest = r2(c.interest + (thirdPartyTarget(c) - c.interest) * T.pull);
    c.thirdParty = c.thirdParty.filter((g) => month() - g.month < T.gameMonths);
    const lib = thirdPartyCount(c);
    const want3 = (c.interest / 100) * T.gamesPerMonth + (c.thirdCarry ?? 0);
    const newGames = Math.max(0, Math.min(Math.floor(want3), T.libraryMax - lib));
    c.thirdCarry = r2(want3 - Math.floor(want3));
    if (newGames) {
      c.thirdParty.push({ month: month(), count: newGames });
      c.thirdPartyTotal += newGames;
      earn(c, newGames * K.devKits[c.devKit].feePerGame, `Dev kits: ${newGames} new game${newGames === 1 ? '' : 's'} for ${c.name}`, 'devKits');
    }
    earn(c, thirdPartyCount(c) * (c.installBase / 1000) * T.royaltyPerThousand * (c.royalty / 10), `Royalties: third-party games on ${c.name}`, 'royalties');
    // 5. Make next month's consoles.
    manufacture(c);
    if (c.bonus.adoptionMonths > 0) c.bonus.adoptionMonths--;
    c.history.push({ month: month(), sold, installBase: c.installBase, stock: c.stock, income: c.income - inc0, costs: c.costs - cost0, interest: c.interest, thirdParty: thirdPartyCount(c), adoption: r2(d.adoption * 100) });
    c.reasons = reasonsFor(c, d);
    if (!c.verdict && c.history.length >= K.verdictMonth) {
      const profit = c.income - c.costs;
      c.verdict = c.installBase >= K.hitBase && profit >= 0 ? 'hit' : c.installBase < K.flopBase || profit < -K.flopLoss ? 'flop' : 'steady';
      bus.emit('console:verdict', { console: c, verdict: c.verdict, profit });
    }
  }
  bus.on('clock:month', () => {
    for (const c of consoles) monthEnd(c);
    saveRng();
  });
  const saveRng = () => (consoleRngState = rng.getState());
  let consoleRngState = rng.getState();

  // --- recovery -----------------------------------------------------------------------------------------------------
  function recoveryWhy(id) {
    const c = own();
    const R = recoveryById(id);
    if (!c || !R) return 'No console on sale';
    if (id === 'priceCut' && c.price === K.priceSteps[0]) return 'Already the lowest price';
    if (id === 'reduce' && c.production === K.productionSteps[0]) return 'Manufacturing already stopped';
    const last = c.used[id];
    if (last != null && R.cooldown == null) return 'Done already';
    if (last != null && month() - last < R.cooldown) return `Again in ${R.cooldown - (month() - last)} month${R.cooldown - (month() - last) === 1 ? '' : 's'}`;
    if (R.cost && room() < R.cost) return `Needs ${R.cost.toLocaleString('en-GB')} Credits`;
    return null;
  }
  function recover(id) {
    const why = recoveryWhy(id);
    if (why) return { ok: false, why };
    const c = own();
    const R = recoveryById(id);
    if (R.cost) spendSafe(c, R.cost, `${R.name}: ${c.name}`);
    if (id === 'priceCut') c.price = K.priceSteps[Math.max(0, K.priceSteps.indexOf(c.price) - 1)];
    if (id === 'reduce') c.production = K.productionSteps[Math.max(0, K.productionSteps.indexOf(c.production) - 1)];
    if (R.reliability) c.bonus.reliability += R.reliability;
    if (R.unitCostPct) c.bonus.unitCostPct += R.unitCostPct;
    if (R.devFriendly) c.bonus.devFriendly += R.devFriendly;
    if (R.games) c.exclusives += R.games;
    if (R.interest) c.interest = clamp(c.interest + R.interest, 0, 100);
    if (R.adoptionPct) Object.assign(c.bonus, { adoptionPct: R.adoptionPct, adoptionMonths: R.months });
    c.used[id] = month();
    return { ok: true };
  }
  // A launched console's own price / production can be moved too.
  function adjust(key, dir) {
    const c = own();
    if (!c) return false;
    const list = key === 'price' ? K.priceSteps : key === 'production' ? K.productionSteps : null;
    if (!list) return false;
    c[key] = list[clamp(list.indexOf(c[key]) + dir, 0, list.length - 1)];
    return true;
  }

  return {
    get consoles() {
      return consoles;
    },
    own,
    get plan() {
      return ensurePlan();
    },
    launchWhy,
    validPrototypes,
    setPlan,
    planPreview,
    launch,
    recoveryWhy,
    recover,
    adjust,
    statusOf,
    demandOf,
    thirdPartyTarget,
    firstParty,
    thirdPartyCount,
    defectPct,
    ratingsNow,
    profitOf: (c) => c.income - c.costs,
    newGame() {
      for (const c of consoles) unregisterPlatform(c.platformId);
      consoles = [];
      plan = null;
      rng = new Rng(`${seed()}|consoles`);
      saveRng();
    },
    serialize: () => {
      saveRng();
      return JSON.parse(JSON.stringify({ consoles, plan, rng: consoleRngState }));
    },
    load(data) {
      for (const c of consoles) unregisterPlatform(c.platformId);
      consoles = JSON.parse(JSON.stringify(data?.consoles ?? []));
      plan = data?.plan ? JSON.parse(JSON.stringify(data.plan)) : null;
      rng = new Rng(`${seed()}|consoles`);
      if (data?.rng) rng.setState(data.rng);
      saveRng();
      register();
    },
  };
}
