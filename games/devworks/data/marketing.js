// Marketing (Milestone 9, bible §21): the actions a studio can run for a game before it launches, the conventions
// (the months a Convention can happen in), and the placeholder competitor releases of the release calendar (real
// rival studios come in Milestone 19). Plain data only; the numbers are in data/balance.js (MARKETING_BALANCE).
//
// An action: cost (Credits, paid when it starts), hype (Hype points it brings, spread over `days`), from = the first
// milestone it can run in (0 Prototype, 1 Vertical Slice, 2 Production, 3 Alpha / Beta, 4 Gold Master, 5 finished and
// waiting to launch); rank = the studio rank it needs; months = only in these months of the year (conventions).
// Each runs once per game.
export const MARKETING_ACTIONS = [
  { id: 'demo', name: 'Demo', art: 'business_ui_06', cost: 400, hype: 10, days: 7, from: 1, line: 'A free slice for players to try.' },
  { id: 'trailer', name: 'Trailer', art: 'business_ui_07', cost: 900, hype: 14, days: 5, from: 2, line: 'A short video of the game in action.' },
  { id: 'convention', name: 'Convention', art: 'business_ui_08', cost: 1600, hype: 20, days: 3, from: 1, months: [3, 7, 11], line: 'A stand at a big show. Only in show months.' },
  { id: 'preview', name: 'Press Preview', art: 'business_ui_05', cost: 700, hype: 12, days: 5, from: 3, line: 'Early builds for the press to write about.' },
  { id: 'platformFeature', name: 'Platform Feature', art: 'platform_device_03', cost: 2000, hype: 16, days: 10, from: 4, rank: 'D', line: 'The platform shop puts the game up front.' },
  { id: 'majorCampaign', name: 'Major Campaign', art: 'business_ui_05', cost: 6000, hype: 32, days: 28, from: 2, rank: 'C', line: 'Ads everywhere for a month.' },
];
export const actionById = (id) => MARKETING_ACTIONS.find((a) => a.id === id) ?? null;

// "None / word of mouth" (bible §21) is not an action: it is what happens when you run none.
export const WORD_OF_MOUTH = { name: 'Word of mouth', art: 'dev_ui_19', line: 'No marketing, no cost. A game players love, with little Hype, keeps selling for longer.' };

// The shows a Convention can be booked at (month of the year → its name).
export const CONVENTIONS = { 3: 'PlayCon', 7: 'Summer Game Show', 11: 'Winter Expo' };

// Where a game is, for the "from" rule (index 5 = finished).
export const MARKETING_STAGES = ['Prototype', 'Vertical Slice', 'Production', 'Alpha / Beta', 'Gold Master', 'Finished'];

// Placeholder competitor releases (Milestone 9; the real rival studios arrive in Milestone 19). Each month gets 0–2
// releases, generated from the run's seed: a studio from this list, a made-up title, a genre and a size.
export const COMPETITOR_STUDIOS = ['Pixel Harbor', 'Blue Kettle Games', 'Northlight Play', 'Tiny Comet', 'Brightforge', 'Paper Lantern', 'Rocket Moss', 'Mapleway Studio', 'Quiet Fox', 'Sunset Arcade'];
export const COMPETITOR_TITLE = {
  first: ['Star', 'Iron', 'Moon', 'Crystal', 'Shadow', 'Sky', 'Neon', 'Wild', 'Lost', 'Golden', 'Frost', 'Echo'],
  second: ['Quest', 'Rush', 'Legends', 'Tactics', 'Kingdom', 'Drift', 'Tales', 'Heroes', 'Valley', 'Circuit', 'Signal', 'Party'],
};
