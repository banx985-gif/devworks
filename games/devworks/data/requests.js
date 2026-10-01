// Requested games (Milestone 40c, Aaron's play-feel notes §5): someone asks for a game — a set genre (sometimes a
// theme too) and scope, a points target, a deadline — with pay, and a bonus for beating the target by bonusAt.
// Plain data; the rules are src/systems/requests.js. Every number is a placeholder (listed in the M40c Log).
//
// A request is never impossible: its genre / theme are open, its scope is open and within what this stage makes
// (scopeByStage), the deadline is the studio's own best team's estimate × deadline.slack + deadline.plusDays, and the
// target is a share (targetFactor) of what this studio has already made (its best released total, or its best value
// of the named stat) — so the team that made those can make it again.
export const REQUESTS = {
  afterReleases: 1, // the first request comes once the studio has released this many games
  board: { min: 2, max: 3 }, // requests on the board; it refreshes at every month end
  askers: [
    { kind: 'publisher', weight: 3, line: 'A publisher wants one for their catalogue' },
    { kind: 'platform', weight: 2, line: 'A platform holder wants one for their store' },
    { kind: 'sponsor', weight: 2, line: 'A sponsor wants one with their name on it' },
    { kind: 'fans', weight: 2, line: 'Your fans are asking for one' },
  ],
  themeChance: 0.4, // the request names a theme too
  statChance: 0.35, // the target is one named stat ("Story 60+"); otherwise the total of the seven outputs
  stats: ['gameplay', 'graphics', 'story', 'innovation', 'polish', 'audienceFit'], // a named-stat target (not Audio: a package)
  targetFactor: { min: 0.78, max: 0.92 }, // × the studio's best so far
  bonusAt: 1.2, // beat the target by 20%: the bonus too
  deadline: { slack: 1.6, plusDays: 28 },
  scopeByStage: { 1: ['tiny'], 2: ['tiny', 'small'], 3: ['small', 'standard'], 4: ['standard', 'large'], 5: ['large', 'blockbuster'] },
  pay: { tiny: 2500, small: 6000, standard: 16000, large: 40000, blockbuster: 90000, mega: 150000 }, // Credits on delivery
  bonusPct: 50, // the bonus: this % of the pay on top
  missPayPct: 50, // missed (late or short): half the pay
  fame: { hit: 25, perScope: 15 }, // Fame for a hit: hit + perScope × the scope's place (tiny 0 … blockbuster 4)
  relation: { hit: 10, miss: -5, max: 100 }, // with whoever asked (shown on the board)
  trustDip: 2, // Fan Trust lost on a miss
  sharePct: 10, // whoever asked takes this % of the game's sales (it still sells normally)
  icon: 'dev_ui_40', // the request board / letter icon (code-drawn until the file exists)
};

export const askerKinds = REQUESTS.askers.map((a) => a.kind);
