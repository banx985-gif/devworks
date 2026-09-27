// Sales (Milestone 4): launch spike → decay → long tail (bible §30). Pure functions; every number is in
// data/balance.js (SALES_BALANCE), where the formula is written out.
// Milestone 9: Hype and word of mouth shape each game's own curve (curveFor, MARKETING_BALANCE): Hype adds sales and
// moves them up front; a strong review with little Hype adds a slow word-of-mouth part and stretches the decay and the
// tail. A same-genre competitor release in the launch month cuts the launch week (clash).
//
// Determinism: a released game carries its own seeded sales state (from its review seed), and each day's copies
// are worked out from it in a fixed order, with the fraction carried to the next day. The same save and choices
// always sell the same copies on the same days.
import { Rng } from '../../../../core/Rng.js';
import { SALES_BALANCE, RELEASE, MARKETING_BALANCE } from '../../data/balance.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// How much players want this game (1 ≈ the whole platform audience buys it over its life).
export function appeal({ score, fit, trust, demand = 100 }, S = SALES_BALANCE) {
  const review = Math.pow(clamp(score, 0, 100) / 100, S.reviewExp) * S.reviewScale;
  const fitF = S.fitBase + S.fitPer * clamp(fit, 0, 100);
  const trustF = S.trustBase + S.trustPer * clamp(trust, 0, 100);
  return review * fitF * trustF * (demand / 100);
}

export const lifetimeCopies = (audience, a) => audience * a;

// Word of mouth (Milestone 9), 0–1: a strong review with little Hype.
export function womStrength(score, hype = 0, M = MARKETING_BALANCE) {
  const q = clamp((score - M.wom.from) / (M.wom.full - M.wom.from), 0, 1);
  return q * (1 - (clamp(hype, 0, 100) / 100) * M.wom.hypeDamp);
}

// Lifetime sales multiplier from Hype and word of mouth.
export function marketingSalesMult(score, hype = 0, M = MARKETING_BALANCE) {
  return (1 + (clamp(hype, 0, 100) / 100) * (M.hypeSalesPct / 100)) * (1 + (womStrength(score, hype, M) * M.wom.bonusPct) / 100);
}

// A game's own sales curve (Milestone 9). No Hype and no word of mouth = exactly SALES_BALANCE.curve.
export function curveFor({ score = 0, hype = 0 } = {}, S = SALES_BALANCE, M = MARKETING_BALANCE) {
  const h = clamp(hype, 0, 100) / 100;
  const str = womStrength(score, hype, M);
  const base = S.curve;
  const wom = str * M.wom.share;
  const spike = base.spike.share * (1 - str * M.wom.quietSpike) + M.spikePerHype * h;
  const rest = Math.max(0, 1 - spike - wom);
  const decayPart = base.decay.share / (base.decay.share + base.tail.share);
  const r6 = (x) => +x.toFixed(6);
  return {
    spike: { share: r6(spike), days: base.spike.days },
    decay: { share: r6(rest * decayPart), days: r6(base.decay.days * (1 + str * M.wom.decayStretch)) },
    tail: { share: r6(rest * (1 - decayPart)), days: r6(base.tail.days * (1 + str * M.wom.tailStretch)) },
    wom: { share: r6(wom), days: M.wom.days, hump: true },
  };
}

// Share of one curve part sold by day x (0 → 1): a fading part front-loads; the word-of-mouth "hump" builds for
// about `days`, then fades.
const soldBy = (p, x) => (p.hump ? 1 - Math.exp(-x / p.days) * (1 + x / p.days) : 1 - Math.exp(-x / p.days));
const partShare = (p, d) => (p.share ? p.share * (soldBy(p, d + 1) - soldBy(p, d)) : 0);

// Share of lifetime copies sold on day d after release (d = 0 is launch day). The parts are exact slices of their
// curves, so over all days they add up to 1.
export function dayShare(d, S = SALES_BALANCE, curve = S.curve) {
  let share = 0;
  for (const part of Object.values(curve)) share += partShare(part, d);
  return share;
}

// "Selling" while the spike, the decay and word of mouth still sell more than the tail, then "Long tail".
export function statusOn(d, S = SALES_BALANCE, curve = S.curve) {
  return partShare(curve.spike, d) + partShare(curve.decay, d) + (curve.wom ? partShare(curve.wom, d) : 0) > partShare(curve.tail, d) ? 'Selling' : 'Long tail';
}

// Credits the studio keeps from one copy.
// price: the game's own (Milestone 7: set by its scope), else the release default.
export const netPerCopy = (R = RELEASE, price = R.price) => (price * (100 - R.storeCutPct)) / 100;

// Start a game's sales at release. Returns the plain, saveable sales state.
// Milestone 7: salesMult (bigger scopes reach more players) and price come from the game's scope.
// Milestone 9: hype (frozen at launch) and the review shape the curve and add sales; clash = the share of the launch
// week lost to a same-genre competitor release ({ days, pct }) or null.
export function startSales({ score, fit, trust, demand, platform, reviewSeed, day, salesMult = 1, price = RELEASE.price, audience = S.platforms[platform]?.audience ?? 0, hype = 0, clash = null }, S = SALES_BALANCE) {
  const a = appeal({ score, fit, trust, demand }, S);
  return {
    platform,
    releasedDay: day,
    appeal: +a.toFixed(6),
    lifetime: +(lifetimeCopies(audience, a) * salesMult * marketingSalesMult(score, hype)).toFixed(3),
    price,
    curve: curveFor({ score, hype }, S),
    clash: clash ? { days: clash.days, pct: clash.pct } : null,
    rng: new Rng(`${reviewSeed}|sales`).getState(),
    carry: 0,
    copies: 0,
    revenue: 0,
    days: 0, // days on sale
  };
}

// One day of sales for a released game (mutates its sales state). Returns { copies, revenue }.
// A state from before Milestone 9 has no curve (the Milestone 4 one) and no clash.
export function sellDay(sales, S = SALES_BALANCE, R = RELEASE) {
  const r = new Rng(1);
  r.setState(sales.rng);
  const wobble = 1 + (r.next() * 2 - 1) * S.jitter;
  sales.rng = r.getState();
  const cut = sales.clash && sales.days < sales.clash.days ? 1 - sales.clash.pct / 100 : 1;
  const exact = sales.lifetime * dayShare(sales.days, S, sales.curve ?? S.curve) * wobble * cut + sales.carry;
  const copies = Math.max(0, Math.floor(exact));
  sales.carry = +(exact - copies).toFixed(6);
  const revenue = Math.round(copies * netPerCopy(R, sales.price ?? R.price));
  sales.copies += copies;
  sales.revenue += revenue;
  sales.days++;
  return { copies, revenue };
}
