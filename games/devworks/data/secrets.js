// Secrets (Milestones 28–29, bible §40 / §41): the declarative operators, the exact counters' settings, the SYNTHETIC
// test rules of Milestone 28 (tests and ?synthetic=1 only) and the real 50 (SECRETS, Milestone 29). Plain data; the rules are checked by
// core/SecretEngine.js through src/systems/secrets.js (the facts and counters).
//
// A secret: { id, name, category, ngPlusMin, triggerEvents, requiresAll, requiresAny, forbids, oncePerRun |
//   oncePerAccount, clueStages: [rumour, hint, nearly explicit] (stage 4 = the recipe, shown once found),
//   rewardActions: [{ type, id, amount? }] }
// Trigger events (src/systems/secrets.js fires them): gameReleased, monthEnd, yearEnd, awardWon, hired, staffLeft,
//   consoleLaunched, consoleMonth, milestone, eventClue.
import { rankIndexOf } from '../../../core/CompanyRank.js';
import { FAME } from './balance.js';

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

// =====================================================================================================================
// Milestone 29 — the 50 secrets of bible §41, in its ids and groups. Every requirement below is the bible's summary
// turned into conditions on the facts src/systems/secrets.js provides (the M28 counters are used as defined there).
// Where the bible names two elements for one recipe slot (a recipe holds one theme, one gameplay, one feature), the
// secret accepts either — as Milestone 15 did for SYN17 — and the build log lists each case.
//
// Game-summary fields for project(): number, score, playerScore, gameplay, graphics, story, innovation, polish,
// audienceFit, technical, stability, crash, genre, theme, play (the gameplay element), tech, art, feature, scope, type,
// ownEngine, lateDays, crunchDays, morale (team average at the finish), bugs (at launch), reviewGain (a sequel: its
// review minus the franchise's previous one), marketingPct, chartWeeks, firstMonthCopies, salesMultiple (lifetime ÷
// first month), patchedFast, abandoned, launchTrust, online, exclusiveOwn, family, finalYear, deal, copies.
// =====================================================================================================================

const RANK = (id) => rankIndexOf(FAME.ranks, id);
const w = (field, op, value, kind = typeof value === 'number' ? 'threshold' : 'fixed') => ({ field, op, value, kind });
const rank = (id) => ({ fact: 'rank', op: 'gte', value: RANK(id), kind: 'fixed', label: `Rank ${id}`, category: 'Fame' });
const has = (fact, value, label, category) => ({ fact, op: 'has', value, kind: 'fixed', label, category });
const researched = (id) => has('researched', id, `Research ${id}`, 'Research');
const n = (fact, op, value, label, category, kind = 'count') => ({ fact, op, value, kind, label, category });
const games = (where, value, label, category = 'Games', extra = {}) => ({ fact: 'games', op: 'countOf', where, value, kind: 'count', label, category, ...extra });
const ngCond = (lvl) => ({ fact: 'ngPlus', op: 'gte', value: lvl, kind: 'fixed', label: `NG+${lvl}`, category: 'New Game+' });
const clue = (rumour, hint, nearly) => [
  { text: rumour, minMet: 1 },
  { text: hint, minMet: 'allButOne' },
  { text: nearly, minMet: { share: 0.9 } },
];
const R = {
  arrival: (staff) => ({ type: 'arrival', id: staff }),
  recipe: (id, bonus) => ({ type: 'recipe', id, bonus }),
  tech: (id) => ({ type: 'tech', id }),
  part: (id) => ({ type: 'part', id }),
  unlock: (id) => ({ type: 'unlock', id }),
  tokens: (id, amount) => ({ type: 'prestigeTokens', id, amount }),
  cosmetic: (id) => ({ type: 'cosmetic', id }),
  accolade: (id) => ({ type: 'accolade', id }),
  flag: (id) => ({ type: 'accountFlag', id }),
  fanTrust: (id, amount) => ({ type: 'fanTrust', id, amount }),
};
const ALL = ['gameReleased', 'monthEnd', 'yearEnd', 'awardWon', 'secretFound', 'milestone', 'eventClue', 'hired', 'staffLeft', 'consoleMonth', 'consoleLaunched'];
const S = (id, name, group, rewardText, conds, rewards, clues, extra = {}) => ({ id, name, group, category: group, rewardText, oncePerRun: true, triggerEvents: ALL, requiresAll: conds, rewardActions: rewards, clueStages: clues, ...extra });

// Recipe bonuses of the secret combos, applied to every later game with that recipe once the recipe is known.
export const SECRET_RECIPES = {
  cultRomance: { name: 'Cult Romance', need: { genre: ['GEN10'], theme: ['THM09'], gameplay: ['PLY06'], artDirection: ['ADR05'] }, bonus: { output: { story: 14 }, tailPct: 20 } },
  starfarm: { name: 'Starfarm', need: { genre: ['GEN04'], theme: ['THM05'], gameplay: ['PLY03'], artDirection: ['ADR02', 'ADR03'] }, bonus: { output: { audienceFit: 14 } } },
  monsterOffice: { name: 'Monster Office', need: { genre: ['GEN04'], theme: ['THM06'], gameplay: ['PLY03'], artDirection: ['ADR02'] }, bonus: { franchisePct: 15 } },
  storyRacing: { name: 'Story Racing', need: { genre: ['GEN05'], theme: ['THM04'], gameplay: ['PLY06'], artDirection: ['ADR05'] }, bonus: { output: { innovation: 12 } } },
  afterclass: { name: 'Afterclass', need: { genre: ['GEN07', 'GEN02'], theme: ['THM09', 'THM10'], gameplay: ['PLY06'] }, bonus: { output: { story: 12 } } },
  underworldManager: { name: 'Underworld Manager', need: { genre: ['GEN04'], theme: ['THM07'], gameplay: ['PLY03', 'PLY08'] }, bonus: { output: { gameplay: 12 } } },
  puzzlePlanet: { name: 'Puzzle Planet', need: { genre: ['GEN08'], feature: ['FEA04', 'FEA06'], technology: ['TEC06'] }, bonus: { output: { innovation: 15 } } },
};
const recipeWhere = (id) => {
  const map = { genre: 'genre', theme: 'theme', gameplay: 'play', technology: 'tech', artDirection: 'art', feature: 'feature' };
  return Object.entries(SECRET_RECIPES[id].need).map(([slot, ids]) => (ids.length === 1 ? w(map[slot], 'eq', ids[0]) : w(map[slot], 'in', ids)));
};

// SEC-COMP-02 (plan review C): how many secrets a software-only player can reach by NG+2 (counted in the build log:
// 35 of the other 49) minus 5 left optional.
export const C12_SECRETS = 30;
// The 'family / casual' genres for SEC-HW-04 (bible §32 audience groups: kids / casual / all-ages).
export const FAMILY_GENRES = ['GEN01', 'GEN04', 'GEN05', 'GEN08', 'GEN09'];
export const STANDARD_ROYALTY = 15; // the launch plan's standard royalty (data/consoles.js royaltySteps[2])
export const SECRET_GROUPS = ['Legendary + Prestige Staff', 'Secret Game Combinations', 'Secret Technologies', 'Hardware Secrets', 'Facility / Studio Secrets', 'Awards / Rival Secrets', 'Behaviour Secrets', 'New Game+ Secrets', 'Cross-Universe / Ultimate'];
const [G_STAFF, G_COMBO, G_TECH, G_HW, G_FAC, G_AWARD, G_BEH, G_NGP, G_X] = SECRET_GROUPS;
const THREE_D = ['ADR03', 'ADR04', 'ADR06'];
const ADV_TECH = ['TEC04', 'TEC06', 'TEC07', 'TEC08'];

export const SECRETS = [
  // --- Legendary + Prestige Staff ---------------------------------------------------------------------------------
  S('SEC-STAFF-L1', 'Legendary Programmer — Dr. Ada Flux', G_STAFF, 'Ada Flux arrives (Code Architect)', [rank('A'), games([w('bugs', 'eq', 0, 'fixed')], 3, 'Three games launched with zero bugs'), has('facilities', 'F18', 'An Engine Lab', 'Studio'), researched('ENG5')], [R.arrival('PRG09')], clue('A brilliant programmer is said to admire flawless launches.', 'Clean launches, an Engine Lab and deep engine research catch her eye.', 'Rank A, three zero-bug launches, an Engine Lab and Streaming Worlds research.')),
  S('SEC-STAFF-L2', 'Legendary Designer — Sora Quill', G_STAFF, 'Sora Quill arrives (Design Legend)', [rank('A'), { fact: 'awardWins', op: 'countOf', where: [w('award', 'eq', 'C03')], value: 2, kind: 'count', label: 'Design Guild Prize (C03) won twice', category: 'Awards' }, n('combosFoundCount', 'gte', 12, 'Twelve normal combos discovered', 'Discoveries'), games([w('gameplay', 'gte', 90)], 1, 'A game with Gameplay 90+')], [R.arrival('DSN09')], clue('A famous designer follows the Design Guild closely.', 'Design prizes, many discovered combos and superb gameplay.', 'Rank A, the Design Guild Prize twice, 12 combos, a Gameplay 90+ game.')),
  S('SEC-STAFF-L3', 'Legendary Artist — Aurelia Frame', G_STAFF, 'Aurelia Frame arrives (Visual Legend)', [rank('A'), has('awards', 'C06', 'Narrative & Arts Awards (C06) won', 'Awards'), games([w('art', 'eq', 'ADR01'), w('graphics', 'gte', 85)], 1, 'A Pixel game with Graphics 85+'), games([w('art', 'in', THREE_D), w('graphics', 'gte', 85)], 1, 'A 3D game with Graphics 85+'), games([w('art', 'eq', 'ADR05'), w('graphics', 'gte', 85)], 1, 'A Hand-Painted game with Graphics 85+')], [R.arrival('ART09')], clue('An artist of legend watches studios that master every style.', 'Pixel, 3D and hand-painted — all beautiful — and an arts award.', 'Rank A, win C06, and ship Pixel, 3D and Hand-Painted games with Graphics 85+.')),
  S('SEC-STAFF-L4', 'Legendary Writer — Cass Story', G_STAFF, 'Cass Story arrives (Story Legend)', [rank('A'), games([w('story', 'gte', 88)], 3, 'Story 88+ games in three genres', 'Games', { by: 'genre' }), games([w('type', 'eq', 'sequel'), w('reviewGain', 'gte', 8)], 1, 'A sequel reviewed 8+ better than the game before')], [R.arrival('WRT09')], clue('A great writer loves studios that tell stories everywhere.', 'Great stories across genres — and a sequel that beats its original.', 'Rank A, three Story 88+ games in three genres, a sequel 8+ better.')),
  S('SEC-STAFF-L5', 'Legendary Producer — Mira Sterling', G_STAFF, 'Mira Sterling arrives (Studio Legend)', [rank('A'), games([w('lateDays', 'eq', 0, 'fixed')], 5, 'Five games on or before their deadline'), games([w('scope', 'eq', 'blockbuster'), w('score', 'gte', 85), w('crunchDays', 'eq', 0, 'fixed')], 1, 'A Blockbuster reviewed 85+ with no crunch')], [R.arrival('PRO09')], clue('A legendary producer admires studios that ship on time.', 'Deadlines kept, and a big game made without crunch.', 'Rank A, five games on schedule, a Blockbuster 85+ with no crunch.')),
  S('SEC-STAFF-S1', 'Prestige Programmer — Zero Lin', G_STAFF, 'Zero Lin arrives (Impossible Build)', [n('researchedVisible', 'gte', 36, 'All 36 research topics', 'Research'), games([w('ownEngine', 'eq', true), w('technical', 'gte', 95)], 1, 'An own-engine game with Technical 95+'), n('clueStage.SEC-X-02', 'gte', 2, 'PROJECT ONE clue stage 2', 'Secrets', 'fixed')], [R.arrival('PRG10')], clue('Someone who builds the impossible is watching.', 'All research, a technical masterpiece — and whispers of PROJECT ONE.', 'NG+2, all 36 research topics, own-engine Technical 95+, PROJECT ONE clue stage 2.'), { ngPlusMin: 2 }),
  S('SEC-STAFF-S2', 'Prestige Designer — Pixel Grey', G_STAFF, 'Pixel Grey arrives (Perfect Loop)', [n('secretCombosEver', 'gte', 8, 'All 8 secret game combos', 'Secrets'), games([w('scope', 'eq', 'small'), w('gameplay', 'gte', 95)], 1, 'A Small game with Gameplay 95+')], [R.arrival('DSN10')], clue('A designer who finds the perfect loop is said to exist.', 'Every secret recipe — and a small game that plays perfectly.', 'NG+2, all 8 secret combos, a Small-scope Gameplay 95+ game.'), { ngPlusMin: 2 }),
  S('SEC-STAFF-S3', 'Prestige Artist — Ghost Palette', G_STAFF, 'Ghost Palette arrives (Dream Render)', [{ fact: 'awardWins', op: 'countOf', where: [w('award', 'eq', 'C06'), w('art', 'eq', 'ADR01')], value: 1, kind: 'count', label: 'An arts award won with a Pixel game', category: 'Awards' }, { fact: 'awardWins', op: 'countOf', where: [w('award', 'eq', 'C06'), w('art', 'in', THREE_D)], value: 1, kind: 'count', label: 'An arts award won with a 3D game', category: 'Awards' }, { fact: 'awardWins', op: 'countOf', where: [w('award', 'eq', 'C06'), w('art', 'eq', 'ADR05')], value: 1, kind: 'count', label: 'An arts award won with a Hand-Painted game', category: 'Awards' }, n('ghostlightDefeats', 'gte', 1, 'Ghostlight beaten at C06 or C09', 'Rivals')], [R.arrival('ART10')], clue('A ghostly painter answers only to true artists.', 'Arts awards in every style — and a certain rival beaten.', 'NG+2, arts wins with Pixel, 3D and Hand-Painted games, and Ghostlight beaten at C06/C09.'), { ngPlusMin: 2 }),
  S('SEC-STAFF-S4', 'Prestige Writer — Oracle Quill', G_STAFF, 'Oracle Quill arrives (Impossible Ending)', [n('legendaryFranchises', 'gte', 1, 'A Legendary franchise', 'Franchises'), games([w('type', 'eq', 'spinoff'), w('story', 'gte', 95)], 1, 'A Story 95+ spin-off in a new genre')], [R.arrival('WRT10')], clue('An oracle writes only for legends.', 'A legendary franchise, and a spin-off with a perfect story.', 'NG+3, a Legendary franchise, a Story 95+ spin-off in a different genre.'), { ngPlusMin: 3 }),
  S('SEC-STAFF-S5', 'Prestige Producer — One Kane', G_STAFF, 'One Kane arrives (Future Proof)', [games([w('scope', 'eq', 'mega'), w('lateDays', 'eq', 0, 'fixed')], 1, 'A Mega project on schedule'), n('externalHits', 'gte', 3, 'Three published external hits', 'Business'), n('hw.hits', 'gte', 1, 'A successful console launch', 'Hardware')], [R.arrival('PRO10')], clue('A producer from the future is looking for a studio ready for anything.', 'Mega games on time, publishing hits — and hardware.', 'NG+3, a Mega project on schedule, 3 external hits, a console hit.'), { ngPlusMin: 3 }),
  // --- Secret Game Combinations -----------------------------------------------------------------------------------
  S('SEC-COMBO-01', 'Romance in the Dark', G_COMBO, 'Cult Romance recipe: Story +14, niche tail +20%', [games(recipeWhere('cultRomance'), 1, 'Horror + School + Narrative Choice + Hand-Painted', 'Recipes')], [R.recipe('cultRomance')], clue('Players whisper about a love story in a haunted school.', 'Fear, school days and choices — painted by hand.', 'Horror, School, Narrative Choice, Hand-Painted.')),
  S('SEC-COMBO-02', 'Farm Beyond Earth', G_COMBO, 'Starfarm recipe: Audience Fit +14', [games(recipeWhere('starfarm'), 1, 'Simulation + Space + Management + Cartoon / Stylised 3D', 'Recipes')], [R.recipe('starfarm')], clue('Someone dreams of farming among the stars.', 'Manage a simulation in space, drawn in a friendly style.', 'Simulation, Space, Management, Cartoon or Stylised 3D.')),
  S('SEC-COMBO-03', 'Monsters at Work', G_COMBO, 'Monster Office recipe: franchise potential +15%', [games(recipeWhere('monsterOffice'), 1, 'Simulation + Monsters + Management + Cartoon', 'Recipes')], [R.recipe('monsterOffice')], clue('What do monsters do from nine to five?', 'A cartoon management sim with monsters.', 'Simulation, Monsters, Management, Cartoon.')),
  S('SEC-COMBO-04', 'The Quiet Race', G_COMBO, 'Story Racing recipe: Innovation +12', [games(recipeWhere('storyRacing'), 1, 'Racing + Historical + Narrative Choice + Hand-Painted', 'Recipes')], [R.recipe('storyRacing')], clue('A racing game with a story? Some say it could work.', 'Old times, choices on the track, painted by hand.', 'Racing, Historical, Narrative Choice, Hand-Painted.')),
  S('SEC-COMBO-05', 'Afterclass', G_COMBO, 'Afterclass recipe: Story +12', [games(recipeWhere('afterclass'), 1, 'Adventure / RPG + School / Post-Apocalypse + Narrative Choice', 'Recipes')], [R.recipe('afterclass')], clue('School is out — forever.', 'An adventure of choices, about school or the end of the world.', 'Adventure or RPG, School or Post-Apocalypse, Narrative Choice.')),
  S('SEC-COMBO-06', 'Crime Tycoon', G_COMBO, 'Underworld Manager recipe: Gameplay +12', [games(recipeWhere('underworldManager'), 1, 'Simulation + Crime + Management / Sandbox', 'Recipes')], [R.recipe('underworldManager')], clue('Running a crime empire could make a fine simulation.', 'Crime, simulated — managed, or as a sandbox.', 'Simulation, Crime, Management or Sandbox.')),
  S('SEC-COMBO-07', 'Puzzle Planet', G_COMBO, 'Puzzle Planet recipe: Innovation +15', [games(recipeWhere('puzzlePlanet'), 1, 'Puzzle + Open World / User Creation + Streaming World', 'Recipes')], [R.recipe('puzzlePlanet')], clue('A whole planet made of puzzles?', 'A puzzle game with a huge streamed world, or one players build.', 'Puzzle, Open World or User Creation, Streaming World.')),
  S('SEC-COMBO-08', 'The One Combination', G_COMBO, 'PROJECT ONE recipe eligibility', [games([w('genre', 'eq', 'GEN02'), w('theme', 'eq', 'THM02'), w('play', 'eq', 'PLY03'), w('tech', 'eq', 'TEC08'), w('art', 'eq', 'ADR07'), w('feature', 'eq', 'FEA06'), w('score', 'gte', 90), w('gameplay', 'gte', 85), w('story', 'gte', 85), w('innovation', 'gte', 85)], 1, 'RPG + Science Fiction + Management + Neural Tools + Mixed Media + User Creation, reviewed 90+ with Gameplay, Story and Innovation 85+', 'Recipes')], [R.unlock('projectOneRecipe')], clue('There is said to be one perfect combination.', 'A science-fiction RPG you manage, built with neural tools, mixed media and player creation.', 'NG+3: that recipe, reviewed 90+ with Gameplay, Story and Innovation 85+.'), { ngPlusMin: 3 }),
  // --- Secret Technologies ----------------------------------------------------------------------------------------
  S('SEC-TECH-01', 'Perfect Compiler', G_TECH, 'Prestige Build System', [games([w('ownEngine', 'eq', true), w('crash', 'eq', false)], 5, 'Five own-engine games with no crash incident'), researched('ENG6')], [R.tech('prestigeBuildSystem')], clue('Engineers dream of a compiler that never fails.', 'Your own engine, game after game, with no crashes.', 'Five own-engine games with zero crash incidents, and Neural Production research.')),
  S('SEC-TECH-02', 'Living Animation', G_TECH, 'Adaptive Animation Tool', [games([w('graphics', 'gte', 92), w('tech', 'in', ADV_TECH)], 3, 'Three games with Graphics 92+ on advanced 3D technology'), researched('ART6')], [R.tech('adaptiveAnimation')], clue('Animators talk of characters that move like life.', 'Stunning graphics on advanced technology, again and again.', 'Three Graphics 92+ games with Advanced 3D (or later) technology, and Mixed-Media Pipeline research.')),
  S('SEC-TECH-03', 'World Streamer', G_TECH, 'Seamless World tech', [games([w('feature', 'eq', 'FEA04'), w('tech', 'eq', 'TEC06')], 1, 'An Open World game on Streaming World'), n('loadingComplaints', 'eq', 0, 'No loading complaints ever', 'Quality', 'fixed'), researched('ENG5')], [R.tech('seamlessWorld')], clue('A world without loading screens is possible, they say.', 'An open, streamed world — and nobody ever complaining about loading.', 'Open World + Streaming World, zero loading complaints, Streaming Worlds research.')),
  S('SEC-TECH-04', 'Infinite Systems', G_TECH, 'Systemic Simulation Toolkit', [has('combosFound', 'SYN17', 'Creator Kit discovered', 'Discoveries'), has('combosFound', 'SYN18', 'Infinite Run discovered', 'Discoveries'), has('combosFound', 'SYN20', 'Living Systems discovered', 'Discoveries'), researched('GAM6')], [R.tech('systemicToolkit')], clue('Systems that never run out of surprises…', 'Creation, endless runs and living systems — found and understood.', 'Discover Creator Kit, Infinite Run and Living Systems, and Creator Systems research.')),
  S('SEC-TECH-05', 'Trustworthy Online', G_TECH, 'Prestige Netcode', [games([w('online', 'eq', true), w('stability', 'gte', 90), w('launchTrust', 'gte', 75)], 3, 'Three online releases with launch stability 90+ and Fan Trust 75+')], [R.tech('prestigeNetcode')], clue('Players remember online games that just worked.', 'Stable online launches while your fans trust you.', 'Three online releases with launch stability 90+ and Fan Trust 75+ at launch.')),
  S('SEC-TECH-06', 'BOTWORKS Neural Suite', G_TECH, 'BOTWORKS Neural Toolset', [has('sponsorsActive', 'SPN08', 'BOTWORKS Systems sponsor active', 'Sponsors'), has('clues', 'botworksDemo', 'The BOTWORKS tech demo built', 'Events'), researched('ENG6')], [R.tech('botworksNeural')], clue('BOTWORKS is rumoured to share its best tools with friends.', 'Their sponsorship, their demo — and neural engine research.', 'SPN08 active, the BOTWORKS demo complete, Neural Production research.')),
  // --- Hardware Secrets -------------------------------------------------------------------------------------------
  S('SEC-HW-01', 'Silent Cooling', G_HW, 'Prestige Cooling (the Prestige Render Core)', [{ fact: 'hw.consoles', op: 'countOf', where: [w('units', 'gte', 1000000), w('defectRatePct', 'lt', 2)], value: 1, kind: 'count', label: 'A console at 1M units with lifetime defects under 2%', category: 'Hardware' }, researched('HW4')], [R.part('GPU06')], clue('A console so reliable it could run forever…', 'A million units with almost no defects.', 'A console with 1M units and under 2% lifetime defects, and Reliability research.')),
  S('SEC-HW-02', 'Developer Darling', G_HW, 'Open Dev Kit (the Prestige Adaptive OS)', [{ fact: 'hw.consoles', op: 'countOf', where: [w('peakDevFriendly', 'gte', 90), w('thirdPartyReleases', 'gte', 8), w('maxRoyalty', 'lte', STANDARD_ROYALTY)], value: 1, kind: 'count', label: 'A console with Dev Friendliness 90+, 8 third-party releases and a standard royalty or lower', category: 'Hardware' }], [R.part('SYS06')], clue('Developers love a certain kind of platform holder.', 'Easy to make games for, fair royalties, many studios aboard.', 'Dev Friendliness 90+, 8 third-party releases, royalty at the standard rate or lower.')),
  S('SEC-HW-03', 'Comeback Machine', G_HW, 'Redemption Revision (the Prestige Crystal Storage)', [{ fact: 'hw.consoles', op: 'countOf', where: [w('missedLaunch', 'eq', true), w('units', 'gte', 2000000), w('firstPartyHits', 'gte', 3)], value: 1, kind: 'count', label: 'A console that missed its launch target, then reached 2M units with 3 first-party 85+ games', category: 'Hardware' }], [R.part('STO06')], clue('Some consoles come back from the dead.', 'A weak launch, then great games and huge sales.', 'Miss the 6-month target by 30%+, then reach 2M units after 3 first-party 85+ games.')),
  S('SEC-HW-04', 'Pocket Giant', G_HW, 'Prestige Hybrid Architecture (the Prestige Neural CPU and Haptic Deck)', [n('hw.handheldRevision', 'eq', true, 'A handheld / hybrid revision', 'Hardware', 'fixed'), games([w('exclusiveOwn', 'eq', true), w('family', 'eq', true), w('score', 'gte', 80)], 3, 'Three family / casual exclusives reviewed 80+')], [R.part('CPU06'), R.part('CTL06')], clue('Big things come in small packages.', 'A portable revision and family games only it can play.', 'A handheld or hybrid revision, and 3 family/casual exclusives reviewed 80+.')),
  S('SEC-HW-05', 'Generation Master', G_HW, 'PROJECT X architecture eligibility', [n('hw.generations', 'gte', 3, 'Three console generations', 'Hardware'), n('hw.profitableGenerations', 'gte', 3, 'Every generation profitable', 'Hardware')], [R.unlock('projectXArchitecture')], clue('A studio that masters generations of hardware is remembered.', 'Three generations — each one in profit.', 'Complete 3 hardware generations, each with lifetime profit above 0.')),
  S('SEC-HW-06', 'PROJECT X', G_HW, 'PROJECT X console + hardware hidden ending (the Prestige Memory Fabric)', [researched('HW6'), n('hwSecretsEver', 'gte', 5, 'All five earlier hardware secrets', 'Secrets'), n('stage', 'gte', 5, 'The Global Campus', 'Studio', 'fixed'), n('legendaryEmployed', 'gte', 3, 'Three Legendary / Prestige people in the studio', 'Staff')], [R.unlock('projectX'), R.part('MEM06')], clue('A console beyond anything ever built…', 'Every hardware secret, the biggest studio and legendary people.', 'NG+3, HW6, the five hardware secrets, the Global Campus, 3 Legendary/Prestige contributors.'), { ngPlusMin: 3 }),
  // --- Facility / Studio Secrets ----------------------------------------------------------------------------------
  S('SEC-FAC-01', 'Black Box R&D', G_FAC, 'Unlock F34 Black Box R&D', [n('secretTechsEver', 'gte', 3, 'Three secret technologies', 'Secrets'), rank('S'), n('researchPrototypes', 'gte', 3, 'Three Research Prototype projects', 'Projects')], [R.unlock('F34')], clue('Somewhere, a studio has a room nobody talks about.', 'Secret technologies, top rank, experimental prototypes.', '3 secret technologies, Rank S, 3 Research Prototype projects.')),
  S('SEC-FAC-02', 'The Vault', G_FAC, 'Unlock F35 The Vault', [n('secretsEver', 'gte', 30, 'Thirty secrets discovered', 'Secrets'), has('awards', 'C11', 'Legends Summit (C11) won', 'Awards'), has('facilities', 'F34', 'Black Box R&D built', 'Studio')], [R.unlock('F35')], clue('Legends keep their treasures in a vault.', 'Many secrets, a legendary award and the black box.', '30 secrets, C11 won, F34 built.')),
  S('SEC-FAC-03', 'Founder Wall', G_FAC, 'Founder Wall cosmetic + Founder trait upgrade', [n('yearsDone', 'gte', 20, 'Through Year 20', 'Time', 'fixed'), n('startersAllContinuous', 'eq', true, 'All three starting staff never left', 'Staff', 'fixed')], [R.cosmetic('founderWall'), R.flag('founderTraitUpgrade')], clue('Some teams stay together forever.', 'Keep your first team — all of them.', 'All three starting staff continuously employed through Year 20.')),
  S('SEC-FAC-04', 'Archive Basement', G_FAC, 'Archive expansion + NG+ archive bonus', [n('hallOfFame.games', 'gte', 10, 'Ten games in the Hall of Fame', 'Hall of Fame'), n('hallOfFame.engines', 'gte', 2, 'Two engines in the Hall of Fame', 'Hall of Fame'), n('hallOfFame.consoles', 'gte', 1, 'A console in the Hall of Fame', 'Hall of Fame')], [R.flag('archiveExpansion'), R.flag('ngPlusArchiveBonus')], clue('A proud studio needs room for its history.', 'Great games, engines and a console worth remembering.', 'Hall of Fame: 10 games, 2 engines and 1 console.')),
  S('SEC-FAC-05', 'Night Shift Room', G_FAC, 'Recovery Lounge upgrade', [n('crunchedGames', 'gte', 3, 'Three games that used crunch', 'Crunch'), { fact: 'gamesAfterCrunch3', op: 'consecutive', where: [w('crunchDays', 'eq', 0, 'fixed'), w('morale', 'gte', 75)], value: 3, kind: 'count', label: 'Then three projects in a row with no crunch and Morale 75+', category: 'Crunch' }], [R.flag('recoveryLounge')], clue('Tired studios sometimes learn to rest.', 'Crunch a few times — then never again, with a happy team.', '3 crunched projects, then 3 in a row with no crunch and average Morale 75+.')),
  // --- Awards / Rival Secrets -------------------------------------------------------------------------------------
  S('SEC-COMP-01', 'Legends Summit', G_AWARD, 'Unlock C11', [has('awards', 'C10', 'Game of the Year (C10) won', 'Awards'), { fact: 'awardWins', op: 'countOf', where: [w('award', 'in', ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09'])], by: 'award', value: 4, kind: 'count', label: 'Four other award categories won', category: 'Awards' }, n('legendaryHiredEver', 'gte', 1, 'A Legendary person recruited', 'Staff')], [R.unlock('C11')], clue('The greatest meet once a year, somewhere secret.', 'The top award, many categories — and a legend on the team.', 'C10 won, 4 other award categories won, a Legendary person recruited.')),
  S('SEC-COMP-02', 'Perfect Game Circle', G_AWARD, 'Unlock C12', [has('awards', 'C11', 'Legends Summit (C11) won', 'Awards'), games([w('score', 'gte', 95), w('bugs', 'eq', 0, 'fixed')], 1, 'A game reviewed 95+ that launched with zero bugs'), n('secretsEver', 'gte', C12_SECRETS, `${C12_SECRETS} secrets discovered`, 'Secrets')], [R.unlock('C12')], clue('A circle for perfect games is whispered about.', 'Legends, a flawless masterpiece and many secrets.', `NG+2, C11 won, a 95+ game with zero launch bugs, ${C12_SECRETS} secrets.`), { ngPlusMin: 2 }),
  S('SEC-RIVAL-01', 'Ghostlight Studio', G_AWARD, 'Ghostlight prestige rival enabled', [has('awards', 'C10', 'Game of the Year (C10) won', 'Awards'), n('rivalUpsets', 'gte', 1, 'Beat a rival game reviewed 8+ above your own forecast', 'Rivals'), n('secretsEver', 'gte', 12, 'Twelve secrets discovered', 'Secrets')], [R.unlock('ghostlight')], clue('A ghost studio watches the award winners.', 'Beat rivals nobody expected you to beat — and know many secrets.', 'C10 won, beat a rival whose review was 8+ above your forecast, 12 secrets.')),
  S('SEC-AWARD-01', 'Sweep Night', G_AWARD, 'Golden Sweep + 3 Prestige Tokens', [n('sweepSeasons', 'gte', 1, 'One game wins a Gameplay award, an Art/Story/Tech award and Game of the Year in one season', 'Awards')], [R.accolade('goldenSweep'), R.tokens('SEC-AWARD-01', 3)], clue('One game, one night, every award?', 'Gameplay, craft and the top prize — the same game, the same year.', 'One game wins C03, C05 or C06, and C10 in the same season.')),
  // --- Behaviour Secrets ------------------------------------------------------------------------------------------
  S('SEC-BEH-01', 'Founder Loyalty', G_BEH, 'Founder Master + 1 Prestige Token', [n('yearsDone', 'gte', 20, 'Through Year 20', 'Time', 'fixed'), n('startersContinuous', 'gte', 1, 'A starting staff member who never left', 'Staff')], [R.accolade('founderMaster'), R.tokens('SEC-BEH-01', 1)], clue('Loyalty is rewarded, they say.', 'Someone from the very start, still here at the end.', 'Any starting staff continuously employed through Year 20.')),
  S('SEC-BEH-02', 'No Marketing Miracle', G_BEH, 'Word-of-Mouth strategy + a producer clue', [games([w('chartWeeks', 'gte', 1), w('marketingPct', 'lte', 5)], 1, 'A #1 chart game with marketing at most 5% of its dev budget')], [R.flag('wordOfMouth'), R.flag('producerClue')], clue('Some games sell without a single advert.', 'Top of the charts on almost no marketing.', 'A #1 chart week with total marketing spend ≤ 5% of the dev budget.')),
  S('SEC-BEH-03', 'Flop Resurrection', G_BEH, 'Redemption plan + permanent Fan Trust +3', [games([w('score', 'lt', 55), w('playerScore', 'gte', 75), w('salesMultiple', 'gte', 3)], 1, 'Reviewed under 55, player score later 75+, lifetime sales 3× the first month')], [R.flag('redemptionPlan'), R.fanTrust('SEC-BEH-03', 3)], clue('A flop can come back to life.', 'Bad reviews at first — then players love it and keep buying.', 'Review under 55, player score 75+ later, lifetime sales at least 3× the first month.')),
  S('SEC-BEH-04', 'Genre Savior', G_BEH, 'Genre Savior accolade + a designer clue', [n('saviourGenres', 'gte', 1, 'Three commercial failures in a genre, then an 85+ hit in it', 'Games')], [R.accolade('genreSavior'), R.flag('designerClue')], clue('Never give up on a genre.', 'Fail in it again and again — then triumph.', '3 commercial failures in the same genre, then an 85+ hit in that genre.')),
  S('SEC-BEH-05', 'Bug Apocalypse', G_BEH, 'QA folklore event + a tech clue', [games([w('bugs', 'gte', 100), w('patchedFast', 'eq', true), w('abandoned', 'eq', false)], 1, 'Launched with 100+ bugs, patched under 5 within 3 months, support kept')], [R.flag('qaFolklore'), R.flag('techClue')], clue('Legends tell of the buggiest launch ever — and its rescue.', 'A disaster of bugs, fixed fast by a team that did not give up.', 'Launch with 100+ bugs, patch below 5 within 3 game months, support not abandoned.')),
  // --- New Game+ Secrets ------------------------------------------------------------------------------------------
  S('SEC-NGP-01', 'Back to Bedroom', G_NGP, 'Retro Studio palette + 2 Prestige Tokens', [{ fact: 'awardWins', op: 'countOf', where: [w('award', 'eq', 'C01'), w('stage', 'eq', 1, 'fixed')], value: 1, kind: 'fixed', label: 'The Local Indie Showcase (C01) won while still in the first studio', category: 'Awards' }], [R.cosmetic('retroPalette'), R.tokens('SEC-NGP-01', 2)], clue('Big studios sometimes miss their bedroom days.', 'Start small again, stay small, and win the local prize.', 'NG+1: win C01 while still at S1, only Tiny/Small projects, no publisher.'), { ngPlusMin: 1, forbids: [games([w('scope', 'in', ['standard', 'large', 'blockbuster', 'mega'])], 1, 'A project bigger than Small', 'Games'), games([w('deal', 'eq', true)], 1, 'A publisher deal', 'Business')] }),
  S('SEC-NGP-02', 'Dead Platform Hero', G_NGP, 'Lost Platform event chain', [games([w('score', 'gte', 85), w('finalYear', 'eq', true), w('copies', 'gte', 500000)], 1, 'An 85+ game released in a platform’s final year that sold 500k')], [R.flag('lostPlatformChain')], clue('The last game on a dying platform can be its best.', 'A great game for a platform in its final year — and it sells.', 'NG+2: an 85+ game released in a platform’s final active year, 500k sales.'), { ngPlusMin: 2 }),
  S('SEC-NGP-03', 'Legacy Team', G_NGP, 'Legacy Master + 3 Prestige Tokens', [n('legacyStaffRuns', 'gte', 3, 'The same Legacy Staff through NG+1, 2 and 3', 'Staff'), n('legacyOnC10', 'eq', true, 'Credited on a C10 winner', 'Awards', 'fixed')], [R.accolade('legacyMaster'), R.tokens('SEC-NGP-03', 3)], clue('Some teams are legends across lifetimes.', 'Carry the same people through every new start.', 'NG+3: the same Legacy Staff through NG+1, 2, 3, credited on a C10 winner.'), { ngPlusMin: 3 }),
  // --- Cross-Universe / Ultimate ----------------------------------------------------------------------------------
  S('SEC-X-01', 'RACEWORKS Licensed Game', G_X, 'RACEWORKS theme / crossover chain', [rank('A'), has('clues', 'raceworksLicence', 'The RACEWORKS licence signed', 'Events'), games([w('genre', 'eq', 'GEN05'), w('play', 'eq', 'PLY03'), w('score', 'gte', 85)], 1, 'A racing-management game (Racing + Management) reviewed 85+')], [R.flag('raceworksChain')], clue('A famous racing brand might lend its name.', 'Their licence — and a great racing management game.', 'Rank A, the RACEWORKS licence event, an 85+ Racing + Management game.')),
  S('SEC-X-02', 'PROJECT ONE', G_X, 'PROJECT ONE + software hidden ending + 5 Prestige Tokens', [ngCond(3), has('awards', 'C12', 'Perfect Game Circle (C12) won', 'Awards'), has('secretEver', 'SEC-COMBO-08', 'The One Combination found', 'Secrets'), n('prestigeEmployed', 'gte', 3, 'Three Prestige people in the studio', 'Staff'), n('prestigeEngineTech', 'eq', true, 'Prestige engine technology', 'Secrets', 'fixed'), games([w('scope', 'eq', 'mega'), w('bugs', 'lte', 3)], 1, 'A Mega game launched with at most 3 bugs')], [R.unlock('projectOne'), R.tokens('SEC-X-02', 5)], [{ text: 'There is one game every developer dreams of making.', minMet: 1 }, { text: 'Only a legendary studio could make it: perfect games, prestige people, prestige tools.', minMet: 2 }, { text: 'NG+3, C12, The One Combination, 3 Prestige staff, prestige engine tech, a Mega game with ≤3 launch bugs.', minMet: { share: 0.8 } }]),
  S('SEC-X-03', 'Studio Singularity', G_X, 'True hidden ending + account crown', [has('secretRun', 'SEC-X-02', 'PROJECT ONE this run', 'Secrets'), has('secretRun', 'SEC-HW-06', 'PROJECT X this run', 'Secrets'), n('yearsDone', 'gte', 20, 'Year 20 or later', 'Time', 'fixed'), n('fanTrust', 'gte', 85, 'Fan Trust 85+', 'Fans', 'threshold'), n('solvent', 'eq', true, 'Not in debt', 'Money', 'fixed')], [R.unlock('trueEnding'), R.cosmetic('accountCrown')], clue('Everything a studio can become, in one lifetime…', 'Both great projects in the same run, loved and debt-free.', 'NG+3, PROJECT ONE and PROJECT X in the same run, Year 20+, Fan Trust 85+, solvent.'), { ngPlusMin: 3, oncePerRun: false, oncePerAccount: true }),
];
export const secretById = (id) => SECRETS.find((s) => s.id === id) ?? null;
