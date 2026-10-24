// Element mastery (Milestone 40h, Kairosoft rule 6 "things you use get better with use"). Plain data for
// src/systems/mastery.js. Every element counts the released games that used it in this run; at levels[i] uses it reaches
// mastery level i + 1. Each level: bugPctPerLevel less bugs from that element's part of the work (one of the six recipe
// slots, so a level is −5% ÷ 6 of the game's bugs), and +outputPerLevel on the output it feeds most. Capped at the last
// level. It never reads or writes a secret, an award or the grade rules. A new run (NG+ too) starts from nothing.
export const MASTERY = {
  levels: [3, 6, 10],
  bugPctPerLevel: 5,
  outputPerLevel: 1,
  slots: 6, // the recipe's six families: an element's part of the work
  // The output each family feeds most (genre: the genre's own heaviest review weight, audio left out).
  feeds: { theme: 'story', gameplay: 'gameplay', technology: 'polish', artDirection: 'graphics', feature: 'innovation' },
  // Exceptions by element (logged in DECISIONS): Online Framework / Neural Tools feed innovation, the 3D technologies
  // the graphics, Co-op / Competitive Online the audience fit.
  feedsById: { TEC05: 'innovation', TEC08: 'innovation', TEC03: 'graphics', TEC04: 'graphics', TEC06: 'graphics', FEA02: 'audienceFit', FEA03: 'audienceFit' },
  toastSec: 3,
};
