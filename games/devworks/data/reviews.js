// Review outlets (bible §30) and the short lines they write (core ReviewText). Made-up outlets, plain words.
// Their taste differences (weights, bias) are numbers, so they live in balance.js (REVIEW_BALANCE.outlets).
export const OUTLETS = [
  { id: 'criticalPath', name: 'Critical Path' },
  { id: 'joyPad', name: 'JoyPad Weekly' },
  { id: 'playerVoice', name: 'PlayerVoice' },
  { id: 'techPlay', name: 'TechPlay' },
];

// One short line per review. A good score praises the game's best output (strong); a low one names its weakest
// (weak); lots of bugs get a bug line instead. {name} = the game's title.
export const REVIEW_LINES = {
  strong: {
    gameplay: ['{name} is a joy to play.', 'Hard to put {name} down.', 'The play in {name} just clicks.', '{name} ate our whole weekend. No regrets.'],
    graphics: ['{name} looks lovely.', 'A bright, good-looking game.', 'Every screen of {name} pops.', 'We paused {name} just to stare at it.'],
    story: ['{name} tells a story worth hearing.', 'Great characters in {name}.', 'The writing in {name} shines.', 'We cried at {name}. Twice. Once was the ending.'],
    audio: ['{name} sounds great.', 'Catchy tunes all the way through.', 'The music carries {name}.', 'We hummed the {name} theme in a meeting.'],
    innovation: ['{name} tries something new.', 'Fresh ideas everywhere in {name}.', 'Not like anything else out there.', 'Nobody else would have dared make {name}.'],
    polish: ['{name} feels smooth and finished.', 'Tidy and well made.', 'Rock solid from start to end.', '{name} is so smooth it practically shines.'],
    audienceFit: ['{name} knows exactly who it is for.', 'Its players will love {name}.', 'Right game, right crowd.', '{name} was made for its fans, and they can tell.'],
  },
  weak: {
    gameplay: ['{name} is a bit dull to play. We checked our pulse twice.', 'The play in {name} never quite clicks. We kept pressing anyway.'],
    graphics: ['{name} looks rough, like it got dressed in the dark.', 'Plain to look at. Beige would be a step up.'],
    story: ['The story in {name} falls flat. We guessed the twist on the title screen.', 'Thin on story. The manual had more plot.'],
    audio: ['{name} is too quiet. We turned it up. Still quiet.', 'The sound lets {name} down. Our toaster beeps with more feeling.'],
    innovation: ['{name} plays it very safe. Helmet, knee pads, the lot.', 'We have seen all this before. Several times. This week.'],
    polish: ['{name} feels unfinished, like a sandwich with one slice.', 'Too many rough edges in {name}. Mind your fingers.'],
    audienceFit: ['Hard to say who {name} is for. Possibly a very patient owl.', '{name} misses its crowd by a few postcodes.'],
  },
  buggy: [
    'Bugs get in the way of {name}. One waved at us.',
    'Patch those bugs, please. They are starting to unionise.',
    'A good idea, buried under bugs. We sent a rescue team.',
    '{name} crashed on us twice. Three times if you count our hopes.',
    'Wait for the patch before buying {name}. Bring snacks.',
    'So many glitches in {name}, the glitches have glitches.',
  ],
};
