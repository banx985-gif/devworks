// First-run guide (Milestone 34, style guide "first-time guide with coach marks", spec §9). Plain data for
// core/GuideSystem.js: coach marks that take a new studio from the empty floor through its first game, its sales and
// the Ledger, a second game and the first Request (Milestone 40d). Each step does the real thing: a tap on the glowing
// spot, or (a light tip) the player does it and the step goes on by itself.
// Words are short; {founder} is the run's own Founding Developer (never a fixed name, spec §9).
// target names are resolved by main.js (guideTarget): founder, back (any screen's ‹ Back), create, bar:<bottom-bar id>,
// sheet:<button id> (a trailing * = the first button whose id starts so), releasePath / decisionPath (the way there:
// Create, then the sheet's button), recipe, ideas:card, ideas:choose, title, start, speed, liveBuild, top:inbox,
// roster:hire, roster:staff, staff:train, research:start, catalogue:archive, catalogue:support, buildDone,
// null = a centred box.
// trigger: after = that step done; event = has happened at least once; screen = only there.
// advance: tap = the glowing spot is tapped (the tap still reaches the game); next = "Got it"; event = it happens.
// Every step can be skipped, and "Guide off" stops it (Help and Settings turn it back on). Done steps never come back.
export const GUIDE_STEPS = [
  { id: 'G1', title: 'Your studio', text: 'Tap your Founder, {founder}, to meet them.', target: 'founder', art: null, trigger: { screen: ['studio'] }, advance: { tap: true }, block: true, skipAlso: ['G2'] },
  { id: 'G2', title: '{founderFirst}’s card', text: 'Stats, Energy and history live here. Tap Back to go on.', target: 'back', trigger: { after: 'G1', screen: ['staff'] }, advance: { tap: true }, block: true, restartAt: 'G1' },
  { id: 'G3', title: 'Make a game', text: 'Tap Create to start your first game.', target: 'create', trigger: { after: 'G1', screen: ['studio'] }, advance: { tap: true }, block: true, skipIf: 'project:start' },
  { id: 'G4', title: 'New Game', text: 'Tap New Game.', target: 'sheet:newGame', trigger: { after: 'G3', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G3', skipIf: 'project:start' },
  // Milestone 40d: the recipe by real taps — the Genre slot, a card in the M40b grid, Choose; then the other five.
  { id: 'G5', title: 'The recipe', text: 'Six slots make the recipe. Tap Genre.', target: 'recipe', trigger: { after: 'G4', screen: ['newProject'] }, advance: { tap: true }, block: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G5a', title: 'Idea cards', text: 'Every card is an idea. Tap one to read what it is good at.', target: 'ideas:card', trigger: { after: 'G5', screen: ['ideas'] }, advance: { tap: true }, block: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G5b', title: 'Choose', text: 'Its strengths and who is good at it are in the strip. Tap Choose.', target: 'ideas:choose', trigger: { after: 'G5a', screen: ['ideas'] }, advance: { tap: true }, block: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G5c', title: 'Five more', text: 'Fill Theme, Gameplay, Technology, Art Direction and Feature the same way. Greyed cards are still locked.', target: null, trigger: { after: 'G5b', screen: ['newProject'] }, advance: { event: 'guide:recipeFull' }, tip: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G6', title: 'Name and team', text: 'Give it a title (or tap Random), then tap two or three people for the team.', target: null, trigger: { after: 'G5c', screen: ['newProject'] }, advance: { event: 'guide:projectReady' }, tip: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G7', title: 'Ready!', text: 'Everything is filled in. Tap Start.', target: 'start', trigger: { after: 'G6', event: 'guide:projectReady', screen: ['newProject'] }, advance: { event: 'project:start' }, block: true, restartAt: 'G3', skipIf: 'project:start' },
  { id: 'G8', title: 'Let time run', text: 'Tap 1× to let time run.', target: 'speed', trigger: { after: 'G7', event: 'project:start', screen: ['studio'] }, advance: { tap: true }, block: true, skipIf: 'project:complete' },
  { id: 'G8a', title: 'The live panel', text: 'Your game’s stats count up here as the team works through five milestones, Concept to Gold.', target: 'liveBuild', trigger: { after: 'G8', screen: ['studio'] }, advance: { next: true }, block: false, skipIf: 'project:complete' },
  { id: 'G9', title: 'A decision', text: 'Ship now, or spend time to polish? Ship is fine for a first game: tap it.', target: 'decisionPath', trigger: { after: 'G8a', event: 'project:decision', screen: ['studio'] }, advance: { event: 'project:decided' }, block: true, skipIf: 'project:complete' },
  // The release: one step whose spot follows the way there — the Release sheet's button when it is open (it opens by
  // itself after "Game finished!"), the game in the Create sheet, else Create — until the game is out.
  { id: 'G10', title: 'Game finished!', text: 'Release it: PC is picked already. Reviews come in on launch day.', target: 'releasePath', trigger: { after: 'G8', event: 'project:complete', screen: ['studio'] }, advance: { event: 'game:released' }, block: true, skipIf: 'game:released' },
  { id: 'G11', title: 'The reviews', text: 'Reviews are in, and kept in the Catalogue. Now it sells, day by day.', target: null, trigger: { after: 'G10', event: 'game:released', screen: ['studio'] }, advance: { next: true }, block: false },
  // Milestone 40d: the sales, the Ledger, the next game and the first Request.
  { id: 'G12', title: 'Sales', text: 'Let a week run: watch your Credits climb in the top bar.', target: null, trigger: { after: 'G11', screen: ['studio'] }, advance: { event: 'guide:salesWeek' }, tip: true, skipIf: 'guide:salesWeek' },
  { id: 'G13', title: 'The Ledger', text: 'Every Credit in and out is in the Ledger. Tap Business.', target: 'bar:business', trigger: { after: 'G12', screen: ['studio'] }, advance: { tap: true }, block: true },
  { id: 'G14', title: 'The Ledger', text: 'Tap Ledger.', target: 'sheet:ledger', trigger: { after: 'G13', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G13' },
  { id: 'G15', title: 'Money in, money out', text: 'Sales in; salaries and costs out, month by month. Tap Back.', target: 'back', trigger: { after: 'G14', screen: ['ledger'] }, advance: { tap: true }, block: true, restartAt: 'G13' },
  { id: 'G16', title: 'Your next game', text: 'Tap Create to make your next game.', target: 'create', trigger: { after: 'G15', screen: ['studio'] }, advance: { tap: true }, block: true, skipIf: 'guide:game2' },
  { id: 'G17', title: 'New Game', text: 'Tap New Game.', target: 'sheet:newGame', trigger: { after: 'G16', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G16', skipIf: 'guide:game2' },
  { id: 'G18', title: 'Game two', text: 'Like the first one: six cards, a title and a team, then Start. Try a new mix!', target: null, trigger: { after: 'G17', screen: ['newProject'] }, advance: { event: 'guide:game2' }, tip: true, restartAt: 'G16', skipIf: 'guide:game2' },
  { id: 'G19', title: 'Game two is done', text: 'Release it the same way.', target: 'releasePath', trigger: { after: 'G18', event: 'guide:done2', screen: ['studio'] }, advance: { event: 'guide:released2' }, block: true, skipIf: 'guide:released2' },
  { id: 'G20', title: 'A request!', text: 'Someone wants a game made. Tap Create.', target: 'create', trigger: { after: 'G19', event: 'guide:requestReady', screen: ['studio'] }, advance: { tap: true }, block: true, skipIf: 'guide:requestStarted' },
  { id: 'G21', title: 'Requests', text: 'Tap Requests.', target: 'sheet:requests', trigger: { after: 'G20', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G20', skipIf: 'guide:requestStarted' },
  { id: 'G22', title: 'The Request Board', text: 'Each asks for a genre, a scope, a target and a deadline. Tap one.', target: 'sheet:request:*', trigger: { after: 'G21', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G20', skipIf: 'guide:requestStarted' },
  { id: 'G23', title: 'Make it', text: 'Hit the target in time for the pay, Fame and a chest. Tap Make it.', target: 'sheet:requestGo', trigger: { after: 'G22', screen: ['studio'] }, advance: { tap: true }, block: true, restartAt: 'G20', skipIf: 'guide:requestStarted' },
  { id: 'G24', title: 'Fixed by the request', text: 'The genre and scope are set. Pick the rest, then Start.', target: null, trigger: { after: 'G23', screen: ['newProject'] }, advance: { event: 'guide:requestStarted' }, tip: true, restartAt: 'G20', skipIf: 'guide:requestStarted' },
  { id: 'G25', title: 'Beat the target', text: 'The target and the days left are on the panel. From now on I’ll show you each new thing as it opens — Help keeps them all.', target: 'liveBuild', trigger: { after: 'G24', screen: ['studio'] }, advance: { next: true }, block: false },
];
// Steps added in Milestone 40d: a run that had finished the Milestone 34 guide (G11 done) counts them as done.
export const GUIDE_M40D_STEPS = ['G5a', 'G5b', 'G5c', 'G8a', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21', 'G22', 'G23', 'G24', 'G25'];
export const GUIDE_FACE = { key: 'dev_mascot_02', crop: { x: 0, y: 0, w: 1, h: 1 } }; // Milestone 37: Code Fox speaks for the studio

// Milestone 40d: a short walkthrough for every feature as it unlocks (they replace the M34 one-time hint cards). When
// `unlock` (src/systems/walkthroughs.js) first holds, a card asks "New: <title>. Show me / Later"; Later keeps a badge
// on Help until it is watched or dismissed. Help lists them all with "Show me again"; Settings resets them.
// One block per feature: { id, title, line (the card and Help), unlock, art, steps: [{ screen, target, advance, title,
// text, when }] } — 3–6 steps, the first on the studio floor. advance 'tap' = do it (only that spot takes taps);
// 'next' = "Got it". when: a step that only makes sense now (main.js applies(): researchIdle, buildMode).
// A walkthrough's steps become GuideSystem steps (walkSteps below): group 'wt:<id>', a reload goes back to its start.
const tap = (screen, target, title, text, extra = {}) => ({ screen, target, advance: 'tap', title, text, ...extra });
const say = (screen, target, title, text, extra = {}) => ({ screen, target, advance: 'next', title, text, ...extra });
export const WALKTHROUGHS = [
  { id: 'research', title: 'Research', unlock: 'afterGuide', art: 'dev_ui_03', line: 'Spend Research Points on topics that open new elements, facilities and scopes.', steps: [
    tap('studio', 'bar:research', 'Research', 'Research Points (RP) come in every day. Tap Research.'),
    tap('research', 'research:start', 'Start a topic', 'Tap Start on a topic: RP pay for it day by day.', { when: 'researchIdle' }),
    say('research', null, 'What it opens', 'A finished topic opens new elements, facilities or bigger scopes. One topic runs at a time.'),
    tap('research', 'back', 'Back to work', 'Tap Back. Your RP are in the top bar.'),
  ] },
  { id: 'hiring', title: 'Hiring', unlock: 'afterGuide', art: 'dev_ui_02', line: 'Grow the team at the Recruitment Desk: channels, candidates and salaries.', steps: [
    tap('studio', 'bar:staff', 'Your team', 'Tap Staff to see everyone.'),
    tap('roster', 'roster:hire', 'Hire', 'Tap Hire for the Recruitment Desk.'),
    tap('roster', 'sheet:card:*', 'Candidates', 'Each channel brings different people. Tap a candidate.'),
    say('roster', null, 'Their card', 'The salary is paid every month. A missing role makes games slower but never blocks them.'),
  ] },
  { id: 'training', title: 'Training and mentoring', unlock: 'twoStaff', art: 'dev_ui_02', line: 'Courses raise a stat; an Elite can mentor a junior.', steps: [
    tap('studio', 'bar:staff', 'Training', 'Tap Staff.'),
    tap('roster', 'roster:staff', 'Pick someone', 'Tap a team member’s card.'),
    tap('staff', 'staff:train', 'Train', 'Tap Train: a course raises a stat for a few days and some Credits.'),
    say('staff', null, 'Mentoring', 'An Elite can mentor a junior from the Elite’s card (Mentor). Both keep working.'),
  ] },
  { id: 'buildMode', title: 'Build Mode and facilities', unlock: 'afterGuide', art: 'facility_f02', line: 'Buy, move and sell facilities: each one makes your studio better at something.', steps: [
    tap('studio', 'bar:business', 'Facilities', 'Facilities make your studio better. Tap Business.'),
    tap('studio', 'sheet:buildMode', 'Build Mode', 'Tap Build Mode.'),
    say('studio', null, 'The Shop', 'Buy from the Shop, drag a facility to move it, tap one to sell it. Each lists what it does.'),
    tap('studio', 'buildDone', 'Done', 'Tap Done to go back to work.', { when: 'buildMode' }),
  ] },
  { id: 'stages', title: 'Studio stages', unlock: 'stageNear', art: 'facility_f01', line: 'Move to a bigger studio: more floor, staff and game lanes.', steps: [
    tap('studio', 'bar:business', 'A bigger studio', 'A bigger studio means more staff and game lanes. Tap Business.'),
    tap('studio', 'sheet:studio', 'Studio', 'Tap Studio.'),
    say('studio', 'sheet:upgrade', 'Moving up', 'The next stage, its cost and what it needs. Everything you built comes with you.'),
  ] },
  { id: 'marketing', title: 'Marketing and Hype', unlock: 'firstRelease', art: 'dev_ui_23', line: 'Campaigns build Hype before launch; Hype sets what fans expect.', steps: [
    tap('studio', 'bar:business', 'Marketing', 'Hype sets what fans expect, and how many buy on day one. Tap Business.'),
    tap('studio', 'sheet:marketing', 'The Planner', 'Tap Marketing Planner.'),
    say('marketing', null, 'Campaigns', 'Run a campaign for a game in the works: Hype climbs, then fades. Big promises need a good game.'),
    tap('marketing', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'platforms', title: 'Platforms and porting', unlock: 'firstRelease', art: 'business_ui_09', line: 'Platforms come and go; ports take your games to new ones.', steps: [
    tap('studio', 'bar:business', 'Platforms', 'Tap Business.'),
    tap('studio', 'sheet:platforms', 'Platform Market', 'Tap Platform Market.'),
    say('platforms', null, 'Who plays where', 'Each platform has its players, a fit for genres and a cost. Pick the ones out now.'),
    tap('platforms', 'back', 'Porting', 'A released game can go to a new platform from Catalogue → Support. Tap Back.'),
  ] },
  { id: 'franchises', title: 'Franchises and sequels', unlock: 'firstRelease', art: 'dev_ui_15', line: 'Every Original starts a franchise: sequels, spin-offs and remakes.', steps: [
    tap('studio', 'bar:business', 'Franchises', 'Tap Business.'),
    tap('studio', 'sheet:catalogue', 'Catalogue', 'Tap Catalogue: every game you made.'),
    tap('catalogue', 'catalogue:archive', 'Franchises', 'Tap Franchises.'),
    say('archive', null, 'Sequels', 'Every Original starts a franchise. New Game can make a sequel, spin-off or remake: fans come back, but too many tire them.'),
    tap('archive', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'publishers', title: 'Publishers', unlock: 'publishers', art: 'business_ui_01', line: 'A publisher pays up front and takes a share of the sales.', steps: [
    tap('studio', 'bar:business', 'Publishers', 'A publisher has an offer for you. Tap Business.'),
    tap('studio', 'sheet:publishers', 'Publishers', 'Tap Publishers.'),
    say('publishers', null, 'A deal', 'They pay up front and take a share of sales. Some want a genre, a scope or your IP.'),
    tap('publishers', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'contracts', title: 'Contract Board', unlock: 'contracts', art: 'business_ui_03', line: 'Short jobs for other studios: steady money between your own games.', steps: [
    tap('studio', 'bar:business', 'Contracts', 'Tap Business.'),
    tap('studio', 'sheet:contracts', 'Contract Board', 'Tap Contract Board.'),
    say('contracts', null, 'A job', 'Pick a job and a team, finish on time, get paid. Steady money between your games.'),
    tap('contracts', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'requests', title: 'Requests', unlock: 'requests', art: 'business_ui_03', line: 'Publishers, platforms, sponsors and fans ask for games: a target, a deadline, pay.', steps: [
    tap('studio', 'bar:create', 'Requests', 'Publishers, platforms, sponsors and fans ask for games. Tap Create.'),
    tap('studio', 'sheet:requests', 'The board', 'Tap Requests.'),
    tap('studio', 'sheet:request:*', 'A request', 'Tap one.'),
    say('studio', null, 'Make it', 'Make it opens New Game with the genre and scope set. Hit the target in time for pay, Fame and a chest; a miss only halves the pay.'),
  ] },
  { id: 'sponsors', title: 'Sponsors', unlock: 'sponsors', art: 'business_ui_02', line: 'Six-month deals: money and perks for a few promises.', steps: [
    tap('studio', 'bar:business', 'Sponsors', 'A sponsor wants your name. Tap Business.'),
    tap('studio', 'sheet:sponsors', 'Sponsors', 'Tap Sponsors.'),
    say('sponsors', null, 'The deal', 'Six months of money and perks for a few promises. Keep them for a bonus.'),
    tap('sponsors', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'awards', title: 'Awards and rivals', unlock: 'yearTwo', art: 'award_trophy_01', line: 'Ten awards a year, and rival studios after the same buyers.', steps: [
    tap('studio', 'bar:compete', 'Awards', 'Tap Compete.'),
    tap('studio', 'sheet:awards', 'Awards', 'Tap Awards.'),
    tap('awards', 'back', 'Once a year', 'Ten awards, each held once a year: games out that season can win. Tap Back.'),
    tap('studio', 'bar:compete', 'Rivals', 'Tap Compete again.'),
    tap('studio', 'sheet:rivals', 'Rivals', 'Tap Rivals.'),
    say('rivals', null, 'The others', 'Rival studios release games too: the same buyers, the same awards. Rankings shows where you stand.'),
  ] },
  { id: 'engines', title: 'Own engine', unlock: 'engines', art: 'dev_ui_11', line: 'Build an engine: its strengths lift every game made on it.', steps: [
    tap('studio', 'bar:create', 'Your own engine', 'You can build an engine now. Tap Create.'),
    tap('studio', 'sheet:engines', 'Engines', 'Tap Engines.'),
    say('engines', null, 'How it works', 'A team builds it for a while. Its strengths lift every game made on it; new versions keep it fresh.'),
    tap('engines', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'support', title: 'Post-launch support', unlock: 'support', art: 'dev_ui_15', line: 'Patches, updates, expansions and ports for a released game.', steps: [
    tap('studio', 'bar:business', 'After launch', 'Tap Business.'),
    tap('studio', 'sheet:catalogue', 'Catalogue', 'Tap Catalogue.'),
    tap('catalogue', 'catalogue:support', 'Support', 'Tap Support on a game.'),
    say('catalogue', null, 'Keep it going', 'Patches fix bugs; updates and expansions bring players back; ports reach new platforms. Each takes a small team for a while.'),
  ] },
  { id: 'global', title: 'Global business', unlock: 'global', art: 'business_ui_10', line: 'Engine licensing, publishing other studios and acquisitions.', steps: [
    tap('studio', 'bar:business', 'Global business', 'Your studio can earn from other studios now. Tap Business.'),
    tap('studio', 'sheet:licensing', 'Licensing', 'Tap Engine Licensing.'),
    say('licensing', null, 'Three ways', 'Studios pay to use your engine. The Publishing Office funds their games; Acquisitions buys studios for their IP or people.'),
    tap('licensing', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'hardware', title: 'Hardware prototype', unlock: 'hardware', art: 'dev_ui_26', line: 'Design a console from six parts in the Prototype Lab (optional).', steps: [
    tap('studio', 'bar:create', 'Hardware', 'Your Prototype Lab is ready. Tap Create.'),
    tap('studio', 'sheet:hardware', 'Hardware', 'Tap Hardware.'),
    say('hardware', null, 'Six parts', 'Pick a part for each of six slots: cost, power and looks. A team builds the prototype.'),
    say('hardware', null, 'Optional', 'Hardware is optional: a software-only studio can still reach grade S.'),
    tap('hardware', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'consoles', title: 'Console launch', unlock: 'consoles', art: 'dev_ui_29', line: 'Launch a prototype as your own platform.', steps: [
    tap('studio', 'bar:create', 'Launch day', 'A prototype is ready to launch. Tap Create.'),
    tap('studio', 'sheet:consoles', 'Consoles', 'Tap Consoles.'),
    say('consoles', null, 'Your platform', 'Set a price and launch. Your console gets players, third-party games and royalties.'),
    tap('consoles', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'generations', title: 'Hardware generations', unlock: 'generations', art: 'dev_ui_29', line: 'Follow a console with the next generation, or fix it with a revision.', steps: [
    tap('studio', 'bar:create', 'Generations', 'Tap Create.'),
    tap('studio', 'sheet:consoles', 'Consoles', 'Tap Consoles.'),
    say('consoles', null, 'The next one', 'After a year on sale, build a new prototype and launch it as the next generation — up to three.'),
    say('consoles', null, 'Revisions', 'Defects or poor sales? A revised model fixes it. Old games count for the new generation.'),
    tap('consoles', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'storefront', title: 'Storefront', unlock: 'storefront', art: 'business_ui_09', line: 'Your own store: keep the cut on the downloads it takes.', steps: [
    tap('studio', 'bar:business', 'Your own store', 'Tap Business.'),
    tap('studio', 'sheet:storefront', 'Storefront', 'Tap Storefront.'),
    say('studio', null, 'Open it', 'Open it and your games sell there too: you keep the platform’s cut on those downloads.'),
  ] },
  { id: 'events', title: 'Events and the Inbox', unlock: 'events', art: 'dev_ui_05', line: 'News, offers and small events; every message is kept in the Inbox.', steps: [
    say('studio', null, 'Events', 'Things happen: offers, news, small crises. One pop-up at a time, never a pile.'),
    tap('studio', 'top:inbox', 'The Inbox', 'Every message is kept in the Inbox. Tap it.'),
    say('studio', null, 'Answer later', 'A choice you closed waits here: answer it any time.'),
  ] },
  { id: 'secrets', title: 'Secrets and rumours', unlock: 'secrets', art: 'dev_mascot_01', line: 'Whispers about secret games, people and parts.', steps: [
    tap('studio', 'bar:compete', 'A rumour', 'You heard a rumour. Tap Compete.'),
    tap('studio', 'sheet:rumours', 'Rumour Archive', 'Tap Rumour Archive.'),
    say('rumours', null, 'Clues', 'Whispers about secret games, people and parts. Clues get clearer as you get close.'),
    tap('rumours', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'achievements', title: 'Achievements', unlock: 'achievements', art: 'dev_ui_04', line: 'Achievements and the Hall of Fame, kept across every studio.', steps: [
    tap('studio', 'bar:compete', 'Achievement!', 'You earned an achievement. Tap Compete.'),
    tap('studio', 'sheet:achievements', 'Achievements', 'Tap Achievements.'),
    say('achievements', null, 'Kept for good', 'Achievements and the Hall of Fame stay on this device across every studio.'),
    tap('achievements', 'back', 'Back', 'Tap Back.'),
  ] },
  { id: 'ending', title: 'The ending and New Game+', unlock: 'lateYears', art: 'dev_brand_06', line: 'Year 20 ends in a ceremony and a grade; then postgame or New Game+.', steps: [
    say('studio', null, 'The last stretch', 'Year 20 ends in a ceremony: awards, games, Fame and secrets add up to a grade.'),
    tap('studio', 'bar:compete', 'Where you stand', 'Tap Compete.'),
    tap('studio', 'sheet:rankings', 'Rankings', 'Tap Rankings.'),
    say('rankings', null, 'After the ceremony', 'Keep playing (postgame), or start New Game+ with a head start.'),
    tap('rankings', 'back', 'Back', 'Tap Back.'),
  ] },
];
// Pacing: after a card is answered or a walkthrough ends, the next card waits this long on a free studio floor.
export const WALK_RULES = { gapSec: 20 };
export const walkGroup = (id) => `wt:${id}`;
// The walkthroughs as GuideSystem steps (they go before the first-game guide: one started takes its turn first).
export function walkSteps(list = WALKTHROUGHS) {
  const out = [];
  for (const w of list) {
    const first = `W:${w.id}:1`;
    w.steps.forEach((s, i) => {
      const id = `W:${w.id}:${i + 1}`;
      out.push({
        id,
        group: walkGroup(w.id),
        title: s.title,
        text: s.text,
        target: s.target,
        art: null,
        trigger: { screen: [s.screen], ...(i ? { after: `W:${w.id}:${i}` } : {}) },
        advance: s.advance === 'tap' ? { tap: true } : { next: true },
        block: s.advance === 'tap',
        ...(i ? { restartAt: first } : {}),
        ...(s.when ? { when: s.when } : {}),
      });
    });
  }
  return out;
}
// The M34 hint cards a run had already seen count their walkthrough as done (an older save).
export const HINT_TO_WALK = { research: 'research', engines: 'engines', marketing: 'marketing', platforms: 'platforms', publishers: 'publishers', contracts: 'contracts', sponsors: 'sponsors', awards: 'awards', rivals: 'awards', hardware: 'hardware', consoles: 'consoles', licensing: 'global', publishingOffice: 'global', acquisitions: 'global', archive: 'franchises', rumours: 'secrets' };

export const HELP_TEXT = {
  title: 'Help',
  topicsTab: 'Topics',
  seenTab: 'Tips seen',
  walksTab: 'Walkthroughs',
  noneSeen: 'Tutorial tips you have seen are kept here.',
  noWalks: 'Each feature gets a short walkthrough when it opens. They will be listed here.',
  walksMore: (n) => `${n} more open as you play.`,
  showMe: 'Show me',
  showAgain: 'Show me again',
  dismiss: 'Dismiss',
  walkStatus: { new: 'New', later: 'New — not watched yet', done: 'Watched' },
  guideOn: 'Turn the guide back on',
  guideOff: 'Turn the guide off',
  back: '‹ Back',
};

// One short page per major system (Help → Topics).
export const HELP_TOPICS = [
  { id: 'about', title: 'About DEVWORKS', icon: 'dev_brand_01', art: 'dev_brand_02', paras: ['Build a game studio, one hit at a time: from a rented office to a Global Campus in twenty years.', 'A Banx Gamex game in the Canvas Management Series, with friends from BOTWORKS and RACEWORKS.'] },
  { id: 'bugs', title: 'Bugs and QA', icon: 'dev_ui_06', art: 'dev_mascot_03', paras: ['Every game ships with some bugs; QA facilities, traits and time cut them.', 'At Beta and Gold you can delay, cut a feature, outsource QA or crunch. Patches after launch fix the rest.'] },
  { id: 'games', title: 'Making a game', icon: 'dev_ui_08', art: 'dev_event_01', paras: ['Create → New Game: six recipe slots, a scope, a budget focus and a team of leads.', 'The team works through five milestones. At Beta and Gold you choose: ship, delay, cut a feature, outsource QA or crunch.', 'A finished game waits for you in Create → Release.'] },
  { id: 'release', title: 'Releasing and reviews', icon: 'dev_ui_21', art: 'dev_event_02', paras: ['Pick platforms that are out now; each has its own players and fit.', 'Reviews come in on launch day. Better reviews sell more, for longer.', 'Everything you released is in Business → Catalogue.'] },
  { id: 'staff', title: 'Staff', icon: 'dev_ui_02', art: 'dev_event_03', paras: ['Staff opens the Roster. Tap anyone for their card: stats, Energy, traits, training and history.', 'Hire at the Recruitment Desk. A missing role makes games slower but never blocks them.'] },
  { id: 'research', title: 'Research', icon: 'dev_reward_03', art: 'dev_event_04', paras: ['Research Points arrive every day. Topics open new elements, facilities and scopes.'] },
  { id: 'money', title: 'Money and Fame', icon: 'dev_reward_01', art: 'dev_event_05', paras: ['Credits pay salaries and projects. Below zero, Emergency Credit keeps you going — nothing ends the studio.', 'Fame raises your rank (E to S); ranks open elements, speeds and bigger stages.'] },
  { id: 'studio', title: 'Studio and Build Mode', icon: 'facility_f02', art: 'dev_brand_05', paras: ['Business → Build Mode: buy, move and sell facilities.', 'Business → Studio: move up a stage for more floor, staff and game lanes.'] },
  { id: 'franchises', title: 'Franchises and support', icon: 'dev_ui_15', art: 'dev_event_06', paras: ['Sequels, spin-offs, remakes and remasters build on your games.', 'After launch: patches, updates, expansions and ports from the Catalogue.'] },
  { id: 'business', title: 'Deals', icon: 'business_ui_01', art: 'dev_event_07', paras: ['Publishers, sponsors and contracts all live in Business.', 'Later: engine licensing, publishing other studios and acquisitions.'] },
  { id: 'compete', title: 'Awards and rivals', icon: 'award_trophy_01', art: 'dev_event_08', paras: ['Compete shows the awards (C01–C10), the rivals and the rankings.', 'Year 20 ends in a ceremony and a grade — then postgame or New Game+.'] },
  { id: 'hardware', title: 'Hardware (optional)', icon: 'dev_ui_26', art: 'dev_event_11', paras: ['From Year 11 with the Hardware Prototype Lab: design, build and launch your own console.', 'Hardware is optional: a software-only studio can still reach grade S.'] },
  { id: 'secrets', title: 'Secrets', icon: 'dev_ui_30', art: 'dev_mascot_01', paras: ['Some things are never listed. Rumours hint at them in Compete → Rumour Archive.'] },
];
