// Element mastery (Milestone 40h, Kairosoft rule 6). Numbers in data/mastery.js.
//
// Every element counts the released games that used it in this run (one count per game, at its launch). At 3 / 6 / 10
// uses it reaches mastery level 1 / 2 / 3. A game fixes its recipe's mastery when it starts (like a combo):
//   forRecipe(recipe) → { bugPct, output: { key: points }, lines } — bugPct: −5% per level of each element's sixth of
//   the bugs; output: +1 per level on the output each element feeds most. A Remaster / Sequel reads it the same way.
// Nothing here reads or writes a secret, an award or the grade rules.
//
// Saved in the run (`mastery`: { uses }); a save from before it (load(null)) counts the released games in the catalogue.
// newGame() (a new run, NG+ too) starts from nothing.
// Events: 'mastery:level' { element, level, uses } when an element reaches a new level.
import { MASTERY as M } from '../../data/mastery.js';
import { elementById, FAMILIES } from '../../data/elements.js';
import { REVIEW_BALANCE } from '../../data/balance.js';

// The output an element feeds most.
export function feedsOf(id) {
  if (M.feedsById[id]) return M.feedsById[id];
  const el = elementById(id);
  if (!el) return null;
  if (el.family === 'genre') {
    const w = REVIEW_BALANCE.genreWeights[id] ?? REVIEW_BALANCE.genreWeights.default;
    return Object.entries(w).filter(([k]) => k !== 'audio').sort((a, b) => b[1] - a[1])[0][0];
  }
  return M.feeds[el.family] ?? null;
}

export const levelFor = (uses) => M.levels.filter((n) => uses >= n).length;

const OUTPUT_NAMES = { gameplay: 'Gameplay', graphics: 'Graphics', story: 'Story', innovation: 'Innovation', polish: 'Polish', audienceFit: 'Audience Fit', audio: 'Audio' };

// Pure: what one element at this level gives.
export function effectOf(id, level) {
  const lv = Math.max(0, Math.min(M.levels.length, level));
  return { bugPct: -(M.bugPctPerLevel * lv) / M.slots, output: lv ? { [feedsOf(id)]: M.outputPerLevel * lv } : {}, level: lv };
}

// The plain line on an element's card ("Mastered: fewer bugs, +2 Gameplay").
export function masteryLine(id, level) {
  if (!level) return null;
  return `Mastered: fewer bugs, +${M.outputPerLevel * level} ${OUTPUT_NAMES[feedsOf(id)] ?? feedsOf(id)}`;
}

export function createMastery({ bus, projects }) {
  let uses = {};
  const recipeIds = (recipe) => FAMILIES.map((f) => recipe?.[f.id]).filter(Boolean);
  function count(record) {
    for (const id of recipeIds(record?.result?.recipe)) uses[id] = (uses[id] ?? 0) + 1;
  }
  bus.on('game:released', ({ record } = {}) => {
    if (!record?.result?.recipe) return;
    const before = Object.fromEntries(recipeIds(record.result.recipe).map((id) => [id, levelFor(uses[id] ?? 0)]));
    count(record);
    for (const [id, lv] of Object.entries(before)) {
      const now = levelFor(uses[id]);
      if (now > lv) bus.emit('mastery:level', { element: elementById(id), level: now, uses: uses[id] });
    }
  });
  function rebuild() {
    uses = {};
    for (const r of projects.catalogue.list()) if (r.release) count(r);
  }
  return {
    uses: (id) => uses[id] ?? 0,
    level: (id) => levelFor(uses[id] ?? 0),
    // How many more released games until the next level (null at the top).
    toNext: (id) => {
      const n = M.levels.find((x) => (uses[id] ?? 0) < x);
      return n == null ? null : n - (uses[id] ?? 0);
    },
    line: (id) => masteryLine(id, levelFor(uses[id] ?? 0)),
    forRecipe(recipe) {
      const out = { bugPct: 0, output: {}, levels: {} };
      for (const id of recipeIds(recipe)) {
        const fx = effectOf(id, levelFor(uses[id] ?? 0));
        if (!fx.level) continue;
        out.levels[id] = fx.level;
        out.bugPct += fx.bugPct;
        for (const [k, v] of Object.entries(fx.output)) out.output[k] = (out.output[k] ?? 0) + v;
      }
      out.bugPct = +out.bugPct.toFixed(4);
      return out;
    },
    newGame() {
      uses = {};
    },
    serialize: () => ({ uses: { ...uses } }),
    load(data) {
      if (data?.uses) uses = { ...data.uses };
      else rebuild(); // a save from before Milestone 40h: its released games so far
    },
  };
}
