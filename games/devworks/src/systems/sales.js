// Sales (Milestone 4): launch spike → decay → long tail (bible §30). Pure functions; every number is in
// data/balance.js (SALES_BALANCE), where the formula is written out.
//
// Determinism: a released game carries its own seeded sales state (from its review seed), and each day's copies
// are worked out from it in a fixed order, with the fraction carried to the next day. The same save and choices
// always sell the same copies on the same days.
import { Rng } from '../../../../core/Rng.js';
import { SALES_BALANCE, RELEASE } from '../../data/balance.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// How much players want this game (1 ≈ the whole platform audience buys it over its life).
export function appeal({ score, fit, trust, demand = 100 }, S = SALES_BALANCE) {
  const review = Math.pow(clamp(score, 0, 100) / 100, S.reviewExp) * S.reviewScale;
  const fitF = S.fitBase + S.fitPer * clamp(fit, 0, 100);
  const trustF = S.trustBase + S.trustPer * clamp(trust, 0, 100);
  return review * fitF * trustF * (demand / 100);
}

export const lifetimeCopies = (audience, a) => audience * a;

// Share of lifetime copies sold on day d after release (d = 0 is launch day). The three parts are exact slices of
// fading curves, so over all days they add up to 1.
export function dayShare(d, S = SALES_BALANCE) {
  let share = 0;
  for (const part of Object.values(S.curve)) share += part.share * (Math.exp(-d / part.days) - Math.exp(-(d + 1) / part.days));
  return share;
}

// "Selling" while the spike and the decay still sell more than the tail, then "Long tail".
export function statusOn(d, S = SALES_BALANCE) {
  const part = (p) => p.share * (Math.exp(-d / p.days) - Math.exp(-(d + 1) / p.days));
  return part(S.curve.spike) + part(S.curve.decay) > part(S.curve.tail) ? 'Selling' : 'Long tail';
}

// Credits the studio keeps from one copy.
// price: the game's own (Milestone 7: set by its scope), else the release default.
export const netPerCopy = (R = RELEASE, price = R.price) => (price * (100 - R.storeCutPct)) / 100;

// Start a game's sales at release. Returns the plain, saveable sales state.
// Milestone 7: salesMult (bigger scopes reach more players) and price come from the game's scope.
export function startSales({ score, fit, trust, demand, platform, reviewSeed, day, salesMult = 1, price = RELEASE.price }, S = SALES_BALANCE) {
  const audience = S.platforms[platform]?.audience ?? 0;
  const a = appeal({ score, fit, trust, demand }, S);
  return {
    platform,
    releasedDay: day,
    appeal: +a.toFixed(6),
    lifetime: +(lifetimeCopies(audience, a) * salesMult).toFixed(3),
    price,
    rng: new Rng(`${reviewSeed}|sales`).getState(),
    carry: 0,
    copies: 0,
    revenue: 0,
    days: 0, // days on sale
  };
}

// One day of sales for a released game (mutates its sales state). Returns { copies, revenue }.
export function sellDay(sales, S = SALES_BALANCE, R = RELEASE) {
  const r = new Rng(1);
  r.setState(sales.rng);
  const wobble = 1 + (r.next() * 2 - 1) * S.jitter;
  sales.rng = r.getState();
  const exact = sales.lifetime * dayShare(sales.days, S) * wobble + sales.carry;
  const copies = Math.max(0, Math.floor(exact));
  sales.carry = +(exact - copies).toFixed(6);
  const revenue = Math.round(copies * netPerCopy(R, sales.price ?? R.price));
  sales.copies += copies;
  sales.revenue += revenue;
  sales.days++;
  return { copies, revenue };
}
