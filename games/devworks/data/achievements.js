// Achievements (Milestone 32, bible §39): the 40 visible achievements, exactly as the bible numbers them. Plain data;
// core/AchievementSystem.js checks them on trigger events against the facts src/systems/achievements.js provides.
// Account-wide: once earned, earned in every later run and never granted again (reload, re-earn, NG+).
//
// The fuzzy ones, defined (build log):
//   First Hit            a game reviewed 80+ whose sales revenue has covered its production cost
//   In the Black         a finished game year with more income than costs
//   Ten Million Club     10 million copies sold across all your games
//   First Expansion      an add-on (Milestone 20 post-launch support) released for a game
//   Patch Hero           support brought a game that launched with 10+ bugs down to 0
//   Word of Mouth        a #1 chart week for a game whose marketing was at most 5% of its production cost (SEC-BEH-02's
//                        visible mirror)
//   Narrative / Art Winner  the Narrative & Arts Awards (C06) won by a game whose Story (Narrative) or Graphics (Art) is
//                        its stronger side
//   First Major Sponsor / Strategic Partner  a sponsor relationship at the Major / Strategic tier (Milestone 18 tiers)
//   Rented No More / Professional / Headquarters / Global Campus  reaching studio stage S2 / S3 / S4 / S5
//   Profitable Hardware Generation  one console generation with lifetime profit above 0
//   Hall of Fame 10      10 entries in the Hall of Fame (games, engines and consoles together)
//   Year-20 Survivor     reaching the end of Year 20 (the Year-20 ending) with no debt
// Reward: RESEARCH_RP research points, paid once per account (the first run that earns it).
const T = ['gameReleased', 'projectComplete', 'monthEnd', 'yearEnd', 'awardWon', 'stageUp', 'consoleLaunched', 'consoleMonth', 'engineComplete', 'hardwarePrototype', 'external', 'licence', 'sponsor', 'support', 'franchise', 'hallOfFame'];
const at = (fact, value, op = 'gte') => ({ fact, op, value });
const A = (n, name, text, requires, extra = {}) => ({ id: `ACH${String(n).padStart(2, '0')}`, n, name, text, requires, triggerEvents: T, reward: [{ currency: 'rp', amount: 25 }], ...extra });

export const ACHIEVEMENTS = [
  A(1, 'First Build', 'Finish your first game.', at('gamesFinished', 1), { icon: 'dev_ui_07' }),
  A(2, 'First Review', 'Release a game and read its reviews.', at('releases', 1), { icon: 'dev_ui_21' }),
  A(3, 'In the Black', 'End a game year with more income than costs.', at('profitableYears', 1), { icon: 'dev_ui_05' }),
  A(4, 'First Hit', 'Release a game reviewed 80+ that has paid back its cost.', at('hits', 1), { icon: 'dev_reward_05' }),
  A(5, 'Million Seller', 'Sell 1,000,000 copies of one game.', at('bestCopies', 1000000), { icon: 'dev_reward_06', progress: { fact: 'bestCopies', target: 1000000 } }),
  A(6, 'Ten Million Club', 'Sell 10,000,000 copies across all your games.', at('totalCopies', 10000000), { icon: 'dev_ui_22', progress: { fact: 'totalCopies', target: 10000000 } }),
  A(7, 'First Sequel', 'Release a sequel.', at('sequels', 1), { icon: 'dev_ui_13' }),
  A(8, 'First Remake', 'Release a remake.', at('remakes', 1), { icon: 'dev_ui_12' }),
  A(9, 'First Expansion', 'Release an add-on for one of your games.', at('expansions', 1), { icon: 'dev_ui_07' }),
  A(10, 'Bug Free', 'Launch a game with zero bugs.', at('bugFree', 1), { icon: 'dev_ui_06' }),
  A(11, 'Patch Hero', 'Patch a game that launched with 10+ bugs down to zero.', at('patchHeroes', 1), { icon: 'dev_ui_06' }),
  A(12, 'Word of Mouth', 'Top the charts for a week with marketing at most 5% of the dev budget.', at('wordOfMouth', 1), { icon: 'dev_ui_10' }),
  A(13, 'First Award', 'Win any award.', at('awardCount', 1), { icon: 'award_trophy_01' }),
  A(14, 'National Winner', 'Win the National Game Awards (C04).', { fact: 'awards', op: 'has', value: 'C04' }, { icon: 'award_trophy_02' }),
  A(15, 'Global Winner', 'Win the Global Interactive Awards (C09).', { fact: 'awards', op: 'has', value: 'C09' }, { icon: 'award_trophy_06' }),
  A(16, 'Game of the Year', 'Win Game of the Year / Studio of the Year (C10).', { fact: 'awards', op: 'has', value: 'C10' }, { icon: 'award_trophy_07' }),
  A(17, 'Best Design', 'Win the Design Guild Prize (C03).', { fact: 'awards', op: 'has', value: 'C03' }, { icon: 'award_trophy_02' }),
  A(18, 'Technical Excellence', 'Win the Technical Achievement Expo (C05).', { fact: 'awards', op: 'has', value: 'C05' }, { icon: 'award_trophy_03' }),
  A(19, 'Narrative Winner', 'Win the Narrative & Arts Awards with a story-led game.', at('narrativeWins', 1), { icon: 'award_trophy_04' }),
  A(20, 'Art Winner', 'Win the Narrative & Arts Awards with an art-led game.', at('artWins', 1), { icon: 'award_trophy_04' }),
  A(21, 'First Own Engine', 'Build your own engine.', at('engines', 1), { icon: 'dev_ui_11' }),
  A(22, 'Engine Licensed', 'License your engine to another studio.', at('engineCustomers', 1), { icon: 'business_ui_10' }),
  A(23, 'Ten Engine Customers', 'License your engines to 10 customers.', at('engineCustomers', 10), { icon: 'dev_reward_07', progress: { fact: 'engineCustomers', target: 10 } }),
  A(24, 'First Published External Game', 'Publish another studio’s game.', at('externalReleased', 1), { icon: 'business_ui_11' }),
  A(25, 'External Hit', 'Publish another studio’s game reviewed 80+.', at('externalHits', 1), { icon: 'business_ui_11' }),
  A(26, 'First Major Sponsor', 'Grow a sponsor relationship to the Major tier.', at('sponsorTier', 2), { icon: 'business_ui_05' }),
  A(27, 'Strategic Partner', 'Grow a sponsor relationship to the Strategic tier.', at('sponsorTier', 3), { icon: 'business_ui_05' }),
  A(28, 'Rented No More', 'Move into your own office (studio stage 2).', at('stage', 2), { icon: 'dev_ui_05' }),
  A(29, 'Professional', 'Become a Professional Studio (stage 3).', at('stage', 3), { icon: 'dev_ui_05' }),
  A(30, 'Headquarters', 'Build your Corporate HQ (stage 4).', at('stage', 4), { icon: 'dev_ui_05' }),
  A(31, 'Global Campus', 'Open the Global Campus (stage 5).', at('stage', 5), { icon: 'dev_ui_05' }),
  A(32, 'First Blockbuster', 'Release a Blockbuster game.', at('blockbusters', 1), { icon: 'dev_ui_08' }),
  A(33, 'First Mega Project', 'Release a Mega game.', at('megas', 1), { icon: 'dev_ui_07' }),
  A(34, 'Legendary Franchise', 'Grow a franchise to Legendary.', at('legendaryFranchises', 1), { icon: 'dev_reward_08' }),
  A(35, 'First Console Prototype', 'Build your first console prototype.', at('prototypes', 1), { icon: 'dev_ui_26' }),
  A(36, 'Console Launch', 'Launch your own console.', at('consolesLaunched', 1), { icon: 'dev_ui_29' }),
  A(37, 'One Million Consoles', 'Sell 1,000,000 of one console.', at('hw.maxUnits', 1000000), { icon: 'dev_reward_09', progress: { fact: 'hw.maxUnits', target: 1000000 } }),
  A(38, 'Profitable Hardware Generation', 'A console generation with a lifetime profit.', at('hw.profitableGenerations', 1), { icon: 'dev_ui_29' }),
  A(39, 'Hall of Fame 10', 'Put 10 entries in the Hall of Fame.', at('hallOfFame.total', 10), { icon: 'dev_reward_10', progress: { fact: 'hallOfFame.total', target: 10 } }),
  A(40, 'Year-20 Survivor', 'Reach the end of Year 20 with no debt.', { all: [at('yearsDone', 20), { fact: 'solvent', op: 'eq', value: true }] }, { icon: 'award_trophy_07' }),
];
export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id) ?? null;

// Hall of Fame (bible §36 F33, §43): who gets in. Entries are kept by the account (every run, every save).
export const HALL_OF_FAME = { gameReview: 90, gameCopies: 1000000, engineCustomers: 10, consoleUnits: 1000000, star: 'dev_reward_10' };

// Account records (core AccountRecords): the best ever, and which run set it.
export const RECORD_DEFS = [
  { id: 'bestReview', name: 'Best review', better: 'max' },
  { id: 'bestFirstMonth', name: 'Best first-month sales', better: 'max' },
  { id: 'bestLifetime', name: 'Best lifetime sales (one game)', better: 'max' },
  { id: 'mostAwardsSeason', name: 'Most awards in one season', better: 'max' },
  { id: 'highestRank', name: 'Highest rank reached', better: 'max' },
  { id: 'fastestRankA', name: 'Fastest to Rank A (days)', better: 'min' },
  { id: 'biggestInstallBase', name: 'Biggest console install base', better: 'max' },
  { id: 'secretsFound', name: 'Secrets found', better: 'max' },
  { id: 'prestigeTokens', name: 'Prestige Tokens', better: 'max' },
];
