// Where and how DEVWORKS saves (Milestone 2). Its own database and keys, so it never meets another series game's
// saves (they can share a web address).
// Milestone 5b: four campaign slots on the shared core/SaveSlots.js, each its own SaveSlot (its own rolling copies),
// so playing one never touches another. Slot 1 keeps the old key, so a save from before 5b simply is Slot 1
// (migrated to version 2: a studio name, a director and Alex Byte as Founder). metaKey holds the last slot played.
export const SAVE = {
  dbName: 'devworks',
  localPrefix: 'devworks:',
  slots: ['devworks:campaign', 'devworks:campaign:2', 'devworks:campaign:3', 'devworks:campaign:4'],
  metaKey: 'devworks:meta',
  accountKey: 'devworks:account', // Milestone 15: what every run shares (the combos discovered)
  secretsAccountKey: 'devworks:account:secrets',
  achievementsKey: 'devworks:account:achievements', // Milestone 32: achievements, the Hall of Fame, account records // Milestone 28: secrets found in any run, prestige tokens, account flags
  rolling: 3, // each slot keeps its last 3 saves; a damaged newest copy falls back to the one before
  version: 2,
  intervalMs: 10000, // save every 10 s of running game time if anything changed (and on leaving the app)
  triggers: ['clock:month', 'clock:speed', 'world:moved', 'project:start', 'project:phase', 'project:complete', 'game:released', 'reputation:rankUp', 'studio:stage', 'marketing:run', 'research:start', 'research:complete', 'combo:found', 'staff:hired', 'staff:letGo', 'training:start', 'training:complete', 'mentor:start', 'engine:start', 'engine:complete', 'deal:signed', 'deal:attached', 'contract:accepted', 'contract:success', 'sponsor:signed', 'sponsor:ended', 'award:result', 'support:start', 'support:done'],
};
