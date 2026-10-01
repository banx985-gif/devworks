// The idea cards' info strip (Milestone 40b): plain, one-glance facts about a recipe element, all from real data.
//   fit        with the genre picked so far: '?' until that genre + element has shipped once; then Great / Good / OK /
//              Poor from the normal combos it is part of with that genre (data/combos.js — never the secret ones) and
//              how much that genre's players care about what this slot builds (REVIEW_BALANCE.genreWeights)
//   who        the role whose stat builds this slot's output most ("Designers are good at this")
//   difficulty Easy / Medium / Hard from its bug load (PROJECT_BALANCE.complexity) and its combos' QA load
//   playsTo    'Launch buzz' (Hype / launch sales in its combos), 'Long-lasting sales' (long tail / franchise), both,
//              or 'Steady sales'
// Pure functions (tested in tests/devworks/m40b.test.mjs).
import { COMBOS } from '../../data/combos.js';
import { REVIEW_BALANCE, PROJECT_BALANCE } from '../../data/balance.js';
import { ROLES } from '../../data/staff.js';
import { OUTPUTS } from '../../data/projects.js';

// What each slot builds most, and whose stat that is.
export const SLOT_OUTPUT = { theme: 'story', gameplay: 'gameplay', technology: 'polish', artDirection: 'graphics', feature: 'audienceFit' };
export const SLOT_STAT = { theme: 'wrt', gameplay: 'des', technology: 'code', artDirection: 'art', feature: 'prod' };
const OUTPUT_STAT = { gameplay: 'des', graphics: 'art', story: 'wrt', audio: 'art', innovation: 'des', polish: 'code', audienceFit: 'prod' };

const roleOfStat = (stat) => Object.values(ROLES).find((r) => r.primaryStat === stat) ?? null;
const NAMES = { gameplay: 'Gameplay', graphics: 'Graphics', story: 'Story', audio: 'Audio', innovation: 'Innovation', polish: 'Polish', audienceFit: 'Audience Fit' };
const outputName = (key) => NAMES[key] ?? OUTPUTS.find((o) => o.key === key)?.label ?? key;
const weightsOf = (genre) => REVIEW_BALANCE.genreWeights[genre] ?? REVIEW_BALANCE.genreWeights.default;

// The normal combos that hold this element (and, when given, this genre: a combo with no genre condition counts).
export function combosWith(element, genre = null) {
  return COMBOS.filter((c) => (c.need[element.family] ?? []).includes(element.id) && (!genre || element.family === 'genre' || !c.need.genre || c.need.genre.includes(genre)));
}

export function fitGrade(element, genre, shipped) {
  if (element.family === 'genre') return { grade: null, line: `Players of this genre love ${topOutputs(element.id).join(' and ')}` };
  if (!genre) return { grade: null, line: 'Pick a genre first' };
  if (!shipped) return { grade: '?', line: 'Ship this pairing once to learn how well it fits' };
  let score = combosWith(element, genre).length ? 2 : 0;
  const w = weightsOf(genre)[SLOT_OUTPUT[element.family]] ?? 1;
  if (w >= 1.2) score += 1;
  else if (w <= 0.6) score -= 1;
  const grade = score >= 2 ? 'Great' : score === 1 ? 'Good' : score === 0 ? 'OK' : 'Poor';
  return { grade, line: `${grade} with your genre` };
}

export function topOutputs(genre, n = 2) {
  return Object.entries(weightsOf(genre))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => outputName(k));
}

export function whoIsGood(element) {
  const stat = element.family === 'genre' ? OUTPUT_STAT[Object.entries(weightsOf(element.id)).sort((a, b) => b[1] - a[1])[0][0]] : SLOT_STAT[element.family];
  const role = roleOfStat(stat);
  return role ? `${role.name}s are good at this` : '';
}

export function difficulty(element) {
  const qa = Math.max(0, ...combosWith(element).map((c) => c.reward?.bugPct ?? 0)) / 100;
  const load = (PROJECT_BALANCE.complexity[element.id] ?? 0) + qa;
  return load >= 0.12 ? 'Hard' : load >= 0.05 ? 'Medium' : 'Easy';
}

export function playsTo(element) {
  const rs = combosWith(element).map((c) => c.reward ?? {});
  const buzz = rs.some((r) => r.hype || r.casualPct || r.corePct);
  const long = rs.some((r) => r.tailPct || r.franchisePct);
  return buzz && long ? 'Launch buzz and long-lasting sales' : buzz ? 'Launch buzz' : long ? 'Long-lasting sales' : 'Steady sales';
}

// Everything for one card. shipped(genre, elementId) → has a released game used that pairing?
export function ideaInfo(element, { genre = null, shipped = () => false } = {}) {
  const fit = fitGrade(element, genre, element.family !== 'genre' && genre ? shipped(genre, element.id) : false);
  return { fit, who: whoIsGood(element), difficulty: difficulty(element), playsTo: playsTo(element) };
}
