// DEVWORKS numbers (Milestone 2). Plain data only; placeholders are marked and will be tuned with the economy.

// Calendar, bible §4: 12 months × 28 days, 1 day = 2.5 s at 1×. The speeds are the top bar's Pause / 1× / 2× / 4×.
// (Bible §4 unlocks 2× after the first shipped game and 4× at Rank C / Year 4; games ship from Milestone 4,
// so every speed is open for now.)
export const CALENDAR = {
  daysPerMonth: 28,
  monthsPerYear: 12,
  secondsPerDay: 2.5,
  speeds: [1, 2, 4],
};

// Staff condition (bible §9: Energy and Morale 0–100; nobody resigns). Rates are placeholders (the bible gives none):
// a worker at 100 Energy works about 14 days (~35 s at 1×) before heading to the Break Area, and rests about 5 days.
export const STAFF_BALANCE = {
  startEnergy: 100,
  startMorale: 75,
  workEnergyLoss: { min: 4, max: 6 }, // per working day
  restEnergyGain: 12, // per resting day, before the Break Area's bonus
  tiredBelow: 30, // Energy under this: "tired" icon, and they go to rest
  stressedBelow: 25, // Morale under this: "low morale" icon
  backToWorkAt: 90, // Energy at which a resting worker goes back to their station
  unassignedMorale: { afterMonths: 2, perMonth: 0 }, // no Morale loss for being idle until projects exist (Milestone 3)
};

// Top bar placeholders until the economy exists.
export const START_WALLET = { credits: 5000, tokens: 0, rank: 'E' };
