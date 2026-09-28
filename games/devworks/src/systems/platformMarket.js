// The platform market (Milestone 8, bible §17): each of the 12 platforms' install base over the campaign — launch →
// growth → peak → decline → dead — from data (data/platforms.js eras, balance.js PLATFORM_BALANCE shape and peaks)
// and the run's committed rolls. The formulas are written out in balance.js.
//
// Determinism (bible §8): at the start of a run each platform gets a success factor and an era shift from the run's
// own seed; they are saved and never rolled again, so a reload never changes a platform's fortunes. Everything else is
// a pure function of those rolls and the day.
import { Rng } from '../../../../core/Rng.js';
import { PLATFORMS, platformById, allPlatforms } from '../../data/platforms.js';
import { PLATFORM_BALANCE, CALENDAR } from '../../data/balance.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (k) => {
  const t = clamp(k, 0, 1);
  return t * t * (3 - 2 * t);
};
export const DAYS_PER_YEAR = CALENDAR.daysPerMonth * CALENDAR.monthsPerYear;

// The committed rolls for a run: { P01: { success, shift }, … } (shift in months).
export function rollPlatforms(seed, P = PLATFORM_BALANCE) {
  const rng = new Rng(`${seed}|platforms`);
  const out = {};
  for (const p of PLATFORMS) {
    const s = rng.next();
    const m = rng.next();
    const fixed = P.platforms[p.id]?.fixed;
    out[p.id] = {
      success: fixed ? 1 : +(P.success.min + s * (P.success.max - P.success.min)).toFixed(4),
      shift: fixed || p.era.from === 1 ? 0 : Math.round((m * 2 - 1) * P.shiftMonths),
    };
  }
  return out;
}

// { base, status, u } for a platform on a day. roll: its committed { success, shift }.
export function platformState(id, day, roll = { success: 1, shift: 0 }, P = PLATFORM_BALANCE) {
  const p = platformById(id);
  const d = P.platforms[id];
  const y = day / DAYS_PER_YEAR;
  const shift = (roll.shift ?? 0) / CALENDAR.monthsPerYear;
  const start = p.era.from - 1 + shift;
  const peak = d.peak * (roll.success ?? 1);
  if (y < start) return { base: 0, status: 'Upcoming', u: 0 };
  if (p.era.to == null) {
    const k = 1 - Math.exp(-(y - start) / P.evergreenYears);
    const share = d.startShare + (1 - d.startShare) * k;
    return { base: Math.round(peak * share), status: share < 0.9 ? 'Growing' : 'Peak', u: 0 };
  }
  const end = p.era.to + shift;
  const u = (y - start) / (end - start);
  const S = P.shape;
  let share;
  let status;
  if (u < S.growthEnd) [share, status] = [d.startShare + (1 - d.startShare) * smooth(u / S.growthEnd), 'Growing'];
  else if (u < S.peakEnd) [share, status] = [1, 'Peak'];
  else if (u < 1) [share, status] = [1 - (1 - S.endShare) * smooth((u - S.peakEnd) / (1 - S.peakEnd)), 'Declining'];
  else [share, status] = [S.endShare * Math.exp(-(y - end) / S.fadeYears), 'Dead'];
  return { base: Math.round(peak * share), status, u };
}

// A platform you can release on: out, and not dead yet.
export const releasable = (status) => status === 'Growing' || status === 'Peak' || status === 'Declining';

// Milestone 24: custom platforms (the player's console): setCustom({ has(id), state(id, day) → { base, status } }).
export function createPlatformMarket({ P = PLATFORM_BALANCE } = {}) {
  let rolls = null;
  let custom = null;
  const stateOf = (id, day) => (custom?.has(id) ? custom.state(id, day) : platformState(id, day, rolls?.[id], P));
  const every = () => allPlatforms().filter((p) => PLATFORMS.includes(p) || custom?.has(p.id));
  const api = {
    get rolls() {
      return rolls;
    },
    newGame(seed) {
      rolls = rollPlatforms(seed, P);
    },
    setCustom(c) {
      custom = c;
    },
    state: (id, day) => stateOf(id, day),
    // Every platform on a day, in catalogue order (the player's console last): { platform, base, status }.
    list: (day) => every().map((p) => ({ platform: p, ...stateOf(p.id, day) })),
    active: (day) => every().filter((p) => releasable(stateOf(p.id, day).status)),
    serialize: () => ({ rolls: JSON.parse(JSON.stringify(rolls)) }),
    // A save from before Milestone 8 has no rolls: they are made once from a fixed seed and then saved like any other.
    load(data) {
      rolls = data?.rolls ? JSON.parse(JSON.stringify(data.rolls)) : rollPlatforms('devworks-legacy', P);
      for (const p of PLATFORMS) rolls[p.id] ??= rollPlatforms('devworks-legacy', P)[p.id];
    },
  };
  return api;
}
