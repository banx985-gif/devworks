// Franchises (Milestone 10, bible §12 project types, §18 franchise / IP system). Plain data only; the numbers are in
// data/balance.js (FRANCHISE_BALANCE).
//
// Project types: Original starts a new franchise (IP). The others belong to one:
//   needs 'ip'    — pick a franchise (Sequel keeps its genre; Spin-off keeps its theme but must change the genre)
//   needs 'entry' — pick a released game of a franchise that is old enough (Remake keeps its genre, theme and
//                   gameplay; Remaster keeps the whole recipe and the scope)
// locks: the recipe slots copied from the franchise (ip) or the chosen game (entry) that can't be changed.
export const PROJECT_TYPES = [
  { id: 'original', name: 'Original', art: 'dev_ui_07', needs: null, locks: [], line: 'A brand-new game. It starts a new franchise.' },
  { id: 'sequel', name: 'Sequel', art: 'dev_ui_13', needs: 'ip', locks: ['genre'], line: 'The next entry: same genre. Its fans bring Hype and players.' },
  { id: 'spinoff', name: 'Spin-off', art: 'dev_ui_12', needs: 'ip', locks: ['theme'], line: 'Same world, a new genre. Half the fan boost, half the fatigue.' },
  { id: 'remake', name: 'Remake', art: 'dev_ui_14', needs: 'entry', locks: ['genre', 'theme', 'gameplay'], line: 'Rebuild an old game with new technology and a new look.' },
  { id: 'remaster', name: 'Remaster', art: 'dev_ui_14', needs: 'entry', locks: ['genre', 'theme', 'gameplay', 'technology', 'artDirection', 'feature'], line: 'Polish up an old game: same recipe and scope, quick and cheap.' },
];
export const projectTypeById = (id) => PROJECT_TYPES.find((t) => t.id === id) ?? PROJECT_TYPES[0];

// Franchise statuses (bible §18), lowest first. points = lifetime copies × review average ÷ 70 (FRANCHISE_BALANCE).
// Legendary also needs `entries` released games and a review average of at least `reviewAvg`.
export const FRANCHISE_STATUSES = [
  { id: 'new', name: 'New', points: 0 },
  { id: 'known', name: 'Known', points: 1000 },
  { id: 'popular', name: 'Popular', points: 4000 },
  { id: 'major', name: 'Major', points: 12000 },
  { id: 'iconic', name: 'Iconic', points: 30000 },
  { id: 'legendary', name: 'Legendary', points: 70000, entries: 4, reviewAvg: 80 },
];

// Legendary shows the Franchise Crown.
export const FRANCHISE_ART = { archive: 'dev_ui_12', crown: 'dev_reward_08', fatigue: 'dev_ui_14' };
