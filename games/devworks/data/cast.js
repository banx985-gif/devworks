// The series chibi cast in DEVWORKS (Milestone 40k, SERIES_CHIBI_CAST.md): new faces for the people who had none —
// the mentor, the four reviewers, the awards host, the Rescue Investor, the publisher and sponsor reps. They never
// replace the staff portraits, the gods or any other picture. Face portraits only (Cowork's files in
// assets/images/cast/, 512 × 512, head in the lower part); the walking versions come later (CAST_WALKING).
// Names are Cowork's placeholders (logged in docs/DECISIONS.md for Aaron to rename). A missing face file → the place
// looks as it did before (src/ui/castArt.js). Plain data only.
import { SPONSORS } from './sponsors.js';

// One head-and-shoulders square for every face (the heads sit at the same spot in all 30 pictures).
export const CAST_CROP = { x: 0.1484, y: 0.2969, w: 0.7031, h: 0.7031 };

// The mentor / narrator (a Kairosoft idea): the next-step hint line, the first-time guide and the Help header.
export const CAST_MENTOR = { face: 'face_07_moustache_polo', name: 'Uncle Ray', job: 'a retired game dev' };
// One critic per review outlet (data/reviews.js ids), on their review in "Reviews are in!".
export const CAST_REVIEWERS = {
  criticalPath: { face: 'face_14_glasses_vest', name: 'Prof. Ivo Lens' },
  joyPad: { face: 'face_02_teal_hoodie', name: 'Benji Pad' },
  playerVoice: { face: 'face_16_curly_coral_tee', name: 'Tasha Voice' },
  techPlay: { face: 'face_17_green_hoodie', name: 'Rex Frame' },
};
// Every award moment and the Year-20 ceremony.
export const CAST_HOST = { face: 'face_03_showman_tux', name: 'Max Marquee' };
// The Rescue Investor (bible §3): the offer when deep in debt, and the recovery.
export const CAST_INVESTOR = { face: 'face_04_silver_green_suit', name: 'Dame Viv Sterling' };
// One rep per publisher (data/publishers.js order).
export const CAST_PUBLISHER_REPS = { PUB01: 'face_29_navy_suit', PUB02: 'face_28_plum_suit', PUB03: 'face_25_grey_pink_blazer', PUB04: 'face_27_bob_green_shirt', PUB05: 'face_30_teal_jumper', PUB06: 'face_05_blue_top' };
// Three sponsor reps: one each for the first sponsors (data/sponsors.js order), then round again.
export const CAST_SPONSOR_REPS = ['face_06_red_shirt', 'face_13_beard_workwear', 'face_11_moustache_shorts'];
export const sponsorRepFace = (id) => {
  const i = SPONSORS.findIndex((s) => s.id === id);
  return i < 0 ? null : CAST_SPONSOR_REPS[i % CAST_SPONSOR_REPS.length];
};
// Fans / visitors: no names; they walk in on launch days, conventions and fan events once the series' sprite sheets
// exist. Off until then (their faces are filed but not loaded).
export const CAST_WALKING = false;
export const CAST_FANS_LATER = ['face_01_curly_yellow_jumper', 'face_08_red_cardigan', 'face_09_pink_shorts', 'face_10_topknot_shorts', 'face_12_beach_shirt', 'face_15_denim_jacket', 'face_18_yellow_tee', 'face_19_sporty_red', 'face_20_athlete_blue', 'face_21_platinum_sporty', 'face_22_teal_sports_tee', 'face_23_ponytail_purple_sports', 'face_24_orange_tracksuit', 'face_26_grandad_cardigan'];

// Every face the game loads now (the manifest, the art check and the portrait crops use this list).
export const CAST_ART = [...new Set([CAST_MENTOR.face, ...Object.values(CAST_REVIEWERS).map((c) => c.face), CAST_HOST.face, CAST_INVESTOR.face, ...Object.values(CAST_PUBLISHER_REPS), ...CAST_SPONSOR_REPS])];
