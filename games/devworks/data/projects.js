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

// Scopes (bible §12; Milestone 7). team = the usual core team: fewer than min still works, just slower (spec §9:
// never hard-block); more than max is not allowed. Only the five lead slots exist until hiring (Milestone 13).
// stage = the studio stage that opens it (bible §35: S2 Indie Loft … S5 Global Campus). Stages arrive in Milestones
// 11 / 22, so for now Standard and up show locked with the reason (?debug=1 "Unlock all" opens them).
export const SCOPES = [
  { id: 'tiny', name: 'Tiny', team: { min: 2, max: 3 }, stage: 1, line: 'Very short, low cost: a first experiment.' },
  { id: 'small', name: 'Small', team: { min: 3, max: 5 }, stage: 1, line: 'Short, low cost: indie bread and butter.' },
  { id: 'standard', name: 'Standard', team: { min: 5, max: 8 }, stage: 2, line: 'Medium length and cost: the midgame default.' },
  { id: 'large', name: 'Large', team: { min: 8, max: 14 }, stage: 3, line: 'Long and costly: a Professional Studio game.' },
  { id: 'blockbuster', name: 'Blockbuster', team: { min: 12, max: 20 }, stage: 4, line: 'Very long, very costly: Corporate HQ.' },
  { id: 'mega', name: 'Mega', team: { min: 15, max: 28 }, stage: 5, line: 'Most of a year, extreme cost: Global Campus.' },
];
export const STAGE_NAMES = { 1: 'Rented Office', 2: 'Indie Loft', 3: 'Professional Studio', 4: 'Corporate HQ', 5: 'Global Campus' };
export const scopeById = (id) => SCOPES.find((s) => s.id === id) ?? null;

// Audio package (bible §12, plan review A4). AUDIO comes only from this. Standard / Premium come later.
export const AUDIO_PACKAGES = [
  { id: 'none', name: 'None', line: 'Silent, or free sounds.' },
  { id: 'basic', name: 'Basic', line: 'A few tunes and sound effects.' },
];

// Budget focus (bible §12; Milestone 7). The numbers are in balance.js (PROJECT_BALANCE.budgetFocus).
// Balanced stays first: it is the default.
export const BUDGET_FOCUS = [
  { id: 'balanced', name: 'Balanced', line: 'The baseline: no bonus, no risk.' },
  { id: 'lean', name: 'Lean', line: '−20% daily cost, −8% quality, +5% bugs.' },
  { id: 'pushQuality', name: 'Push Quality', line: '+25% cost, +10% quality, +10% Energy drain.' },
  { id: 'marketingHeavy', name: 'Marketing', line: '−5% dev cost, +15% Hype, +3% bugs.' },
  { id: 'experimental', name: 'Experimental', line: '+12% Innovation, +8% slip and bug risk.' },
];

// The choices at Beta and Gold (bible §20; Milestone 7). Effects are in balance.js (PROJECT_BALANCE.decisions).
export const DECISIONS = [
  { id: 'ship', name: 'Ship', beta: 'Carry on to Gold Master as planned.', gold: 'Finish the game now.' },
  { id: 'delay', name: 'Delay', beta: 'More time to fix and polish. Later, and Hype drops.', gold: 'More time to fix and polish. Later, and Hype drops.' },
  { id: 'cut', name: 'Cut Feature', beta: 'Drop the feature package: fewer bugs, less to do, less Innovation and Hype.', gold: 'Drop the feature package: fewer bugs, less Innovation and Hype.' },
  { id: 'outsource', name: 'Outsource QA', beta: 'Pay a QA company: most bugs gone fast, but Polish is capped.', gold: 'Pay a QA company: most bugs gone fast, but Polish is capped.' },
  { id: 'crunch', name: 'Crunch', beta: 'Faster for two weeks. Hurts Energy and Morale, more bugs. Never required.', gold: 'Nothing left to rush.' },
];
export const DECISION_POINTS = { beta: 'Beta', gold: 'Gold' };

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
