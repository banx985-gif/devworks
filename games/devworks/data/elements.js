// The game element catalogue (bible §13): all 50 elements in the six recipe families. Plain data only.
// art = image key; the file is assets/images/elements/<art>.png (a missing file shows its placeholder).
// Art Direction ids are ADR01–07 (plan review: ART01–07 clashed with the Artist staff ids).
//
// Milestone 6 — unlock rules (the bible gives none; plan review B, M6 row). unlock = what opens the element; every
// condition in it must be met:
//   { start: true }            open from the first day
//   { rank: 'D' }              the studio has reached that rank (it never drops)
//   { year: 2 }                that calendar year has begun
//   { research: 'ENG3' }       that research topic is done (data/research.js; the tree comes in Milestone 12)
// Once open, an element stays open for the run (core UnlockRunner, saved).
//
// needs = what a recipe must also have for the element to be legal, e.g. a 3D art direction needs 3D technology:
//   { technology: ['TEC03', …] }   one of these in that slot (needsText: the short words shown on screen)
// A legal recipe = one open element in each of the six slots, and every chosen element's needs met.

// The six recipe slots, in order (bible §12).
export const FAMILIES = [
  { id: 'genre', name: 'Genre', prefix: 'GEN', count: 10 },
  { id: 'theme', name: 'Theme', prefix: 'THM', count: 10 },
  { id: 'gameplay', name: 'Core Gameplay', prefix: 'PLY', count: 8 },
  { id: 'technology', name: 'Technology', prefix: 'TEC', count: 8 },
  { id: 'artDirection', name: 'Art Direction', prefix: 'ADR', count: 7 },
  { id: 'feature', name: 'Feature Package', prefix: 'FEA', count: 7 },
];

const START = { start: true };
const TECH_3D = ['TEC03', 'TEC04', 'TEC06']; // Early 3D, Advanced 3D, Streaming World
const TECH_3D_ADVANCED = ['TEC04', 'TEC06'];

export const ELEMENTS = [
  // Genre
  { id: 'GEN01', family: 'genre', name: 'Platformer', art: 'element_gen01', unlock: START },
  { id: 'GEN02', family: 'genre', name: 'RPG', art: 'element_gen02', unlock: { year: 2 } },
  { id: 'GEN03', family: 'genre', name: 'Strategy', art: 'element_gen03', unlock: { year: 3 } },
  { id: 'GEN04', family: 'genre', name: 'Simulation', art: 'element_gen04', unlock: START },
  { id: 'GEN05', family: 'genre', name: 'Racing', art: 'element_gen05', unlock: { rank: 'C' } },
  { id: 'GEN06', family: 'genre', name: 'Action', art: 'element_gen06', unlock: { rank: 'D' } },
  { id: 'GEN07', family: 'genre', name: 'Adventure', art: 'element_gen07', unlock: { rank: 'D' } },
  { id: 'GEN08', family: 'genre', name: 'Puzzle', art: 'element_gen08', unlock: START },
  { id: 'GEN09', family: 'genre', name: 'Sports', art: 'element_gen09', unlock: { rank: 'C' } },
  { id: 'GEN10', family: 'genre', name: 'Horror', art: 'element_gen10', unlock: { year: 4 } },
  // Theme
  { id: 'THM01', family: 'theme', name: 'Fantasy', art: 'element_thm01', unlock: START },
  { id: 'THM02', family: 'theme', name: 'Science Fiction', art: 'element_thm02', unlock: { year: 2 } },
  { id: 'THM03', family: 'theme', name: 'Modern Life', art: 'element_thm03', unlock: START },
  { id: 'THM04', family: 'theme', name: 'Historical', art: 'element_thm04', unlock: { year: 2 } },
  { id: 'THM05', family: 'theme', name: 'Space', art: 'element_thm05', unlock: { rank: 'C' } },
  { id: 'THM06', family: 'theme', name: 'Monsters', art: 'element_thm06', unlock: { rank: 'D' } },
  { id: 'THM07', family: 'theme', name: 'Crime', art: 'element_thm07', unlock: { year: 3 } },
  { id: 'THM08', family: 'theme', name: 'Farming', art: 'element_thm08', unlock: { rank: 'D' } },
  { id: 'THM09', family: 'theme', name: 'School', art: 'element_thm09', unlock: START },
  { id: 'THM10', family: 'theme', name: 'Post-Apocalypse', art: 'element_thm10', unlock: { rank: 'B' } },
  // Core Gameplay
  { id: 'PLY01', family: 'gameplay', name: 'Exploration', art: 'element_ply01', unlock: START },
  { id: 'PLY02', family: 'gameplay', name: 'Combat', art: 'element_ply02', unlock: { rank: 'D' } },
  { id: 'PLY03', family: 'gameplay', name: 'Management', art: 'element_ply03', unlock: { rank: 'D' } },
  { id: 'PLY04', family: 'gameplay', name: 'Building', art: 'element_ply04', unlock: { year: 3 } },
  { id: 'PLY05', family: 'gameplay', name: 'Collection', art: 'element_ply05', unlock: START },
  { id: 'PLY06', family: 'gameplay', name: 'Narrative Choice', art: 'element_ply06', unlock: { year: 2 } },
  { id: 'PLY07', family: 'gameplay', name: 'Competitive', art: 'element_ply07', unlock: { rank: 'C' } },
  { id: 'PLY08', family: 'gameplay', name: 'Sandbox', art: 'element_ply08', unlock: { rank: 'B' } },
  // Technology: each one is a research topic (bible §37), Licensed 2D aside.
  { id: 'TEC01', family: 'technology', name: 'Licensed 2D', art: 'element_tec01', unlock: START },
  { id: 'TEC02', family: 'technology', name: 'Custom 2D', art: 'element_tec02', unlock: { research: 'ENG2' } },
  { id: 'TEC03', family: 'technology', name: 'Early 3D', art: 'element_tec03', unlock: { research: 'ENG3' } },
  { id: 'TEC04', family: 'technology', name: 'Advanced 3D', art: 'element_tec04', unlock: { research: 'ART4', rank: 'B' } },
  { id: 'TEC05', family: 'technology', name: 'Online Framework', art: 'element_tec05', unlock: { research: 'ENG4' } },
  { id: 'TEC06', family: 'technology', name: 'Streaming World', art: 'element_tec06', unlock: { research: 'ENG5' } },
  { id: 'TEC07', family: 'technology', name: 'Procedural Systems', art: 'element_tec07', unlock: { research: 'GAM3' } },
  { id: 'TEC08', family: 'technology', name: 'Neural Tools', art: 'element_tec08', unlock: { research: 'ENG6' } },
  // Art Direction: the 3D looks need 3D technology in the recipe.
  { id: 'ADR01', family: 'artDirection', name: 'Pixel', art: 'element_adr01', unlock: START },
  { id: 'ADR02', family: 'artDirection', name: 'Cartoon', art: 'element_adr02', unlock: START },
  { id: 'ADR03', family: 'artDirection', name: 'Stylised 3D', art: 'element_adr03', unlock: { research: 'ART2' }, needs: { technology: TECH_3D }, needsText: '3D technology' },
  { id: 'ADR04', family: 'artDirection', name: 'Realistic 3D', art: 'element_adr04', unlock: { research: 'ART4' }, needs: { technology: TECH_3D_ADVANCED }, needsText: 'Advanced 3D or Streaming' },
  { id: 'ADR05', family: 'artDirection', name: 'Hand-Painted', art: 'element_adr05', unlock: { rank: 'D' } },
  { id: 'ADR06', family: 'artDirection', name: 'Low-Poly', art: 'element_adr06', unlock: { research: 'ART2' }, needs: { technology: TECH_3D }, needsText: '3D technology' },
  { id: 'ADR07', family: 'artDirection', name: 'Mixed Media', art: 'element_adr07', unlock: { research: 'ART6' } },
  // Feature Package
  { id: 'FEA01', family: 'feature', name: 'Single-Player Focus', art: 'element_fea01', unlock: START },
  { id: 'FEA02', family: 'feature', name: 'Co-op', art: 'element_fea02', unlock: { rank: 'D' } },
  { id: 'FEA03', family: 'feature', name: 'Competitive Online', art: 'element_fea03', unlock: { research: 'ENG4' }, needs: { technology: ['TEC05'] }, needsText: 'Online Framework' },
  { id: 'FEA04', family: 'feature', name: 'Open World', art: 'element_fea04', unlock: { research: 'GAM5' }, needs: { technology: [...TECH_3D, 'TEC07'] }, needsText: '3D or Procedural tech' },
  { id: 'FEA05', family: 'feature', name: 'Mod Support', art: 'element_fea05', unlock: { year: 4 } },
  { id: 'FEA06', family: 'feature', name: 'User Creation', art: 'element_fea06', unlock: { research: 'GAM6' } },
  { id: 'FEA07', family: 'feature', name: 'Procedural Replayability', art: 'element_fea07', unlock: { research: 'GAM3' } },
];

// Open at the start of a run: 3 genres × 3 themes × 2 core gameplays × 1 technology × 2 art directions × 1 feature
// = 36 legal recipes (bible §13 asks for at least 20). The Milestone 3 six come first (tests and old saves use them).
const FIRST_SIX = ['GEN08', 'THM09', 'PLY05', 'TEC01', 'ADR02', 'FEA01'];
export const STARTING_UNLOCKED = [...FIRST_SIX, ...ELEMENTS.filter((e) => e.unlock.start && !FIRST_SIX.includes(e.id)).map((e) => e.id)];

export const elementById = (id) => ELEMENTS.find((e) => e.id === id) ?? null;
export const elementsOf = (family) => ELEMENTS.filter((e) => e.family === family);

// Why a chosen element is not legal in this recipe (null = fine). recipe: { genre: 'GEN08', … }.
export function needsProblem(el, recipe) {
  for (const [family, ids] of Object.entries(el?.needs ?? {})) {
    if (!ids.includes(recipe[family])) {
      const fam = FAMILIES.find((f) => f.id === family);
      return `${el.name} needs ${el.needsText ?? `${ids.map((id) => elementById(id).name).join(' / ')} ${fam.name.toLowerCase()}`}`;
    }
  }
  return null;
}

// Every problem with a full or partial recipe's needs, in slot order.
export const recipeProblems = (recipe) => FAMILIES.map((f) => needsProblem(elementById(recipe[f.id]), recipe)).filter(Boolean);

// Every legal recipe that can be made from a set of open element ids (tests; the count grows fast, so keep it small).
export function legalRecipes(open) {
  const lists = FAMILIES.map((f) => elementsOf(f.id).filter((e) => open.has(e.id)));
  const out = [];
  const walk = (i, recipe) => {
    if (i === FAMILIES.length) {
      if (!recipeProblems(recipe).length) out.push({ ...recipe });
      return;
    }
    for (const e of lists[i]) walk(i + 1, { ...recipe, [FAMILIES[i].id]: e.id });
  };
  walk(0, {});
  return out;
}
