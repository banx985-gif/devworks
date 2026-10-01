// The Menu (Milestone 40e, series common feature §1; core/ui/MenuSheet): every screen in plain words, in the card's
// groups. A row opens the very same sheet / screen the art and the bottom bar open (main.js MENU_OPEN: one code path).
// Locked rows are greyed with their reason (main.js menuState). Plain data only.
const row = (id, label, line, icon) => ({ id, label, line, icon });
export const MENU_GROUPS = [
  { title: 'Create', rows: [
    row('newGame', 'New Game', 'Pick a recipe, a scope and a team, and make a game', 'dev_ui_01'),
    row('requests', 'Requests', 'Games publishers, platforms, sponsors and fans ask for', 'business_ui_03'),
    row('engines', 'Engines', 'Build your own engine to lift every game made on it', 'dev_ui_11'),
    row('hardware', 'Hardware', 'Design a console prototype from six parts (optional)', 'dev_ui_26'),
    row('consoles', 'Consoles', 'Launch your own console and run it as a platform', 'dev_ui_29'),
  ] },
  { title: 'Staff', rows: [
    row('roster', 'Roster', 'Everyone in the studio: stats, Energy, training, history', 'dev_ui_02'),
    row('hire', 'Hire', 'The Recruitment Desk: channels and candidates', 'dev_ui_02'),
    row('training', 'Training', 'Courses that raise a stat; mentoring by an Elite', 'dev_ui_02'),
    row('items', 'Studio Store (items)', 'Items to give your staff: each raises a stat for good', 'dev_ui_41'),
  ] },
  { title: 'Research', rows: [row('research', 'Research', 'Spend Research Points on new elements, facilities and scopes', 'dev_ui_03')] },
  { title: 'Build / Facilities', rows: [
    row('build', 'Build Mode', 'Buy, move, upgrade and sell facilities', 'facility_f02'),
    row('studioStage', 'Studio', 'Move to a bigger studio: more floor, staff and game lanes', 'facility_f01'),
  ] },
  { title: 'Compete', rows: [
    row('awards', 'Awards', 'C01–C10, your trophies and last year’s results', 'award_trophy_01'),
    row('rivals', 'Rivals', 'The other studios and their games', 'rival_logo_r01'),
    row('rankings', 'Rankings', 'Studios by awards and sales', 'dev_ui_20'),
  ] },
  { title: 'Business', rows: [
    row('ledger', 'Ledger', 'Every Credit in and out, month by month', 'dev_reward_01'),
    row('catalogue', 'Catalogue', 'Every game you made; support and ports', 'dev_vfx_07'),
    row('marketing', 'Marketing', 'Campaigns, Hype and the release calendar', 'business_ui_05'),
    row('publishers', 'Publishers', 'Deals that pay up front for a share', 'business_ui_01'),
    row('contracts', 'Contracts', 'Short jobs for other studios', 'business_ui_03'),
    row('sponsors', 'Sponsors', 'Six-month deals with perks, promises and gifts', 'business_ui_02'),
    row('platforms', 'Platform Market', 'Which platforms are out, and who plays on them', 'dev_ui_09'),
    row('store', 'Store', 'Remove Ads, Studio Tokens, VIP and free rewards', 'dev_reward_01'),
  ] },
  { title: 'Records', rows: [
    row('achievements', 'Achievements', 'What you have earned, kept across every studio', 'dev_ui_04'),
    row('hallOfFame', 'Hall of Fame', 'Your studio’s legends and records', 'dev_reward_10'),
    row('discoveries', 'Discovery Archive', 'Combos and secrets you have found', 'dev_ui_30'),
    row('rumours', 'Rumours', 'Whispers about secrets', 'dev_ui_29'),
  ] },
  { title: 'More', rows: [
    row('help', 'Help', 'How every system works, and every walkthrough', 'dev_ui_05'),
    row('settings', 'Settings', 'Sound, graphics, text size, the Menu button and hints', 'dev_ui_05'),
    row('mainMenu', 'Main Menu', 'Saves your studio, then back to the title screen', 'dev_brand_01'),
  ] },
];
export const MENU_TEXT = { title: 'Menu', subtitle: 'Every screen in the studio. Tapping the art works too.', button: 'Menu', icon: 'dev_ui_menu' }; // dev_ui_menu: drawn by code (main.js)

// Every facility's main action (its sheet's first button), as a Menu row id: the sheet says what the facility does and
// offers what it is for (series common feature §1).
export const FACILITY_ACTIONS = {
  F01: { row: 'newGame', label: 'Start a game' },
  F02: { row: 'training', label: 'Train someone' },
  F03: { row: 'training', label: 'Train someone' },
  F04: { row: 'training', label: 'Train someone' },
  F05: { row: 'training', label: 'Train someone' },
  F06: { row: 'projects', label: 'Project Board' },
  F07: { row: 'catalogue', label: 'Patch a game' },
  F08: { row: 'items', label: 'Give an item' },
  F09: { row: 'hire', label: 'Hire' },
  F10: { row: 'newGame', label: 'Plan a new game' },
  F11: { row: 'research', label: 'Research' },
  F12: { row: 'newGame', label: 'Start a game' },
  F13: { row: 'marketing', label: 'Plan marketing' },
  F14: { row: 'catalogue', label: 'See your games' },
  F15: { row: 'awards', label: 'Awards' },
  F16: { row: 'newGame', label: 'Start a game' },
  F17: { row: 'catalogue', label: 'Patch a game' },
  F18: { row: 'engines', label: 'Engines' },
  F19: { row: 'newGame', label: 'Start a game' },
  F20: { row: 'newGame', label: 'Start a game' },
  F21: { row: 'newGame', label: 'Start a game' },
  F22: { row: 'newGame', label: 'Start a game' },
  F23: { row: 'catalogue', label: 'See your games' },
  F24: { row: 'marketing', label: 'Plan marketing' },
  F25: { row: 'engines', label: 'Engines' },
  F26: { row: 'publishingOffice', label: 'Publishing Office' },
  F27: { row: 'publishers', label: 'Publishers' },
  F28: { row: 'hardware', label: 'Hardware' },
  F29: { row: 'consoles', label: 'Consoles' },
  F30: { row: 'platforms', label: 'Platform Market' },
  F31: { row: 'platforms', label: 'Platform Market' },
  F32: { row: 'storefront', label: 'Storefront' },
  F33: { row: 'hallOfFame', label: 'Hall of Fame' },
  F34: { row: 'research', label: 'Research' },
  F35: { row: 'rumours', label: 'Rumours' },
};

// The next-step hint line under the date (core/ui/HintLine): the first that applies is shown (main.js decides when).
export const NEXT_HINTS = {
  firstGame: 'Start your first game: tap Create',
  decision: 'A decision is waiting: tap to choose',
  release: 'Your game is ready: release it',
  request: 'A request has arrived',
  drop: 'A reward is waiting: tap to open it',
  items: (n) => `${n} item${n === 1 ? '' : 's'} to give your staff`,
  laneFree: 'The team is free: start a new game',
  research: 'Research is idle: pick a topic',
  walks: (n) => `${n} walkthrough${n === 1 ? '' : 's'} waiting in Help`,
};
