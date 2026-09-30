// Rival studios (Milestone 19, bible §29). Numbers in data/rivals.js.
//
// Milestone 30: Ghostlight Studio (R08) joins once SEC-RIVAL-01 has enabled it: prestige titles from a plan fixed at the
// start of each year from the player's released games (ghostlightIn; bounds in data/rivals.js GHOSTLIGHT).
//
// A rival's releases in month m (0 = Year 1 Month 1) come from the run's seed and m alone (releasesIn, pure): every
// rival active that year (from its first year; Ghostlight never) has releaseChance of a release; its review = core
// RivalSystem's strength curve for that year (its first-year review × (1 + growth)) ± seeded noise; its outputs lean on
// the rival's strengths; genre and theme from its own lists; the platform one on sale that month; copies from its scale
// and the review. Nothing reads the player's games (no rubber-banding). So the calendar can look ahead (the Marketing
// Planner, launch clashes — this replaces Milestone 9's placeholder competitors), and a release never changes.
//
// The history is kept (saved): each month end adds that month's releases, and the awards add their results — so the
// Rivals screen and Rankings have each rival's whole story.
import { Rng } from '../../../../core/Rng.js';
import { RivalSystem } from '../../../../core/RivalSystem.js';
import { RIVALS, rivalById, RIVAL_BALANCE as R, RIVAL_TITLES, GHOSTLIGHT as GL } from '../../data/rivals.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const rivalSystem = new RivalSystem({ rivals: RIVALS.map((r) => ({ ...r, strengths: [] })), rules: R.rules });
const OUT = ['gameplay', 'graphics', 'story', 'innovation', 'polish', 'audienceFit'];

// The rival releases of month m. platformsOn(m) → platform ids on sale that month (optional; P01 if none given).
export function releasesIn(seed, m, platformsOn = () => ['P01']) {
  const year = Math.floor(m / 12) + 1;
  const out = [];
  for (const r of RIVALS) {
    if (r.hidden || year < r.firstYear || out.length >= R.maxPerMonth) continue;
    const rng = new Rng(`${seed}|rival|${r.id}|${m}`);
    if (rng.next() >= r.releaseChance) continue;
    const pick = (list) => list[Math.floor(rng.next() * list.length)];
    const base = rivalSystem.baseFor(r.id, { target: r.review, weights: {}, beatYear: r.firstYear }, { year }).base;
    const review = Math.round(clamp(base + (rng.next() * 2 - 1) * R.noise, 20, 98));
    const outputs = Object.fromEntries(OUT.map((k) => [k, Math.round(clamp(review + (r.strengths.includes(k) ? R.strengthBonus : -2) + (rng.next() * 2 - 1) * R.outputNoise, 5, 100))]));
    const plats = platformsOn(m);
    const big = review >= R.bigReview || rng.next() < r.bigChance;
    out.push({
      id: `${r.id}-${m}`,
      rival: r.id,
      studio: r.name,
      month: m,
      title: `${pick(RIVAL_TITLES.first)} ${pick(RIVAL_TITLES.second)}`,
      genre: pick(r.genres),
      theme: pick(r.themes),
      platform: plats.length ? pick(plats) : 'P01',
      review,
      outputs,
      big,
      copies: Math.round(r.scale * (review / 70) ** 3 * (big ? 1.8 : 1) * (0.7 + rng.next() * 0.6)),
    });
  }
  return out;
}

// Milestone 30: Ghostlight's releases of month m from its year plan { genre, theme, best } (pure; null plan → none).
export function ghostlightIn(seed, m, plan, platformsOn = () => ['P01']) {
  if (!plan) return [];
  const rng = new Rng(`${seed}|rival|${GL.id}|${m}`);
  if (rng.next() >= GL.releaseChance) return [];
  const raw = plan.best - GL.noiseDown + rng.next() * (GL.noiseDown + GL.noiseUp);
  const review = Math.round(clamp(Math.min(raw, plan.best + GL.maxAbove), GL.floor, 98));
  const outputs = Object.fromEntries(OUT.map((k) => [k, Math.round(clamp(review + (k === 'gameplay' || k === 'story' || k === 'graphics' ? GL.strengthBonus : 0) + (rng.next() * 2 - 1) * 3, 5, 100))]));
  const plats = platformsOn(m);
  const pick = (list) => list[Math.floor(rng.next() * list.length)];
  const big = rng.next() < GL.bigChance;
  return [{ id: `${GL.id}-${m}`, rival: GL.id, studio: rivalById(GL.id).name, month: m, title: `${pick(RIVAL_TITLES.first)} ${pick(RIVAL_TITLES.second)}`, genre: plan.genre, theme: plan.theme, platform: plats.length ? pick(plats) : 'P01', review, outputs, big, prestige: true, plan: { ...plan }, copies: Math.round(GL.scale * (review / 70) ** 3 * (big ? 1.8 : 1) * (0.7 + rng.next() * 0.6)) }];
}

// ghostlight: { on() → Ghostlight enabled (SEC-RIVAL-01), snapshot(year) → { genre, theme, best } | null from the player's
// released games before that year } — Milestone 30.
export function createRivals({ bus, clock, seed = () => 'devworks-run', platformsOn = () => ['P01'], ghostlight = { on: () => false, snapshot: () => null } }) {
  let history = {}; // rival id → { releases: [release], awards: [{ award, year, title }] }
  let ghostPlans = {}; // year → { genre, theme, best } | null — fixed the first time the year is needed (saved)
  let lastMonth = -1; // the last month whose releases are in the history
  const monthNow = () => Math.floor(clock.totalDays / clock.daysPerMonth);
  const rowOf = (id) => (history[id] ||= { releases: [], awards: [] });
  const yearOfMonth = (m) => Math.floor(m / 12) + 1;
  // Ghostlight's plan for a year: only once it is enabled and that year has begun; then fixed.
  function planFor(year) {
    if (!ghostlight.on()) return null;
    if (!(year in ghostPlans)) {
      if (year > clock.year) return null;
      ghostPlans[year] = ghostlight.snapshot(year) ?? null;
    }
    return ghostPlans[year];
  }
  const allIn = (m) => [...releasesIn(seed(), m, platformsOn), ...ghostlightIn(seed(), m, planFor(yearOfMonth(m)), platformsOn)];
  // Add every month up to (not including) the current one.
  function catchUp() {
    for (let m = lastMonth + 1; m < monthNow(); m++) {
      for (const rel of allIn(m)) rowOf(rel.rival).releases.push(rel);
      lastMonth = m;
    }
  }
  bus.on('clock:month', () => catchUp());
  return {
    releasesIn: (m) => allIn(m),
    ghostPlan: (year = clock.year) => planFor(year),
    get ghostPlans() {
      return ghostPlans;
    },
    // Releases in the months [from, to] (history for the past, generated for the rest).
    between(fromMonth, toMonth) {
      const out = [];
      for (let m = Math.max(0, fromMonth); m <= toMonth; m++) out.push(...allIn(m));
      return out;
    },
    history: (id) => rowOf(id),
    visible: () => RIVALS.filter((r) => !r.hidden || (r.id === GL.id && ghostlight.on())),
    active: (year = clock.year) => RIVALS.filter((r) => (!r.hidden && year >= r.firstYear) || (r.id === GL.id && ghostlight.on())),
    rival: rivalById,
    addAward(rivalId, entry) {
      rowOf(rivalId).awards.push(entry);
    },
    catchUp,
    newGame() {
      history = {};
      ghostPlans = {};
      lastMonth = monthNow() - 1;
    },
    serialize: () => JSON.parse(JSON.stringify({ history, lastMonth, ghostPlans })),
    load(data) {
      history = JSON.parse(JSON.stringify(data?.history ?? {}));
      lastMonth = data?.lastMonth ?? -1;
      ghostPlans = JSON.parse(JSON.stringify(data?.ghostPlans ?? {}));
      if (!data) catchUp(); // a save from before Milestone 19: the rivals' past releases (they come from the seed alone)
    },
  };
}
