// Covers (Milestone 3 stub). A finished game gets a cover picked from its recipe; the title is drawn over it in code,
// never baked into the art. For now only the genre decides, and only Puzzle has one; the full Genre / Theme /
// Art Direction table comes in Milestone 6 (plan review B).
export const COVER_BY_GENRE = { GEN08: 'cover_08' };
export const DEFAULT_COVER = 'cover_08';
export const coverFor = (recipe) => COVER_BY_GENRE[recipe.genre] ?? DEFAULT_COVER;
