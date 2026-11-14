// Visitors in the studio (Milestone 40v, the walking part of Milestone 40k; SERIES_CHIBI_CAST.md). Plain data only;
// the rules are src/systems/visitors.js, the drawing src/screens/StudioScreen.js.
//   Fans walk in through the door on a game's launch day, during a convention and on fan events (a milestone reached,
//   an award won): 2–6 at a time (more for a better review and more Fame), they wander, stop at a desk or the trophy
//   shelf, cheer and leave. Tapping one shows a one-line comment about your latest game.
//   Uncle Ray (the mentor) walks in when the first-time guide speaks and on the year's awards day, stands by the door
//   while his hint shows, then leaves.
// Their sheets are Cowork's (assets/images/walkers/visitor_NN_<look>_sheet.png, cast_uncle_ray_sheet.png), made
// phone-sized by tools/devworks-walkers.mjs with the rows visitors use (idle, walk, cheer).

// The 14 fans' sheets (series cast numbers 01, 08, 09, 10, 12, 15, 18–24, 26) — the same people as CAST_FANS_LATER.
export const FAN_SHEETS = [
  'visitor_01_curly_yellow_jumper',
  'visitor_08_red_cardigan',
  'visitor_09_pink_shorts',
  'visitor_10_topknot_shorts',
  'visitor_12_beach_shirt',
  'visitor_15_denim_jacket',
  'visitor_18_yellow_tee',
  'visitor_19_sporty_red',
  'visitor_20_athlete_blue',
  'visitor_21_platinum_sporty',
  'visitor_22_teal_sports_tee',
  'visitor_23_ponytail_purple_sports',
  'visitor_24_orange_tracksuit',
  'visitor_26_grandad_cardigan',
];
export const MENTOR_SHEET = 'cast_uncle_ray';

export const VISITORS = {
  maxOnScreen: 6, // never more fans than this in the studio at once
  lowMax: 3, // Graphics Low (or the phone struggling): at most this many, and half the group
  // How many fans come: base, +1 for each review line passed, +1 for each Fame line passed; then 2..6.
  base: 2,
  reviewSteps: [70, 85],
  fameSteps: [3000, 7000], // Rank B and Rank A's Fame (data/balance.js FAME.ranks)
  // Each reason's group (before the review / Fame bonus) and how long a visit waits for you to be in the studio
  // (game days; a launch seen from the release screens still brings its fans when you come back).
  reasons: {
    launch: { extra: 0, waitDays: 3 },
    convention: { extra: 0, waitDays: 3 },
    fan: { extra: -1, waitDays: 2 },
  },
  // Seconds (real time, only while the clock runs on the studio screen).
  arriveGap: 0.7, // between one fan stepping in and the next
  stops: [1, 2], // places each fan stops at (a desk or the trophy shelf)
  lookSec: [2.2, 3.6], // standing at a stop
  cheerSec: 1.6, // the cheer at a stop
  cheerChance: 0.75,
  speed: 210, // plan units a second (the staff walk at 240)
  commentSec: 3.2, // a tapped fan's line stays this long
  mentorSec: 7, // Uncle Ray's awards-day line
  mentorSpot: { col: 2, row: 10 }, // just inside the door (data/studio.js DOORWAY: col 0, rows 9–11)
};

// A tapped fan's line about your latest game ({game}). By how it reviewed; a fan with no game to talk about yet uses
// the last list. Plain, light humour.
export const FAN_LINES = {
  great: ['I played {game} all weekend. My plants are fine. Mostly.', '{game}! I told my nan about it. She wants a copy.', 'I named my goldfish after {game}. He seems pleased.', 'Ten out of ten. I would have given it eleven but the form stopped at ten.', 'Can I touch the desk where {game} was made? Just once?'],
  good: ['{game} was really fun. I only got stuck twice!', 'My friends and I argue about {game} at lunch. In a good way.', 'I came for {game}, I stayed for the snacks you have not offered me.', 'The music in {game} is stuck in my head. Thanks. I think.'],
  mixed: ['{game} was... interesting! I liked the menu.', 'I believe in you. {game} had a lot of heart.', 'My cat enjoyed watching me play {game}. That counts.', 'Next one will be great, I can feel it.'],
  none: ['So this is where the magic happens!', 'Hi! Big fan. Of games. And of this studio, probably.', 'Is it true you have a bean bag? I have heard rumours.'],
};
export const FAN_REVIEW_BANDS = { great: 80, good: 60 }; // review score ≥ great → great lines, ≥ good → good, else mixed

// Uncle Ray's line on the awards day (the guide speaks for itself while he stands by the door).
export const MENTOR_AWARDS_LINES = ['Awards day! Win or lose, keep making things.', 'I put on my good polo for awards day.', 'Trophies are nice. Players are better.'];
