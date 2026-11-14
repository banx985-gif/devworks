// Milestone 41b: what is worth a notification when the player leaves (data/pushNotes.js has the kinds and lines;
// core/LocalNotify plans and delivers them; BOTWORKS src/app/pushNotes.js is the pattern). Only things true in the game
// right now: the clock stops while the game is closed, so nothing here claims something finished while away.
//   wantedNotes(view, { now, slot }) → [{ kind, at, title, body, open: { screen, slot } }]
//     view: { started, month (1–12), awardsSoon: [award names held this month or next that you can enter] }
import { PUSH_KINDS, PUSH_TEXT, PUSH_RULES } from '../../data/pushNotes.js';

const KIND = Object.fromEntries(PUSH_KINDS.map((k) => [k.id, k]));
const HOUR = 3600000;
// The same line all day, a different one the next (no randomness).
const lineOf = (kind, now, arg) => {
  const lines = KIND[kind].lines;
  return lines[Math.floor(now / 86400000) % lines.length](arg);
};

export const showSoon = (month) => PUSH_RULES.showMonths.some((m) => m === month || m === (month % 12) + 1);

export function wantedNotes(view, { now = Date.now(), slot = 0 } = {}) {
  if (!view?.started) return [];
  const out = [];
  const add = (kind, arg) => out.push({ kind, at: now + KIND[kind].afterH * HOUR, title: PUSH_TEXT.title, body: lineOf(kind, now, arg), open: { screen: KIND[kind].open, slot } });
  if (view.awardsSoon?.length) add('awards', view.awardsSoon[0]);
  if (showSoon(view.month)) add('convention');
  add('comeBack');
  return out;
}

// The Settings ids: one main switch and one per kind (saved with the game's settings on this device).
export const PUSH_SETTING = { master: 'notify', kind: (id) => `notify_${id}` };
export const PUSH_DEFAULTS = { notify: true, notifyAsked: 0, ...Object.fromEntries(PUSH_KINDS.map((k) => [`notify_${k.id}`, true])) };
