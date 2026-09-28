// Publishers and contract work (Milestone 17, bible §23 and §25; §3 recovery). Plain data only; the rules are
// src/systems/publishers.js and src/systems/contracts.js. The bible gives the six publishers, their identity and deal
// style, the seven deal terms and the eight contract kinds; every number is a placeholder (plan review B), listed in
// the build log.

// Deal style per publisher (all multipliers of the base deal for the game's scope):
//   advance       × the base advance (paid when the deal is signed; the publisher keeps it — no recoup)
//   sharePct      the publisher's share of that game's sales revenue (launch and back catalogue)
//   hype          Hype the publisher's marketing adds when the game starts
//   slack         milestone deadlines = the team's estimate × this (higher = more lenient)
//   control       creative-control clause: null | 'scope' (the game must be exactly this scope) |
//                 'genre' (+ scope: the genre must be one of 3 the publisher picks)
//   ipChance      chance the deal has the IP clause (the publisher owns the franchise: no sequel without them)
//   salesPct      the publisher's reach: extra launch sales (Atlas global, OpenGate on PC only)
//   rank          earliest studio rank the publisher offers deals at
//   weight        how often it offers (relative)
export const PUBLISHERS = [
  { id: 'PUB01', name: 'Brightline Publishing', identity: 'Friendly indie funding', style: 'Low advance, fair royalty', rank: null, weight: 4, advance: 0.6, sharePct: 20, hype: 5, slack: 1.6, control: null, ipChance: 0.1, salesPct: 0, logo: 'publisher_logo_pub01' },
  { id: 'PUB02', name: 'Northstar Media', identity: 'Marketing muscle', style: 'Higher marketing, stricter milestones', rank: null, weight: 3, advance: 0.9, sharePct: 30, hype: 16, slack: 1.25, control: null, ipChance: 0.2, salesPct: 0, logo: 'publisher_logo_pub02' },
  { id: 'PUB03', name: 'Atlas Interactive', identity: 'Global localisation', style: 'Strong global reach', rank: 'D', weight: 3, advance: 0.8, sharePct: 25, hype: 8, slack: 1.4, control: null, ipChance: 0.15, salesPct: 15, logo: 'publisher_logo_pub03' },
  { id: 'PUB04', name: 'CrownArc', identity: 'Blockbusters', style: 'Huge advances, high control', rank: 'C', weight: 2, advance: 2.2, sharePct: 40, hype: 20, slack: 1.2, control: 'genre', ipChance: 0.6, salesPct: 0, logo: 'publisher_logo_pub04' },
  { id: 'PUB05', name: 'OpenGate Digital', identity: 'Digital-first', style: 'Low physical costs, PC strength', rank: null, weight: 3, advance: 0.7, sharePct: 22, hype: 6, slack: 1.5, control: null, ipChance: 0.1, salesPct: 10, pcOnly: true, logo: 'publisher_logo_pub05' },
  { id: 'PUB06', name: 'Meridian Entertainment', identity: 'Premium partner', style: 'Top-tier deals after Rank A', rank: 'A', weight: 2, advance: 2.6, sharePct: 30, hype: 25, slack: 1.4, control: 'scope', ipChance: 0.3, salesPct: 10, logo: 'publisher_logo_pub06' },
];
export const publisherById = (id) => PUBLISHERS.find((p) => p.id === id) ?? null;

export const DEALS = {
  offersPerMonth: 1, // base offers a month (plus one per two ranks above E)
  maxOffers: 4,
  maxSigned: 2, // signed deals at once (signed and waiting for a game, or on a game in the works)
  startWithinDays: 56, // a signed deal must be put on a New Game within this many days, or it lapses
  lapseRepayPct: 100, // a lapsed deal pays the advance back
  advanceDaysPct: 60, // base advance = the scope's daily cost × the team's estimated days × this %
  // Milestones: Prototype, Alpha/Beta (end of phase 4) and the finish, each due at the team's estimate for that point ×
  // the publisher's slack. A missed milestone costs missPct of the advance (once per milestone; never a lock).
  milestones: [
    { phase: 0, name: 'Prototype' },
    { phase: 3, name: 'Alpha / Beta' },
    { phase: 4, name: 'Gold Master' },
  ],
  missPct: 15,
  // Recovery weighting (bible §3): a studio short of cash (Credits under shortCash, or in debt) gets extraOffers more
  // offers and richer advances.
  recovery: { shortCash: 5000, extraOffers: 1, advanceMult: 1.4 },
};

// Contract work (bible §25): kinds of job for other studios. stat: the work stat that counts; work: progress needed;
// pay: Credits per point of work; days: the deadline is the team's estimate × slack (never less than minDays).
// needs: what the studio must have for this kind to be offered at all (so no job asks for the impossible).
export const CONTRACT_KINDS = [
  { id: 'porting', name: 'Porting job', stat: 'code', work: 60, pay: 55, needs: { platforms: 2 }, line: 'Port another studio’s game to a second platform.' },
  { id: 'bugfix', name: 'Bug-fix rescue', stat: 'code', work: 45, pay: 60, needs: {}, line: 'A buggy game needs fixing before its launch.' },
  { id: 'dlc', name: 'DLC support', stat: 'des', work: 55, pay: 50, needs: {}, line: 'Build extra levels for someone else’s hit.' },
  { id: 'tieIn', name: 'Licensed tie-in', stat: 'art', work: 70, pay: 52, needs: {}, line: 'A small game for a film or cartoon brand.' },
  { id: 'prototype', name: 'Prototype', stat: 'des', work: 40, pay: 48, needs: {}, line: 'Prove an idea for a publisher.' },
  { id: 'engineIntegration', name: 'Engine integration', stat: 'code', work: 65, pay: 62, needs: { engine: true }, line: 'Fit your own engine to a client’s game.' },
  { id: 'localisation', name: 'Localisation', stat: 'wrt', work: 45, pay: 46, needs: {}, line: 'Translate and adapt a game’s text.' },
  { id: 'launchDemo', name: 'Platform launch demo', stat: 'art', work: 50, pay: 58, needs: { platforms: 1 }, line: 'A showcase demo for a platform holder.' },
];
export const contractKindById = (id) => CONTRACT_KINDS.find((k) => k.id === id) ?? null;
export const CONTRACTS = {
  maxActive: 2,
  offersPerMonth: 3,
  progressDivisor: 60, // a day's progress = Σ(team's stat × their work multiplier) ÷ this
  slack: 1.8, // deadline = estimated days × this
  minDays: 14,
  payRankPct: 10, // pay +10% for each rank above E
  failFame: 5, // a failed (missed) contract costs this much Fame
  clients: ['Moonbeam Arcade', 'Paper Rocket Games', 'Jolly Kraken Studio', 'Tiny Comet Interactive', 'Velvet Joystick', 'Sunny Loop Studio', 'Copper Kite Studio', 'Maple Circuit Games'],
};
