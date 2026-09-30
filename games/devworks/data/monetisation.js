// Monetisation stubs (Milestone 36, bible §45, §2.8 "paid convenience never buys prestige", §44). Plain data for the
// core services (AdService, CommerceService, EntitlementService) wired in src/systems/monetisation.js. No real ad
// network or store: a normal web build has no provider (every ad and purchase says "not available" and the game
// carries on); ?debug=1 installs core FakeStoreProvider, whose next ad / purchase can succeed, cancel, fail or be
// offline (the Store screen's debug switches).
//
// Nothing here may reach a secret, an award, Prestige Tokens, C11 / C12, PROJECT ONE / X, the true ending or the grade:
// every grant below is Credits-free convenience (a refresh, a speed-up, RP, Studio Tokens) — tested against that list.

// Products. Studio Token pack sizes (logged): 20 / 120 / 300.
export const PRODUCTS = {
  remove_ads: { kind: 'nonConsumable', entitlement: 'removeAds', name: 'Remove Ads', price: '£3.99', line: 'No automatic ads, ever. Rewarded ads stay optional.' },
  tokens_20: { kind: 'consumable', name: '20 Studio Tokens', price: '£0.99', grant: { tokens: 20 } },
  tokens_120: { kind: 'consumable', name: '120 Studio Tokens', price: '£4.99', grant: { tokens: 120 } },
  tokens_300: { kind: 'consumable', name: '300 Studio Tokens', price: '£9.99', grant: { tokens: 300 } },
  vip_monthly: { kind: 'subscription', entitlement: 'vip', name: 'VIP (monthly)', price: '£4.99 a month', line: 'Ad-free, daily Studio Tokens and small conveniences. No VIP-only content.' },
};
export const PRODUCT_ORDER = ['remove_ads', 'tokens_20', 'tokens_120', 'tokens_300', 'vip_monthly'];

// VIP (§45): ad-free · daily Studio Tokens · Support Lead 35% · a second research queue · a monthly recruitment refresh ·
// a minor Auto Training speed-up. The perks are effects the studio reads (world.effect), never a rule's fact.
export const VIP = {
  graceHours: 72,
  dailyTokens: 5,
  perks: { supportLeadPct: 35, trainingDaysPct: -10 },
  lines: ['No automatic ads', '5 Studio Tokens a day (claim in the Store)', 'Support Lead +35%: the lead of a post-launch team works 35% faster', 'A second research queue: pick the next topic, it starts by itself', 'A free recruitment refresh every month', 'Training courses 10% shorter'],
};

// Rewarded ads (§45): the player chooses to watch; only an ad watched to the end grants anything.
//   limit: per 'gameMonth' (scope = the game month), per 'target' (scope = that contract / course), or 'realHours'
export const REWARDED = [
  { id: 'recruitRefresh', name: 'Recruitment refresh', line: 'A fresh board of candidates', limit: { per: 'gameMonth', count: 1 } },
  { id: 'contractBoost', name: '+20% contract reward', line: 'On an ordinary contract in progress', bonusPct: 20, limit: { per: 'target', count: 1 } },
  { id: 'trainingBoost', name: 'Training speed-up', line: 'A training course 30% nearer the end', pct: 30, limit: { per: 'target', count: 1 } },
  { id: 'smallGrant', name: 'Small grant', line: '+30 RP and 1 Studio Token', rp: 30, tokens: 1, limit: { per: 'realHours', hours: 4, count: 3 } },
  { id: 'offerRefresh', name: 'New offers', line: 'Fresh sponsor offers and one more publisher offer', limit: { per: 'gameMonth', count: 1 } },
];

// Interstitials (§45): natural boundaries only — after a release, after a year end — capped (logged here), never during
// a decision, an ending, a ceremony or a sheet, and never with Remove Ads or VIP.
export const INTERSTITIAL_CAPS = { firstInstallQuietMin: 10, minGapMin: 15, maxPerHour: 2, afterResumeQuietSec: 60, afterPurchaseQuietMin: 10, breakPoints: ['afterRelease', 'yearEnd'] };

// Studio Token spends (§45): refreshes, cosmetics, normal training / research speed-ups, offer refresh.
export const TOKEN_SPENDS = [
  { id: 'recruitRefresh', name: 'Recruitment refresh', cost: 1, line: 'A fresh board now' },
  { id: 'offerRefresh', name: 'New offers', cost: 2, line: 'Fresh sponsor offers and one more publisher offer' },
  { id: 'trainingBoost', name: 'Training speed-up', cost: 2, line: 'The course nearest the end: 30% nearer', pct: 30 },
  { id: 'researchBoost', name: 'Research speed-up', cost: 3, line: 'The topic being researched: +25% of its work', pct: 25 },
  { id: 'signRepaint', name: 'Repaint the studio sign', cost: 1, line: 'The next studio colour (a cosmetic)' },
];

// What a paid grant may touch — the test checks every grant against it (and against the prestige list).
export const PAID_GRANT_KINDS = ['tokens', 'rp', 'recruitRefresh', 'offerRefresh', 'contractBonus', 'trainingDays', 'researchProgress', 'signColour', 'entitlement'];
export const PRESTIGE_THINGS = ['secret', 'award', 'prestigeTokens', 'C11', 'C12', 'projectOne', 'projectX', 'trueEnding', 'grade'];

export const STORE_MESSAGES = {
  unavailable: 'The store is not available in this version. Nothing was charged.',
  offline: 'Could not reach the store. Check your connection and try again. Nothing was charged.',
  cancelled: 'Purchase cancelled. Nothing was charged.',
  failed: 'The purchase did not go through. Nothing was charged.',
};
export const AD_TEXT = {
  unavailable: 'No ad available right now — the game carries on.',
  cancelled: 'Ad closed early: no reward.',
  failed: 'The ad did not play: no reward.',
  offline: 'You are offline: no ad right now.',
};
