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
// Milestone 25 — generations and revisions (bible §32). Up to CONSOLE.generations.max consoles per run, launched in
// order: a new generation needs a prototype built (and validated) after the current one launched, and the current one
// on sale for generations.minMonths. It is named family + number ("Nova 2") and is its own platform (OWN2, OWN3); the
// one before becomes a legacy console (Declining on the market, slower sales, fewer new third-party games, a smaller
// monthly run, retired after legacyMonths) — its install base, library and history stay in the portfolio. Backwards
// compatibility (a plan choice from Gen 2) costs more but counts the old libraries and carries more goodwill. A
// revision (Slim / Portable, once per console) makes the live console cheaper and sturdier with a new look. Each
// console records the stats the hardware secrets (HW-01…HW-05, Milestone 28) will read: secretStats().
//
// Events: 'console:launched' { console, previous }, 'console:defects' { console, cost }, 'console:verdict' { console,
// verdict }, 'console:revised' { console }, 'console:retired' { console }.
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
  const G = K.generations;
  let consoles = []; // one per generation, in order (Gen 1 first)
  let plan = null; // the launch plan being made: { prototypeId, form, price, production, devKit, royalty, marketing, backCompat, launchTitles: [jobId] }
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
  // The current generation (the newest console still 'launched'); older ones are 'legacy', then 'retired'.
  const own = () => consoles.findLast((c) => c.status === 'launched') ?? null;
  const modelName = (c) => (c.revision ? `${c.name} ${K.revisions[c.revision.kind].suffix}` : c.name);
  const artFor = (gen, form, revised) => {
    const a = G.art[gen - 1] ?? G.art.at(-1);
    return revised ? a.revision : (a.model ?? a[form] ?? K.forms[form].art);
  };
  function platformDef(c) {
    const f = K.forms[c.form];
    return { id: c.platformId, name: modelName(c), holder: studioName(), era: { from: Math.floor(c.launchDay / (clock.daysPerMonth * clock.monthsPerYear)) + 1, to: null }, audienceLabel: f.name, group: f.group, friendliness: 'Very High', identity: `Your own ${f.name.toLowerCase()} (generation ${c.gen})`, art: c.art, open: true, own: true };
  }
  function statusOf(c, day = today()) {
    if (!c || day < c.launchDay) return 'Upcoming';
    if (c.status === 'retired') return 'Dead';
    if (c.status === 'legacy') return 'Declining';
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
  // Prototypes that can launch the next generation: passed validation, not launched yet, and (after Gen 1) built after
  // the current generation launched — a new generation is a new hardware project.
  // Milestone 31: a PROJECT X prototype (hardware.designProjectX) may launch after the three generations, once.
  const projectXReady = () => hardware.prototypes.find((p) => p.projectX && p.validation.passed && !consoles.some((c) => c.prototypeId === p.id)) ?? null;
  const projectXDone = () => consoles.some((c) => c.projectX);
  const validPrototypes = () => {
    const cur = own();
    const px = !projectXDone() ? projectXReady() : null;
    if (px) return [px];
    return hardware.prototypes.filter((p) => !p.projectX && p.validation.passed && !consoles.some((c) => c.prototypeId === p.id) && (!cur || p.builtDay >= cur.launchDay));
  };
  const nextGen = () => consoles.length + 1;
  const monthsOn = (c) => month() - c.launchMonth;
  function launchWhy() {
    if (!projectXDone() && projectXReady()) return null; // Milestone 31: PROJECT X launches whenever it is built
    if (consoles.length >= G.max) return `All ${G.max} console generations made: a studio makes at most ${G.max}`;
    const cur = own();
    if (cur && monthsOn(cur) < G.minMonths) {
      const n = G.minMonths - monthsOn(cur);
      return `${modelName(cur)} is already on sale: the next generation can launch in ${n} month${n === 1 ? '' : 's'}`;
    }
    if (cur && !validPrototypes().length) return `Generation ${nextGen()} needs a new prototype that passed validation, built after ${cur.name} launched (Create → Hardware)`;
    if (!validPrototypes().length) return 'Needs a prototype that passed validation (Create → Hardware)';
    return null;
  }
  const formOpen = (form) => (K.forms[form]?.minGen ?? 1) <= nextGen();
  function ensurePlan() {
    if (launchWhy()) return null;
    if (!plan || !validPrototypes().some((p) => p.id === plan.prototypeId)) {
      const p = validPrototypes().at(-1);
      if (!p) return null;
      plan = { prototypeId: p.id, form: 'home', price: K.priceSteps[3], production: K.productionSteps[3], devKit: 'standard', royalty: K.royaltySteps[2], marketing: 'standard', backCompat: false, launchTitles: [] };
    }
    plan.backCompat ??= false;
    if (nextGen() === 1) plan.backCompat = false;
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
    else if (key === 'form' && K.forms[v] && formOpen(v)) p.form = v;
    else if (key === 'backCompat' && nextGen() > 1) p.backCompat = v == null ? !p.backCompat : !!v;
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
    const unitCost = unitCostOf(proto.ratings, p.production, p.backCompat ? K.backCompat.unitCostPct : 0);
    const gen = nextGen();
    const family = consoles[0]?.family ?? proto.family;
    const backCompatCost = p.backCompat ? K.backCompat.cost : 0;
    return { plan: p, prototype: proto, gen, name: gen === 1 ? family : `${family} ${gen}`, art: artFor(gen, p.form, false), unitCost, fairPrice: fairPriceOf(proto.ratings), value: r2(valueOf(proto.ratings, p.price)), margin: r2(p.price - unitCost), marketingCost: K.marketing[p.marketing].cost, backCompatCost, firstBatchCost: Math.round(unitCost * p.production), defectPct: defectPctOf(proto.ratings.reliability, world.effect?.('certFailPct') ?? 0), previous: own() };
  }

  // --- launch -------------------------------------------------------------------------------------------------------
  function launch() {
    const why = launchWhy();
    if (why) return { ok: false, why };
    const pv = planPreview();
    if (!pv) return { ok: false, why: 'No plan' };
    const p = pv.plan;
    const proto = pv.prototype;
    const prev = own();
    const gen = pv.gen;
    const px = !!proto.projectX; // Milestone 31
    const c = {
      id: px ? 'CX' : `C${gen}`,
      platformId: px ? 'OWNX' : gen === 1 ? K.platformId : `OWN${gen}`,
      name: px ? 'PROJECT X' : pv.name,
      projectX: px,
      family: consoles[0]?.family ?? proto.family,
      gen,
      art: px ? K.projectXArt : pv.art,
      marketMult: G.marketMult[gen - 1] ?? G.marketMult.at(-1),
      backCompat: !!p.backCompat,
      revision: null,
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
      bonus: { reliability: 0, devFriendly: 0, unitCostPct: 0, usability: 0, appeal: 0, reachPlus: 0, adoptionPct: 0, adoptionMonths: 0 },
      used: {}, // recovery id → month last used
      history: [], // { month, sold, installBase, stock, income, costs, interest, thirdParty }
      income: 0,
      incomeBy: {},
      costs: 0,
      defectWaves: 0,
      reasons: [],
      verdict: null,
      notes: [],
      stats: freshStats(),
    };
    // Third-party goodwill comes across from the generation before (more with backwards compatibility).
    if (prev) c.interest = r2(prev.interest * (c.backCompat ? K.backCompat.goodwill : G.goodwill));
    consoles.push(c);
    registerPlatform(platformDef(c));
    if (prev) toLegacy(prev);
    spendSafe(c, K.marketing[c.marketing].cost, `Console marketing: ${c.name}`);
    if (c.backCompat) spendSafe(c, K.backCompat.cost, `Backwards compatibility: ${c.name}`);
    manufacture(c);
    plan = null;
    bus.emit('console:launched', { console: c, previous: prev });
    return { ok: true, console: c };
  }
  // The generation before goes Declining: a smaller monthly run; its history stays.
  function toLegacy(c) {
    c.status = 'legacy';
    c.legacyMonth = month();
    c.production = K.productionSteps.filter((x) => x <= Math.min(c.production, G.legacyProduction)).at(-1) ?? 0;
    c.notes.push({ month: month(), text: `Generation ${c.gen + 1} launched: ${c.name} is now declining` });
  }
  function retire(c) {
    c.status = 'retired';
    c.retiredMonth = month();
    c.production = 0;
    if (c.stock) c.notes.push({ month: month(), text: `Retired: ${c.stock.toLocaleString('en-GB')} unsold consoles written off` });
    c.stock = 0;
    bus.emit('console:retired', { console: c });
  }
  // Stats for the hardware secrets (read by Milestone 28): kept per console, updated each month end.
  function freshStats() {
    return { defectUnits: 0, peakDevFriendly: 0, maxRoyalty: 0, sold6: null, target6: null, missedLaunch: false, firstPartyHits: 0, exclusiveHits: 0 };
  }

  // --- the month --------------------------------------------------------------------------------------------------
  const ratingsNow = (c) => ({ ...c.ratings, reliability: clamp(c.ratings.reliability + c.bonus.reliability, 0, 100), devFriendly: clamp(c.ratings.devFriendly + c.bonus.devFriendly, 0, 100), usability: clamp(c.ratings.usability + (c.bonus.usability ?? 0), 0, 100), launchAppeal: clamp(c.ratings.launchAppeal + (c.bonus.appeal ?? 0), 0, 100) });
  const defectPct = (c) => defectPctOf(ratingsNow(c).reliability, world.effect?.('certFailPct') ?? 0);
  const unitCostNow = (c, production = c.production) => unitCostOf(c.ratings, production, c.bonus.unitCostPct + (c.backCompat ? K.backCompat.unitCostPct : 0));
  function manufacture(c) {
    if (!c.production) return 0;
    const unit = unitCostNow(c);
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
  // Backwards compatibility: the older generations' games (yours and third-party ones ever made) count for this one.
  function oldLibrary(c) {
    if (!c.backCompat) return { first: 0, third: 0 };
    const older = consoles.filter((x) => x.gen < c.gen);
    const share = K.backCompat.libraryShare;
    return { first: share * older.reduce((t, x) => t + firstParty(x), 0), third: share * older.reduce((t, x) => t + x.thirdPartyTotal + x.exclusives, 0) };
  }
  // Rival platforms that launched in the last year (bad timing).
  const rivalLaunches = () => PLATFORMS.filter((p) => {
    const st = business.platforms.state(p.id, today());
    const then = business.platforms.state(p.id, Math.max(0, today() - clock.daysPerMonth * clock.monthsPerYear));
    return releasable(st.status) && then.status === 'Upcoming';
  }).length;
  function demandOf(c) {
    const r = ratingsNow(c);
    const M = K.market;
    const market = M.size * (c.marketMult ?? 1) * (0.5 + r.launchAppeal / 100) * ((M.reach[c.form] ?? 1) + (c.bonus.reachPlus ?? 0));
    const value = valueOf(r, c.price);
    const old = oldLibrary(c);
    const library = Math.min(M.libMax, M.libBase + M.perFirstParty * (firstParty(c) + old.first) + M.perThirdParty * (thirdPartyCount(c) + old.third));
    const mkt = K.marketing[c.marketing].mult * (c.bonus.adoptionMonths > 0 ? 1 + c.bonus.adoptionPct / 100 : 1);
    const rel = Math.max(0.5, 1 - (defectPct(c) / 100) * M.defectAdoption);
    const timing = 1 - Math.min(M.timingMax, M.timingPct * rivalLaunches()) / 100;
    const legacy = c.status === 'legacy' ? G.legacyAdoption : 1;
    const adoption = M.adoption * value * library * mkt * rel * timing * legacy;
    const exact = Math.max(0, market - c.installBase) * adoption + c.carry;
    return { market, value, library, mkt, rel, timing, legacy, adoption, exact };
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
    if ((c.status !== 'launched' && c.status !== 'legacy') || month() <= c.launchMonth) return;
    if (c.status === 'legacy' && month() - c.legacyMonth >= G.legacyMonths) return retire(c);
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
    const want3 = (c.interest / 100) * T.gamesPerMonth * (c.status === 'legacy' ? G.legacyThirdParty : 1) + (c.thirdCarry ?? 0);
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
    recordStats(c, sold, d);
    if (!c.verdict && c.history.length >= K.verdictMonth) {
      const profit = c.income - c.costs;
      c.verdict = c.installBase >= K.hitBase && profit >= 0 ? 'hit' : c.installBase < K.flopBase || profit < -K.flopLoss ? 'flop' : 'steady';
      bus.emit('console:verdict', { console: c, verdict: c.verdict, profit });
    }
  }
  function recordStats(c, sold, d) {
    const s = (c.stats ??= freshStats());
    const H = K.hooks;
    s.defectUnits = r2(s.defectUnits + (sold * defectPct(c)) / 100);
    s.peakDevFriendly = Math.max(s.peakDevFriendly, ratingsNow(c).devFriendly);
    s.maxRoyalty = Math.max(s.maxRoyalty, c.royalty);
    if (c.history.length === 6) {
      s.sold6 = c.history.reduce((t, h) => t + h.sold, 0);
      s.target6 = Math.round((d.market * H.target6Pct) / 100);
      s.missedLaunch = s.sold6 <= s.target6 * (1 - H.missPct / 100);
    }
    let hits = 0;
    let excl = 0;
    for (const r of projects.catalogue.list()) {
      const on = r.release?.platforms ?? [];
      if (!on.includes(c.platformId)) continue;
      if (r.release.score >= H.hitScore) hits++;
      if (on.length === 1 && r.release.score >= H.exclusiveScore) excl++;
    }
    s.firstPartyHits = hits;
    s.exclusiveHits = excl;
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
    if (R.revision) return revisionWhy(R.revision);
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
    if (R.revision) return revise(R.revision);
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
  // A revision of the live console (once each): cheaper to make, sturdier (or more portable), a new model name and look.
  function revisionWhy(kind) {
    const c = own();
    const V = K.revisions[kind];
    if (!c || !V) return 'No console on sale';
    if (c.revision) return `Done already: ${modelName(c)} is on sale`;
    if (room() < V.cost) return `Needs ${V.cost.toLocaleString('en-GB')} Credits`;
    return null;
  }
  function revise(kind) {
    const why = revisionWhy(kind);
    if (why) return { ok: false, why };
    const c = own();
    const V = K.revisions[kind];
    spendSafe(c, V.cost, `${V.name}: ${c.name}`);
    c.bonus.reliability += V.reliability;
    c.bonus.unitCostPct += V.unitCostPct;
    c.bonus.usability = (c.bonus.usability ?? 0) + V.usability;
    c.bonus.appeal = (c.bonus.appeal ?? 0) + V.appeal;
    c.bonus.reachPlus = (c.bonus.reachPlus ?? 0) + (V.reachPlus ?? 0);
    c.revision = { kind, month: month(), art: artFor(c.gen, c.form, true) };
    c.art = c.revision.art;
    c.used.revisedModel = month();
    registerPlatform(platformDef(c));
    bus.emit('console:revised', { console: c });
    return { ok: true, console: c };
  }
  // A console's own price / production can be moved too (the current generation unless an id is given).
  function adjust(key, dir, id = null) {
    const c = id ? consoles.find((x) => x.id === id && x.status !== 'retired') : own();
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
    revisionWhy,
    revise,
    adjust,
    modelName,
    unitCostNow,
    nextGen,
    formsOpen: () => Object.keys(K.forms).filter(formOpen),
    // Every generation's lifetime record (the Console Portfolio).
    portfolio: () =>
      consoles.map((c) => ({ id: c.id, gen: c.gen, name: modelName(c), platformId: c.platformId, status: statusOf(c), units: c.sold, installBase: c.installBase, profit: c.income - c.costs, games: firstParty(c), thirdPartyGames: c.thirdPartyTotal + c.exclusives, verdict: c.verdict, revision: c.revision?.kind ?? null, backCompat: c.backCompat, art: c.art, months: c.history.length })),
    // What the hardware secrets need (Milestone 28 reads it; no rewards yet).
    secretStats() {
      const each = consoles.map((c) => {
        const s = c.stats ?? freshStats();
        return { id: c.id, gen: c.gen, form: c.form, revision: c.revision?.kind ?? null, units: c.sold, installBase: c.installBase, profit: c.income - c.costs, defectRatePct: c.sold ? r2((s.defectUnits / c.sold) * 100) : 0, peakDevFriendly: s.peakDevFriendly, thirdPartyReleases: c.thirdPartyTotal, maxRoyalty: s.maxRoyalty, missedLaunch: s.missedLaunch, sold6: s.sold6, target6: s.target6, firstPartyHits: s.firstPartyHits, exclusiveHits: s.exclusiveHits };
      });
      return {
        consoles: each,
        generations: consoles.length,
        profitableGenerations: each.filter((x) => x.profit > 0).length,
        // A handheld / hybrid revision (HW-04): a Portable revision, or any revision of a handheld / hybrid console.
        handheldRevision: consoles.some((c) => c.revision && (c.revision.kind === 'portable' || c.form !== 'home')),
      };
    },
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
      // A Milestone 24 save: its one console is Generation 1.
      for (const c of consoles) {
        c.family ??= c.name;
        c.art ??= K.forms[c.form]?.art ?? 'console_visual_01';
        c.marketMult ??= 1;
        c.backCompat ??= false;
        c.revision ??= c.used?.revisedModel != null ? { kind: 'slim', month: c.used.revisedModel, art: artFor(c.gen, c.form, true) } : null;
        c.stats ??= freshStats();
        Object.assign(c.bonus, { usability: 0, appeal: 0, reachPlus: 0, ...c.bonus });
      }
      plan = data?.plan ? JSON.parse(JSON.stringify(data.plan)) : null;
      rng = new Rng(`${seed()}|consoles`);
      if (data?.rng) rng.setState(data.rng);
      saveRng();
      register();
    },
  };
}
