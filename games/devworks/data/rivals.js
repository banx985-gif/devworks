// Rival studios (Milestone 19, bible §29). Plain data only; the rules are src/systems/rivals.js. The bible gives the
// eight studios, their identity, strength and first year; the release numbers are placeholders (plan review B), listed
// in the build log. Rivals are not companies: they release generated titles on a fixed strength curve (core
// RivalSystem: growth per year from their first year), never reading the player's games (no rubber-banding).
//
//   releaseChance  chance of a release in any month they are active
//   review         their typical review in their first year (core RivalSystem target); growthPctPerYear raises it
//   strengths      the outputs their games are strong in (+strengthBonus on those, for the awards)
//   genres / themes  what they make;  scale: how many copies a typical release sells;  bigChance: a big release
//   hidden         Ghostlight: secret, never shown or released until its secret (a later milestone)
export const RIVALS = [
  { id: 'R01', name: 'Copper Pixel', identity: 'Indie efficiency', strength: 'Small games, clever scope', firstYear: 1, releaseChance: 0.22, review: 52, growthPctPerYear: 2.5, strengths: ['gameplay', 'polish'], genres: ['GEN08', 'GEN01', 'GEN04'], themes: ['THM03', 'THM09', 'THM06'], scale: 700, bigChance: 0.05, logo: 'rival_logo_r01' },
  { id: 'R02', name: 'Moonforge Games', identity: 'Fantasy / RPG', strength: 'Story-heavy franchises', firstYear: 3, releaseChance: 0.12, review: 66, growthPctPerYear: 2.5, strengths: ['story'], genres: ['GEN02', 'GEN07'], themes: ['THM01', 'THM06'], scale: 1500, bigChance: 0.2, logo: 'rival_logo_r02' },
  { id: 'R03', name: 'Redline Interactive', identity: 'Action / Racing', strength: 'Hype and technical polish', firstYear: 4, releaseChance: 0.14, review: 67, growthPctPerYear: 2.5, strengths: ['graphics', 'polish'], genres: ['GEN06', 'GEN05'], themes: ['THM03', 'THM02', 'THM07'], scale: 1800, bigChance: 0.35, logo: 'rival_logo_r03' },
  { id: 'R04', name: 'StoryArc Studio', identity: 'Narrative', strength: 'Writers and awards', firstYear: 5, releaseChance: 0.1, review: 72, growthPctPerYear: 2, strengths: ['story'], genres: ['GEN07', 'GEN02', 'GEN10'], themes: ['THM07', 'THM04', 'THM09'], scale: 1200, bigChance: 0.15, logo: 'rival_logo_r04' },
  { id: 'R05', name: 'Vanta Labs', identity: 'Technology', strength: 'Engines, graphics, PC audience', firstYear: 7, releaseChance: 0.12, review: 72, growthPctPerYear: 2, strengths: ['graphics', 'innovation'], genres: ['GEN06', 'GEN03', 'GEN04'], themes: ['THM02', 'THM05', 'THM10'], scale: 2200, bigChance: 0.25, logo: 'rival_logo_r05' },
  { id: 'R06', name: 'CrownByte', identity: 'Commercial blockbusters', strength: 'Marketing, sequels, platform deals', firstYear: 9, releaseChance: 0.15, review: 74, growthPctPerYear: 1.5, strengths: ['audienceFit', 'graphics'], genres: ['GEN06', 'GEN09', 'GEN05', 'GEN02'], themes: ['THM03', 'THM02', 'THM04'], scale: 5000, bigChance: 0.6, logo: 'rival_logo_r06' },
  { id: 'R07', name: 'Titan Owl', identity: 'Global all-rounder', strength: 'World-class benchmark', firstYear: 13, releaseChance: 0.12, review: 82, growthPctPerYear: 1, strengths: ['gameplay', 'graphics', 'story'], genres: ['GEN02', 'GEN06', 'GEN07', 'GEN03'], themes: ['THM01', 'THM02', 'THM05'], scale: 8000, bigChance: 0.6, logo: 'rival_logo_r07' },
  { id: 'R08', name: 'Ghostlight Studio', identity: 'Adaptive prestige', strength: 'Secret rival that targets your strengths', firstYear: 99, releaseChance: 0, review: 90, growthPctPerYear: 0, strengths: [], genres: ['GEN07'], themes: ['THM02'], scale: 0, bigChance: 0, hidden: true, logo: 'rival_logo_r08' },
];
export const rivalById = (id) => RIVALS.find((r) => r.id === id) ?? null;

// Milestone 30 — Ghostlight Studio (R08), a secret rival: enabled by SEC-RIVAL-01. It makes prestige titles aimed at the
// player's strengths, from a plan fixed at the start of each year (and saved): the genre and theme of the player's
// best-reviewed released games of the last lookbackYears, and their best review. Each month: releaseChance of a
// release, reviewed best − noiseDown … best + noiseUp, but never above best + maxAbove (bible §29: no exact
// rubber-banding — it never reads a game still being made, and the plan never changes mid-year). No plan (nothing
// released yet): no releases.
export const GHOSTLIGHT = { id: 'R08', releaseChance: 0.3, lookbackYears: 3, noiseDown: 6, noiseUp: 4, maxAbove: 5, floor: 60, strengthBonus: 4, scale: 400000, bigChance: 0.5 };

export const RIVAL_BALANCE = {
  // core RivalSystem rules: no specialty in releases (the weights are empty), growth clamped to ±40%.
  rules: { specialtyBase: 0, specialtyPctPerPoint: 0, ngPlusPct: 0, growthClampPct: 25 }, // Milestone 40: 40 → 25 (late rivals top out in the 80s–low 90s, so C10 is winnable)
  noise: 5, // review ± this (seeded). Milestone 40: 8 → 5
  strengthBonus: 6, // their strength outputs this much above their review
  outputNoise: 6,
  bigReview: 82, // a release this good is "big" too (a big launch-week clash)
  maxPerMonth: 3, // at most this many rival releases in one month (in rival order)
};

// Generated titles: one word from each list per rival style (all made up).
export const RIVAL_TITLES = {
  first: ['Iron', 'Crystal', 'Neon', 'Silent', 'Hollow', 'Golden', 'Rapid', 'Lost', 'Emerald', 'Storm', 'Echo', 'Velvet', 'Rogue', 'Sky', 'Paper', 'Ember'],
  second: ['Kingdom', 'Circuit', 'Tales', 'Rush', 'Harbor', 'Legacy', 'Drift', 'Frontier', 'Chronicle', 'Arena', 'Garden', 'Signal', 'Odyssey', 'Pulse', 'Quest', 'Rally'],
};
