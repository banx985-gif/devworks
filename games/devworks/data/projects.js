// Game projects (Milestone 3): the choices on the New Game Project screen and the names the player sees.
// Plain data only; every number is in balance.js (PROJECT_BALANCE), formulas in src/systems/gameProject.js.

// The five project stages. In code they are phases (plan review A7); on screen they are "milestones".
export const PHASE_NAMES = {
  prototype: 'Prototype',
  verticalSlice: 'Vertical Slice',
  production: 'Production',
  alphaBeta: 'Alpha / Beta',
  goldMaster: 'Gold Master',
};

// Only Tiny for now (bible §12). team = how many lead slots it uses.
export const SCOPES = [{ id: 'tiny', name: 'Tiny', team: { min: 2, max: 3 }, line: 'Very short, low cost: a first experiment.' }];

// Audio package (bible §12, plan review A4). AUDIO comes only from this. Standard / Premium come later.
export const AUDIO_PACKAGES = [
  { id: 'none', name: 'None', line: 'Silent, or free sounds.' },
  { id: 'basic', name: 'Basic', line: 'A few tunes and sound effects.' },
];

// Budget focus: Balanced only for now (bible §12).
export const BUDGET_FOCUS = [{ id: 'balanced', name: 'Balanced', line: 'The baseline: no bonus, no risk.' }];

// Core team: one lead slot per role (bible §9), in this order.
export const LEAD_ROLES = ['PRG', 'DSN', 'ART', 'WRT', 'PRO'];

// A finished game's output stats, 0–100 (bible §14, plan review A3), in display order.
export const OUTPUTS = [
  { key: 'gameplay', label: 'GAMEPLAY' },
  { key: 'graphics', label: 'GRAPHICS' },
  { key: 'story', label: 'STORY' },
  { key: 'audio', label: 'AUDIO' },
  { key: 'innovation', label: 'INNOVATION' },
  { key: 'polish', label: 'POLISH' },
  { key: 'audienceFit', label: 'AUDIENCE FIT' },
];

// The title suggestion button: one word from each list ("Pixel Quest"). Plain words, all made up.
export const TITLE_WORDS = {
  first: ['Pixel', 'Tiny', 'Brainy', 'Clever', 'Puzzle', 'Happy', 'Lucky', 'Midnight', 'Rocket', 'Paper', 'Honey', 'Neon', 'Little', 'Magic', 'Super'],
  second: ['Quest', 'Blocks', 'School', 'Tiles', 'Club', 'Academy', 'Party', 'Garden', 'Lab', 'Puzzle', 'Friends', 'Riddle', 'Match', 'Days', 'Maze'],
};
