// Settings / Accessibility (Milestone 34, bible §51). Device settings (core/Settings.js, localStorage + the account
// database), never part of a run. Each entry: { id, label, group, options: [{ id, label }], line }.
// What each does now (main.js applySettings): textSize → core setTextScale (every font); reducedFlashes → no confetti
// or screen flashes; reducedMotion → no launch rocket or camera glides; lowVfx → fewer effects and no dev pops;
// reducedWorkerDetail → no tired / work icons over workers; confirmDestructive → Sell / Let go / Delete ask first;
// largerTargets → the bottom sheet's buttons grow; holdDuration → how long the one hold action (Dialog hold) takes;
// textSpeed → how long banners stay; extraComboHints → New Game shows every near-miss, not just one;
// colourBlindSymbols → ✓ / ✗ / ! next to coloured good / bad / risk lines; statsMode → Advanced shows every number on
// staff cards. Audio (Master / Music / SFX) sets the code-made music and sounds (Milestone 38); haptics: phone vibration
// on the big moments only.
// Accessibility never reduces rewards or blocks secrets: no rule reads a setting.
const lvl = (ids) => ids.map((id) => ({ id, label: id === 0 ? 'Off' : `${id}%` }));
const onOff = [{ id: false, label: 'Off' }, { id: true, label: 'On' }];

export const SETTINGS = [
  { id: 'master', label: 'Master volume', group: 'Audio', options: lvl([0, 25, 50, 75, 100]), line: 'Sound starts after your first tap.' },
  { id: 'music', label: 'Music', group: 'Audio', options: lvl([0, 25, 50, 75, 100]) },
  { id: 'sfx', label: 'Sound effects', group: 'Audio', options: lvl([0, 25, 50, 75, 100]) },
  { id: 'textSize', label: 'UI scale (text size)', group: 'Visual', options: [{ id: 'normal', label: 'Normal' }, { id: 'large', label: 'Large' }, { id: 'larger', label: 'Larger' }], line: 'Large: every text 15% bigger; Larger: 30%.' },
  { id: 'reducedFlashes', label: 'Reduced flashes', group: 'Visual', options: onOff, line: 'No confetti or bright bursts.' },
  { id: 'reducedMotion', label: 'Reduced motion', group: 'Visual', options: onOff, line: 'No launch rocket, no shakes; sheets appear without sliding.' },
  { id: 'lowVfx', label: 'Low effects', group: 'Visual', options: onOff, line: 'Simple drawn effects only (no picture effects), fewer particles.' },
  { id: 'reducedWorkerDetail', label: 'Reduced worker detail', group: 'Visual', options: onOff, line: 'No icons or work pops over the workers.' },
  { id: 'confirmDestructive', label: 'Confirm before selling or letting go', group: 'Interaction', options: onOff },
  { id: 'haptics', label: 'Vibration on big moments', group: 'Interaction', options: onOff, line: 'Phones only.' },
  { id: 'largerTargets', label: 'Larger buttons in sheets', group: 'Interaction', options: onOff },
  { id: 'holdDuration', label: 'Hold time', group: 'Interaction', options: [{ id: 0.5, label: 'Short' }, { id: 0.8, label: 'Normal' }, { id: 1.2, label: 'Long' }] },
  { id: 'textSpeed', label: 'Banner time', group: 'Interaction', options: [{ id: 'fast', label: 'Short' }, { id: 'normal', label: 'Normal' }, { id: 'slow', label: 'Long' }] },
  { id: 'extraComboHints', label: 'Extra combo hints', group: 'Information', options: onOff, line: 'New Game lists every near-miss combo, not just one.' },
  { id: 'colourBlindSymbols', label: 'Colour-blind-safe symbols', group: 'Information', options: onOff, line: '✓ ✗ ! next to good, bad and risky lines.' },
  { id: 'statsMode', label: 'Stats', group: 'Information', options: [{ id: 'simple', label: 'Simple' }, { id: 'advanced', label: 'Advanced' }] },
];
export const SETTINGS_DEFAULTS = { haptics: true, master: 100, music: 75, sfx: 100, textSize: 'normal', reducedFlashes: false, reducedMotion: false, lowVfx: false, reducedWorkerDetail: false, confirmDestructive: true, largerTargets: false, holdDuration: 0.8, textSpeed: 'normal', extraComboHints: false, colourBlindSymbols: false, statsMode: 'simple' };
export const TEXT_SPEED = { fast: 0.7, normal: 1, slow: 1.6 }; // banner time multiplier
export const TEXT_SCALE = { normal: 1, large: 1.15, larger: 1.3 }; // Milestone 38: three UI-scale steps
export const SETTINGS_KEY = 'devworks:settings';
