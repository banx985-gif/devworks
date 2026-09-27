// DEVWORKS content check (Milestone 6) on core DataValidator: every element, genre weight, cover mapping and unlock
// reference points at something real. Runs in the tests (tests/devworks/m6.test.mjs) and at boot with ?debug=1
// (problems go to the debug log). Never throws.
//   const v = checkGameData();  v.report() → { ok, errors, warnings, counts }
//   await v.checkArt()           then also checks every queued image (element icons, filed covers) exists
import { DataValidator } from '../../../../core/DataValidator.js';
import { FAMILIES, ELEMENTS, STARTING_UNLOCKED, elementsOf } from '../../data/elements.js';
import { COVER_FAMILIES, PARKED_COVERS, FILED_COVERS, coverArt, coverFamilyFor, coverFor } from '../../data/covers.js';
import { RESEARCH } from '../../data/research.js';
import { REVIEW_BALANCE, FAME } from '../../data/balance.js';
import { OUTPUTS } from '../../data/projects.js';

// Element icons still parked in assets/images/_spares (shown as placeholders on purpose).
export const PARKED_ELEMENTS = ['element_gen01', 'element_ply08'];

export function checkGameData({ fetchFn } = {}) {
  const v = new DataValidator(fetchFn ? { fetchFn } : {});
  const familyIds = new Set(FAMILIES.map((f) => f.id));
  const elementIds = v.uniqueIds('elements', ELEMENTS);
  const researchIds = v.uniqueIds('research', RESEARCH);
  const rankIds = new Set(FAME.ranks.map((r) => r.id));
  const outputKeys = OUTPUTS.map((o) => o.key);

  // Families: the bible §12 counts, ids with the family's prefix.
  v.check(ELEMENTS.length === 50, `elements: ${ELEMENTS.length}, the bible has 50`);
  for (const f of FAMILIES) {
    const list = elementsOf(f.id);
    v.check(list.length === f.count, `family ${f.id}: ${list.length} elements, expected ${f.count}`);
    for (const e of list) v.check(e.id.startsWith(f.prefix), `element ${e.id}: not a ${f.prefix} id`);
  }

  // Elements: family, name, art, unlock rule and needs all point at something real.
  for (const e of ELEMENTS) {
    const o = `element ${e.id}`;
    v.ref(o, 'family', e.family, familyIds);
    v.check(typeof e.name === 'string' && e.name.length > 0, `${o}: no name`);
    v.check(e.art === `element_${e.id.toLowerCase()}`, `${o}: art key "${e.art}" does not match its id`);
    v.art(o, `assets/images/elements/${e.art}.png`, { placeholder: PARKED_ELEMENTS.includes(e.art) });
    const u = e.unlock;
    if (!v.check(u && typeof u === 'object', `${o}: no unlock rule`)) continue;
    const keys = Object.keys(u);
    v.check(keys.length > 0 && keys.every((k) => ['start', 'rank', 'year', 'research'].includes(k)), `${o}: unknown unlock rule ${JSON.stringify(u)}`);
    if (u.start) v.check(keys.length === 1, `${o}: a start element has no other conditions`);
    if (u.rank !== undefined) v.ref(o, 'rank', u.rank, rankIds);
    if (u.year !== undefined) v.check(Number.isInteger(u.year) && u.year >= 1 && u.year <= 20, `${o}: year ${u.year} is not 1–20`);
    if (u.research !== undefined) v.ref(o, 'research', u.research, researchIds);
    v.check(!!u.start === STARTING_UNLOCKED.includes(e.id), `${o}: start rule and STARTING_UNLOCKED disagree`);
    for (const [fam, ids] of Object.entries(e.needs ?? {})) {
      v.ref(o, 'needs family', fam, familyIds);
      v.check(fam !== e.family, `${o}: needs its own family`);
      for (const id of ids) {
        if (v.ref(o, 'needed element', id, elementIds)) v.check(ELEMENTS.find((x) => x.id === id).family === fam, `${o}: needs ${id}, which is not a ${fam}`);
      }
    }
  }
  // Every Technology is tied to research (bible §37), Licensed 2D aside (it is the start technology).
  for (const e of elementsOf('technology')) v.check(e.unlock.start || !!e.unlock.research, `element ${e.id}: technology without a research topic`);

  // Genre weights: all 10 genres, every output, positive numbers.
  const W = REVIEW_BALANCE.genreWeights;
  for (const g of [...elementsOf('genre').map((e) => e.id), 'default']) {
    const w = W[g];
    if (!v.check(!!w, `genre weights: none for ${g}`)) continue;
    for (const k of outputKeys) v.check(typeof w[k] === 'number' && w[k] > 0 && w[k] <= 3, `genre weights ${g}: ${k} = ${w[k]}`);
    for (const k of Object.keys(w)) v.check(outputKeys.includes(k), `genre weights ${g}: unknown output "${k}"`);
  }
  for (const g of Object.keys(W)) if (g !== 'default') v.ref('genre weights', 'genre', g, elementIds);

  // Covers: 30 families, each one's genres / themes / arts real and of the right family, fallbacks real, the parked
  // ones all have a filed picture to show, and every Genre × Theme × Art Direction resolves to a filed picture.
  const coverIds = v.uniqueIds('covers', COVER_FAMILIES);
  v.check(COVER_FAMILIES.length === 30, `covers: ${COVER_FAMILIES.length} families, the bible has 30`);
  for (const f of COVER_FAMILIES) {
    const o = `cover ${f.id}`;
    v.check(/^cover_\d\d$/.test(f.id), `${o}: bad id`);
    if (!f.override) {
      for (const [list, fam] of [[f.genres, 'genre'], [f.themes, 'theme'], [f.arts, 'artDirection']]) {
        if (!v.check(Array.isArray(list), `${o}: no ${fam} list`)) continue;
        for (const id of list) if (v.ref(o, fam, id, elementIds)) v.check(ELEMENTS.find((x) => x.id === id).family === fam, `${o}: ${id} is not a ${fam}`);
      }
      v.check(f.genres.length + f.themes.length + f.arts.length > 0, `${o}: matches nothing`);
    }
    if (f.fallback) v.ref(o, 'fallback cover', f.fallback, coverIds);
    if (PARKED_COVERS.includes(f.id)) v.check(!PARKED_COVERS.includes(coverArt(f.id)), `${o}: parked, and its fallback chain never reaches a filed cover`);
  }
  for (const id of PARKED_COVERS) v.ref('parked covers', 'cover', id, coverIds);
  for (const id of FILED_COVERS) v.art(`cover ${id}`, `assets/images/covers/${id}.png`);
  const reached = new Set();
  for (const genre of elementsOf('genre')) {
    for (const theme of elementsOf('theme')) {
      for (const artDirection of elementsOf('artDirection')) {
        const recipe = { genre: genre.id, theme: theme.id, artDirection: artDirection.id };
        const fam = coverFamilyFor(recipe);
        reached.add(fam);
        v.check(FILED_COVERS.includes(coverFor(recipe)), `cover for ${genre.id}/${theme.id}/${artDirection.id}: "${coverFor(recipe)}" is not a filed picture`);
      }
    }
  }
  for (const f of COVER_FAMILIES) if (!f.override) v.check(reached.has(f.id), `cover ${f.id}: no recipe ever picks it`);
  return v;
}
