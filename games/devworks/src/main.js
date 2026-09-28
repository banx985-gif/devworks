// DEVWORKS — boot.
// Starts the shared series engine from core/, loads the save (or starts a new studio) and opens the studio.
// Milestone 3: game projects (New Game Project, the active project view, "Game finished!").
// Milestone 4: Credits, releasing, reviews, sales, Fame / rank, the Ledger and the Catalogue, speed unlocks.
// Milestone 5: real art in the studio (props, the Showcase Shelf with the released covers), workers that move, the
// art pops while a game is made, a medium beat when a milestone is done, the big cover at "Game finished!", a launch
// rocket and confetti on release, and a money burst on big sales days.
// Milestone 5b: a title screen on launch (Continue, Load / Slots, New Game, Settings), four save slots (core/SaveSlots),
// New Game setup (studio name, Studio Director, colour, Founding Developer) and founder perks. Slot 1 is the old save.
// Switching to another slot after one has been played reloads the page first, so no state crosses between studios.
// Milestone 6: all 50 recipe elements, opened by rank / year / research (src/systems/elementUnlocks.js); the pickers
// show why a locked one is locked; covers come from the recipe (30 families, data/covers.js).
// Milestone 7: six scopes (Standard+ wait for studio stages), budget focus, a deadline with a seeded slip, and the Beta /
// Gold decisions (Ship / Delay / Cut Feature / Outsource QA / Crunch): the clock stops and the decision sheet opens.
// Milestone 8: the platform market (12 platforms, seeded install-base curves committed per run, Business → Platform
// Market), release on one or more platforms (porting, QA overhead, certification that can fail and delay the launch).
// Milestone 9: marketing (actions build each game's Hype; Hype sets Fan Expectation and sales; word of mouth; Fan
// Trust in the top bar), the Marketing Planner (Business, Create, and the Marketing Wall placed at Rank D) and the
// release calendar of competitor releases (on the planner and the release sheet).
// Milestone 10: franchises — project types (Original / Sequel / Spin-off / Remake / Remaster) on New Game, fatigue and
// fans at launch, the back catalogue each month, and the Franchise Archive (Catalogue → Franchises).
// Milestone 11: facilities — the 35 in data/facilities.js with their effects (world.effect), Build Mode's Shop (buy) and
// tap-to-sell, Business → Studio (stages S1–S3: a bigger floor, staff cap and game lanes; Standard scope at S2, Large at
// S3) and Business → Build Mode.
// Milestone 12: the research tree (36 topics, core ResearchSystem): the Research button opens the Research screen; RP
// in the top bar; a finished topic opens the elements and facilities that waited on it.
// Milestone 13: recruitment (the Recruitment Desk and Staff → Hire: channels, the board of 3, free refresh every 56
// days, hiring up to the stage cap, letting go), training courses and mentoring (Staff card → Train / Mentor), careers
// on the staff card, the missing-role hints on New Game, and the second game lane at S2+.
// Milestone 14: all 50 staff (portrait crops, the career validator in the ?debug=1 data check, the Staff book).
// Milestone 15: the 24 normal combos (src/systems/combos.js): rewards when a recipe matches, discovery when the game is
// finished (RP once a run; the archive is kept for the whole account, SAVE.accountKey), near-miss hints on New Game,
// the Discovery Archive (Research and Catalogue).
// Milestone 16: the own engine (src/systems/engines.js): engine projects (Create → Engines), versions with eight
// attributes, New Game's engine pick, upkeep while games use it.
// Milestone 17: publishers (monthly deal offers, signed deals on New Game, milestones, revenue share, IP clause) and the
// contract-work board (Business → Publishers / Contract Board).
// Milestone 18: sponsors (Business → Sponsors: 1–3 slots by rank, 6-month deals, perks through the studio's effect
// query, exact obligation counters, relationship tiers); Standard and Premium audio packages.
// Milestone 19: awards C01–C10 and the rival studios (Compete → Awards / Rivals / Rankings; their releases are the
// release calendar); award wins add Fame, trophies (the Awards Cabinet) and the stages' award needs.
// Milestone 20: post-launch support (Catalogue → Support on a released game: Patch, Free Update, Expansion, DLC, Port,
// Move On; Remaster / Remake lead to New Game): a player score, Fan Trust, a longer tail, add-on sales, new platforms.
// Milestone 21: global business — localisation on New Game (PRO3 / Localisation Suite), Global publisher deals at Rank A,
// engine licensing (Business → Engine Licensing), publishing other studios (Business → Publishing Office, or tap the
// Publishing Office), acquisitions (Business → Acquisitions); passive income capped at a share of each year's income.
// Add ?debug=1 for the FPS/state overlay and the badge toggle, ?screen=test for the Milestone 0 scaling/tap test screen.
import { THEME, font } from '../../../core/Theme.js';
import { EventBus } from '../../../core/EventBus.js';
import { Rng } from '../../../core/Rng.js';
import { Renderer } from '../../../core/Renderer.js';
import { UiLayout } from '../../../core/UiLayout.js';
import { Input } from '../../../core/Input.js';
import { ScreenRouter } from '../../../core/ScreenRouter.js';
import { AssetManager } from '../../../core/AssetManager.js';
import { FixedStepLoop } from '../../../core/FixedStepLoop.js';
import { DebugOverlay } from '../../../core/DebugOverlay.js';
import { SystemBack } from '../../../core/SystemBack.js';
import { Clock } from '../../../core/Clock.js';
import { createStorageAdapter } from '../../../core/StorageAdapter.js';
import { SaveSlots } from '../../../core/SaveSlots.js';
import { Autosave } from '../../../core/Autosave.js';
import { MajorFeedback } from '../../../core/MajorFeedback.js';
import { VfxSystem } from '../../../core/VfxSystem.js';
import { FloatFeed } from '../../../core/FloatFeed.js';
import { TextPrompt } from '../../../core/ui/TextPrompt.js';
import { BottomSheet } from '../../../core/ui/BottomSheet.js';
import { Dialog } from '../../../core/ui/Modal.js';
import { createTopBar } from '../../../core/ui/TopBar.js';
import { createBottomBar } from '../../../core/ui/BottomBar.js';
import { drawButton, hitRect, setPressPoint, clearPress } from '../../../core/ui/Button.js';
import { drawToasts } from '../../../core/ui/Toast.js';
import { ASSETS } from '../data/assets.js';
import { CALENDAR, PROJECT_BALANCE, FRANCHISE_BALANCE } from '../data/balance.js';
import { BOTTOM_SLOTS, TOP_ICONS, BADGES } from '../data/home.js';
import { SAVE } from '../data/save.js';
import { FAMILIES, elementById } from '../data/elements.js';
import { SCOPES } from '../data/projects.js';
import { STATIONS, DEV_POPS, BIG_SALES } from '../data/studio.js';
import { founderById } from '../data/setup.js';
import { startStaffById, staffDefById } from '../data/staff.js';
import { createRecruitment } from './systems/recruitment.js';
import { createTraining } from './systems/training.js';
import { createCombos, combosFor } from './systems/combos.js';
import { comboById } from '../data/combos.js';
import { createDiscoveryScreen } from './screens/DiscoveryScreen.js';
import { createEngines } from './systems/engines.js';
import { createEngineScreen } from './screens/EngineScreen.js';
import { createPublishers } from './systems/publishers.js';
import { createContracts } from './systems/contracts.js';
import { createPublishersScreen, createContractsScreen } from './screens/BusinessDealsScreens.js';
import { createSponsors } from './systems/sponsors.js';
import { createRivals } from './systems/rivals.js';
import { createSupport } from './systems/support.js';
import { createGlobalBusiness } from './systems/globalBusiness.js';
import { createLicensingScreen, createPublishingOfficeScreen, createAcquisitionsScreen } from './screens/GlobalScreens.js';
import { LOCALISATION } from '../data/global.js';
import { supportOptionById as SUPPORT_OPTION_BY_ID } from '../data/support.js';
import { createAwards } from './systems/awards.js';
import { createAwardsScreen, createRivalsScreen, createRankingsScreen } from './screens/CompeteScreens.js';
import { staffDefById as defOf, ROSTER as ALL_STAFF } from '../data/staff.js';
import { createSponsorsScreen } from './screens/SponsorsScreen.js';
import { sponsorById } from '../data/sponsors.js';
const sponsorName = (id) => sponsorById(id)?.name ?? id;
import { TRAITS, STATS } from '../data/staff.js';
import { createStudioProfile, migrateToV2, slotSummary } from './systems/studioProfile.js';
import { createTitleScreen } from './screens/TitleScreen.js';
import { createSetupScreen } from './screens/SetupScreen.js';
import { createDevPops } from './ui/devPops.js';
import { createStudioWorld } from './systems/studioWorld.js';
import { createGameProjects } from './systems/gameProject.js';
import { createElementUnlocks } from './systems/elementUnlocks.js';
import { checkGameData } from './systems/dataCheck.js';
import { createBusiness } from './systems/business.js';
import { createStudioScreen } from './screens/StudioScreen.js';
import { createRosterScreen } from './screens/RosterScreen.js';
import { createStaffDetailScreen } from './screens/StaffDetailScreen.js';
import { createNewProjectScreen } from './screens/NewProjectScreen.js';
import { createProjectScreen } from './screens/ProjectScreen.js';
import { createLedgerScreen } from './screens/LedgerScreen.js';
import { createCatalogueScreen } from './screens/CatalogueScreen.js';
import { createPlatformMarketScreen } from './screens/PlatformMarketScreen.js';
import { createMarketingScreen } from './screens/MarketingScreen.js';
import { createFranchiseArchiveScreen } from './screens/FranchiseArchiveScreen.js';
import { openStations } from './systems/stationUnlocks.js';
import { createFacilityShop } from './systems/facilityShop.js';
import { createResearch } from './systems/research.js';
import { createResearchScreen } from './screens/ResearchScreen.js';
import { RESEARCH } from '../data/research.js';
const RESEARCH_LIST = () => RESEARCH;
import { elementById as elementName } from '../data/elements.js';
import { facilityById, stageById } from '../data/facilities.js';
import { platformById } from '../data/platforms.js';
import { drawCover, drawOutputs } from './ui/gameCard.js';
import { createTestScreen } from './screens/TestScreen.js';
import { createRouteTestScreen } from './screens/RouteTestScreen.js';
import { createStudioMenus } from './ui/studioMenus.js';
import { registerPlaceholders } from './ui/placeholders.js';
const COL = THEME.color;

const W = 1080;
const BASE_H = 1920; // 9:16; taller phones grow the height (see Renderer)
const MAX_H = 2640; // up to 9:22 fills edge to edge; taller still gets thin bars top and bottom
const START_SCREEN = new URLSearchParams(window.location.search).get('screen') === 'test' ? 'test' : 'title';
const MENU_SCREENS = ['title', 'setup']; // before a studio is open: no clock, no top bar
const TEST_SCREENS = ['test', 'route']; // the Milestone 0 screens: pause button, full debug box
const WORLD_SCREENS = ['studio', 'roster', 'staff', 'newProject', 'project', 'ledger', 'catalogue', 'platforms', 'marketing', 'archive', 'research', 'discoveries', 'engines', 'publishers', 'contracts', 'sponsors', 'awards', 'rivals', 'rankings', 'licensing', 'publishingOffice', 'acquisitions']; // where the top bar's Pause / speeds apply

const bus = new EventBus();
const rng = new Rng('devworks-m0');
const renderer = new Renderer(document.getElementById('game'), { width: W, height: BASE_H, maxHeight: MAX_H, maxDpr: 2, bus });
const layout = new UiLayout(renderer);
bus.on('renderer:resize', () => layout.refresh());
const input = new Input(renderer, bus);
const assets = new AssetManager({ bus });
const router = new ScreenRouter(bus, { roots: ['studio', 'test', 'title'] });
const dialog = new Dialog({ layout, assets }); // confirm boxes (delete a slot)
const sheet = new BottomSheet({ layout, assets, onClose: () => studio.selection.clear() });
registerPlaceholders(assets); // stand-ins for art not drawn yet

// The calendar (bible §4) and the studio. The studio runs on every world screen, at the top bar's speed.
const clock = new Clock({ bus, ...CALENDAR });
const log = { log: (m) => debug.log(m) };
const studioRng = new Rng('devworks-studio'); // the run's seeded randomness (saved with the studio)
const world = createStudioWorld({ bus, rng: studioRng, debug: log });
const profile = createStudioProfile({ bus, clock }); // studio name, director, colour, founder + history (Milestone 5b)
// Each day: the studio settles Energy and breaks, projects work (and pay), then released games sell — so the
// three are created in that order.
let engines = null; // Milestone 16 (made below, after research)
const projects = createGameProjects({ engineFor: (versionId, tech) => engines?.forGame(versionId, tech) ?? null, bus, world, clock, charge: (amount, reason) => business.charge(amount, reason), founder: () => profile.founder(), studioVariancePct: () => world.effect('scheduleVariancePct') }); // Milestone 11: the facilities' effect
const business = createBusiness({ bus, clock, world, projects });
const research = createResearch({ bus, clock, world }); // Milestone 12
const shop = createFacilityShop({ bus, world, business, clock, projects, researched: () => research.researched() }); // Milestone 11
// Busy elsewhere (Milestones 16–17): the engine, a contract.
let contracts = null;
const engineBusy = (id) => (engines?.jobOf(id) ? 'Building the engine' : contracts?.jobOf(id) ? 'On a contract' : support?.jobOf(id) ? 'On post-launch support' : null);
const recruitment = createRecruitment({ bus, clock, world, business, projects, profile, shop, extraBusy: engineBusy }); // Milestone 13
const training = createTraining({ bus, clock, world, business, projects, research, recruitment, extraBusy: engineBusy });
engines = createEngines({ bus, clock, world, business, projects, research, studioName: () => profile.name || 'Studio', extraBusy: (id) => (contracts?.jobOf(id) ? 'On a contract' : null) });
const sponsors = createSponsors({ bus, clock, world, business }); // Milestone 18
world.addEffectSource((key) => sponsors.effect(key));
// Milestone 19: the rivals and the awards (after the business: the season's sales are in by the month end).
const rivals = createRivals({ bus, clock, seed: () => business.marketing.seed, platformsOn: (m) => business.platforms.active(m * clock.daysPerMonth).map((p) => p.id) });
const awards = createAwards({ bus, clock, business, projects, rivals, seed: () => business.marketing.seed, studioName: () => profile.name || 'Your studio', hasEngine: () => !!engines?.engines.length });
// Milestone 20: post-launch support (takes a game lane while it runs).
let support = null;
support = createSupport({ bus, clock, world, business, projects, lanes: () => lanes(), isBusy: (id) => (projects.jobs.some((j) => j.slots.includes(id)) ? 'Making a game' : world.workerById(id)?.away ? 'Away on a course' : engineBusy(id)) });
const publishers = createPublishers({ bus, clock, world, business, projects, elements: { scopeOpen: (id) => elements.scopeOpen(id), isOpen: (id) => elements.isOpen(id) } }); // Milestone 17
contracts = createContracts({ bus, clock, world, business, engines: () => engines, isBusy: (id) => (projects.jobs.some((j) => j.slots.includes(id)) ? 'Making a game' : world.workerById(id)?.away ? 'Away on a course' : engines?.jobOf(id) ? 'Building the engine' : null) });
const lanes = () => stageById(world.stage).lanes;
// Milestone 21: global business (after the business, research, engines, recruitment and publishers).
const global = createGlobalBusiness({ bus, clock, world, business, projects, research, engines: () => engines, recruitment: () => recruitment, publishers: () => publishers, seed: () => business.marketing.seed });
let accountStore = null; // the storage adapter, once the saves are ready (the combo archive's account record)
const combos = createCombos({ bus, research, business, saveAccount: (data) => accountStore?.set(SAVE.accountKey, data).catch((e) => console.error('[DEVWORKS] account save failed', e)) }); // Milestone 15
clock.speedAllowed = (speed) => business.speedOpen(speed); // bible §4: 2× after the first release, 4× at Rank C / Year 4
// Open recipe elements (Milestone 6): rank and year open more; research (Milestone 12) the rest.
const elements = createElementUnlocks({ bus, state: () => ({ rankIndex: business.reputation.highestRankIndex, year: clock.year, researched: research.researched(), stage: world.stage }) }); // Milestone 11: stages; Milestone 12: research
bus.on('clock:month', () => started && elements.check());
bus.on('reputation:rankUp', () => started && elements.check());
let started = false; // after the save has loaded

// Sprites are cached at the screen's real pixel size: remake them when that changes.
assets.setPixelScale(renderer.pixelScale);
bus.on('renderer:resize', () => {
  assets.setPixelScale(renderer.pixelScale);
  debug.top = debugTop();
  if (router.currentName === 'studio') studio.resize();
});

// Pressed button look: any button under a finger that is down.
bus.on('input:down', (p) => setPressPoint(p, renderer.pixelScale));
bus.on('input:up', () => clearPress());
bus.on('input:dragstart', () => clearPress());

const onTestScreen = () => TEST_SCREENS.includes(router.currentName);
const loop = new FixedStepLoop({
  stepHz: 60,
  bus,
  update: (dt) => {
    if (started) {
      clock.update(dt);
      world.update(clock.paused ? 0 : dt * clock.speed);
      autosave.tick(dt);
      profile.addPlayTime(dt);
    }
    router.update(dt);
    dialog.update(dt);
    sheet.update(dt);
    feedback.height = renderer.height;
    feedback.update(dt);
    // Floating +Credits only over the studio with nothing on top; otherwise they wait (and old ones are dropped).
    floatFeed.update(dt, { hold: router.currentName !== 'studio' || sheet.active || feedback.active || studio.buildMode });
    vfx.height = renderer.height;
    vfx.update(dt);
    celebrate.height = renderer.height;
    celebrate.update(dt);
    if (started) devPops.update(dt, !clock.paused);
    if (tip && (tip.t += dt) > TIP_SEC) tip = null;
    if (beat && !feedback.active && (beat.age += dt) > DEV_POPS.phaseBannerSec) beat = null;
  },
  render: (alpha) => {
    const ctx = renderer.begin(COL.bg);
    router.render(ctx, alpha);
    if (router.currentName === 'studio') vfx.render(ctx, 'screen');
    sheet.render(ctx);
    dialog.render(ctx);
    if (tip) drawTip(ctx);
    if (beat && !feedback.active && router.currentName === 'studio' && !studio.buildMode) drawBeat(ctx);
    feedback.render(ctx);
    celebrate.render(ctx, 'screen'); // confetti over the big moments
    if (onTestScreen()) drawButton(ctx, pauseButton(), loop.paused ? 'RESUME' : 'PAUSE', { selected: loop.paused });
    if (loop.paused) drawPaused(ctx);
    // One FPS line at the top in the studio or under a sheet, so it hides nothing; the full box on the test screens.
    debug.compact = sheet.active || !onTestScreen();
    debug.render(ctx);
  },
});
// On the test screen the debug box sits between the asset test and the sheet button, whatever the height.
const debugTop = () => layout.safeRect.h - 600;
const debug = new DebugOverlay({ loop, renderer, layout, input, bus, top: debugTop(), maxLines: 3 });
bus.on('loop:pause', () => input.reset());
debug.log(`seeded rng check: ${rng.int(0, 9999)} (same every reload)`);

// ---------------------------------------------------------------------------
// Pause. The top bar's Pause / 1× / 2× / 4× run the game clock (P / Space too, on the world screens). The test
// screens keep their Milestone 0 button, which pauses the whole loop; while the loop is paused any tap resumes.
// Hiding the app pauses the loop (core).
const pauseButton = () => layout.anchor('top-right', 240, THEME.button.minH, 80);
// Big feedback (style guide §7): "Game finished!" pauses the game clock until it is tapped away.
let speedBeforeFeedback = null;
const feedback = new MajorFeedback({
  layout,
  width: W,
  height: renderer.height,
  pause: () => {
    if (speedBeforeFeedback === null) speedBeforeFeedback = clock.speed;
    clock.pause();
  },
});
// After a big moment: back to the speed from before it — unless another one is showing now (they queue).
function afterFeedback() {
  if (feedback.active) return;
  if (speedBeforeFeedback) clock.setSpeed(speedBeforeFeedback);
  speedBeforeFeedback = null;
}
router.modal = {
  get active() {
    return loop.paused || dialog.active || feedback.active;
  },
  onTap: (p) => (loop.paused ? loop.resume('tap') : dialog.active ? dialog.onTap(p) : feedback.onTap()),
  onDown: (p) => dialog.active && dialog.onDown?.(p),
  onUp: (p) => dialog.active && dialog.onUp?.(p),
  onBack: () => (loop.paused ? loop.resume('back') : dialog.active ? dialog.onBack() : feedback.acknowledge()),
};
window.addEventListener('keydown', (e) => {
  if (e.key !== 'p' && e.key !== 'P' && e.key !== ' ') return;
  if (textPrompt.active || feedback.active || dialog.active || MENU_SCREENS.includes(router.currentName)) return;
  if (WORLD_SCREENS.includes(router.currentName) && !loop.paused) clock.togglePause();
  else loop.togglePause();
});

function drawPaused(ctx) {
  const H = renderer.height;
  ctx.fillStyle = COL.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COL.chip;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 300, H / 2 - 90, 600, 220, THEME.panel.radius);
  ctx.fill();
  ctx.fillStyle = COL.textOnDark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(96, true);
  ctx.fillText('PAUSED', W / 2, H / 2);
  ctx.font = font(THEME.size.body);
  ctx.fillText('tap to resume', W / 2, H / 2 + 80);
}

// ---------------------------------------------------------------------------
// Sheets: one registry for station taps, the bars and Create's "Starter Desks". Opening one replaces the open one.
const makerId = STATIONS.find((s) => s.role === 'Maker').id;
const menus = createStudioMenus({
  world: () => world,
  open: (kind, target) => openMenu(kind, target),
  projects: () => projects,
  business: () => business,
  today: () => clock.totalDays,
  debugSkipYear: new URLSearchParams(window.location.search).has('debug') ? () => skipYear() : null,
  doRelease: (number, ids) => {
    sheet.close();
    const rec = business.release(number, ids);
    if (rec) debug.log(rec.release ? `released: ${rec.result.title} (review ${rec.release.score})` : `certifying: ${rec.result.title}`);
  },
  openScreen: (name) => router.go(name),
  toTitle: () => toTitle(),
  shop: () => shop,
  buyFacility: (id) => {
    const r = shop.buy(id);
    sheet.close();
    if (r.ok) beat = { entry: { title: `${r.station.def.name} built!`, body: 'Drag it where you want it. Done when finished.' }, age: 0 };
    else showTip(r.why);
  },
  sellFacility: (id) => {
    const r = shop.sell(id);
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
  upgradeStudio: () => {
    const r = shop.upgrade();
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
  buildMode: () => {
    sheet.close();
    router.go('studio');
    studio.setBuildMode(true);
  },
  runMarketing: (key, id) => {
    sheet.close();
    if (business.marketing.run(id, key)) debug.log(`marketing: ${id} for ${key}`);
  },
  newGame: () => router.go('newProject'),
  openProject: () => router.go('project'),
  openProjectById: (id) => router.go('project', { id }), // Milestone 13: two lanes
  lanes,
  recruitment: () => recruitment,
  training: () => training,
  hireCard: (cardId) => {
    const r = recruitment.hire(cardId);
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
  startCourse: (courseId, staffId) => {
    const r = training.start(courseId, staffId);
    sheet.close();
    if (!r.ok) showTip(r.reason);
  },
  engines: () => engines, // Milestone 16
  publishers: () => publishers, // Milestone 17
  contracts: () => contracts,
  sponsors: () => sponsors, // Milestone 18
  support: () => support, // Milestone 20
  global: () => global, // Milestone 21
  startSupport: (id, number, team, platform = null) => {
    const r = support.start(id, number, team, platform);
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
  newGameAs: (type) => {
    sheet.close();
    router.go('newProject');
    newProject.setType(type);
  },
  acceptContract: (id, team) => {
    const r = contracts.accept(id, team);
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
  startEngine: (kind, team) => {
    const r = engines.start(kind, team);
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
  debugSpawn: new URLSearchParams(window.location.search).has('debug') ? (id) => (recruitment.debugJoin(id) ? sheet.close() : showTip('Can\'t join: gated, or no room')) : null, // Milestone 14
  debugHire: new URLSearchParams(window.location.search).has('debug') ? () => (['PRG07', 'DSN07', 'ART07', 'WRT07', 'PRO07'].some((id) => recruitment.debugJoin(id)) ? sheet.close() : showTip('No room for an Elite')) : null,
  decide: (id) => decideNow(id),
  dateOf: (d) => clock.shortLabel(d),
  isUnlocked: (id) => elements.isOpen(id),
  lockReason: (id) => elements.reason(id),
  recipe: () => newProject.setup?.recipe ?? {},
  debugUnlockAll: new URLSearchParams(window.location.search).has('debug') ? () => elements.unlockAll() : null,
  picked: (family) => newProject.setup?.recipe[family] ?? null,
  onPick: (family, id) => {
    newProject.choose(family, id);
    sheet.close();
  },
});
// The Beta / Gold decision (Milestone 7): the clock stops and the sheet asks; the speed comes back after the choice.
let speedBeforeDecision = null;
function askDecision() {
  if (speedBeforeDecision === null && !clock.paused) speedBeforeDecision = clock.speed;
  clock.pause();
  openMenu('decision');
}
bus.on('project:decision', () => askDecision());
function decideNow(id) {
  sheet.close();
  const sp = speedBeforeDecision;
  speedBeforeDecision = null;
  if (sp) clock.setSpeed(sp); // first, so "Game finished!" (Ship at Gold) keeps the speed to come back to
  if (!projects.decide(id)) return;
  debug.log(`decision: ${id}`);
  if (projects.decision) askDecision(); // Cut / Outsource at Gold: still to ship
}
function openMenu(kind, target) {
  const build = menus.for(kind, target);
  if (build) sheet.open(build);
}
const shelfId = STATIONS.find((s) => s.showcase).id;
const openStaff = (id) => router.go('staff', { id });
// Tapping a station: the Starter Desks open the game in the works when there is one, the Showcase Shelf opens the
// Catalogue; otherwise the station's sheet.
const openStation = (id) => {
  if (id === makerId && projects.active) router.go('project');
  else if (id === shelfId) router.go('catalogue');
  else if (world.stationById(id)?.def.planner) router.go('marketing'); // the Marketing Wall (Milestone 9)
  else if (id === 'F09') openMenu('recruit'); // the Recruitment Desk (Milestone 13)
  else if (id === 'F15') router.go('awards'); // the Awards Cabinet (Milestone 19)
  else if (id === 'F26') router.go('publishingOffice'); // the Publishing Office (Milestone 21)
  else openMenu(id);
};
const textPrompt = new TextPrompt({ renderer });
bus.on('screen:change', () => textPrompt.close());
bus.on('renderer:resize', () => textPrompt.close());
bus.on('screen:change', () => sheet.close());

// Red attention badges (data/home.js BADGES), plus the ?debug=1 toggle that lights them all.
let debugBadges = false;
const BADGE_RULES = {
  lowCondition: () => world.workers.filter((w) => w.tiredIcon || w.staff.status.stressed).length,
  decision: () => (projects.decision ? '!' : 0),
};
const badgeFor = (id) => (debugBadges ? (id === 'inbox' ? 1 : '!') : BADGE_RULES[BADGES[id]]?.() || null);

// The bars (core/ui). The studio's top bar is the home one; the Roster and staff cards get a "‹ Back" in it.
const topBarOptions = {
  layout,
  assets,
  clock,
  stats: () => [
    { icon: TOP_ICONS.credits, text: business.credits.toLocaleString('en-GB'), color: business.inDebt ? COL.bad : COL.text },
    ...(business.tokens ? [{ icon: TOP_ICONS.tokens, text: String(business.tokens), gap: 20 }] : []), // Studio Tokens once there are any (Milestone 12: room for RP)
    { icon: 'dev_ui_19', iconSize: 44, text: String(Math.round(business.state.fanTrust)), gap: 10 }, // Fan Trust (Milestone 9)
    { icon: 'dev_reward_03', iconSize: 44, text: research.rp >= 10000 ? `${Math.floor(research.rp / 1000)}k` : String(research.rp), gap: 10 }, // RP (Milestone 12)
    { text: `Rank ${business.rank.id}`, gap: 10 },
  ],
  statsBad: () => business.inDebt, // Emergency Credit
  onStats: () => openMenu('business'),
  onLockedSpeed: (speed) => showTip(business.speedLockReason(speed)),
  onInbox: () => openMenu('inbox'),
  onHelp: () => openMenu('help'),
  inboxCount: () => badgeFor('inbox') ?? 0,
};
const topBar = createTopBar({ ...topBarOptions, home: true });
const subTopBar = createTopBar({ ...topBarOptions, home: false, back: { label: '‹ Back', onTap: () => router.back() } });
const bottomBar = createBottomBar({
  layout,
  assets,
  items: BOTTOM_SLOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon, badge: () => badgeFor(s.id) })),
  open: (id) => (id === 'staff' ? router.go('roster') : id === 'research' ? router.go('research') : openMenu(id)),
});

// The sheet is asked before the screen; a tap on the top bar still reaches it (Inbox / Help replace the sheet).
router.layers.push(
  {
    get active() {
      return onTestScreen();
    },
    handleInput: (hook, p) => {
      if (hook !== 'onTap' || !hitRect(p, pauseButton())) return false;
      loop.pause('button');
      return true;
    },
  },
  {
    get active() {
      return sheet.active;
    },
    handleInput: (hook, p) => (hook === 'onTap' && router.currentName === 'studio' && !studio.buildMode && topBar.contains(p) ? false : sheet.handleInput(hook, p)),
    onBack: () => sheet.onBack(),
  },
);

// Back (phone/browser Back, Esc, "‹ Back"): resume a paused loop, close the sheet, leave Build Mode, or go back a
// screen. Returns false at the studio with nothing open, so the next Back leaves the app.
let systemBack = null;
function back() {
  if (loop.paused) {
    loop.resume('back');
    return true;
  }
  return router.back();
}
systemBack = new SystemBack({ onBack: back });
bus.on('input:up', () => systemBack.rearm()); // re-arm after any tap, in case a Back at the studio let it go

// ---------------------------------------------------------------------------
// Saving: its own database; four campaign slots (Milestone 5b), each keeping its last 3 saves; saved on month ends,
// speed changes, moved stations, every 10 s of running time if anything changed, straight away when the app goes to
// the background, and on the way back to the Main Menu.
let slots = null; // core SaveSlots (slot i = keys[i]; Slot 1 is the old single save's key)
let slot = null; // the SaveSlot being played
let slotIndex = null;
let sessionUsed = false; // a slot has been opened since the page loaded: opening another one reloads first
let slotCards = SAVE.slots.map((_, index) => ({ index, summary: null, error: null }));
let lastSlot = null;
const INTENT_KEY = 'devworks:intent'; // sessionStorage: what to open straight after a reload
const saveData = () => ({ global: global.serialize(), support: support.serialize(), rivals: rivals.serialize(), awards: awards.serialize(), sponsors: sponsors.serialize(), publishers: publishers.serialize(), contracts: contracts.serialize(), engines: engines.serialize(), combos: combos.serialize(), staff: { recruit: recruitment.serialize(), training: training.serialize() }, research: research.serialize(), clock: clock.serialize(), world: world.serialize(), games: projects.serialize(), business: business.serialize(), elements: elements.serialize(), unlocked: elements.open(), studio: profile.serialize() });
const autosave = new Autosave({
  bus,
  triggers: SAVE.triggers,
  save: () => (slot && started ? slot.save(saveData()) : Promise.resolve(null)),
  stamp: () => `${clock.totalDays}|${world.stamp()}|${projects.active?.phaseProgress ?? '-'}|${projects.catalogue.count}|${business.economy.nextLine}`,
  running: () => started && !clock.paused,
  intervalMs: SAVE.intervalMs,
  enabled: () => started && !!slot,
});
autosave.installBackground();

async function prepareSaves() {
  const adapter = await createStorageAdapter({ dbName: SAVE.dbName, prefix: SAVE.localPrefix });
  accountStore = adapter;
  try {
    combos.loadAccount(await adapter.get(SAVE.accountKey)); // Milestone 15: combos found in any slot
  } catch (err) {
    console.error('[DEVWORKS] account record unreadable', err);
  }
  slots = new SaveSlots({ adapter, keys: SAVE.slots, metaKey: SAVE.metaKey, version: SAVE.version, migrations: { 1: migrateToV2 }, rolling: SAVE.rolling, bus });
  await refreshSlots();
}
// The slot cards: what each slot holds now (read fresh from storage).
async function refreshSlots() {
  const all = await slots.peekAll();
  slotCards = all.map((d, index) => ({ index, summary: d && !d.error ? slotSummary(d) : null, error: d?.error ?? null }));
  // Continue: the last slot played, else (a save from before 5b has no record of it) the most recently saved one.
  lastSlot = await slots.lastUsed();
  if (lastSlot == null || !slotCards[lastSlot]?.summary) {
    let best = null;
    slots.savedAt.forEach((t, i) => {
      if (t != null && slotCards[i].summary && (best == null || t > slots.savedAt[best])) best = i;
    });
    lastSlot = best;
  }
}
function reloadInto(intent) {
  try {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
  } catch {
    /* no sessionStorage: the player lands on the title screen instead */
  }
  window.location.reload();
}
function resume() {
  started = true;
  router.go('studio');
  if (projects.decision) askDecision(); // saved while a Beta / Gold decision was waiting (Milestone 7)
}

// Play a slot: the one already open carries on; another one after a slot was open reloads the page first.
async function playSlot(i) {
  if (sessionUsed && slotIndex === i && slot) return resume();
  if (sessionUsed) return reloadInto({ action: 'play', slot: i });
  const s = slots.slot(i);
  let data = null;
  try {
    data = await s.load();
  } catch (err) {
    console.error('[DEVWORKS] could not load slot', i + 1, err);
  }
  if (!data) {
    debug.log(`slot ${i + 1}: nothing to load`);
    await refreshSlots();
    router.go('title', { view: 'slots' });
    return;
  }
  world.load(data.world);
  projects.load(data.games); // a Milestone 2 save has none: nothing in the works, an empty catalogue
  business.load(data.business); // a Milestone 3 save has none: the books start now (starting Credits)
  profile.load(data.studio);
  research.load(data.research); // Milestone 12 (a save from before it: nothing researched)
  clock.load(data.clock); // the saved speed is checked against the unlocks just loaded
  elements.load(data.elements ?? data.unlocked); // after the rank and the date: anything already earned opens
  recruitment.load(data.staff?.recruit ?? null); // Milestone 13 (a save from before it: a fresh board, careers rebuilt)
  training.load(data.staff?.training ?? null);
  combos.load(data.combos ?? null); // Milestone 15 (a save from before it: nothing found in this run)
  engines.load(data.engines ?? null); // Milestone 16 (a save from before it: no engine)
  publishers.load(data.publishers ?? null); // Milestone 17 (a save from before it: this month's offers now)
  contracts.load(data.contracts ?? null);
  sponsors.load(data.sponsors ?? null); // Milestone 18
  rivals.load(data.rivals ?? null); // Milestone 19 (a save from before it: the rivals' past releases, no award results)
  awards.load(data.awards ?? null);
  support.load(data.support ?? null); // Milestone 20
  global.load(data.global ?? null); // Milestone 21
  combos.loadAccount(null); // (merges: anything this run found is known to the account too)
  checkStations(); // a studio already at Rank D gets its Marketing Wall (Milestone 9)
  slot = s;
  slotIndex = i;
  sessionUsed = true;
  await slots.setLastUsed(i);
  debug.log(`slot ${i + 1} loaded: day ${clock.totalDays}, ${world.workers.length} staff`);
  resume();
}

// START STUDIO: a new studio in an empty slot, with the founder's starting team at their stations.
async function startStudio(i, setup) {
  if (sessionUsed) return reloadInto({ action: 'new', slot: i, setup });
  const founder = founderById(setup.founder);
  world.newGame(founder.team.map(startStaffById));
  business.newGame({ seed: `${Date.now()}-${Math.floor(Math.random() * 1e9)}` }); // the run's platform market seed
  research.newGame();
  elements.newGame();
  recruitment.newGame(); // Milestone 13: the first board (Start Candidates) and everyone's career
  training.newGame();
  combos.newRun(); // Milestone 15: the account's archive stays
  engines.newGame(); // Milestone 16
  publishers.newGame(); // Milestone 17: the first offers
  contracts.newGame();
  sponsors.newGame(); // Milestone 18
  rivals.newGame(); // Milestone 19
  awards.newGame();
  support.newGame(); // Milestone 20
  global.newGame(); // Milestone 21
  profile.create(setup);
  slot = slots.slot(i);
  slotIndex = i;
  sessionUsed = true;
  started = true;
  await slot.save(saveData());
  await slots.setLastUsed(i);
  debug.log(`new studio in slot ${i + 1}: ${setup.studio}, founder ${founder.id}`);
  router.go('studio');
}

// Main Menu (Business sheet): save, stop the clock, show the title screen.
async function toTitle() {
  sheet.close();
  if (slot && started) {
    try {
      await slot.save(saveData());
    } catch (err) {
      console.error('[DEVWORKS] save before the Main Menu failed', err);
    }
  }
  started = false;
  await refreshSlots();
  router.go('title');
}

function deleteSlot(i) {
  const name = slotCards[i]?.summary?.studio;
  dialog.confirm({
    title: `Delete Slot ${i + 1}?`,
    body: name ? `"${name}" will be gone for good. This can't be undone.` : 'This save will be gone for good.',
    yes: 'Delete',
    danger: true,
    onYes: async () => {
      await slots.remove(i);
      if (slotIndex === i) {
        slot = null; // the open studio is gone: nothing saves into this slot again
        slotIndex = null;
      }
      debug.log(`slot ${i + 1} deleted`);
      await refreshSlots();
    },
  });
}

async function newGameFromMenu() {
  const i = slotCards.findIndex((c) => !c.summary && !c.error);
  if (i < 0) titleScreen.showSlots('All 4 slots are full. Delete one to start a new studio.');
  else router.go('setup', { slot: i });
}

const titleScreen = createTitleScreen({
  layout,
  assets,
  slots: () => slotCards,
  last: () => lastSlot,
  onContinue: (i) => playSlot(i),
  onPlay: (i) => playSlot(i),
  onNewGame: () => newGameFromMenu(),
  onNewInSlot: (i) => router.go('setup', { slot: i }),
  onDelete: (i) => deleteSlot(i),
  onSettings: () => sheet.open({ title: 'Settings', subtitle: 'Sound, text size and other options will live here.', accent: COL.progress }),
});
const setupScreen = createSetupScreen({ layout, assets, textPrompt, onBack: () => router.go('title', { view: 'slots' }), onStart: (i, setup) => startStudio(i, setup) });

// ---------------------------------------------------------------------------
// Boot screen: shows while the images and the save load, then hands over to the studio (or the test screen).
const bootScreen = {
  progress: 0,
  enter() {
    this.progress = 0;
    Promise.all([
      // Milestone 17 fix: at most 48 images at a time (500+ at once through the service worker could leave one request
      // hanging on a reload), and the boot carries on after 45 s at the latest — a picture still on its way pops in when
      // it arrives (core AssetManager).
      Promise.race([
        assets.loadImages(ASSETS, (done, total) => (this.progress = done / total), { concurrency: 48 }).then((r) => debug.log(`assets: ${r.loaded} loaded, ${r.missing.length} missing`)),
        new Promise((r) => setTimeout(() => (debug.log('assets: still loading after 45 s, starting anyway'), r()), 45000)),
      ]),
      prepareSaves().catch((err) => console.error('[DEVWORKS] saves unavailable', err)),
    ]).then(() => {
      // Straight after a reload for another slot: open it; otherwise the title screen (or ?screen=test).
      let intent = null;
      try {
        intent = JSON.parse(sessionStorage.getItem(INTENT_KEY) ?? 'null');
        sessionStorage.removeItem(INTENT_KEY);
      } catch {
        intent = null;
      }
      if (START_SCREEN === 'title' && slots && intent?.action === 'play') playSlot(intent.slot);
      else if (START_SCREEN === 'title' && slots && intent?.action === 'new') startStudio(intent.slot, intent.setup);
      else router.go(START_SCREEN);
    });
  },
  render(ctx) {
    const H = renderer.height;
    ctx.fillStyle = COL.text;
    ctx.font = font(THEME.size.major, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEVWORKS', W / 2, H / 2 - 60);
    ctx.fillStyle = COL.track;
    ctx.fillRect(W / 2 - 300, H / 2 + 20, 600, 24);
    ctx.fillStyle = COL.progress;
    ctx.fillRect(W / 2 - 300, H / 2 + 20, 600 * this.progress, 24);
  },
};

// Effects (core/VfxSystem, pooled): the studio's art pops ('world', under its camera) and floating +Credits
// ('screen'); celebrate = the confetti drawn over the big moments.
const vfx = new VfxSystem({ assets, width: W, height: renderer.height, font: THEME.family });
const celebrate = new VfxSystem({ assets, width: W, height: renderer.height, font: THEME.family, maxTexts: 2, maxEffects: 8 });
// The Showcase Shelf shows the released games, newest first.
const shipped = () => projects.catalogue.list().filter((r) => r.release).reverse();
const studio = createStudioScreen({
  renderer,
  layout,
  assets,
  bus,
  world,
  sheet,
  openStation,
  openStaff,
  projectView: () => projects.view(),
  showcase: shipped,
  vfx,
  isRunning: () => started && !clock.paused && !loop.paused,
  topBar,
  bottomBar,
  debug: log,
  sign: () => (profile.data ? { name: profile.name, colour: profile.colour } : null),
  openShop: () => openMenu('shop'), // Milestone 11
  openFacility: (id) => openMenu('facility', id),
});
// A new studio stage (Milestone 11): the big moment with the stage's picture; new scopes open.
bus.on('studio:stage', ({ stage }) => {
  debug.log(`studio stage ${stage.id}: ${stage.name}`);
  elements.check();
  feedback.show({
    title: `Welcome to the ${stage.name}!`,
    subtitle: `A bigger floor (${stage.cols} × ${stage.rows}), room for ${stage.staffCap} staff and ${stage.lanes} game lanes. Everything stayed where it was.`,
    accent: COL.good,
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const s = Math.min(1, t / 0.35);
      const size = 560 * (0.6 + 0.4 * s);
      ctx.save();
      ctx.globalAlpha = s;
      if (stage.shell) assets.drawContained(ctx, stage.shell, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.3 - size / 2, w: size, h: size });
      ctx.restore();
    },
    onAck: afterFeedback,
  });
});
// Development made visible: the art pops while a game is made (only while the studio is on screen, nothing on top).
const devPops = createDevPops({
  bus,
  world,
  projects,
  vfx,
  studio,
  isVisible: () => router.currentName === 'studio' && !feedback.active && !studio.buildMode && !loop.paused,
});

// A milestone done (medium feedback, style guide §7): a short banner under the top bar that goes by itself, and a
// sparkle over the Starter Desks. The last one is "Game finished!" (big), so it has no banner.
let beat = null; // { entry: { title, body }, age }
bus.on('project:phase', ({ job, phase }) => {
  const next = projects.phases[job.phaseIndex + 1];
  if (!next) return;
  beat = { entry: { title: `${phase.name} done!`, body: `${job.name} · next: ${next.name}` }, age: 0 };
  if (router.currentName !== 'studio') return;
  const at = studio.popPoint(world.stationById(makerId));
  vfx.sparks('world', at.x, at.y, { count: 14, speedMin: 160, speedMax: 380, spread: 3.2 });
  vfx.pulse('world', at.x, at.y + 40, { rx: 120, ry: 60, color: COL.good, life: 0.8, grow: 1.8, width: 8 });
});
// New elements opened (rank-up, a new year…): the same short banner.
bus.on('elements:unlocked', ({ ids }) => {
  const names = ids.map((id) => elementById(id)?.name).filter(Boolean);
  const body = names.length > 4 ? `${names.slice(0, 4).join(', ')} and ${names.length - 4} more` : names.join(', ');
  beat = { entry: { title: names.length === 1 ? 'New game element!' : 'New game elements!', body }, age: 0 };
  debug.log(`elements opened: ${ids.join(' ')}`);
});
function drawBeat(ctx) {
  const t = topBar.rect();
  const sr = layout.safeRect;
  drawToasts(ctx, [beat], {
    x: sr.x + 24,
    y: t.y + t.h + (tip ? 120 : 20),
    w: sr.w - 48,
    life: DEV_POPS.phaseBannerSec,
    accent: () => COL.good,
    drawIcon: (c, e, r) => assets.drawContained(c, 'dev_ui_07', r),
  });
}
const newProject = createNewProjectScreen({
  layout,
  assets,
  world,
  topBar: subTopBar,
  textPrompt,
  openPicker: (family) => openMenu(`pick:${family}`),
  scopeOpen: (id) => elements.scopeOpen(id),
  scopeReason: (id) => elements.scopeReason(id),
  estimate: (team, scope, type, localised) => projects.estimate(team, scope, type, localised),
  franchises: business.franchises, // Milestone 10: project types
  // Milestone 13: nobody on two games or on a course; the missing-role hints; the lanes.
  unavailable: (id) => {
    const job = projects.jobs.find((j) => j.slots.includes(id));
    return job ? `Making ${job.name}` : training.trainingOf(id) ? 'Away on a course' : engineBusy(id);
  },
  hints: (team, scope) => recruitment.hints(team, scope),
  onFindRole: (role) => {
    recruitment.surface(role);
    openMenu('recruit');
  },
  laneWhy: () => (projects.jobs.length >= lanes() ? 'a free game lane' : null),
  engineChoices: (tech) => engines.choices(tech), // Milestone 16
  deals: () => publishers.signed().map((d) => ({ id: d.id, scope: d.scope, short: publishers.publisherName(d.publisher), label: `${publishers.publisherName(d.publisher)}${d.global ? ' Global' : ''} deal`, terms: dealTerms(d), global: d.global ? publishers.publisherName(d.publisher) : null })), // Milestone 17 (Milestone 21: Global deals)
  localisationWhy: () => global.localisationWhy(), // Milestone 21
  localisationLine: (mode) => localisationLine(mode),
  dealWhy: (id, setup) => publishers.setupWhy(id, setup),
  ipWhy: (setup) => publishers.ipWhy(setup),
  audioCost: (id) => Math.round((PROJECT_BALANCE.audio[id]?.cost ?? 0) * (1 + world.effect(`audioCostPct.${id}`) / 100)), // Milestone 18
  engineEffects: (versionId, tech) => engines.forGame(versionId, tech)?.fx ?? null,
  comboHints: (recipe) => combos.hints(recipe), // Milestone 15
  combosIn: (recipe) => combosFor(recipe).filter((id) => combos.known(id)).map((id) => comboById(id).name),
  dateLabel: (d) => clock.shortLabel(d),
  today: () => clock.totalDays,
  costPerDay: (scope, focus, type, localise) => Math.round(PROJECT_BALANCE.scopes[scope].baseCostPerDay * (1 + (PROJECT_BALANCE.budgetFocus[focus]?.costPct ?? 0) / 100) * (FRANCHISE_BALANCE.types[type]?.costMult ?? 1) * (localise === 'on' ? 1 + localisationCostPct() / 100 : 1)),
  onStart: (setup) => {
    projects.start(setup, studioRng);
    debug.log(`project started: ${setup.title}`);
    router.go('studio');
  },
});
const projectScreen = createProjectScreen({ layout, assets, world, projects, topBar: subTopBar, dateLabel: (d) => clock.shortLabel(d), openDecision: () => askDecision() });

// A finished game: the big result (pauses until tapped); the game itself is already in the catalogue.
bus.on('project:complete', ({ record }) => {
  const g = record.result;
  beat = null; // the big moment takes over from any milestone banner
  debug.log(`game finished: ${g.title}`);
  const scope = SCOPES.find((x) => x.id === g.scope)?.name ?? '';
  feedback.show({
    title: 'Game finished!',
    subtitle: `${g.title} · ${scope} game in ${record.days} days${g.deadlineDay == null ? '' : g.lateDays ? ` (${g.lateDays} days late)` : ' (on time)'} · ${g.bugs} bug${g.bugs === 1 ? '' : 's'} left`,
    accent: COL.good,
    drawFn: (ctx, t) => drawFinished(ctx, t, g),
    onAck: () => {
      afterFeedback();
      if (comboBeat) [beat, comboBeat] = [comboBeat, null]; // Milestone 15: the combo banner after the big moment
      if (router.currentName === 'project') router.go('studio');
      openMenu('release', record.number); // Milestone 4: straight on to releasing it
    },
  });
});

// Stations that open with the rank (Milestone 9: the Marketing Wall at Rank D) are placed by themselves.
function checkStations() {
  for (const st of openStations(world, business.reputation.highestRankIndex)) {
    beat = { entry: { title: `New station: ${st.def.name}!`, body: 'Tap it to plan your marketing.' }, age: 0 };
    debug.log(`station opened: ${st.id}`);
  }
}
bus.on('reputation:rankUp', () => started && checkStations());
// A franchise reaches a higher status (Milestone 10): a short banner (Legendary gets the big moment).
bus.on('franchise:status', ({ ip, status }) => {
  if (status.id === 'legendary') return;
  beat = { entry: { title: `${ip.name} is now ${status.name}!`, body: 'Your franchise is growing. See it in Catalogue → Franchises.' }, age: 0 };
});
bus.on('franchise:legendary', ({ ip }) => {
  debug.log(`legendary franchise: ${ip.name}`);
  feedback.show({ title: 'Legendary franchise!', subtitle: `${ip.name} has become Legendary.`, accent: COL.gold, drawFn: (ctx, t) => drawCrown(ctx, t), onAck: afterFeedback });
});
function drawCrown(ctx, t) {
  const sr = layout.safeRect;
  const s = Math.min(1, t / 0.35);
  const size = 380 * (0.6 + 0.4 * s);
  ctx.save();
  ctx.globalAlpha = s;
  assets.drawContained(ctx, 'dev_reward_08', { x: W / 2 - size / 2, y: sr.y + sr.h * 0.33 - size / 2, w: size, h: size });
  ctx.restore();
}
// A topic researched (Milestone 12): what it opened, and the element pickers / shop see it at once.
bus.on('research:complete', ({ node, fired }) => {
  elements.check();
  const names = (fired ?? []).map((a) => (a.type === 'element' ? elementName(a.id)?.name : facilityById(a.id)?.name)).filter(Boolean);
  beat = { entry: { title: `Research done: ${node.name}`, body: names.length ? `Opens ${names.join(', ')}` : 'The studio knows more now.' }, age: 0 };
  debug.log(`research done: ${node.id}`);
});
// A combo found in a finished game (Milestone 15): a short banner (RP the first time in this run).
// It comes with "Game finished!", so it waits until that is tapped away (comboBeat).
let comboBeat = null;
bus.on('combo:found', ({ combo, firstInRun, rp }) => {
  if (!firstInRun) return;
  comboBeat = { entry: { title: `Combo discovered: ${combo.name}!`, body: `+${rp} RP · see it in Research → Discoveries` }, age: 0 };
  debug.log(`combo: ${combo.id}`);
});
// Publisher and contract banners (Milestone 17).
bus.on('deal:signed', ({ deal }) => {
  beat = { entry: { title: `Deal signed: ${publishers.publisherName(deal.publisher)}`, body: `+${deal.advance.toLocaleString('en-GB')} Credits advance · pick it on your next New Game` }, age: 0 };
});
bus.on('deal:missed', ({ deal, milestone, penalty }) => {
  beat = { entry: { title: `Missed milestone: ${milestone.name}`, body: `${publishers.publisherName(deal.publisher)} charges ${penalty.toLocaleString('en-GB')} Credits` }, age: 0 };
});
bus.on('deal:lapsed', ({ deal, repaid }) => {
  beat = { entry: { title: `Deal lapsed: ${publishers.publisherName(deal.publisher)}`, body: `No game started in time: ${repaid.toLocaleString('en-GB')} Credits paid back` }, age: 0 };
});
bus.on('contract:success', ({ contract }) => {
  beat = { entry: { title: `Contract done for ${contract.client}`, body: `+${contract.pay.toLocaleString('en-GB')} Credits` }, age: 0 };
});
bus.on('contract:failed', ({ contract, reason }) => {
  beat = { entry: { title: `Contract ${reason === 'cancelled' ? 'dropped' : 'missed'}: ${contract.client}`, body: 'No pay.' }, age: 0 };
});
// Awards (Milestone 19): a win is a big moment with its trophy, and it hands out the award's extra; a place is a banner.
bus.on('award:result', ({ award, result }) => {
  if (result.winner === 'player' || !result.playerPlace) return;
  beat = { entry: { title: `${award.name}: #${result.playerPlace}`, body: `${result.entrants[0].name} won with "${result.entrants[0].title}"` }, age: 0 };
});
bus.on('award:won', ({ award, result }) => {
  if (award.extra === 'rp') research.system.addRp(award.rp, `Award: ${award.name}`, clock.totalDays);
  if (award.extra === 'agencyRefresh') recruitment.refreshWith('ad', 'agency');
  if (award.extra === 'moreOffers') publishers.extraOffer();
  if (award.extra === 'eliteArrival') {
    const elite = ALL_STAFF.find((d) => d.tier === 'elite' && !world.staffSystem.get(d.id) && !recruitment.eligibilityWhy(d));
    if (elite) recruitment.specialArrival(elite.id, `Interested after your ${award.name} win`);
  }
  if (award.extra === 'ending') bus.emit('ending:year20', { award, result }); // the Year-20 ending (a later milestone)
  feedback.show({
    title: `${award.name}!`,
    subtitle: `"${result.entrants[0].title}" won. +${award.fame.toLocaleString('en-GB')} Fame · ${award.rewardText}`,
    accent: COL.gold,
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const s = Math.min(1, t / 0.35);
      const size = 420 * (0.6 + 0.4 * s);
      ctx.save();
      ctx.globalAlpha = s;
      assets.drawContained(ctx, award.trophy, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.33 - size / 2, w: size, h: size });
      ctx.restore();
    },
    onAck: afterFeedback,
  });
});
// Post-launch banners (Milestone 20).
bus.on('support:done', ({ job, record, effects }) => {
  if (!job) return (beat = { entry: { title: `${record.result.title}: support ended`, body: 'Moved on.' }, age: 0 });
  const o = SUPPORT_OPTION_BY_ID(job.option);
  const bits = [effects.bugsFixed ? `${effects.bugsFixed} bugs fixed` : null, effects.playerScore ? `player score +${effects.playerScore}` : null, effects.trust ? `Fan Trust +${Math.round(effects.trust)}` : null, effects.tailPct ? `tail +${effects.tailPct}%` : null, effects.addonRevenue ? `add-on: ${effects.addonRevenue.toLocaleString('en-GB')} Credits over time` : null, effects.port?.ok ? `launches ${clock.shortLabel(effects.port.launchDay)}` : null].filter(Boolean);
  beat = { entry: { title: `${o.name} done: ${record.result.title}`, body: bits.join(' · ') || 'Done.' }, age: 0 };
});
// Global business banners (Milestone 21).
bus.on('licence:signed', ({ licence }) => {
  beat = { entry: { title: `Engine licensed to ${licence.customer}`, body: `${licence.label}: fees every month for a year` }, age: 0 };
});
bus.on('external:released', ({ project }) => {
  beat = { entry: { title: `${project.studio}'s game is out: review ${project.result.review}`, body: `Your share: ${project.result.share.toLocaleString('en-GB')} Credits over the next months` }, age: 0 };
});
bus.on('acquisition:offered', ({ target }) => {
  beat = { entry: { title: `${target.studio} is for sale`, body: 'See Business → Acquisitions.' }, age: 0 };
});
bus.on('acquisition:done', ({ target }) => {
  beat = { entry: { title: `You bought ${target.studio}!`, body: target.line }, age: 0 };
});
// Sponsor banners (Milestone 18).
bus.on('sponsor:signed', ({ deal }) => {
  beat = { entry: { title: `Sponsor signed: ${sponsorName(deal.id)}`, body: 'A stipend every month for 6 months. See its obligation in Business → Sponsors.' }, age: 0 };
});
bus.on('sponsor:ended', ({ deal, met, bonus, tier }) => {
  beat = { entry: { title: `${sponsorName(deal.id)}: deal ${met ? 'completed' : 'ended'}`, body: met ? `+${bonus.toLocaleString('en-GB')} Credits bonus · now ${tier.name}` : 'Obligation not met: no bonus this time.' }, age: 0 };
});
// Engine banners (Milestone 16).
bus.on('engine:start', ({ job }) => {
  beat = { entry: { title: `Engine project started`, body: job.name }, age: 0 };
});
bus.on('engine:complete', ({ job, version, kind }) => {
  beat = { entry: { title: version ? `${job.data.name} ${version.label} ready!` : `${job.name} done`, body: version ? 'Pick it on New Game → Engine.' : kind === 'researchPrototype' ? 'Research points gained.' : '' }, age: 0 };
});
// A marketing action starts: a short banner.
bus.on('marketing:run', ({ action, gain, title }) => {
  beat = { entry: { title: `${action.name} started`, body: `${title}: +${Math.round(gain)} Hype over ${action.days} days` }, age: 0 };
});

// Released: the launch rocket takes off through confetti, then the four reviews come in one by one (big feedback:
// waits until they are all shown, then a tap).
const REVEAL = { first: 1.4, each: 0.6 };
const LAUNCH_SEC = 1.3; // the rocket's flight
bus.on('game:released', ({ record }) => {
  const r = record.release;
  feedback.show({
    title: 'Reviews are in!',
    subtitle: `${record.result.title} · review score ${r.score} · on sale now on ${(r.platforms ?? [r.platform]).map((id) => platformById(id)?.name).join(', ')}${r.hype ? ` · Hype ${Math.round(r.hype)}, fans expected ${Math.round(r.fanExpectation)}` : ''}${r.trust ? ` · Fan Trust ${r.trust.total >= 0 ? '+' : '−'}${Math.abs(Math.round(r.trust.total))}` : ''}${r.clash ? ` · launch week hit by "${r.clash.title}"` : ''}`,
    accent: COL.gold,
    minShowSec: REVEAL.first + REVEAL.each * r.reviews.length + 0.3,
    onShow: () => {
      const H = renderer.height;
      celebrate.confetti('screen', W / 2, H * 0.72, { count: 40, speed: 900, spreadX: 120 });
      celebrate.confetti('screen', W * 0.15, H * 0.8, { count: 22, speed: 760 });
      celebrate.confetti('screen', W * 0.85, H * 0.8, { count: 22, speed: 760 });
    },
    drawFn: (ctx, t) => {
      drawReviews(ctx, t, record);
      if (t < LAUNCH_SEC) drawRocket(ctx, t / LAUNCH_SEC);
    },
    onAck: afterFeedback,
  });
});

// The launch rocket (dev_vfx_08) rises from the bottom through the card, with a puffy trail.
function drawRocket(ctx, k) {
  const H = renderer.height;
  const e = k * k * (3 - 2 * k); // ease in-out
  const w = 200;
  const h = w / assets.aspect('dev_vfx_08');
  const x = W / 2 + Math.sin(k * Math.PI) * 60;
  const y = H + h - e * (H + h * 2.2);
  ctx.save();
  ctx.globalAlpha = Math.min(1, (1 - k) / 0.15);
  for (let i = 1; i <= 6; i++) {
    const r = 26 + i * 9;
    ctx.fillStyle = `rgba(214,200,178,${0.85 - i * 0.11})`; // warm grey smoke, visible on the cream card
    ctx.beginPath();
    ctx.arc(x - Math.sin(k * Math.PI) * i * 8, y + h * 0.42 + i * 46, r, 0, Math.PI * 2);
    ctx.fill();
  }
  assets.draw(ctx, 'dev_vfx_08', x - w / 2, y - h / 2, w, h);
  ctx.restore();
}
// A new rank (big feedback).
bus.on('reputation:rankUp', ({ rank }) => {
  debug.log(`rank up: ${rank.id}`);
  feedback.show({
    title: `Rank ${rank.id}!`,
    subtitle: `Your studio has reached Rank ${rank.id}. It never drops back.`,
    accent: COL.progress,
    drawFn: (ctx, t) => drawRankBadge(ctx, t, rank.id),
    onAck: afterFeedback,
  });
});

// Daily sales float up over the Starter Desks as +Credits (small feedback, never piled up: core FloatFeed).
const floatFeed = new FloatFeed({
  vfx,
  where: (source, lane) => {
    const p = studio.screenPointOf(makerId);
    return { x: p.x, y: p.y - 330 * studio.camera.zoom - lane * 60 }; // over the progress card
  },
  fallback: (lane) => ({ x: W / 2, y: layout.safeRect.y + 420 + lane * 60 }),
});
// Big sales days (data/studio.js BIG_SALES) also get the money burst over the desks, when the studio is in view.
const bestDay = new Map(); // catalogue number → best day's Credits so far (this session)
let burstAgo = -Infinity; // vfx time of the last burst
bus.on('sales:day', ({ record, revenue }) => {
  floatFeed.push({ key: 'credits', amount: revenue, label: (a) => `+${a.toLocaleString('en-GB')}`, icon: TOP_ICONS.credits, color: '#B87A00', size: 40 });
  const best = Math.max(bestDay.get(record.number) ?? 0, revenue);
  bestDay.set(record.number, best);
  const big = revenue >= BIG_SALES.minCredits && revenue >= best * BIG_SALES.shareOfBest;
  const seen = router.currentName === 'studio' && !sheet.active && !feedback.active && !studio.buildMode;
  if (!big || !seen || vfx.time - burstAgo < BIG_SALES.gap) return;
  burstAgo = vfx.time;
  const p = studio.screenPointOf(makerId);
  vfx.sprite('screen', 'dev_vfx_06', p.x, p.y - 120, { size: BIG_SALES.size, life: BIG_SALES.life, from: 0.3, to: 1, rise: 70, hold: 0.4 });
  debug.log(`big sales day: ${record.result.title} +${revenue}`);
});

// A short line under the top bar (why a speed is locked).
const TIP_SEC = 2.8;
let tip = null;
const showTip = (text) => text && (tip = { text, t: 0 });
function drawTip(ctx) {
  const t = topBar.rect();
  const a = Math.min(1, tip.t / 0.2, (TIP_SEC - tip.t) / 0.4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);
  ctx.font = font(THEME.size.body, true);
  const w = Math.min(ctx.measureText(tip.text).width + 60, layout.safeRect.w - 40);
  const x = W / 2 - w / 2;
  const y = t.y + t.h + 20;
  ctx.fillStyle = COL.chip;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 84, 42);
  ctx.fill();
  ctx.fillStyle = COL.textOnDark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tip.text, W / 2, y + 43, w - 40);
  ctx.restore();
}

// The review reveal card: cover, then each outlet pops in with its stars, score and line; the average last.
function drawReviews(ctx, t, record) {
  const g = record.result;
  const r = record.release;
  const sr = layout.safeRect;
  const w = Math.min(sr.w - 48, 1000);
  const x = sr.x + (sr.w - w) / 2;
  const y = sr.y + 40;
  const rowH = 190;
  const h = 250 + r.reviews.length * rowH + 30;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 0.25);
  ctx.fillStyle = COL.panel;
  ctx.strokeStyle = COL.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 32);
  ctx.fill();
  ctx.stroke();
  drawCover(ctx, assets, g.cover, g.title, { x: x + 32, y: y + 28, w: 136, h: 196 });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.text;
  ctx.font = font(THEME.size.title, true);
  ctx.fillText(g.title, x + 196, y + 80, w - 230);
  const allIn = t >= REVEAL.first + REVEAL.each * r.reviews.length;
  ctx.fillStyle = allIn ? COL.actionDark : COL.textMuted;
  ctx.font = font(allIn ? THEME.size.heading : THEME.size.body, true);
  ctx.fillText(allIn ? `Review score: ${r.score}` : 'The reviews are coming in…', x + 196, y + 170, w - 230);
  ctx.globalAlpha = 1;
  r.reviews.forEach((o, i) => {
    const t0 = t - (REVEAL.first + REVEAL.each * i);
    if (t0 < 0) return;
    const ry = y + 250 + i * rowH;
    const pop = Math.min(1, t0 / 0.25);
    ctx.globalAlpha = pop;
    ctx.fillStyle = COL.panelAlt;
    ctx.beginPath();
    ctx.roundRect(x + 24, ry, w - 48, rowH - 16, 24);
    ctx.fill();
    const s = 0.5 + 0.5 * pop + 0.12 * Math.sin(Math.min(1, t0 / 0.35) * Math.PI);
    const sw = 150 * s;
    const sh = sw * (260 / 451);
    assets.draw(ctx, 'dev_vfx_07', x + 110 - sw / 2, ry + 58 - sh / 2, sw, sh);
    ctx.fillStyle = o.score >= 70 ? COL.good : o.score >= 45 ? COL.text : COL.bad;
    ctx.font = font(64, true);
    ctx.textAlign = 'center';
    ctx.fillText(String(o.score), x + 110, ry + 130);
    ctx.textAlign = 'left';
    ctx.fillStyle = COL.text;
    ctx.font = font(THEME.size.heading, true);
    ctx.fillText(o.name, x + 210, ry + 50, w - 260);
    ctx.fillStyle = COL.textMuted;
    ctx.font = font(30);
    ctx.fillText(`"${o.line}"`, x + 210, ry + 112, w - 260);
  });
  ctx.restore();
}

function drawRankBadge(ctx, t, id) {
  const sr = layout.safeRect;
  const cx = W / 2;
  const cy = sr.y + sr.h * 0.33;
  const s = Math.min(1, t / 0.35);
  const r = 190 * (0.6 + 0.4 * s) + 10 * Math.sin(t * 3);
  ctx.save();
  ctx.globalAlpha = s;
  ctx.fillStyle = COL.progress;
  ctx.strokeStyle = COL.outline;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COL.textOnDark;
  ctx.font = font(r * 1.1, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, cx, cy + r * 0.06);
  ctx.restore();
}

// The result card over the dimmed game (Milestone 5): the cover big, popping in on a glow, with the title drawn by
// code; under it the six recipe icons, then the output stats and bugs. The cover takes the height that is left
// above the banner, so it fits every screen shape.
const FIN = { pad: 32, iconMax: 130, rowH: 50, bannerRoom: 400 };
function drawFinished(ctx, t, g) {
  const sr = layout.safeRect;
  const w = Math.min(sr.w - 48, 1000);
  const x = sr.x + (sr.w - w) / 2;
  const y = sr.y + 24 - Math.max(0, 1 - t / 0.3) ** 2 * 60;
  const icon = Math.min(FIN.iconMax, (w - FIN.pad * 2 - 5 * 12) / 6);
  const outputsH = 8 * FIN.rowH;
  const fixed = FIN.pad + 24 + 56 + icon + 24 + outputsH + FIN.pad;
  const cardH = sr.y + sr.h - FIN.bannerRoom - y;
  const coverH = Math.max(320, Math.min(700, cardH - fixed));
  const coverW = coverH * (336 / 483);
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 0.25);
  ctx.fillStyle = COL.panel;
  ctx.strokeStyle = COL.good;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, fixed + coverH, 32);
  ctx.fill();
  ctx.stroke();
  // The cover: a soft gold glow behind, then a pop (overshoot) from small to full size.
  const cx = x + w / 2;
  const cy = y + FIN.pad + coverH / 2;
  const glow = ctx.createRadialGradient(cx, cy, coverH * 0.2, cx, cy, coverH * 0.75);
  glow.addColorStop(0, 'rgba(255,209,102,0.55)');
  glow.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x + 6, y + 6, w - 12, coverH + FIN.pad * 2);
  const k = Math.min(1, t / 0.4);
  const s = 0.6 + 0.4 * (1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2);
  drawCover(ctx, assets, g.cover, g.title, { x: cx - (coverW * s) / 2, y: cy - (coverH * s) / 2, w: coverW * s, h: coverH * s });
  let yy = y + FIN.pad + coverH + 24;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COL.text;
  ctx.font = font(THEME.size.heading, true);
  ctx.fillText('Recipe', x + 40, yy);
  yy += 56;
  const rowW = 6 * icon + 5 * 12;
  FAMILIES.forEach((f, i) => {
    const el = elementById(g.recipe[f.id]);
    const r = { x: cx - rowW / 2 + i * (icon + 12), y: yy, w: icon, h: icon };
    ctx.fillStyle = COL.panelAlt;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 20);
    ctx.fill();
    if (el) assets.drawContained(ctx, el.art, { x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16 });
  });
  yy += icon + 24;
  drawOutputs(ctx, g.outputs, g.bugs, x + 40, yy, w - 80, { rowH: FIN.rowH });
  ctx.restore();
}
const roster = createRosterScreen({ renderer, layout, assets, world, topBar: subTopBar, openStaff, onHire: () => openMenu('recruit') });
// The staff card's actions (Milestone 13): Train, Mentor (Elite and up), Let go (asks first).
function staffActions(id) {
  const s = world.staffSystem.get(id);
  if (!s) return [];
  const t = training.trainingOf(id);
  const letWhy = recruitment.letGoWhy(id);
  return [
    { id: 'train', label: t ? `Training (${training.daysLeft(id)}d)` : 'Train', onTap: () => openMenu('train', id) },
    ...(training.canMentor(s) ? [{ id: 'mentor', label: training.pairOfMentor(id) ? 'Mentoring' : 'Mentor', accent: COL.purple, onTap: () => openMenu('mentor', id) }] : []),
    { id: 'letGo', label: 'Let go', accent: COL.bad, disabled: !!letWhy, sub: letWhy ? `Let go: ${letWhy.charAt(0).toLowerCase()}${letWhy.slice(1)}.` : null, onTap: () => confirmLetGo(id) },
  ];
}
function confirmLetGo(id) {
  const s = world.staffSystem.get(id);
  if (!s) return;
  dialog.confirm({
    title: `Let ${s.name} go?`,
    body: profile.isFounder(id) ? `${s.name} founded this studio. Their Founding Developer run of continuous employment ends here.` : `${s.name} leaves the studio. They may turn up on the recruitment board again one day.`,
    yes: 'Let go',
    danger: true,
    onYes: () => {
      const r = recruitment.letGo(id);
      if (!r.ok) return showTip(r.why);
      if (router.currentName === 'staff') router.back();
    },
  });
}
// Short banners for the staff events (Milestone 13).
bus.on('staff:hired', ({ staff, station }) => {
  beat = { entry: { title: `${staff.name} joined!`, body: `They're walking in to the ${station?.def.name ?? 'studio'}.` }, age: 0 };
});
bus.on('staff:letGo', ({ name }) => {
  beat = { entry: { title: `${name} left the studio`, body: 'Their career record stays in the studio history.' }, age: 0 };
});
bus.on('training:complete', ({ staff, course, gains }) => {
  const g = Object.entries(gains).map(([k, v]) => `${STATS.find((x) => x.key === k)?.label ?? k} +${v}`).join(', ');
  beat = { entry: { title: `${staff.name} finished ${course.name}`, body: g || 'Already at the tier cap' }, age: 0 };
});
bus.on('mentor:tag', ({ mentor, mentee, trait }) => {
  beat = { entry: { title: `${mentee.name} learned ${TRAITS[trait]?.name ?? trait}`, body: `From their mentor ${mentor.name}.` }, age: 0 };
});
const staffDetail = createStaffDetailScreen({
  layout,
  assets,
  world,
  topBar: subTopBar,
  history: (id) => projects.staffHistory[id] ?? null,
  career: (id) => recruitment.careerOf(id), // Milestone 13
  actions: (id) => staffActions(id),
  dateLabel: (d) => clock.shortLabel(d),
  nameOf: (id) => staffDefById(id)?.name ?? world.staffSystem.get(id)?.name ?? id,
  founderInfo: () => {
    const f = profile.founder();
    return f ? { ...f, flag: profile.data.founder.flag, history: profile.data.founder, years: profile.yearsEmployed() } : null;
  },
});
const ledger = createLedgerScreen({ layout, assets, business, topBar: subTopBar });
const platformScreen = createPlatformMarketScreen({ layout, assets, business, clock, topBar: subTopBar });
const marketingScreen = createMarketingScreen({ layout, assets, business, clock, topBar: subTopBar, dateLabel: (d) => clock.shortLabel(d), openRun: (key, id) => openMenu('market', { key, id }) });
// ?debug=1 (Business sheet): run the next year at once, to watch the platform market move.
function skipYear() {
  sheet.close();
  for (let i = 0; i < clock.daysPerMonth * clock.monthsPerYear; i++) clock.advanceDay();
  debug.log(`skipped to Year ${clock.year}`);
  router.go('platforms');
}
// Sent to certification: a short banner with the launch day.
bus.on('game:certifying', ({ record }) => {
  beat = { entry: { title: 'Sent to certification', body: `${record.result.title} launches ${clock.shortLabel(record.cert.launchDay)}` }, age: 0 };
});
const catalogueScreen = createCatalogueScreen({ dateLabel: (d) => clock.shortLabel(d), layout, assets, business, projects, topBar: subTopBar, openRelease: (n) => openMenu('release', n), openArchive: () => router.go('archive'), openDiscoveries: () => router.go('discoveries'), openSupport: (n) => openMenu('support', n) });
const engineScreen = createEngineScreen({ layout, assets, engines, topBar: subTopBar, textPrompt, openProject: (kind) => openMenu('engineStart', kind), dateLabel: (d) => clock.shortLabel(d) }); // Milestone 16
// Milestone 21: localisation's cost after the Localisation Suite, and its one-line summary on New Game.
const localisationCostPct = () => +(LOCALISATION.costPct * (1 + world.effect('localisationCostPct') / 100)).toFixed(1);
function localisationLine(mode) {
  const sells = LOCALISATION.salesPct + world.effect('localisedSalesPct');
  return mode === 'publisher' ? `+${LOCALISATION.workPct}% work, sells ${sells}% more abroad.` : mode === 'on' ? `+${localisationCostPct()}% cost a day, +${LOCALISATION.workPct}% work; sells ${sells}% more abroad.` : `Off: sells at home only; a global publisher's reach counts at most ${LOCALISATION.reachCapPct}%.`;
}
// Milestone 17: the deal terms in one line; the Publishers and Contract Board screens.
const dealTerms = (d) => `${d.global ? 'Global deal: localised for free · ' : ''}${SCOPES.find((s) => s.id === d.scope)?.name}${d.exactScope ? '' : '+'} game · ${d.sharePct}% of sales · on ${publishers.platformName(d.platform)}${d.genres ? ` · genre: ${d.genres.map((g) => elementById(g)?.name).join(' / ')}` : ''}${d.ipOwned ? ' · they own the IP' : ''}`;
const publishersScreen = createPublishersScreen({ layout, assets, topBar: subTopBar, publishers, dealTerms, dateLabel: (d) => clock.shortLabel(d), onSign: (id) => { const r = publishers.sign(id); if (!r.ok) showTip(r.why); } });
const contractsScreen = createContractsScreen({ layout, assets, topBar: subTopBar, contracts, dateLabel: (d) => clock.shortLabel(d), openAccept: (id) => openMenu('contractTeam', id) });
const sponsorsScreen = createSponsorsScreen({ layout, assets, topBar: subTopBar, sponsors, dateLabel: (d) => clock.shortLabel(d), onSign: (id) => { const r = sponsors.sign(id); if (!r.ok) showTip(r.why); } }); // Milestone 18
// Milestone 19: the Compete screens.
const monthLabel = (m) => `Y${Math.floor(m / 12) + 1} M${(m % 12) + 1}`;
const awardsScreen = createAwardsScreen({ layout, assets, topBar: subTopBar, awards, dateLabel: (d) => clock.shortLabel(d), monthLabel });
const rivalsScreen = createRivalsScreen({ layout, assets, topBar: subTopBar, rivals, clock, monthLabel });
const rankingsScreen = createRankingsScreen({ layout, assets, topBar: subTopBar, awards, rivals });
// Milestone 21: the global business screens.
const licensingScreen = createLicensingScreen({ layout, assets, topBar: subTopBar, global, dateLabel: (d) => clock.shortLabel(d), onSign: (id) => { const r = global.signLicence(id); if (!r.ok) showTip(r.why); }, onDecline: (id) => global.declineLicence(id) });
const publishingOfficeScreen = createPublishingOfficeScreen({ layout, assets, topBar: subTopBar, global, dateLabel: (d) => clock.shortLabel(d), onChoose: (id, choice) => { const r = global.fund(id, choice); if (!r.ok) showTip(r.why); } });
const acquisitionsScreen = createAcquisitionsScreen({ layout, assets, topBar: subTopBar, global, dateLabel: (d) => clock.shortLabel(d), onBuy: () => { const r = global.acquire(); if (!r.ok) showTip(r.why); }, onDecline: () => global.declineAcquisition(), nameOf: (a) => (a.ipId ? `${business.franchises.byId(a.ipId)?.name} joined your franchises` : a.staffId ? `${staffDefById(a.staffId)?.name} came to the recruitment board` : null) });
const discoveryScreen = createDiscoveryScreen({ layout, assets, combos, topBar: subTopBar }); // Milestone 15
const researchScreen = createResearchScreen({ layout, assets, research, topBar: subTopBar, openDiscoveries: () => router.go('discoveries'), debugFinish: new URLSearchParams(window.location.search).has('debug') ? (b) => { for (const r of RESEARCH_LIST().filter((x) => x.branch === b)) research.complete(r.id); } : null });
const archiveScreen = createFranchiseArchiveScreen({ layout, assets, business, projects, topBar: subTopBar, textPrompt });

// ?debug=1: the badge toggle (bottom-left, above the bottom bar) and a test hook for automated checks.
if (debug.enabled) {
  // Milestone 6: check the content (elements, unlocks, weights, covers, their images) and log any problem.
  const check = checkGameData();
  check.checkArt().then(() => {
    const r = check.report();
    debug.log(`data check: ${r.errors.length} errors, ${r.warnings.length} warnings`);
    for (const e of r.errors) console.warn('[DEVWORKS data]', e);
  });
  studio.setDebugBadge({
    rect: () => {
      const b = bottomBar.rect();
      return { x: b.x + 4, y: b.y - 104, w: 300, h: 90 };
    },
    label: () => `Badges: ${debugBadges ? 'on' : 'off'}`,
    onTap: () => {
      debugBadges = !debugBadges;
      debug.log(`debug badges ${debugBadges ? 'on' : 'off'}`);
    },
  });
  window.__dw = { global, licensingScreen, publishingOfficeScreen, acquisitionsScreen, support, rivals, awards, awardsScreen, rivalsScreen, rankingsScreen, sponsors, sponsorsScreen, publishers, contracts, publishersScreen, contractsScreen, engines, engineScreen, combos, discoveryScreen, recruitment, training, staffActions, confirmLetGo, research, researchScreen, shop, archiveScreen, marketingScreen, checkStations, platformScreen, skipYear, decideNow, elements, renderer, layout, input, loop, router, assets, sheet, systemBack, clock, world, projects, business, ledger, catalogueScreen, floatFeed, vfx, celebrate, devPops, shipped, get beat() { return beat; }, get tip() { return tip; }, feedback, newProject, projectScreen, textPrompt, studioRng, studio, roster, staffDetail, topBar, subTopBar, bottomBar, autosave, badgeFor, get slot() { return slot; }, taps: [], profile, dialog, titleScreen, setupScreen, playSlot, startStudio, toTitle, deleteSlot, refreshSlots, get slots() { return slots; }, get slotIndex() { return slotIndex; }, get slotCards() { return slotCards; }, get started() { return started; } };
}

router
  .register('boot', bootScreen)
  .register('title', titleScreen)
  .register('setup', setupScreen)
  .register('studio', studio)
  .register('roster', roster)
  .register('staff', staffDetail)
  .register('newProject', newProject)
  .register('project', projectScreen)
  .register('ledger', ledger)
  .register('catalogue', catalogueScreen)
  .register('platforms', platformScreen)
  .register('marketing', marketingScreen)
  .register('archive', archiveScreen)
  .register('research', researchScreen)
  .register('discoveries', discoveryScreen)
  .register('engines', engineScreen)
  .register('publishers', publishersScreen)
  .register('contracts', contractsScreen)
  .register('sponsors', sponsorsScreen)
  .register('awards', awardsScreen)
  .register('rivals', rivalsScreen)
  .register('rankings', rankingsScreen)
  .register('licensing', licensingScreen)
  .register('publishingOffice', publishingOfficeScreen)
  .register('acquisitions', acquisitionsScreen)
  .register('test', createTestScreen({ renderer, layout, assets, openSheet: () => sheet.open(testSheet), onTapLogged: (p) => window.__dw?.taps.push({ x: p.x, y: p.y }) }))
  .register('route', createRouteTestScreen({ renderer, layout, onBack: () => back() }));

// The Milestone 0 placeholder sheet (?screen=test).
function testSheet() {
  return {
    title: 'Test sheet',
    subtitle: 'Placeholder bottom sheet for Milestone 0.',
    art: 'm0Real',
    sections: [
      {
        lines: ['Close it with ✕, by tapping above it, with Close, or with the phone Back button.'],
        buttons: [
          { id: 'route', label: 'Second screen', onTap: () => router.go('route') },
          { id: 'close', label: 'Close', accent: COL.progress, onTap: () => sheet.close() },
        ],
      },
    ],
  };
}

router.go('boot');
loop.start();
