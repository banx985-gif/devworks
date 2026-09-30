// First-run guide (Milestone 34, style guide "first-time guide with coach marks", spec §9). Plain data for
// core/GuideSystem.js: coach marks that take a new studio from the empty floor to its first released, reviewed game.
// Words are short; {founder} is the run's own Founding Developer (never a fixed name, spec §9).
// target names are resolved by main.js (guideTarget): founder, back, create, sheet:<button id>, releasePath (the
// Release button, else the game in Create, else Create), recipe, title, start, speed, null = a centred box.
// trigger: after = that step done; event = has happened at least once; screen = only there.
// advance: tap = the glowing spot is tapped (the tap still reaches the game); next = "Got it"; event = it happens.
// Every step can be skipped, and "Guide off" stops it (Help turns it back on). Done steps never come back.
// The advanced systems get no tutorial walls: their screens show a one-time hint card instead (SCREEN_HINTS).
export const GUIDE_STEPS = [
  { id: 'G1', title: 'Your studio', text: 'Tap your Founder, {founder}, to meet them.', target: 'founder', art: null, trigger: { screen: ['studio'] }, advance: { tap: true }, block: true, skipAlso: ['G2'] },
  { id: 'G2', title: '{founderFirst}’s card', text: 'Stats, Energy and history live here. Tap Back to go on.', target: 'back', trigger: { after: 'G1', screen: ['staff'] }, advance: { tap: true }, block: true, restartAt: 'G1' },
  { id: 'G3', title: 'Make a game', text: 'Tap Create to start your first game.', target: 'create', trigger: { after: 'G1', screen: ['studio'] }, advance: { tap: true }, block: true, skipIf: 'project:start' },
  { id: 'G4', title: 'New Game', text: 'Tap New Game.', target: 'sheet:newGame', trigger: { after: 'G3', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G5', title: 'The recipe', text: 'Tap each of the six slots and pick an element. Greyed ones are still locked.', target: 'recipe', trigger: { after: 'G4', screen: ['newProject'] }, advance: { next: true }, block: false, skipIf: 'project:start' },
  { id: 'G6', title: 'Name and team', text: 'Give it a title (or tap Random), then tap two or three people for the team.', target: 'title', trigger: { after: 'G5', screen: ['newProject'] }, advance: { next: true }, block: false, skipIf: 'project:start' },
  { id: 'G7', title: 'Ready!', text: 'Everything is filled in. Tap Start.', target: 'start', trigger: { after: 'G6', event: 'guide:projectReady', screen: ['newProject'] }, advance: { event: 'project:start' }, block: true, skipIf: 'project:start' },
  { id: 'G8', title: 'Five milestones', text: 'Your team works through five milestones at the desks. Tap 1× to let time run.', target: 'speed', trigger: { after: 'G7', event: 'project:start', screen: ['studio'] }, advance: { next: true }, block: false },
  { id: 'G9', title: 'A decision', text: 'Ship now, or spend time to polish. Shipping is fine for a first game.', target: null, trigger: { after: 'G8', event: 'project:decision' }, advance: { next: true }, block: false, skipIf: 'project:complete' },
  // The release: one step whose spot follows the way there — the Release sheet's button when it is open (it opens by
  // itself after "Game finished!"), the game in the Create sheet, else Create — until the game is out.
  { id: 'G10', title: 'Game finished!', text: 'Release it: PC is picked already. Reviews come in on launch day.', target: 'releasePath', trigger: { after: 'G8', event: 'project:complete', screen: ['studio'] }, advance: { event: 'game:released' }, block: true, skipIf: 'game:released' },
  { id: 'G11', title: 'The reviews', text: 'Every review is saved in the Catalogue. Now make the next one — Help has a page for every system.', target: null, trigger: { after: 'G10', event: 'game:released', screen: ['studio'] }, advance: { next: true }, block: false },
];
export const GUIDE_FACE = null; // no speaker face: the coach box speaks as the studio

// One-time hint cards for the advanced screens (never a wall: a card with "Got it" the first time the screen opens).
export const SCREEN_HINTS = {
  research: { title: 'Research', text: 'Research Points come in every day. A finished topic opens new elements and facilities.' },
  engines: { title: 'Own engines', text: 'An engine of your own makes your games better in its strengths. Building one takes people off games.' },
  marketing: { title: 'Marketing', text: 'Campaigns build Hype before launch. Hype sets what fans expect — and what they buy.' },
  platforms: { title: 'Platform Market', text: 'Platforms come and go. Pick the ones your audience plays on right now.' },
  publishers: { title: 'Publishers', text: 'A publisher pays up front and takes a share. Some want a genre, a scope or your IP.' },
  contracts: { title: 'Contract Board', text: 'Short jobs for other studios: steady money between your own games.' },
  sponsors: { title: 'Sponsors', text: 'Six-month deals with perks and a few promises to keep.' },
  awards: { title: 'Awards', text: 'Each award is held once a year. Good games released that season can win.' },
  rivals: { title: 'Rivals', text: 'Other studios release games too — the same awards and the same buyers.' },
  hardware: { title: 'Hardware (optional)', text: 'Design a console from six parts. You never need one to win.' },
  consoles: { title: 'Console Portfolio', text: 'A launched console is a platform of your own: install base, third-party games, royalties.' },
  licensing: { title: 'Engine Licensing', text: 'Other studios pay to use your engine.' },
  publishingOffice: { title: 'Publishing Office', text: 'Fund other studios’ games and share what they earn.' },
  acquisitions: { title: 'Acquisitions', text: 'Now and then a studio is for sale: its IP or a person comes with it.' },
  archive: { title: 'Franchises', text: 'Every Original starts a franchise. Sequels bring fans — and fatigue.' },
  rumours: { title: 'Rumour Archive', text: 'Whispers about secrets. Clues get clearer as you get close.' },
  ledger: { title: 'Ledger', text: 'Every Credit in and out, month by month.' },
};

export const HELP_TEXT = {
  title: 'Help',
  topicsTab: 'Topics',
  seenTab: 'Tips seen',
  noneSeen: 'Tutorial tips and hint cards you have seen are kept here.',
  guideOn: 'Turn the guide back on',
  guideOff: 'Turn the guide off',
  back: '‹ Back',
};

// One short page per major system (Help → Topics).
export const HELP_TOPICS = [
  { id: 'games', title: 'Making a game', icon: 'dev_ui_07', art: 'dev_event_01', paras: ['Create → New Game: six recipe slots, a scope, a budget focus and a team of leads.', 'The team works through five milestones. At Beta and Gold you choose: ship, delay, cut a feature, outsource QA or crunch.', 'A finished game waits for you in Create → Release.'] },
  { id: 'release', title: 'Releasing and reviews', icon: 'dev_vfx_07', art: 'dev_event_02', paras: ['Pick platforms that are out now; each has its own players and fit.', 'Reviews come in on launch day. Better reviews sell more, for longer.', 'Everything you released is in Business → Catalogue.'] },
  { id: 'staff', title: 'Staff', icon: 'dev_ui_02', art: 'dev_event_03', paras: ['Staff opens the Roster. Tap anyone for their card: stats, Energy, traits, training and history.', 'Hire at the Recruitment Desk. A missing role makes games slower but never blocks them.'] },
  { id: 'research', title: 'Research', icon: 'dev_reward_03', art: 'dev_event_04', paras: ['Research Points arrive every day. Topics open new elements, facilities and scopes.'] },
  { id: 'money', title: 'Money and Fame', icon: 'dev_reward_01', art: 'dev_event_05', paras: ['Credits pay salaries and projects. Below zero, Emergency Credit keeps you going — nothing ends the studio.', 'Fame raises your rank (E to S); ranks open elements, speeds and bigger stages.'] },
  { id: 'studio', title: 'Studio and Build Mode', icon: 'facility_f02', art: 'dev_event_09', paras: ['Business → Build Mode: buy, move and sell facilities.', 'Business → Studio: move up a stage for more floor, staff and game lanes.'] },
  { id: 'franchises', title: 'Franchises and support', icon: 'dev_ui_15', art: 'dev_event_06', paras: ['Sequels, spin-offs, remakes and remasters build on your games.', 'After launch: patches, updates, expansions and ports from the Catalogue.'] },
  { id: 'business', title: 'Deals', icon: 'business_ui_01', art: 'dev_event_07', paras: ['Publishers, sponsors and contracts all live in Business.', 'Later: engine licensing, publishing other studios and acquisitions.'] },
  { id: 'compete', title: 'Awards and rivals', icon: 'award_trophy_01', art: 'dev_event_08', paras: ['Compete shows the awards (C01–C10), the rivals and the rankings.', 'Year 20 ends in a ceremony and a grade — then postgame or New Game+.'] },
  { id: 'hardware', title: 'Hardware (optional)', icon: 'dev_ui_26', art: 'dev_event_11', paras: ['From Year 11 with the Hardware Prototype Lab: design, build and launch your own console.', 'Hardware is optional: a software-only studio can still reach grade S.'] },
  { id: 'secrets', title: 'Secrets', icon: 'dev_ui_29', art: 'dev_event_13', paras: ['Some things are never listed. Rumours hint at them in Compete → Rumour Archive.'] },
];
