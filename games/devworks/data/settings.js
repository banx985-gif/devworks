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
// Milestone 40e: the series list (SERIES_COMMON_FEATURES §2) in Robot Workshop's order and names — Sound, Music volume
// (+ mute), Sound effects volume (+ mute), Graphics (Auto / High / Low), Reduced flashes, Screen shake, Reduced motion,
// Vibration, Text size, Show Menu button, Show next-step hints; then (main.js) Guide / Help and tutorial replay /
// Privacy & legal / Credits; DEVWORKS's own extras last (tail). Every older id is kept, so old saved settings load.
const lvl = (ids) => ids.map((id) => ({ id, label: id === 0 ? 'Off' : `${id}%` }));
const onOff = [{ id: false, label: 'Off' }, { id: true, label: 'On' }];

export const SETTINGS = [
  { id: 'muted', label: 'Sound', group: 'Sound', options: [{ id: true, label: 'Off' }, { id: false, label: 'On' }], line: 'All music and sound effects on or off. Sound starts after your first tap.' },
  { id: 'music', label: 'Music volume', group: 'Sound', options: lvl([0, 25, 50, 75, 100]) },
  { id: 'musicMuted', label: 'Music mute', group: 'Sound', options: [{ id: false, label: 'Playing' }, { id: true, label: 'Muted' }] },
  { id: 'sfx', label: 'Sound effects volume', group: 'Sound', options: lvl([0, 25, 50, 75, 100]) },
  { id: 'sfxMuted', label: 'Sound effects mute', group: 'Sound', options: [{ id: false, label: 'Playing' }, { id: true, label: 'Muted' }] },
  { id: 'fpsMode', label: 'Graphics', group: 'Graphics and performance', options: [{ id: 'auto', label: 'Auto' }, { id: 'high', label: 'High' }, { id: 'low', label: 'Low' }], line: 'Auto: 60 FPS, a steady 30 if the phone struggles. High: always 60 with every effect. Low: 30 FPS, fewer effects, simpler workers.' },
  { id: 'reducedFlashes', label: 'Reduced flashes', group: 'Graphics and performance', options: onOff, line: 'No confetti or bright bursts.' },
  { id: 'screenShake', label: 'Screen shake', group: 'Graphics and performance', options: [{ id: 'off', label: 'Off' }, { id: 'low', label: 'Low' }, { id: 'normal', label: 'Normal' }], line: 'The little shakes (a bug found, a big launch) — never needed to follow the game.' },
  { id: 'reducedMotion', label: 'Reduced motion', group: 'Graphics and performance', options: onOff, line: 'No launch rocket; sheets appear without sliding.' },
  { id: 'haptics', label: 'Vibration', group: 'Comfort', options: onOff, line: 'A buzz on the big moments. Phones only.' },
  { id: 'textSize', label: 'Text size', group: 'Comfort', options: [{ id: 'normal', label: 'Normal' }, { id: 'large', label: 'Large' }, { id: 'larger', label: 'Larger' }], line: 'Large: every text 15% bigger; Larger: 30%.' },
  { id: 'showMenu', label: 'Show Menu button', group: 'Menu and hints', options: onOff, line: 'Off: tap the art to get around (Settings stays in Business and the title screen).' },
  { id: 'showHints', label: 'Show next-step hints', group: 'Menu and hints', options: onOff, line: 'A line under the date saying what to do next; tap it to go there.' },
  // DEVWORKS's own extras (after the series list).
  { id: 'master', label: 'Master volume', group: 'More options', tail: true, options: lvl([0, 25, 50, 75, 100]) },
  { id: 'lowVfx', label: 'Low effects', group: 'More options', tail: true, options: onOff, line: 'Simple drawn effects only (no picture effects), fewer particles.' },
  { id: 'reducedWorkerDetail', label: 'Reduced worker detail', group: 'More options', tail: true, options: onOff, line: 'No icons or work pops over the workers; fewer of them animate.' },
  { id: 'confirmDestructive', label: 'Confirm before selling or letting go', group: 'More options', tail: true, options: onOff },
  { id: 'largerTargets', label: 'Larger buttons in sheets', group: 'More options', tail: true, options: onOff },
  { id: 'holdDuration', label: 'Hold time', group: 'More options', tail: true, options: [{ id: 0.5, label: 'Short' }, { id: 0.8, label: 'Normal' }, { id: 1.2, label: 'Long' }] },
  { id: 'textSpeed', label: 'Banner time', group: 'More options', tail: true, options: [{ id: 'fast', label: 'Short' }, { id: 'normal', label: 'Normal' }, { id: 'slow', label: 'Long' }] },
  { id: 'extraComboHints', label: 'Extra combo hints', group: 'More options', tail: true, options: onOff, line: 'New Game lists every near-miss combo, not just one.' },
  { id: 'colourBlindSymbols', label: 'Colour-blind-safe symbols', group: 'More options', tail: true, options: onOff, line: '✓ ✗ ! next to good, bad and risky lines.' },
  { id: 'statsMode', label: 'Stats', group: 'More options', tail: true, options: [{ id: 'simple', label: 'Simple' }, { id: 'advanced', label: 'Advanced' }] },
];
export const SETTINGS_DEFAULTS = { muted: false, musicMuted: false, sfxMuted: false, screenShake: 'normal', showMenu: true, showHints: true, fpsMode: 'auto', haptics: true, master: 100, music: 75, sfx: 100, textSize: 'normal', reducedFlashes: false, reducedMotion: false, lowVfx: false, reducedWorkerDetail: false, confirmDestructive: true, largerTargets: false, holdDuration: 0.8, textSpeed: 'normal', extraComboHints: false, colourBlindSymbols: false, statsMode: 'simple' };
export const SHAKE_LEVELS = { off: 0, low: 0.5, normal: 1 }; // Milestone 40e: shake strength for each choice
export const TEXT_SPEED = { fast: 0.7, normal: 1, slow: 1.6 }; // banner time multiplier
export const TEXT_SCALE = { normal: 1, large: 1.15, larger: 1.3 }; // Milestone 38: three UI-scale steps
export const SETTINGS_KEY = 'devworks:settings';
