// Rival studios (Milestone 19, bible §29). Numbers in data/rivals.js.
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
import { RIVALS, rivalById, RIVAL_BALANCE as R, RIVAL_TITLES } from '../../data/rivals.js';

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

export function createRivals({ bus, clock, seed = () => 'devworks-run', platformsOn = () => ['P01'] }) {
  let history = {}; // rival id → { releases: [release], awards: [{ award, year, title }] }
  let lastMonth = -1; // the last month whose releases are in the history
  const monthNow = () => Math.floor(clock.totalDays / clock.daysPerMonth);
  const rowOf = (id) => (history[id] ||= { releases: [], awards: [] });
  // Add every month up to (not including) the current one.
  function catchUp() {
    for (let m = lastMonth + 1; m < monthNow(); m++) {
      for (const rel of releasesIn(seed(), m, platformsOn)) rowOf(rel.rival).releases.push(rel);
      lastMonth = m;
    }
  }
  bus.on('clock:month', () => catchUp());
  return {
    releasesIn: (m) => releasesIn(seed(), m, platformsOn),
    // Releases in the months [from, to] (history for the past, generated for the rest).
    between(fromMonth, toMonth) {
      const out = [];
      for (let m = Math.max(0, fromMonth); m <= toMonth; m++) out.push(...releasesIn(seed(), m, platformsOn));
      return out;
    },
    history: (id) => rowOf(id),
    visible: () => RIVALS.filter((r) => !r.hidden),
    active: (year = clock.year) => RIVALS.filter((r) => !r.hidden && year >= r.firstYear),
    rival: rivalById,
    addAward(rivalId, entry) {
      rowOf(rivalId).awards.push(entry);
    },
    catchUp,
    newGame() {
      history = {};
      lastMonth = monthNow() - 1;
    },
    serialize: () => JSON.parse(JSON.stringify({ history, lastMonth })),
    load(data) {
      history = JSON.parse(JSON.stringify(data?.history ?? {}));
      lastMonth = data?.lastMonth ?? -1;
      if (!data) catchUp(); // a save from before Milestone 19: the rivals' past releases (they come from the seed alone)
    },
  };
}
