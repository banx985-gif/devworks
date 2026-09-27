// The home screen's bars (Milestone 2): the five bottom-bar slots, the top bar's icons, the placeholder sheets and
// what drives the red attention badges. Plain data only; the bars are core/ui/TopBar.js and core/ui/BottomBar.js.

// Bottom bar, in the series order (bible §5). `line` = what will live in its sheet. Staff opens the Roster instead.
export const BOTTOM_SLOTS = [
  { id: 'create', label: 'Create', icon: 'dev_ui_01', line: 'Start new games, and later engines and hardware.' },
  { id: 'staff', label: 'Staff', icon: 'dev_ui_02', line: 'Your team: roster, hiring and training.' },
  { id: 'research', label: 'Research', icon: 'dev_ui_03', line: 'The technology tree: new genres, engines and tools.' },
  { id: 'compete', label: 'Compete', icon: 'dev_ui_04', line: 'Awards, rankings and rival studios.' },
  { id: 'business', label: 'Business', icon: 'dev_ui_05', line: 'Finance, sponsors, publishers, contracts and saving.' },
];

// Top bar icons (Batch 6 art, Milestone 4). The code-drawn coin and gem stay as stand-ins if a file is missing.
export const TOP_ICONS = { credits: 'dev_reward_01', tokens: 'dev_reward_02' };

// Inbox and Help placeholder sheets.
export const TOP_SHEETS = {
  inbox: { title: 'Inbox', line: 'News, offers, reviews and sales reports will arrive here.' },
  help: { title: 'Help', line: 'Tips and how-to guides will live here.' },
};

// Red attention badges: which rule lights each slot (null = nothing yet). Rules are named here and worked out
// by the game: 'lowCondition' = how many staff are tired or low on Morale. ?debug=1 adds a toggle that lights all.
export const BADGES = {
  create: 'decision', // Milestone 7: a game waiting for its Beta / Gold decision
  staff: 'lowCondition',
  research: null,
  compete: null,
  business: null,
  inbox: null,
};

// Status icons over a worker's head (code-drawn; shared series icons can replace them under these keys).
export const STATUS_ICONS = { tired: 'dev_status_tired', stressed: 'dev_status_stressed' };
