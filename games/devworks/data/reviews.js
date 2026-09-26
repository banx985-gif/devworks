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
    gameplay: ['{name} is a joy to play.', 'Hard to put {name} down.', 'The play in {name} just clicks.'],
    graphics: ['{name} looks lovely.', 'A bright, good-looking game.', 'Every screen of {name} pops.'],
    story: ['{name} tells a story worth hearing.', 'Great characters in {name}.', 'The writing in {name} shines.'],
    audio: ['{name} sounds great.', 'Catchy tunes all the way through.', 'The music carries {name}.'],
    innovation: ['{name} tries something new.', 'Fresh ideas everywhere in {name}.', 'Not like anything else out there.'],
    polish: ['{name} feels smooth and finished.', 'Tidy and well made.', 'Rock solid from start to end.'],
    audienceFit: ['{name} knows exactly who it is for.', 'Its players will love {name}.', 'Right game, right crowd.'],
  },
  weak: {
    gameplay: ['{name} is a bit dull to play.', 'The play in {name} never quite clicks.'],
    graphics: ['{name} looks rough.', 'Plain to look at.'],
    story: ['The story in {name} falls flat.', 'Thin on story.'],
    audio: ['{name} is too quiet.', 'The sound lets {name} down.'],
    innovation: ['{name} plays it very safe.', 'We have seen all this before.'],
    polish: ['{name} feels unfinished.', 'Too many rough edges in {name}.'],
    audienceFit: ['Hard to say who {name} is for.', '{name} misses its crowd.'],
  },
  buggy: [
    'Bugs get in the way of {name}.',
    'Patch those bugs, please.',
    'A good idea, buried under bugs.',
    '{name} crashed on us twice.',
    'Wait for the patch before buying {name}.',
    'So many glitches in {name}.',
  ],
};
