// Reward drops (Milestone 40c, Aaron's play-feel notes §4): a gift box (small) or a chest (big) drops onto the live
// build panel for doing well; tap to open. Plain data; the rules are src/systems/rewards.js. All placeholders (the
// M40c Log lists them). Never an element or secret unlock, never anything only sold in the Store (bible §2.8).
export const REWARDS = {
  maxWaiting: 5, // unopened drops kept (and saved); a new one past this is not dropped
  drops: {
    breakthroughChance: 0.15, // a breakthrough drops a gift box
    phaseOnTrackChance: 0.2, // a milestone finished on schedule ("above expectation") drops a gift box
    releaseReview: 75, // a release reviewed this or better drops a chest
  },
  // What is inside: one roll (seeded) on the table for the drop's size. Credits and RP scale with the year
  // (× (1 + perYear × (year − 1))).
  small: [
    { type: 'credits', weight: 4, amount: 600, text: '{n} Credits' },
    { type: 'rp', weight: 3, amount: 20, text: '{n} Research Points' },
    { type: 'energy', weight: 2, amount: 8, text: 'The team: +{n} Energy and Morale' },
    { type: 'idea', weight: 2, amount: 3, text: 'An idea: +{n} {stat} on your next game' },
  ],
  big: [
    { type: 'credits', weight: 4, amount: 2500, text: '{n} Credits' },
    { type: 'rp', weight: 3, amount: 70, text: '{n} Research Points' },
    { type: 'energy', weight: 2, amount: 15, text: 'The team: +{n} Energy and Morale' },
    { type: 'idea', weight: 2, amount: 5, text: 'An idea: +{n} {stat} on your next game' },
    { type: 'voucher', weight: 2, amount: 1, text: 'A training voucher: your next course is free' },
    { type: 'marketing', weight: 2, amount: 1, text: 'A free marketing action: the next one costs nothing' },
    { type: 'token', weight: 0.4, amount: 1, text: 'A Studio Token' },
  ],
  perYear: 0.25,
  ideaStats: ['gameplay', 'graphics', 'story', 'innovation', 'polish', 'audienceFit'],
  art: { small: 'dev_reward_11', big: 'dev_reward_12' }, // code-drawn until the files exist
};
