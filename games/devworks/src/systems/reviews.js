// Reviews (Milestone 4): the bible §14 review contract on a finished game's 0–100 outputs, one score per outlet
// (bible §30) and a short line each from core ReviewText. Pure functions: every number is in data/balance.js
// (REVIEW_BALANCE), where the contract is written out.
//
// Determinism: the only randomness is each outlet's small jitter, drawn from the game's review seed — the project's
// seeded state at Gold Master. Reviewing the same game again always gives the same scores and words.
import { Rng } from '../../../../core/Rng.js';
import { writeReview, pickBySeed } from '../../../../core/ReviewText.js';
import { REVIEW_BALANCE } from '../../data/balance.js';
import { OUTLETS, REVIEW_LINES } from '../../data/reviews.js';
import { OUTPUTS } from '../../data/projects.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Weighted average of the seven outputs for a genre, with an outlet's taste multipliers (none = the plain genre).
export function genreScore(outputs, genre, taste = {}, R = REVIEW_BALANCE) {
  const base = R.genreWeights[genre] ?? R.genreWeights.default;
  let sum = 0;
  let wsum = 0;
  for (const { key } of OUTPUTS) {
    const w = (base[key] ?? 1) * (taste[key] ?? 1);
    sum += (outputs[key] ?? 0) * w;
    wsum += w;
  }
  return wsum ? sum / wsum : 0;
}

// Bounded bug penalty for the scope: rises quickly for the first bugs, never past max.
export function bugPenalty(bugs, scope = 'tiny', R = REVIEW_BALANCE) {
  const p = R.bugPenalty[scope] ?? R.bugPenalty.tiny;
  return p.max * (1 - Math.exp(-Math.max(0, bugs) / p.scale));
}

export function expectationPenalty(fanExpectation, delivery, R = REVIEW_BALANCE) {
  return Math.max(0, fanExpectation - delivery) * R.expectationWeight;
}

export function innovationBonus(innovation, R = REVIEW_BALANCE) {
  return ((innovation ?? 50) - 50) * R.innovationPerPoint;
}

// One outlet's score before jitter (not rounded).
// Milestone 10: fatiguePenalty (points) from a tired franchise.
export function outletScore({ outputs, bugs, scope, genre, fanExpectation, fatiguePenalty = 0 }, outletId, R = REVIEW_BALANCE) {
  const o = R.outlets[outletId];
  const g = genreScore(outputs, genre, o.weights, R);
  return g + innovationBonus(outputs.innovation, R) - bugPenalty(bugs, scope, R) - expectationPenalty(fanExpectation, genreScore(outputs, genre, {}, R), R) - fatiguePenalty + o.bias;
}

// The whole review round for a finished game.
// game: { title, outputs, bugs, scope, recipe: { genre }, reviewSeed }; fanExpectation from the studio.
// Returns { outlets: [{ id, name, score, line }], score } — score = the rounded average of the four.
export function reviewGame(game, { fanExpectation = REVIEW_BALANCE.start.fanExpectation, fatiguePenalty = 0 } = {}, R = REVIEW_BALANCE) {
  const rng = new Rng(1);
  rng.setState(game.reviewSeed >>> 0);
  const facts = { outputs: game.outputs, bugs: game.bugs, scope: game.scope, genre: game.recipe?.genre, fanExpectation, fatiguePenalty };
  const used = new Set(); // no two outlets print the same line in one round
  const outlets = OUTLETS.map((o) => {
    const jitter = (rng.next() * 2 - 1) * R.jitter;
    const score = Math.round(clamp(outletScore(facts, o.id, R) + jitter, 0, 100));
    let line = reviewLine(game, o.id, score, R);
    for (let k = 2; used.has(line) && k < 12; k++) line = reviewLine(game, `${o.id}|${k}`, score, R);
    used.add(line);
    return { id: o.id, name: o.name, score, line };
  });
  const score = Math.round(outlets.reduce((t, o) => t + o.score, 0) / outlets.length);
  return { outlets, score };
}

// One short line: bugs if there are many, the weakest output if the score is low, else praise for the best.
export function reviewLine(game, outletId, score, R = REVIEW_BALANCE) {
  const seed = `${game.reviewSeed}|${outletId}`;
  const name = game.title;
  if (game.bugs >= R.buggyAt) return pickBySeed(REVIEW_LINES.buggy, seed).replaceAll('{name}', name);
  // Seen through the outlet's taste, so each one talks about what it cares about (TechPlay: graphics, polish…).
  const taste = R.outlets[outletId.split('|')[0]]?.weights ?? {};
  const stats = Object.fromEntries(OUTPUTS.map((o) => [o.key, (game.outputs[o.key] ?? 0) * (taste[o.key] ?? 1)]));
  const templates = score < R.lowScore ? { weak: REVIEW_LINES.weak } : { strong: REVIEW_LINES.strong };
  return writeReview(templates, { stats, fitBand: 'mid', name, seed });
}
