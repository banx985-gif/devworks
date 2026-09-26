// Where and how DEVWORKS saves (Milestone 2). Its own database and keys, so it never meets another series game's
// saves (they can share a web address).
export const SAVE = {
  dbName: 'devworks',
  localPrefix: 'devworks:',
  key: 'devworks:campaign',
  rolling: 3, // keep the last 3 saves; a damaged newest copy falls back to the one before
  version: 1,
  intervalMs: 10000, // save every 10 s of running game time if anything changed (and on leaving the app)
  triggers: ['clock:month', 'clock:speed', 'world:moved'],
};
