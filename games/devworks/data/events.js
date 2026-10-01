// Events (Milestone 27, bible §38): the 13 event classes, the 12 milestone moments and the crossover hooks. Plain data;
// the rules are src/systems/studioEvents.js on core/EventSystem.js (seeded: every result is rolled when the event
// happens and saved, so a reload never rerolls it). Every number is a placeholder (plan review B).
//
// A definition: { id, cls, kind: 'choice' | 'flavour' | 'milestone', title, text, icon, trigger, weight, cooldownDays,
//   effects (at once), choices: [{ id, label, line, effects, default }] }
// trigger (all must hold): game (a game in the works), deal (…made for a publisher), localised (…being localised),
//   multiPlatform (a finished game waits for release, or 2+ platforms were used before), sponsor (a sponsor deal is
//   running), sponsorId, console (your console is on sale), hardware (a prototype built or being built), staffMin,
//   yearMin, released (games released at least).
// Words in the text: {game} the game in the works it picked, {who} the person it picked.
// Effects: hype, bugs, work (% of the game's total work: + slips, − saves), output { key, value } (a game output
//   bonus), credits, fanTrust, energy / morale (the person), teamMorale, rp, signal (a sponsor obligation signal),
//   clue (a secret clue, kept for Milestone 28), chance { p, then, else } (decided when the event happens).
export const EVENT_CLASSES = [
  { id: 'creative', name: 'Creative disagreement', icon: 'dev_ui_07' },
  { id: 'breakthrough', name: 'Technical breakthrough', icon: 'dev_ui_26' },
  { id: 'scopeCreep', name: 'Scope creep', icon: 'dev_ui_07' },
  { id: 'platform', name: 'Platform requirement', icon: 'platform_device_03' },
  { id: 'publisher', name: 'Publisher demand', icon: 'business_ui_05' },
  { id: 'inspiration', name: 'Staff inspiration', icon: 'dev_ui_02' },
  { id: 'exhaustion', name: 'Staff exhaustion', icon: 'dev_ui_02' },
  { id: 'leak', name: 'Leak', icon: 'business_ui_05' },
  { id: 'demo', name: 'Demo reaction', icon: 'dev_ui_07' },
  { id: 'qa', name: 'QA problem', icon: 'dev_ui_07' },
  { id: 'localisation', name: 'Localisation issue', icon: 'business_ui_13' },
  { id: 'hardware', name: 'Hardware failure', icon: 'dev_ui_29' },
  { id: 'sponsor', name: 'Sponsor request', icon: 'business_ui_05' },
  { id: 'crossover', name: 'Crossover', icon: 'dev_ui_26' },
];

const C = (id, cls, title, text, trigger, choices, extra = {}) => ({ id, cls, kind: 'choice', title, text, trigger, choices, weight: 1, cooldownDays: 336, ...extra });
const F = (id, cls, title, text, trigger, effects, extra = {}) => ({ id, cls, kind: 'flavour', title, text, trigger, effects, weight: 1, cooldownDays: 168, ...extra });
const ch = (id, label, line, effects, isDefault = false) => ({ id, label, line, effects, ...(isDefault ? { default: true } : {}) });

export const EVENTS = [
  // Creative disagreement
  C('EV_ENDING', 'creative', 'Rewrite the ending?', '{who} thinks the ending of {game} falls flat and wants to rewrite it.', { game: true }, [
    ch('rewrite', 'Rewrite it', 'Story up, the schedule slips.', [{ type: 'output', key: 'story', value: 6 }, { type: 'work', pct: 6 }]),
    ch('keep', 'Keep it', 'On time; {who} is a little let down.', [{ type: 'morale', value: -8 }], true),
  ]),
  C('EV_ARTSTYLE', 'creative', 'Two art styles', 'The team is split over the look of {game}. {who} wants something bolder.', { game: true }, [
    ch('bold', 'Go bold', 'Graphics and Innovation up, a bit more work.', [{ type: 'output', key: 'graphics', value: 4 }, { type: 'output', key: 'innovation', value: 3 }, { type: 'work', pct: 4 }]),
    ch('safe', 'Stay safe', 'No change; the team settles.', [{ type: 'teamMorale', value: 2 }], true),
  ]),
  F('EV_DEBATE', 'creative', 'A lively design debate', 'A long lunch argument about {game} ends in a better idea.', { game: true }, [{ type: 'output', key: 'gameplay', value: 2 }]),
  // Technical breakthrough
  C('EV_RENDERER', 'breakthrough', 'An experimental renderer', '{who} has a new renderer running for {game}. It looks amazing — and it is not stable yet.', { game: true }, [
    ch('keep', 'Keep it', 'Graphics and Innovation up, more bugs.', [{ type: 'output', key: 'graphics', value: 6 }, { type: 'output', key: 'innovation', value: 4 }, { type: 'bugs', value: 3 }]),
    ch('shelve', 'Shelve it for later', 'Research points instead.', [{ type: 'rp', value: 60 }], true),
  ]),
  C('EV_TOOLING', 'breakthrough', 'A faster build pipeline', '{who} found a way to make builds much faster.', { game: true }, [
    ch('adopt', 'Switch over now', 'Saves work on {game}, a small risk of new bugs.', [{ type: 'work', pct: -5 }, { type: 'chance', p: 0.3, then: [{ type: 'bugs', value: 2 }], else: [] }], true),
    ch('later', 'After this game', 'Research points.', [{ type: 'rp', value: 40 }]),
  ]),
  F('EV_EUREKA', 'breakthrough', 'Eureka at the whiteboard', '{who} cracked a tricky problem.', { staffMin: 1 }, [{ type: 'rp', value: 25 }]),
  // Scope creep
  C('EV_FEATURE', 'scopeCreep', 'One more feature', 'The team wants to squeeze another feature into {game}.', { game: true }, [
    ch('add', 'Add it', 'Innovation up, more work and bugs.', [{ type: 'output', key: 'innovation', value: 5 }, { type: 'work', pct: 8 }, { type: 'bugs', value: 2 }]),
    ch('cut', 'Cut an unstable feature instead', 'Hype down, bugs down.', [{ type: 'hype', value: -4 }, { type: 'bugs', value: -3 }]),
    ch('no', 'Say no', 'Nothing changes.', [], true),
  ]),
  C('EV_BIZARRE', 'scopeCreep', 'A bizarre mechanic', '{who} prototyped a truly strange mechanic for {game}. Nobody can stop playing it.', { game: true }, [
    ch('keep', 'Keep it in', 'Innovation up, more risk — and something to remember.', [{ type: 'output', key: 'innovation', value: 7 }, { type: 'bugs', value: 2 }, { type: 'clue', id: 'bizarreMechanic' }]),
    ch('drop', 'Drop it', 'Nothing changes.', [], true),
  ]),
  F('EV_SIDEQUEST', 'scopeCreep', 'A tiny side quest', 'Someone slipped a small side quest into {game}.', { game: true }, [{ type: 'output', key: 'story', value: 1 }, { type: 'work', pct: 1 }]),
  // Platform requirement
  C('EV_CERTRULE', 'platform', 'New certification rule', 'A platform holder changed its rules. {game} needs extra work to pass.', { game: true, released: 1 }, [
    ch('comply', 'Do the work', 'More work, no risk.', [{ type: 'work', pct: 4 }], true),
    ch('gamble', 'Hope it passes', 'Maybe it is fine; maybe many bugs.', [{ type: 'chance', p: 0.5, then: [], else: [{ type: 'bugs', value: 4 }] }]),
  ]),
  C('EV_CONTROLLER', 'platform', 'Controller support', 'Players ask for full controller support in {game}.', { game: true, yearMin: 2 }, [
    ch('add', 'Add it', 'Audience fit up, a bit more work.', [{ type: 'output', key: 'audienceFit', value: 3 }, { type: 'work', pct: 3 }]),
    ch('skip', 'Not now', 'Nothing changes.', [], true),
  ]),
  F('EV_SDK', 'platform', 'A new SDK', 'A platform released a friendlier SDK.', { released: 1 }, [{ type: 'rp', value: 15 }]),
  // Publisher demand
  C('EV_PUBDATE', 'publisher', 'The publisher wants it sooner', 'Your publisher asks for {game} to hit a holiday date.', { game: true, deal: true }, [
    ch('rush', 'Rush it', 'Saves work, more bugs.', [{ type: 'work', pct: -6 }, { type: 'bugs', value: 4 }]),
    ch('refuse', 'Push back', 'On your schedule; the publisher is cool with you.', [{ type: 'fanTrust', value: -1 }], true),
  ]),
  C('EV_PUBMASCOT', 'publisher', 'Add our mascot?', 'The publisher wants their mascot in {game}.', { game: true, deal: true }, [
    ch('yes', 'Put it in', 'Hype up, fans roll their eyes.', [{ type: 'hype', value: 6 }, { type: 'fanTrust', value: -2 }]),
    ch('no', 'Politely no', 'Nothing changes.', [], true),
  ]),
  F('EV_PUBPRAISE', 'publisher', 'A note from the publisher', 'Your publisher loved the last build of {game}.', { game: true, deal: true }, [{ type: 'teamMorale', value: 3 }]),
  // Staff inspiration
  C('EV_WEEKEND', 'inspiration', 'A weekend of inspiration', '{who} came in on Monday with a notebook full of ideas.', { staffMin: 2 }, [
    ch('use', 'Put them in {game}', 'Gameplay up.', [{ type: 'output', key: 'gameplay', value: 4 }, { type: 'energy', value: -10 }], true),
    ch('research', 'Turn them into research', 'Research points.', [{ type: 'rp', value: 50 }]),
  ], { trigger: { game: true } }),
  C('EV_TALK', 'inspiration', 'A conference talk', '{who} was invited to speak at a developer conference.', { staffMin: 2, yearMin: 2 }, [
    ch('go', 'Go and speak', 'Fame for the studio; {who} is away a few days.', [{ type: 'hype', value: 3 }, { type: 'energy', value: -15 }, { type: 'morale', value: 8 }], true),
    ch('stay', 'Too busy', 'Nothing changes.', []),
  ]),
  F('EV_FLOW', 'inspiration', 'In the zone', '{who} is on fire today.', { staffMin: 1 }, [{ type: 'morale', value: 6 }]),
  // Staff exhaustion
  C('EV_TIRED', 'exhaustion', '{who} is exhausted', '{who} has been pushing too hard.', { staffMin: 2 }, [
    ch('rest', 'Send them home to rest', 'Energy back up.', [{ type: 'energy', value: 40 }, { type: 'work', pct: 1 }], true),
    ch('push', 'Ask for one more week', 'Morale down, a risk of mistakes.', [{ type: 'morale', value: -12 }, { type: 'chance', p: 0.5, then: [{ type: 'bugs', value: 2 }], else: [] }]),
  ]),
  C('EV_BURNOUT', 'exhaustion', 'The whole team is tired', 'It has been a long stretch. People are grumbling.', { staffMin: 3, game: true }, [
    ch('party', 'Studio party (1,500 Credits)', 'Everyone feels better.', [{ type: 'credits', value: -1500 }, { type: 'teamMorale', value: 10 }], true),
    ch('ignore', 'Keep going', 'Morale falls.', [{ type: 'teamMorale', value: -8 }]),
  ]),
  F('EV_COFFEE', 'exhaustion', 'The coffee machine broke', 'A slow, grumpy morning.', { staffMin: 1 }, [{ type: 'teamMorale', value: -2 }]),
  // Leak
  C('EV_LEAK', 'leak', 'Screenshots leaked', 'Early screenshots of {game} are all over the forums.', { game: true }, [
    ch('embrace', 'Embrace it', 'Hype up; the surprise is gone.', [{ type: 'hype', value: 5 }, { type: 'output', key: 'innovation', value: -2 }], true),
    ch('deny', 'Say nothing', 'A little Hype.', [{ type: 'hype', value: 2 }]),
  ]),
  C('EV_BUILDLEAK', 'leak', 'A buggy build leaked', 'An old, buggy build of {game} is being passed around.', { game: true, yearMin: 2 }, [
    ch('statement', 'Explain it is old', 'Fan Trust holds.', [{ type: 'fanTrust', value: 1 }], true),
    ch('fixfast', 'Rush a fix-up', 'Bugs down, more work.', [{ type: 'bugs', value: -3 }, { type: 'work', pct: 3 }]),
  ]),
  F('EV_RUMOUR', 'leak', 'A rumour', 'People are guessing what your studio does next.', { released: 1 }, [{ type: 'hype', value: 1 }]),
  // Demo reaction
  C('EV_DEMOFAIL', 'demo', 'The public demo crashed', 'The demo of {game} crashed on stage.', { game: true }, [
    ch('rebuild', 'Rebuild the demo', 'Costs work; Hype recovers.', [{ type: 'work', pct: 4 }], true),
    ch('accept', 'Accept it', 'Lower Hype.', [{ type: 'hype', value: -6 }]),
  ]),
  C('EV_DEMOLOVE', 'demo', 'Players love the demo', 'The demo of {game} is a hit. Players want more of one mode.', { game: true }, [
    ch('more', 'Give them more', 'Gameplay and Hype up, more work.', [{ type: 'output', key: 'gameplay', value: 3 }, { type: 'hype', value: 4 }, { type: 'work', pct: 4 }]),
    ch('thanks', 'Thank them', 'A little Hype.', [{ type: 'hype', value: 3 }], true),
  ]),
  F('EV_STREAMER', 'demo', 'A streamer played it', 'A small streamer played the demo of {game}.', { game: true }, [{ type: 'hype', value: 2 }]),
  // QA problem
  C('EV_SAVEBUG', 'qa', 'A save-game bug', 'QA found a bug in {game} that can wipe saves.', { game: true }, [
    ch('fix', 'Fix it properly', 'More work, bugs down.', [{ type: 'work', pct: 3 }, { type: 'bugs', value: -2 }], true),
    ch('patch', 'Patch it later', 'Risky.', [{ type: 'bugs', value: 3 }]),
  ]),
  C('EV_QAHIRE', 'qa', 'Outside testers', 'A QA company offers a week of testing on {game}.', { game: true, yearMin: 2 }, [
    ch('hire', 'Hire them (2,000 Credits)', 'Bugs down.', [{ type: 'credits', value: -2000 }, { type: 'bugs', value: -4 }]),
    ch('no', 'No thanks', 'Nothing changes.', [], true),
  ]),
  F('EV_BUGHUNT', 'qa', 'Bug hunt', 'An afternoon bug hunt on {game}.', { game: true }, [{ type: 'bugs', value: -1 }]),
  // Localisation issue
  C('EV_TRANSLATION', 'localisation', 'A bad translation', 'Testers abroad say the translation of {game} is clumsy.', { game: true, localised: true }, [
    ch('redo', 'Redo it', 'More work; audience fit holds.', [{ type: 'work', pct: 3 }], true),
    ch('ship', 'Ship it', 'Audience fit down.', [{ type: 'output', key: 'audienceFit', value: -4 }]),
  ]),
  C('EV_CULTURE', 'localisation', 'A cultural slip', 'One joke in {game} does not travel well.', { game: true, localised: true }, [
    ch('change', 'Change it', 'A little work.', [{ type: 'work', pct: 1 }], true),
    ch('keep', 'Keep it', 'Fan Trust abroad dips.', [{ type: 'fanTrust', value: -2 }]),
  ]),
  F('EV_FONTS', 'localisation', 'Font trouble', 'The menus of {game} needed new fonts.', { game: true, localised: true }, [{ type: 'work', pct: 1 }]),
  // Hardware failure
  C('EV_DEVKITS', 'hardware', 'Dev kits failing', 'A batch of your dev kits keeps overheating.', { hardware: true }, [
    ch('replace', 'Replace them (4,000 Credits)', 'Problem solved.', [{ type: 'credits', value: -4000 }], true),
    ch('patch', 'Patch them up', 'Cheap, but a risk to the team.', [{ type: 'chance', p: 0.5, then: [{ type: 'teamMorale', value: -6 }], else: [] }]),
  ]),
  C('EV_RECALL', 'hardware', 'A faulty batch', 'Some of your consoles shipped with a loose part.', { console: true }, [
    ch('recall', 'Recall the batch (8,000 Credits)', 'Fans trust you more.', [{ type: 'credits', value: -8000 }, { type: 'fanTrust', value: 2 }], true),
    ch('quiet', 'Fix them only when asked', 'Cheaper; Fan Trust drops.', [{ type: 'fanTrust', value: -4 }]),
  ]),
  F('EV_SERVER', 'hardware', 'The build server died', 'The build server gave up; a day lost.', { staffMin: 1, yearMin: 2 }, [{ type: 'work', pct: 1 }]),
  // Sponsor request
  C('EV_SPONSORLOGO', 'sponsor', 'Sponsor logo', 'Your sponsor wants its logo on the loading screen of {game}.', { sponsor: true, game: true }, [
    ch('yes', 'Put it in', '2,500 Credits; fans shrug.', [{ type: 'credits', value: 2500 }, { type: 'fanTrust', value: -1 }], true),
    ch('no', 'No thanks', 'Nothing changes.', []),
  ]),
  C('EV_SPONSOREVENT', 'sponsor', 'A sponsor event', 'Your sponsor invites {who} to a showcase.', { sponsor: true, staffMin: 2 }, [
    ch('go', 'Go', 'Hype up; {who} is tired.', [{ type: 'hype', value: 4 }, { type: 'energy', value: -15 }], true),
    ch('skip', 'Skip it', 'Nothing changes.', []),
  ]),
  F('EV_SPONSORGIFT', 'sponsor', 'Sponsor goodies', 'A box of free gear arrived from your sponsor.', { sponsor: true }, [{ type: 'teamMorale', value: 3 }]),
  // Milestone 40e: sponsor-run challenges and showcase offers (series common feature §5), each with a reward.
  C('EV_SPONSORJAM', 'sponsor', 'Sponsor game jam', 'Your sponsor runs a weekend game jam and wants {who} to take part.', { sponsor: true, staffMin: 2 }, [
    ch('jam', 'Join the jam', '{who} is tired; a prize for the Studio Store and some Fan Trust.', [{ type: 'energy', value: -20 }, { type: 'item', source: 'sponsor' }, { type: 'fanTrust', value: 1 }], true),
    ch('pass', 'Not this time', 'Nothing changes.', []),
  ], { cooldownDays: 224 }),
  C('EV_SPONSORSHOWCASE', 'sponsor', 'Sponsor showcase', 'Your sponsor offers a stand at its showcase for {game}.', { sponsor: true, game: true }, [
    ch('stand', 'Take the stand', '1,500 Credits for the stand; Hype up and a gift from the sponsor.', [{ type: 'credits', value: -1500 }, { type: 'hype', value: 6 }, { type: 'item', source: 'sponsor' }], true),
    ch('pass', 'Pass', 'Nothing changes.', []),
  ], { cooldownDays: 224 }),
  // Crossover hooks (they never read another game's files: they work whether BOTWORKS or RACEWORKS is installed or not).
  C('EV_BOTWORKS_DEMO', 'crossover', 'BOTWORKS technology demo', 'BOTWORKS Systems asks your studio to build a small robot-AI tech demo.', { sponsorId: 'SPN08' }, [
    ch('build', 'Build the demo', 'Research points and the BOTWORKS obligation met.', [{ type: 'rp', value: 80 }, { type: 'signal', name: 'botworksDemo' }, { type: 'clue', id: 'botworksDemo' }], true),
    ch('later', 'Not now', 'It may come back.', []),
  ], { cooldownDays: 84 }),
  C('EV_RACEWORKS_LICENCE', 'crossover', 'A RACEWORKS licence', 'The RACEWORKS team offers to license their racing brand for a game of yours.', { yearMin: 6, released: 3 }, [
    ch('sign', 'Sign it (5,000 Credits)', 'Hype up for your next game — and a note for later.', [{ type: 'credits', value: -5000 }, { type: 'hype', value: 6 }, { type: 'clue', id: 'raceworksLicence' }]),
    ch('pass', 'Pass', 'Nothing changes.', [], true),
  ], { once: true }),
];

// The 12 milestone moments (big, with their picture). trigger: what fires it (src/systems/studioEvents.js listens).
export const MILESTONES = [
  { id: 'MS_FIRST_OFFICE', title: 'Your first office!', text: 'A real office, with a real door.', art: 'dev_event_01', on: 'stage:2' },
  { id: 'MS_FIRST_PROTOTYPE', title: 'First prototype!', text: 'Your first game is playable.', art: 'dev_event_02', on: 'firstPrototype' },
  { id: 'MS_FIRST_RELEASE', title: 'Your first release!', text: 'It is out there. People are playing it.', art: 'dev_event_03', on: 'firstRelease' },
  { id: 'MS_FIRST_HIT', title: 'Your first hit!', text: 'Reviews of 80 or more.', art: 'dev_event_04', on: 'firstHit' },
  { id: 'MS_FIRST_DEAL', title: 'First publisher deal!', text: 'A publisher believes in you.', art: 'dev_event_05', on: 'firstDeal' },
  { id: 'MS_FIRST_SPONSOR', title: 'First major sponsor!', text: 'Your studio name is on someone else\'s banner.', art: 'dev_event_06', on: 'firstSponsor' },
  { id: 'MS_FIRST_AWARD', title: 'First award!', text: 'A trophy for the shelf.', art: 'dev_event_07', on: 'firstAward' },
  { id: 'MS_ENGINE', title: 'Your own engine!', text: 'Built in-house, ready for your games.', art: 'dev_event_08', on: 'firstEngine' },
  { id: 'MS_STUDIO_UPGRADE', title: 'A professional studio!', text: 'Bigger rooms, bigger games.', art: 'dev_event_09', on: 'stage:3', shownBy: 'studio stage moment' },
  { id: 'MS_CONSOLE_PROTOTYPE', title: 'First console prototype!', text: 'Your own hardware, on a bench.', art: 'dev_event_10', on: 'firstConsolePrototype', shownBy: 'hardware moment' },
  { id: 'MS_CONSOLE_LAUNCH', title: 'Console launch!', text: 'Your console is in the shops.', art: 'dev_event_11', on: 'consoleLaunch', shownBy: 'console launch moment' },
  { id: 'MS_GLOBAL_CAMPUS', title: 'The Global Campus!', text: 'The whole world is your studio.', art: 'dev_event_12', on: 'stage:5', shownBy: 'studio stage moment' },
];

// The flow (bible §40 / style guide §7): cadence and caps.
export const EVENT_RULES = {
  caps: { choice: 45, flavour: 12 }, // at most one choice event per 45 days, one flavour note per 12
  dailyChance: { choice: 0.06, flavour: 0.1 },
  startDay: 56, // nothing in the first two months
  maxOpen: 3, // choice events waiting at once (core/EventSystem)
  answerDays: 28, // an unanswered choice event takes its default after this
  maxQueue: 6, // pop-ups waiting to be shown (core/NotificationSystem); past this the lowest folds into the Inbox
  inboxMax: 150,
  graceSec: 2, // a pop-up comes only after the studio has been free (no sheet, moment or other screen) this long
};
