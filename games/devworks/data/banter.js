// Staff banter (Milestone 40b, Aaron's play-feel notes §3): the short speech bubbles while a game is made, and the
// pride line after a personal-best review. Plain data. DEVWORKS's own words; {title} is the game.
export const BANTER = {
  start: ['Here we go!', 'Fresh idea, fresh start!', 'Let’s make something great.', 'Coffee first, then code.'],
  working: ['This bit is fun.', 'Getting there…', 'Ooh, that looks nice.', 'One more tweak.', 'Saving… saving…'],
  bug: ['Found one!', 'Uh-oh, a bug.', 'Who wrote this?!', 'Squashing it…'],
  breakthrough: ['Ooh, idea!', 'Eureka!', 'That’s the one!', 'Wait — what if…'],
  phase: ['Milestone done!', 'On to the next bit!', 'Ticked that off!'],
  nearly: ['Nearly there!', 'Last push!', 'So close now.'],
  finished: ['We did it!', 'Ship it!', 'Done and dusted!'],
  pride: ['"{title}" is my best work yet!', '"{title}" — my finest game so far!', 'I’m so proud of "{title}"!'],
};

// The live build panel and its banners (Milestone 40b). Seconds are real seconds.
export const LIVE_BUILD = {
  bannerSec: 1.6, // a banner's life
  bugBannerGap: 5, // at most one "Bugs found!" banner this often
  bubbleSec: 2.4,
  bubbleGap: 2.6, // at least this long between two bubbles
  maxBubbles: 2,
  maxFlies: 6, // points flying from a worker to the panel at once
  flySec: 0.7,
  plusSec: 1.1, // the "+N" next to a stat
  nearlyAt: 0.9, // "Nearly there!" once the game is this far along
};
