// Cover / key-art families (bible §16, art list §C). A finished game gets a cover picked from its recipe; the title is
// drawn over it in code, never baked into the art. Plain data; the picking rule is coverFamilyFor() below.
//
// Milestone 6 resolver (plan review B, M6 row): every family lists the Genres, Themes and Art Directions it suits.
// A recipe scores each family: genre match +COVER_SCORE.genre, theme match +theme, art direction match +art. The
// highest score wins; a tie goes to the family listed first. Families marked override are never picked by recipe:
// they are for a prestige override (a legendary franchise, a secret, PROJECT ONE…), a slot nothing fills yet.
//
// Parked art (still in assets/images/_spares): the family shows its fallback family's picture instead, never a
// broken image. Take a key out of PARKED_COVERS when its file is filed in assets/images/covers/.

export const COVER_SCORE = { genre: 4, theme: 3, art: 2 };

export const COVER_FAMILIES = [
  // Early families (art list §C, 12)
  { id: 'cover_01', name: 'Bright Platformer', genres: ['GEN01'], themes: [], arts: ['ADR01', 'ADR02'], fallback: 'cover_08' },
  { id: 'cover_02', name: 'Fantasy Quest', genres: ['GEN07'], themes: ['THM01'], arts: ['ADR02', 'ADR01'] },
  { id: 'cover_03', name: 'Strategy Map', genres: ['GEN03'], themes: [], arts: ['ADR01', 'ADR02'] },
  { id: 'cover_04', name: 'Tiny Tycoon', genres: ['GEN04'], themes: ['THM03'], arts: ['ADR01', 'ADR02'] },
  { id: 'cover_05', name: 'Street Racer', genres: ['GEN05'], themes: ['THM03'], arts: ['ADR01', 'ADR02'] },
  { id: 'cover_06', name: 'Monster Action', genres: ['GEN06'], themes: ['THM06'], arts: ['ADR01', 'ADR02'] },
  { id: 'cover_07', name: 'Space Adventure', genres: ['GEN07', 'GEN02', 'GEN06'], themes: ['THM05', 'THM02'], arts: [] },
  { id: 'cover_08', name: 'Puzzle Box', genres: ['GEN08'], themes: [], arts: [] },
  { id: 'cover_09', name: 'Farm Sim', genres: ['GEN04'], themes: ['THM08'], arts: [] },
  { id: 'cover_10', name: 'Night Horror', genres: ['GEN10'], themes: ['THM10'], arts: [] },
  { id: 'cover_11', name: 'School Story', genres: ['GEN07', 'GEN04'], themes: ['THM09'], arts: [] },
  { id: 'cover_12', name: 'Sports Arena', genres: ['GEN09'], themes: [], arts: [] },
  // Advanced families (art list batch 3, 10): mostly the 3D and painted looks.
  { id: 'cover_13', name: 'Epic RPG', genres: ['GEN02'], themes: ['THM01'], arts: ['ADR05', 'ADR03'] },
  { id: 'cover_14', name: 'Grand Strategy', genres: ['GEN03'], themes: ['THM04'], arts: ['ADR03', 'ADR04', 'ADR05'] },
  { id: 'cover_15', name: 'Management Empire', genres: ['GEN04'], themes: [], arts: ['ADR03', 'ADR04', 'ADR06'] },
  { id: 'cover_16', name: 'GT / Racing Pro', genres: ['GEN05'], themes: [], arts: ['ADR04', 'ADR03', 'ADR06'] },
  { id: 'cover_17', name: 'Action Blockbuster', genres: ['GEN06'], themes: ['THM07'], arts: ['ADR04', 'ADR03'] },
  { id: 'cover_18', name: 'Open World Adventure', genres: ['GEN07'], themes: [], arts: ['ADR04', 'ADR03', 'ADR06'] },
  { id: 'cover_19', name: 'Creator Sandbox', genres: ['GEN04'], themes: ['THM03', 'THM10'], arts: ['ADR06'] },
  { id: 'cover_20', name: 'Online Competition', genres: ['GEN09'], themes: [], arts: ['ADR04', 'ADR03'], fallback: 'cover_12' },
  { id: 'cover_21', name: 'Cinematic Story', genres: ['GEN07'], themes: ['THM07', 'THM04'], arts: ['ADR05'] },
  { id: 'cover_22', name: 'Technical Showcase', genres: [], themes: ['THM02'], arts: ['ADR04'] },
  // Final families (art list batch 5, 8): the odd, the retro and the prestige ones.
  { id: 'cover_23', name: 'Cult Weird Game', genres: ['GEN10'], themes: ['THM09', 'THM06'], arts: ['ADR07'] },
  { id: 'cover_24', name: 'Legendary Franchise', override: true },
  { id: 'cover_25', name: 'Retro Revival', genres: ['GEN02', 'GEN06', 'GEN07', 'GEN10'], themes: [], arts: ['ADR01'], fallback: 'cover_08' },
  { id: 'cover_26', name: 'Neural Experimental', genres: [], themes: ['THM02'], arts: ['ADR07'] },
  { id: 'cover_27', name: 'Prestige Mixed Media', genres: ['GEN07', 'GEN02', 'GEN03'], themes: [], arts: ['ADR07'] },
  { id: 'cover_28', name: 'Secret Crossover', override: true, fallback: 'cover_24' },
  { id: 'cover_29', name: 'PROJECT ONE', override: true },
  { id: 'cover_30', name: 'Perfect Game', override: true },
];

// Still parked in assets/images/_spares (not filed yet): shown as their fallback family.
export const PARKED_COVERS = ['cover_01', 'cover_20', 'cover_25', 'cover_28'];

export const coverFamilyById = (id) => COVER_FAMILIES.find((f) => f.id === id) ?? null;

// The art key to draw for a family: its own picture, or (while parked) the nearest filed family's, following the
// fallback chain.
export function coverArt(id) {
  let fam = coverFamilyById(id);
  for (let i = 0; fam && PARKED_COVERS.includes(fam.id) && i < COVER_FAMILIES.length; i++) fam = coverFamilyById(fam.fallback);
  return fam && !PARKED_COVERS.includes(fam.id) ? fam.id : 'cover_08';
}

// One family's score for a recipe (0 = nothing matches).
export function coverScore(fam, recipe) {
  if (fam.override) return 0;
  return (fam.genres.includes(recipe.genre) ? COVER_SCORE.genre : 0) + (fam.themes.includes(recipe.theme) ? COVER_SCORE.theme : 0) + (fam.arts.includes(recipe.artDirection) ? COVER_SCORE.art : 0);
}

// Which family a recipe gets. prestige: an override family id (unused until franchises / secrets).
export function coverFamilyFor(recipe, prestige = null) {
  if (prestige && coverFamilyById(prestige)) return prestige;
  let best = 'cover_08';
  let bestScore = 0;
  for (const fam of COVER_FAMILIES) {
    const s = coverScore(fam, recipe);
    if (s > bestScore) [best, bestScore] = [fam.id, s];
  }
  return best;
}

// The art key for a recipe's cover (what a finished game stores and draws).
export const coverFor = (recipe, prestige = null) => coverArt(coverFamilyFor(recipe, prestige));

// Every cover image that is filed (the loader asks for these; parked ones would only 404).
export const FILED_COVERS = COVER_FAMILIES.map((f) => f.id).filter((id) => !PARKED_COVERS.includes(id));
