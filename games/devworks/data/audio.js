// DEVWORKS sound (Milestone 38, bible §48) — plain data for core/AudioManager.js and core/SoundSynth.js.
// No audio files exist (none supplied yet), so the 8 music tracks and every sound effect are code-made recipes: warm,
// bouncy, a little retro — a studio making games. A real file wins with no code change: drop assets/audio/<id>.mp3
// (or .ogg) with the same id and list it in assets/audio/manifest.json.
// Sound starts only after the first tap (the browser rule); until then plays are counted, silent.
export const AUDIO_BASE = 'assets/audio/';
export const AUDIO_MANIFEST = 'assets/audio/manifest.json';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const tone = (m, t, d, wave = 'triangle', v = 1, extra = {}) => ({ wave, f: hz(m), t, d, v, ...extra });
const sweep = (f, f2, t, d, wave = 'sine', v = 1, extra = {}) => ({ wave, f, f2, t, d, v, ...extra });
const hiss = (t, d, lp, v = 1, extra = {}) => ({ wave: 'noise', t, d, lp, v, a: 0.002, ...extra });
const arp = (notes, step, len, wave = 'triangle', v = 1, from = 0, extra = {}) => notes.map((m, i) => tone(m, from + i * step, len, wave, v, extra));
const clicks = (times, lp = 5000, v = 0.6) => times.map((t) => hiss(t, 0.016, lp, v, { shape: 3 }));
// group (core AudioManager caps): ui | workshop | progression | competition | economy.
const S = (group, layers, extra = {}) => ({ group, recipe: { layers, gain: extra.gain ?? 0.5, echo: extra.echo, seed: extra.seed }, loop: !!extra.loop, volume: extra.volume ?? 1 });
const ECHO = { delay: 0.09, feedback: 0.35, mix: 0.3 };

// §48 SFX: typing, marker, bug alert, breakthrough, review, sales, award, recruitment, engine build, console boot, defect
// warning, UI, cash/RP.
export const SOUNDS = {
  sfx_typing: S('workshop', clicks([0, 0.08, 0.17, 0.24, 0.36, 0.44, 0.55, 0.63, 0.75, 0.86, 0.98, 1.07], 6000, 0.7), { gain: 0.2, loop: true, volume: 0.4 }),
  sfx_marker: S('progression', [...arp([72, 76, 79], 0.07, 0.12), hiss(0.2, 0.06, 7000, 0.2)], { gain: 0.42 }),
  sfx_bug: S('workshop', [tone(57, 0, 0.09, 'square', 1, { lp: 1500 }), tone(61, 0.1, 0.09, 'square', 1, { lp: 1500 }), hiss(0, 0.2, 2500, 0.3)], { gain: 0.34 }),
  sfx_breakthrough: S('progression', [sweep(600, 1800, 0, 0.25, 'sine'), tone(96, 0.22, 0.3, 'triangle', 0.6)], { gain: 0.44, echo: ECHO }),
  sfx_review: S('progression', [hiss(0, 0.18, 2500, 0.4, { a: 0.05 }), ...arp([79, 84, 88], 0.12, 0.2, 'sine', 0.7, 0.14)], { gain: 0.42 }),
  sfx_sales: S('economy', [hiss(0, 0.025, 5000, 0.7), tone(83, 0.03, 0.06, 'square', 0.6, { duty: 0.25, lp: 4000 }), tone(88, 0.09, 0.16, 'square', 0.6, { duty: 0.25, lp: 4000 })], { gain: 0.34 }),
  sfx_award: S('competition', [...arp([67, 72, 76, 79], 0.1, 0.18, 'square', 0.6, 0, { duty: 0.3, lp: 3500 }), ...arp([60, 64, 67, 72], 0, 0.9, 'triangle', 0.5, 0.4), tone(84, 0.4, 0.6, 'triangle', 0.6)], { gain: 0.52 }),
  sfx_recruit: S('progression', [tone(81, 0, 0.18), tone(76, 0.17, 0.3)], { gain: 0.42 }),
  sfx_engine: S('progression', [sweep(200, 900, 0, 0.35, 'saw', 1, { lp: 1800 }), ...arp([72, 79, 84], 0.1, 0.16, 'square', 0.5, 0.3, { duty: 0.3, lp: 3000 })], { gain: 0.4 }),
  sfx_console_boot: S('progression', [sweep(80, 400, 0, 0.5, 'sine', 0.8), ...arp([60, 67, 72, 76, 84], 0.12, 0.35, 'triangle', 0.7, 0.35), hiss(0.35, 0.5, 9000, 0.12, { a: 0.1 })], { gain: 0.5, echo: { delay: 0.12, feedback: 0.4, mix: 0.3 } }),
  sfx_defect: S('workshop', [tone(55, 0, 0.14, 'square', 1, { lp: 1200 }), tone(52, 0.16, 0.2, 'square', 1, { lp: 1200 }), hiss(0.05, 0.4, 900, 0.5)], { gain: 0.4 }),
  sfx_ui: S('ui', [sweep(900, 1300, 0, 0.045, 'sine')], { gain: 0.28 }),
  sfx_cash: S('economy', [tone(83, 0, 0.06, 'square', 0.8, { duty: 0.25, lp: 4000 }), tone(88, 0.06, 0.2, 'square', 0.8, { duty: 0.25, lp: 4000 })], { gain: 0.34 }),
  sfx_rp: S('ui', [sweep(1200, 1900, 0, 0.1, 'sine'), tone(95, 0.08, 0.1, 'sine', 0.4)], { gain: 0.3, echo: ECHO }),
  sfx_secret: S('progression', [...arp([69, 72, 76, 81], 0.14, 0.4, 'sine', 0.8, 0, { vib: { rate: 5, depth: 0.2 } }), sweep(200, 90, 0, 0.8, 'triangle', 0.3)], { gain: 0.44, echo: { delay: 0.18, feedback: 0.45, mix: 0.4 } }),
  sfx_launch: S('economy', [sweep(300, 1400, 0, 0.3, 'sine', 0.6), tone(88, 0.26, 0.35, 'triangle')], { gain: 0.44, echo: ECHO }),
};

// Chords as semitones from the root.
const I = [0, 4, 7];
const ii = [2, 5, 9];
const IV = [5, 9, 12];
const V = [7, 11, 14];
const vi = [9, 12, 16];
const im = [0, 3, 7];
const ivm = [5, 8, 12];
const VI = [8, 12, 15];
const VII = [10, 14, 17];
// §48: the 8 tracks, by id (a real file with the same id replaces its recipe).
export const MUSIC = {
  music_office_morning: { bpm: 96, root: 65, chords: [I, IV, vi, V], gain: 0.34, pad: { wave: 'triangle', v: 0.1, lp: 1400 }, bass: { v: 0.24, steps: [0, 10] }, arp: { wave: 'triangle', v: 0.06, every: 4, octave: 1 }, drums: { v: 0.16, kick: [0], hat: [4, 12] } }, // Tiny Office Morning
  music_prototype_energy: { bpm: 118, root: 67, chords: [I, V, vi, IV], gain: 0.38, pad: { wave: 'triangle', v: 0.1 }, bass: { v: 0.3, steps: [0, 3, 8, 11] }, arp: { wave: 'square', v: 0.06, every: 1, octave: 1, lp: 2200 }, drums: { v: 0.26, kick: [0, 8, 10], snare: [4, 12], hat: [2, 6, 10, 14] } }, // Prototype Energy
  music_crunch_night: { bpm: 128, root: 57, chords: [im, VI, VII, im], gain: 0.4, pad: { wave: 'saw', v: 0.06, lp: 1100 }, bass: { v: 0.34, steps: [0, 2, 4, 6, 8, 10, 12, 14] }, arp: { wave: 'square', v: 0.05, every: 2, octave: 1, lp: 1800 }, drums: { v: 0.34, kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } }, // Crunch Night
  music_release_day: { bpm: 124, root: 62, chords: [I, IV, V, IV], gain: 0.44, pad: { wave: 'saw', v: 0.06, lp: 1600 }, bass: { v: 0.32, steps: [0, 4, 8, 12] }, arp: { wave: 'square', v: 0.06, every: 2, octave: 1 }, drums: { v: 0.34, kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14] }, lead: { v: 0.1, octave: 1, notes: [[0, 7, 3], [4, 9, 2], [8, 12, 4], [16, 9, 3], [20, 7, 2], [24, 4, 4]] } }, // Release Day
  music_awards_season: { bpm: 104, root: 64, chords: [I, vi, ii, V], gain: 0.42, pad: { wave: 'triangle', v: 0.12, lp: 1800 }, bass: { v: 0.26, steps: [0, 8] }, arp: { wave: 'sine', v: 0.07, every: 2, octave: 2 }, drums: { v: 0.22, kick: [0, 8], snare: [12], hat: [4, 12] }, lead: { v: 0.1, octave: 1, notes: [[0, 12, 4], [8, 11, 4], [16, 9, 6], [24, 7, 8]] } }, // Awards Season
  music_corporate_hq: { bpm: 110, root: 60, chords: [I, vi, IV, V], gain: 0.4, pad: { wave: 'triangle', v: 0.1 }, bass: { v: 0.3, steps: [0, 6, 8, 14] }, arp: { wave: 'square', v: 0.06, every: 2, octave: 1 }, drums: { v: 0.28, kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14] } }, // Corporate HQ
  music_console_launch: { bpm: 136, root: 69, chords: [I, vi, IV, V, I, vi, ii, V], gain: 0.46, pad: { wave: 'saw', v: 0.08, lp: 2000 }, bass: { v: 0.34, steps: [0, 2, 4, 6, 8, 10, 12, 14] }, arp: { wave: 'square', v: 0.05, every: 1, octave: 1, lp: 2500 }, drums: { v: 0.38, kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } }, // Console Launch
  music_prestige: { bpm: 84, root: 57, chords: [im, VI, ivm, VII], gain: 0.4, pad: { wave: 'saw', v: 0.07, lp: 900 }, bass: { v: 0.28, steps: [0] }, arp: { wave: 'sine', v: 0.08, every: 3, octave: 2 }, drums: { v: 0.14, kick: [0, 10], hat: [8] } }, // Prestige / PROJECT ONE
};
export const MUSIC_NAMES = { music_office_morning: 'Tiny Office Morning', music_prototype_energy: 'Prototype Energy', music_crunch_night: 'Crunch Night', music_release_day: 'Release Day', music_awards_season: 'Awards Season', music_corporate_hq: 'Corporate HQ', music_console_launch: 'Console Launch', music_prestige: 'Prestige / PROJECT ONE' };

// Which track plays (the first rule that holds wins; checked each day and on a screen change, then crossfaded):
//   prestige       the ending ceremony / NG+ setup, or a PROJECT ONE / X in the works or just done
//   consoleLaunch  for a month after a console launch
//   crunch         a game in the works is crunching
//   release        for 14 days after a release
//   awards         in December (award season)
//   corporate      at studio stage 4 or 5
//   prototype      a game in the works
//   morning        otherwise
export const MUSIC_RULES = { releaseDays: 14, consoleLaunchDays: 28, awardMonth: 12, corporateStage: 4, crossfadeSec: 1.5 };
