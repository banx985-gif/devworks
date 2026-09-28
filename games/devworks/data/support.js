// Post-launch support (Milestone 20, bible §22). Plain data only; the rules are src/systems/support.js. The bible
// names the options; every number is a placeholder (plan review B), listed in the build log.
//
// A support project runs like a small game job: a team, work (Σ(stat × work multiplier) ÷ 60 a day, on duty), Credits
// every day, and it takes a game lane while it runs. What finishing it does:
//   bugsPct        that % of the game's remaining bugs are fixed
//   playerScore    the player score rises this much (+ perBugsFixed for every 10 bugs fixed), never past 100; the
//                  original review never changes (plan review C)
//   trust          Fan Trust + this (+ trustPerBugs for every 10 bugs fixed)
//   tailPct        the sales tail (on every platform) sells this % more, and lasts tailDaysPct longer
//   addon          its own sales to the game's owners: attachPct of the copies sold so far buy it at price, over
//                  `days` days (ledger "Post-launch")
//   port           adds a platform (Milestone 8 porting and certification)
export const SUPPORT_OPTIONS = [
  { id: 'patch', name: 'Patch', icon: 'dev_ui_16', stat: 'code', work: 25, costPerDay: 40, bugsPct: 70, playerScore: 3, perBugsFixed: 1, trust: 1, trustPerBugs: 1, line: 'Fix most of the bugs players found. Raises the player score and Fan Trust.' },
  { id: 'freeUpdate', name: 'Free Update', icon: 'dev_ui_16', stat: 'des', work: 40, costPerDay: 50, bugsPct: 20, playerScore: 4, trust: 3, tailPct: 25, tailDaysPct: 20, line: 'New content for free: Fan Trust, the player score and a longer sales tail.' },
  { id: 'expansion', name: 'Expansion', icon: 'dev_ui_15', stat: 'des', work: 90, costPerDay: 70, playerScore: 3, trust: 1, tailPct: 20, tailDaysPct: 15, addon: { attachPct: 22, priceOfGamePct: 50, days: 60 }, line: 'A big paid add-on: its own sales to the game’s owners and a longer tail.' },
  { id: 'dlc', name: 'DLC', icon: 'dev_ui_17', stat: 'art', work: 45, costPerDay: 50, playerScore: 1, trust: 0, tailPct: 8, tailDaysPct: 5, addon: { attachPct: 30, priceOfGamePct: 25, days: 40 }, line: 'A small paid add-on (skins, a level pack): its own sales.' },
  { id: 'port', name: 'Port', icon: 'platform_device_03', stat: 'code', work: 50, costPerDay: 50, port: true, line: 'Bring it to another platform (porting and certification as at release).' },
  { id: 'moveOn', name: 'Move On', icon: 'dev_ui_07', instant: true, line: 'End support for this game (no more post-launch work on it).' },
];
export const supportOptionById = (id) => SUPPORT_OPTIONS.find((o) => o.id === id) ?? null;

export const SUPPORT_BALANCE = {
  progressDivisor: 60,
  maxPlayerScore: 100,
  perUse: { patch: 3, freeUpdate: 2, expansion: 1, dlc: 3, port: 11 }, // how often each can be done per game
};
