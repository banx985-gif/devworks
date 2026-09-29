// Secrets (Milestone 28, bible §40): the declarative operators, the exact counters' settings and — for now — only
// SYNTHETIC test rules. The real 50 (bible §41) are wired in Milestone 29. Plain data; the rules are checked by
// core/SecretEngine.js through src/systems/secrets.js (the facts and counters).
//
// A secret: { id, name, category, ngPlusMin, triggerEvents, requiresAll, requiresAny, forbids, oncePerRun |
//   oncePerAccount, clueStages: [rumour, hint, nearly explicit] (stage 4 = the recipe, shown once found),
//   rewardActions: [{ type, id, amount? }] }
// Trigger events (src/systems/secrets.js fires them): gameReleased, monthEnd, yearEnd, awardWon, hired, staffLeft,
//   consoleLaunched, consoleMonth, milestone, eventClue.

// --- the bible §40 operators, as condition makers -------------------------------------------------------------------
const c = (fact, op, value, extra = {}) => ({ fact, op, value, ...extra });
export const OP = {
  all: (...conds) => ({ all: conds }),
  any: (...conds) => ({ any: conds }),
  // threshold: a number reaches a value (eased 15% on a repeat run)
  threshold: (fact, op, value, label) => c(fact, op, value, { kind: 'threshold', label }),
  // exact count: exactly n (never eased)
  exactCount: (fact, n, label) => c(fact, 'eq', n, { kind: 'fixed', label }),
  // at least n of something (eased: halved)
  atLeast: (fact, n, label) => c(fact, 'gte', n, { kind: 'count', label }),
  // consecutive count: n items in a row of a list fact pass every test
  consecutive: (fact, where, n, label) => c(fact, 'consecutive', n, { where, kind: 'count', label }),
  // year range: the calendar year is inside [from, to]
  yearRange: (from, to) => c('year', 'between', [from, to], { kind: 'fixed', label: `Year ${from}–${to}` }),
  // continuous employment: someone (a staff id, or 'founder') has been employed without a break for n years
  employedYears: (who, years) => c(`employed.${who}`, 'gte', years, { kind: 'threshold', label: `${who} employed ${years} years` }),
  // project property: n released games matching every test (fields of a game summary, see secrets.js)
  project: (where, n = 1, label) => c('games', 'countOf', n, { where, kind: 'count', label }),
  // award: won this award at least once
  award: (id) => c('awards', 'has', id, { kind: 'fixed', label: `Won ${id}` }),
  // platform: released a game on this platform
  platform: (id) => c('platforms', 'has', id, { kind: 'fixed', label: `Released on ${id}` }),
  // hardware: a console stat (hw.generations, hw.profitableGenerations, hw.bestDefectRate, hw.handheldRevision …)
  hardware: (key, op, value, label) => c(`hw.${key}`, op, value, { kind: typeof value === 'number' ? 'threshold' : 'fixed', label }),
  // NG+ level: use the rule's ngPlusMin, or this for a condition inside any/all
  ngPlus: (n) => c('ngPlus', 'gte', n, { kind: 'fixed', label: `NG+${n}` }),
  // discovery count: combos discovered in this run
  discoveries: (n) => c('discoveries', 'gte', n, { kind: 'count', label: `${n} discoveries` }),
  // forbid: put conditions in a rule's `forbids` list — any that holds blocks it
  forbid: (fact, op, value, label) => c(fact, op, value, { kind: 'fixed', label }),
  // ordered sequence: these history steps happened in this order
  sequence: (steps, label) => c('history', 'sequence', steps, { kind: 'fixed', label }),
};

// --- exact counters (plan review C: numbers the game never tracked; defined here) -------------------------------------
//   technical       = (Graphics + Polish) ÷ 2 of the released game
//   launchStability = 100 − stabilityPerBug × bugs at launch (review bugs + QA overhead), 0–100
//   crash incident  = a launch with launchStability under crashBelow
//   loading complaint = a launch of a Large+ game whose Technical is under loadingBelow
//   playerScore     = the game's player score after support (Milestone 20), else its review
//   #1 chart week   = a 7-day week in which your best-selling game sold at least chartBase + chartPerYear × year copies
//   crunch          = total crunch days and games that crunched (Milestone 7 history)
//   founder         = the Founding Developer's continuous employment (Milestone 5b)
export const COUNTERS = { stabilityPerBug: 4, crashBelow: 60, loadingBelow: 45, loadingScopes: ['large', 'blockbuster', 'mega'], chartBase: 3000, chartPerYear: 500, chartDays: 7 };

// --- clue stages (1 rumour → 2 hint → 3 nearly explicit; 4 = the recipe once found) ---------------------------------
const clues = (rumour, hint, nearly) => [
  { text: rumour, minMet: 1 },
  { text: hint, minMet: 'allButOne' },
  { text: nearly, minMet: { share: 0.9 } },
];

// --- synthetic rules (tests and ?debug=1 only; never in a normal game) -----------------------------------------------
export const SYNTHETIC_SECRETS = [
  {
    id: 'SYN-AND', name: 'Two Hits and a Trophy', category: 'Test', oncePerRun: true, triggerEvents: ['gameReleased', 'awardWon'],
    requiresAll: [OP.project([{ field: 'score', op: 'gte', value: 80, kind: 'threshold' }], 2, 'Two games reviewed 80+'), OP.atLeast('awardCount', 1, 'An award')],
    clueStages: clues('Critics whisper about a studio with a shelf of hits.', 'Something about awards and good reviews…', 'Two 80+ reviews and a trophy.'),
    rewardActions: [{ type: 'prestigeTokens', id: 'SYN-AND', amount: 1 }],
  },
  {
    id: 'SYN-OR', name: 'Any Door', category: 'Test', oncePerRun: true, triggerEvents: ['gameReleased', 'monthEnd'],
    requiresAny: [OP.platform('P03'), OP.threshold('credits', 'gte', 250000, '250,000 Credits')],
    clueStages: clues('Some say one door opens many ways.', 'A console release — or a fat bank account.', 'Release on Nova-8, or hold 250,000 Credits.'),
    rewardActions: [{ type: 'flag', id: 'anyDoor' }],
  },
  {
    id: 'SYN-STREAK', name: 'On a Roll', category: 'Test', oncePerRun: true, triggerEvents: ['gameReleased'],
    requiresAll: [OP.consecutive('games', [{ field: 'score', op: 'gte', value: 70, kind: 'threshold' }], 3, 'Three games in a row reviewed 70+')],
    clueStages: clues('A streak is talked about in the forums.', 'Keep the reviews up, game after game.', 'Three releases in a row at 70+.'),
    rewardActions: [{ type: 'prestigeTokens', id: 'SYN-STREAK', amount: 1 }],
  },
  {
    id: 'SYN-CLEAN', name: 'No Crunch Allowed', category: 'Test', oncePerRun: true, triggerEvents: ['gameReleased'],
    requiresAll: [OP.atLeast('releases', 3, 'Three releases')],
    forbids: [OP.forbid('crunch.days', 'gt', 0, 'Any crunch')],
    clueStages: clues('A calm studio is said to be rewarded.', 'Ship games — but something must never happen.', 'Three releases with no crunch at all.'),
    rewardActions: [{ type: 'flag', id: 'noCrunch' }],
  },
  {
    id: 'SYN-NG', name: 'Second Life', category: 'Test', ngPlusMin: 1, oncePerAccount: true, triggerEvents: ['gameReleased'],
    requiresAll: [OP.atLeast('releases', 1, 'A release')],
    clueStages: clues('Only those who have done it all before may find it.', 'A new start is needed.', 'Any release in NG+1.'),
    rewardActions: [{ type: 'prestigeTokens', id: 'SYN-NG', amount: 2 }, { type: 'accountFlag', id: 'secondLife' }],
  },
  {
    id: 'SYN-HW', name: 'Hardware Hero', category: 'Test', oncePerRun: true, triggerEvents: ['consoleLaunched', 'consoleMonth', 'yearEnd'],
    requiresAll: [OP.hardware('generations', 'gte', 2, 'Two console generations'), OP.hardware('profitableGenerations', 'gte', 1, 'One profitable generation'), OP.yearRange(10, 20)],
    clueStages: clues('Hardware makers speak of a second machine.', 'Consoles — more than one, and one that pays.', 'Two generations, one profitable, between Year 10 and 20.'),
    rewardActions: [{ type: 'flag', id: 'hardwareHero' }],
  },
  {
    id: 'SYN-HISTORY', name: 'Loyal Founder', category: 'Test', oncePerRun: true, triggerEvents: ['yearEnd', 'gameReleased'],
    requiresAll: [OP.employedYears('founder', 2), OP.sequence(['firstRelease', 'firstHit'], 'First release, then a first hit'), OP.threshold('technicalBest', 'gte', 60, 'Technical 60+')],
    clueStages: clues('Founders who stay are remembered.', 'Stay together, and let history run its course.', 'The founder 2 years in, a release then a hit, Technical 60+.'),
    rewardActions: [{ type: 'prestigeTokens', id: 'SYN-HISTORY', amount: 1 }],
  },
  {
    id: 'SYN-EXACT', name: 'Exactly Three', category: 'Test', oncePerRun: true, triggerEvents: ['gameReleased'],
    requiresAll: [OP.exactCount('releases', 3, 'Exactly three releases'), OP.discoveries(0)],
    clueStages: clues('Three is a magic number.', 'Count your releases carefully.', 'Exactly three releases.'),
    rewardActions: [{ type: 'flag', id: 'three' }],
  },
];

// Reward types: prestigeTokens (account currency: once per account, never again on a repeat run), flag (this run),
// accountFlag (every run from now on). Every reward fires at most once (core/UnlockActions + the account history).
export const SECRET_REWARD_CURRENCIES = ['prestigeTokens'];
