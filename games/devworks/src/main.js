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
// Milestone 22: studio stages S4 Corporate HQ and S5 Global Campus (Business → Studio), Blockbuster / Mega scopes with
// them, three game lanes; the big moment shows the stage's event picture; ?debug=1 adds __dw.debugFullStudio().
// Milestone 23: hardware foundation (optional): Create → Hardware — a console design (six parts, a family name), a
// prototype built at the Hardware Prototype Lab, its seven ratings and its validation; the first prototype's moment.
// Milestone 24: console launch and market — Create → Consoles (Console Portfolio): the launch plan from a validated
// prototype, then the console as a platform (install base, third-party games, royalties, defects, failure reasons,
// recovery); spending never passes the Emergency Credit line.
// Milestone 33: the Year-20 ending (src/systems/ending.js: the grade, the ceremony screen, postgame) and New Game+
// (src/systems/ngplus.js: Legacy Staff, blueprints, research conversion, the token shop; NG+ starts in another slot).
// Milestone 34: the Banx Gamex studio splash, the first-run guide (core GuideSystem + CoachMark, data/guide.js), one-time
// hint cards on the advanced screens, the Help archive (top bar Help), Settings / Accessibility (core Settings,
// data/settings.js), the Store / VIP stub and the Project Board.
// Add ?debug=1 for the FPS/state overlay and the badge toggle, ?screen=test for the Milestone 0 scaling/tap test screen.
import { THEME, font, setTextScale } from '../../../core/Theme.js';
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
import { createHardware } from './systems/hardware.js';
import { createHardwareScreen } from './screens/HardwareScreen.js';
import { HARDWARE } from '../data/hardware.js';
import { createConsoles } from './systems/consoles.js';
import { createDistribution } from './systems/distribution.js'; // Milestone 26
import { createStudioEvents } from './systems/studioEvents.js'; // Milestone 27
import { createSecrets } from './systems/secrets.js'; // Milestone 28
import { SYNTHETIC_SECRETS, SECRETS } from '../data/secrets.js';
import { GHOSTLIGHT } from '../data/rivals.js'; // Milestone 30
import { PRESTIGE_TIERS } from '../data/staff.js';
import { createRumourScreen } from './screens/RumourScreen.js';
import { createPrestige, PROJECT_ONE } from './systems/prestige.js'; // Milestone 31
import { createAchievements } from './systems/achievements.js'; // Milestone 32
import { createAchievementsScreen, createHallOfFameScreen } from './screens/AchievementsScreens.js';
import { createEnding } from './systems/ending.js'; // Milestone 33
import { createNgPlus } from './systems/ngplus.js';
import { createEndingScreen } from './screens/EndingScreen.js';
import { createNgPlusScreen } from './screens/NgPlusScreen.js';
import { GuideSystem } from '../../../core/GuideSystem.js'; // Milestone 34
import { CoachMark } from '../../../core/ui/CoachMark.js';
import { createHelpArchive } from '../../../core/ui/HelpArchive.js';
import { createStudioSplash } from '../../../core/ui/StudioSplash.js';
import { Settings } from '../../../core/Settings.js';
import { GUIDE_STEPS, GUIDE_FACE, SCREEN_HINTS, HELP_TEXT, HELP_TOPICS } from '../data/guide.js';
import { SETTINGS_DEFAULTS, SETTINGS_KEY, TEXT_SPEED } from '../data/settings.js';
import { createSettingsScreen, createStoreScreen } from './screens/SettingsScreen.js';
import { createProjectBoardScreen } from './screens/ProjectBoardScreen.js';
import { setCardSymbols } from './ui/cardListScreen.js';
import { drawPortrait } from './ui/setupArt.js'; // Milestone 29: the arrival moment
import { EVENT_RULES } from '../data/events.js';
import { IRONPEAK } from '../data/hardware.js';
import { createConsoleScreen } from './screens/ConsoleScreen.js';
import { CONSOLE } from '../data/consoles.js';
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
import { facilityById, stageById, FACILITIES } from '../data/facilities.js';
import { platformById } from '../data/platforms.js';
import { drawCover, drawOutputs } from './ui/gameCard.js';
import { createTestScreen } from './screens/TestScreen.js';
import { createRouteTestScreen } from './screens/RouteTestScreen.js';
import { createStudioMenus } from './ui/studioMenus.js';
import { registerPlaceholders } from './ui/placeholders.js';
const COL = THEME.color;

// Milestone 34: Settings / Accessibility (device settings, bible §51). What each one does: data/settings.js.
const settings = new Settings({ key: SETTINGS_KEY, defaults: SETTINGS_DEFAULTS });
const BASE_MIN_H = THEME.button.minH;
function applySettings() {
  setTextScale(settings.get('textSize') === 'large' ? 1.15 : 1);
  THEME.button.minH = settings.get('largerTargets') ? Math.round(BASE_MIN_H * 1.2) : BASE_MIN_H;
  setCardSymbols(settings.get('colourBlindSymbols'));
}
applySettings();
settings.onChange(() => applySettings());
const textTime = () => TEXT_SPEED[settings.get('textSpeed')] ?? 1;

const W = 1080;
const BASE_H = 1920; // 9:16; taller phones grow the height (see Renderer)
const MAX_H = 2640; // up to 9:22 fills edge to edge; taller still gets thin bars top and bottom
const START_SCREEN = new URLSearchParams(window.location.search).get('screen') === 'test' ? 'test' : 'title';
const MENU_SCREENS = ['title', 'setup', 'splash', 'boot', 'settings', 'store', 'help']; // before a studio is open: no clock, no top bar
const TEST_SCREENS = ['test', 'route']; // the Milestone 0 screens: pause button, full debug box
const WORLD_SCREENS = ['projects', 'ngplus', 'studio', 'roster', 'staff', 'newProject', 'project', 'ledger', 'catalogue', 'platforms', 'marketing', 'archive', 'research', 'discoveries', 'engines', 'publishers', 'contracts', 'sponsors', 'awards', 'rivals', 'rankings', 'licensing', 'publishingOffice', 'acquisitions', 'hardware', 'consoles', 'rumours', 'achievements', 'hallOfFame']; // where the top bar's Pause / speeds apply

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
const projects = createGameProjects({ engineFor: (versionId, tech) => engines?.forGame(versionId, tech) ?? null, recipeBonus: (recipe) => secrets.recipeBonus(recipe), bus, world, clock, charge: (amount, reason) => business.charge(amount, reason), founder: () => profile.founder(), studioVariancePct: () => world.effect('scheduleVariancePct') }); // Milestone 11: the facilities' effect
const business = createBusiness({ bus, clock, world, projects });
const research = createResearch({ bus, clock, world }); // Milestone 12
const shop = createFacilityShop({ bus, world, business, clock, projects, researched: () => research.researched(), secretOpen: (id) => secrets.opened('unlocks', id), discountPct: (id) => profile.facilityDiscount(id), usedDiscount: (id) => profile.useFacilityDiscount(id) }); // Milestone 11 (Milestone 29: F34 / F35; Milestone 33: the NG+ facility blueprint)
// Busy elsewhere (Milestones 16–17): the engine, a contract.
let contracts = null;
const engineBusy = (id) => (engines?.jobOf(id) ? 'Building the engine' : contracts?.jobOf(id) ? 'On a contract' : support?.jobOf(id) ? 'On post-launch support' : hardware?.jobOf(id) ? 'Building a console prototype' : null);
let hardware = null; // Milestone 23 (made below)
const recruitment = createRecruitment({ bus, clock, world, business, projects, profile, shop, extraBusy: engineBusy, secretArrived: (id) => secrets.opened('arrivals', id) }); // Milestone 13 (Milestone 29: secret arrivals)
const training = createTraining({ bus, clock, world, business, projects, research, recruitment, extraBusy: engineBusy });
engines = createEngines({ bus, clock, world, business, projects, research, studioName: () => profile.name || 'Studio', extraBusy: (id) => (contracts?.jobOf(id) ? 'On a contract' : null) });
const sponsors = createSponsors({ bus, clock, world, business, needs: (n) => (n === 'hardwareLab' ? !!world.stationById('F28') : n === 'botworksEvents') }); // Milestone 18 (Milestone 27: IronPeak and BOTWORKS)
world.addEffectSource((key) => sponsors.effect(key));
// Milestone 19: the rivals and the awards (after the business: the season's sales are in by the month end).
// Milestone 30: Ghostlight (R08), once SEC-RIVAL-01 has enabled it: its yearly plan is the player's best-reviewed genre and
// theme of the released games in the years before (never a game still being made) and that best review.
function ghostSnapshot(year) {
  const perYear = clock.daysPerMonth * clock.monthsPerYear;
  const from = (year - 1 - GHOSTLIGHT.lookbackYears) * perYear;
  const to = (year - 1) * perYear;
  const recent = projects.catalogue.list().filter((r) => r.release && r.release.day >= from && r.release.day < to);
  if (!recent.length) return null;
  const best = [...recent].sort((a, b) => b.release.score - a.release.score || a.number - b.number)[0];
  return { genre: best.result.recipe?.genre ?? 'GEN07', theme: best.result.recipe?.theme ?? 'THM02', best: best.release.score };
}
const rivals = createRivals({ bus, clock, seed: () => business.marketing.seed, ghostlight: { on: () => secrets.opened('unlocks', 'ghostlight'), snapshot: ghostSnapshot }, platformsOn: (m) => business.platforms.active(m * clock.daysPerMonth).filter((p) => !p.own).map((p) => p.id) }); // Milestone 24: not on your console
const awards = createAwards({ bus, clock, business, projects, rivals, seed: () => business.marketing.seed, studioName: () => profile.name || 'Your studio', hasEngine: () => !!engines?.engines.length, secretOpen: (id) => secrets.opened('unlocks', id), prestigeCredit: (r) => (r.team ?? []).some((m) => PRESTIGE_TIERS.includes(staffDefById(m.id)?.tier)) }); // Milestone 30: C11 / C12
// Milestone 20: post-launch support (takes a game lane while it runs).
let support = null;
support = createSupport({ bus, clock, world, business, projects, lanes: () => lanes(), isBusy: (id) => (projects.jobs.some((j) => j.slots.includes(id)) ? 'Making a game' : world.workerById(id)?.away ? 'Away on a course' : engineBusy(id)) });
const publishers = createPublishers({ bus, clock, world, business, projects, elements: { scopeOpen: (id) => elements.scopeOpen(id), isOpen: (id) => elements.isOpen(id) } }); // Milestone 17
contracts = createContracts({ bus, clock, world, business, engines: () => engines, isBusy: (id) => (projects.jobs.some((j) => j.slots.includes(id)) ? 'Making a game' : world.workerById(id)?.away ? 'Away on a course' : engines?.jobOf(id) ? 'Building the engine' : null) });
const lanes = () => stageById(world.stage).lanes;
// Milestone 21: global business (after the business, research, engines, recruitment and publishers).
hardware = createHardware({ bus, clock, world, business, research, prestigePart: (id) => secrets.opened('parts', id), studioName: () => profile.name || 'Studio', isBusy: (id) => (projects.jobs.some((j) => j.slots.includes(id)) ? 'Making a game' : world.workerById(id)?.away ? 'Away on a course' : engines?.jobOf(id) ? 'Building the engine' : contracts?.jobOf(id) ? 'On a contract' : support?.jobOf(id) ? 'On post-launch support' : null) });
const consoles = createConsoles({ bus, clock, world, business, projects, hardware, engines: () => engines, studioName: () => profile.name || 'Studio', seed: () => business.marketing.seed }); // Milestone 24
const distribution = createDistribution({ bus, clock, world, business, projects, consoles: () => consoles }); // Milestone 26 (registers itself with the business)
// Milestone 27: events, milestone moments, the Inbox and toasts (one blocking pop-up at a time).
const studioEvents = createStudioEvents({ bus, clock, world, business, projects, research, sponsors: () => sponsors, consoles: () => consoles, hardware: () => hardware, seed: () => business.marketing.seed });
// Milestone 28: the secret engine. Only synthetic test rules, and only with ?debug=1 (the real 50 are Milestone 29);
// the account half (secrets found in any run, prestige tokens) has its own save record.
// Milestone 29: the real 50 (bible §41); ?synthetic=1 swaps in the Milestone 28 test rules. ?debug=1 adds the inspector.
const DEBUG_SECRETS = new URLSearchParams(window.location.search).has('debug');
const SYNTHETIC = new URLSearchParams(window.location.search).has('synthetic');
const secrets = createSecrets({ bus, clock, world, business, projects, rules: SYNTHETIC ? SYNTHETIC_SECRETS : SECRETS, research: () => research, franchises: () => business.franchises, global: () => global, engines: () => engines, sponsors: () => sponsors, profile: () => profile, awards: () => awards, combos: () => combos, consoles: () => consoles, studioEvents: () => studioEvents, hallOfFame: () => achievements.hallCounts(), runId: () => business.marketing.seed, saveAccount: (data) => accountStore?.set(SAVE.secretsAccountKey, data).catch((e) => console.error('[DEVWORKS] secrets account save failed', e)) });
// Milestone 32: achievements, the Hall of Fame and the account records (account-wide, their own save record).
const achievements = createAchievements({ bus, clock, world, business, projects, secrets, awards: () => awards, global: () => global, engines: () => engines, sponsors: () => sponsors, consoles: () => consoles, hardware: () => hardware, research: () => research, runId: () => business.marketing.seed, ngPlus: () => profile.ngPlus, saveAccount: (data) => accountStore?.set(SAVE.achievementsKey, data).catch((e) => console.error('[DEVWORKS] achievements save failed', e)) });
// Milestone 27: IronPeak's obligation — an IronPeak part in a hardware project started during its deal.
bus.on('hardware:start', ({ job }) => {
  if (Object.values(job.data.parts ?? {}).some((id) => IRONPEAK.includes(id))) sponsors.signal('ironPeakPart');
});
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
    if (started) eventFlow.update(dt); // Milestone 27
    if (started) endingWatch(); // Milestone 33
    feedback.height = renderer.height;
    feedback.update(dt);
    // Floating +Credits only over the studio with nothing on top; otherwise they wait (and old ones are dropped).
    floatFeed.update(dt, { hold: router.currentName !== 'studio' || sheet.active || feedback.active || studio.buildMode });
    vfx.height = renderer.height;
    vfx.update(dt);
    celebrate.height = renderer.height;
    celebrate.update(dt);
    if (started) devPops.update(dt, !clock.paused);
    if (tip && (tip.t += dt) > TIP_SEC * textTime()) tip = null;
    if (beat && !feedback.active && (beat.age += dt) > DEV_POPS.phaseBannerSec * textTime()) beat = null; // Milestone 34: Banner time
    if (started) {
      coach.update(dt); // Milestone 34: the guide, the hint cards
      guide.update();
      guideWatch();
    }
  },
  render: (alpha) => {
    const ctx = renderer.begin(COL.bg);
    router.render(ctx, alpha);
    if (router.currentName === 'studio') vfx.render(ctx, 'screen');
    sheet.render(ctx);
    if (started && guide.active) coach.render(ctx, guideFill(guide.current), guideTarget(guide.current.target), { block: guide.current.block, next: !!guide.current.advance.next }); // Milestone 34
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
// Milestone 27: every big moment is also kept in the Inbox.
{
  const show = feedback.show.bind(feedback);
  feedback.show = (m) => {
    if (!m.noInbox) studioEvents?.note({ title: m.title, body: m.subtitle ?? '', level: 'major', read: true });
    return show(m);
  };
}
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
  distribution: () => distribution, // Milestone 26
  prestige: () => prestige, // Milestone 31
  achievements: () => achievements, // Milestone 32
  knownBefore: (id) => !!ngplus.known[id], // Milestone 33: discovered staff identities
  extraScreens: true, // Milestone 34: Project Board, Settings, Store / VIP
  yearEnding: () => yearEnding(),
  rumours: () => { const r = secrets.rumours(); return r.length ? `${r.filter((x) => x.stage >= 4).length} found · ${r.filter((x) => x.stage < 4).length} rumours` : 'Whispers about secrets'; }, // Milestone 28
  fullLaunch: (number) => {
    sheet.close();
    const r = distribution.fullLaunch(number);
    if (!r.ok) showTip(r.why);
  },
  setStorefront: (on) => {
    const r = distribution.setStorefront(on);
    if (!r.ok) showTip(r.why);
  },
  doRelease: (number, ids, mode = 'balanced') => {
    sheet.close();
    const rec = business.release(number, ids, mode);
    if (rec) debug.log(rec.release ? `released: ${rec.result.title} (review ${rec.release.score})` : `certifying: ${rec.result.title}`);
  },
  openScreen: (name) => router.go(name),
  toTitle: () => toTitle(),
  shop: () => shop,
  buyFacility: (id) => {
    const r = shop.buy(id);
    sheet.close();
    if (r.ok) showBeat({ title: `${r.station.def.name} built!`, body: 'Drag it where you want it. Done when finished.' });
    else showTip(r.why);
  },
  sellFacility: (id) => {
    const go = () => {
      const r = shop.sell(id);
      if (!r.ok) showTip(r.why);
    };
    sheet.close();
    // Milestone 34: "Confirm before selling" (on by default).
    if (settings.get('confirmDestructive')) dialog.confirm({ title: `Sell the ${facilityById(id)?.name ?? 'facility'}?`, body: `You get ${shop.refundOf(id).toLocaleString('en-GB')} Credits back.`, yes: 'Sell', danger: true, onYes: go });
    else go();
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
  hardware: () => hardware, // Milestone 23
  consoles: () => consoles, // Milestone 24
  pickPart: (slot, id) => {
    hardware.pick(slot, id);
    sheet.close();
  },
  startHardware: (team) => {
    const r = hardware.start(team);
    sheet.close();
    if (!r.ok) showTip(r.why);
  },
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
  else if (id === 'F28') router.go('hardware'); // the Hardware Prototype Lab (Milestone 23)
  else if (id === 'F33') router.go('hallOfFame'); // the Museum / Hall of Fame (Milestone 32)
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
  onHelp: () => router.go('help', { back: router.currentName }), // Milestone 34: the Help archive
  inboxCount: () => (debugBadges ? 1 : studioEvents.unread()), // Milestone 27: unread messages
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
const saveData = () => ({ guide: { ...guide.serialize(), hints: [...hintsSeen] }, ending: ending.serialize(), secrets: secrets.serialize(), studioEvents: studioEvents.serialize(), distribution: distribution.serialize(), consoles: consoles.serialize(), hardware: hardware.serialize(), global: global.serialize(), support: support.serialize(), rivals: rivals.serialize(), awards: awards.serialize(), sponsors: sponsors.serialize(), publishers: publishers.serialize(), contracts: contracts.serialize(), engines: engines.serialize(), combos: combos.serialize(), staff: { recruit: recruitment.serialize(), training: training.serialize() }, research: research.serialize(), clock: clock.serialize(), world: world.serialize(), games: projects.serialize(), business: business.serialize(), elements: elements.serialize(), unlocked: elements.open(), studio: profile.serialize() });
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
    secrets.loadAccount(await adapter.get(SAVE.secretsAccountKey)); // Milestone 28: secrets found in any run
    achievements.loadAccount(await adapter.get(SAVE.achievementsKey)); // Milestone 32
    ngplus.loadAccount(await adapter.get(SAVE.legacyAccountKey)); // Milestone 33: legacy summaries, staff worked with
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
  hardware.load(data.hardware ?? null); // Milestone 23
  consoles.load(data.consoles ?? null); // Milestone 24
  distribution.load(data.distribution ?? null); // Milestone 26
  studioEvents.load(data.studioEvents ?? null); // Milestone 27
  secrets.load(data.secrets ?? null); // Milestone 28
  ending.load(data.ending ?? null); // Milestone 33 (a save from before it: the ending fires at the next check if Year 20 is over)
  combos.loadAccount(null); // (merges: anything this run found is known to the account too)
  achievements.checkAll(); // Milestone 32: a run from before achievements catches up (nothing is ever granted twice)
  ngplus.knowAll(); // Milestone 33: everyone here is someone the account has worked with
  loadGuide(data.guide ?? null, projects.catalogue.count > 0 || projects.jobs.length > 0); // Milestone 34
  checkStations(); // a studio already at Rank D gets its Marketing Wall (Milestone 9)
  slot = s;
  slotIndex = i;
  sessionUsed = true;
  await slots.setLastUsed(i);
  debug.log(`slot ${i + 1} loaded: day ${clock.totalDays}, ${world.workers.length} staff`);
  resume();
}

// START STUDIO: a new studio in an empty slot, with the founder's starting team at their stations.
// Milestone 33: carry = a New Game+ package (src/systems/ngplus.js buildCarry), applied once the new run exists.
async function startStudio(i, setup, carry = null) {
  if (sessionUsed) return reloadInto({ action: 'new', slot: i, setup, carry });
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
  hardware.newGame(); // Milestone 23
  consoles.newGame(); // Milestone 24
  distribution.newGame(); // Milestone 26
  studioEvents.newGame(); // Milestone 27
  secrets.newGame(); // Milestone 28
  ending.newGame(); // Milestone 33
  profile.create(setup);
  if (carry) ngplus.apply(carry); // Milestone 33: NG+ level, Legacy Staff, blueprints, RP, tokens paid
  loadGuide(null, !!carry); // Milestone 34: a new studio starts the guide (an NG+ one has seen it all)
  ngplus.knowAll();
  slot = slots.slot(i);
  slotIndex = i;
  sessionUsed = true;
  started = true;
  await slot.save(saveData());
  await slots.setLastUsed(i);
  debug.log(`new studio in slot ${i + 1}: ${setup.studio}, founder ${founder.id}${carry ? `, NG+${carry.level} from slot ${(carry.parent?.slot ?? 0) + 1}` : ''}`);
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
  crown: () => secrets.opened("cosmetics", "accountCrown"), // Milestone 31
  slots: () => slotCards,
  last: () => lastSlot,
  onContinue: (i) => playSlot(i),
  onPlay: (i) => playSlot(i),
  onNewGame: () => newGameFromMenu(),
  onNewInSlot: (i) => router.go('setup', { slot: i }),
  onDelete: (i) => deleteSlot(i),
  onSettings: () => router.go('settings'), // Milestone 34
});
const setupScreen = createSetupScreen({ layout, assets, textPrompt, onBack: () => (pendingNg ? router.go('ngplus', { keep: true, view: 'slot' }) : router.go('title', { view: 'slots' })), onStart: (i, setup) => (pendingNg && pendingNg.slot === i ? startNgPlusRun(i, setup) : startStudio(i, setup)) });

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
      else if (START_SCREEN === 'title' && slots && intent?.action === 'new') startStudio(intent.slot, intent.setup, intent.carry ?? null);
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
  labPrototype: () => (hardware?.prototypes.length ? HARDWARE.prototypeArt : null), // Milestone 23: the prototype on the lab
  workerIcons: () => !settings.get('reducedWorkerDetail'), // Milestone 34
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
      const pic = stage.event ?? stage.shell; // Milestone 22: the Professional Studio / Global Campus event pictures
      if (pic) assets.drawContained(ctx, pic, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.3 - size / 2, w: size, h: size });
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
  isVisible: () => router.currentName === 'studio' && !feedback.active && !studio.buildMode && !loop.paused && !settings.get('lowVfx'), // Milestone 34: Low effects
});

// A milestone done (medium feedback, style guide §7): a short banner under the top bar that goes by itself, and a
// sparkle over the Starter Desks. The last one is "Game finished!" (big), so it has no banner.
let beat = null; // { entry: { title, body }, age }
// A medium banner over the studio; it is also kept in the Inbox (Milestone 27).
function showBeat(entry) {
  beat = { entry, age: 0 };
  studioEvents.note({ title: entry.title, body: entry.body ?? '', read: true });
  return beat;
}
bus.on('project:phase', ({ job, phase }) => {
  const next = projects.phases[job.phaseIndex + 1];
  if (!next) return;
  showBeat({ title: `${phase.name} done!`, body: `${job.name} · next: ${next.name}` });
  if (router.currentName !== 'studio') return;
  const at = studio.popPoint(world.stationById(makerId));
  vfx.sparks('world', at.x, at.y, { count: 14, speedMin: 160, speedMax: 380, spread: 3.2 });
  vfx.pulse('world', at.x, at.y + 40, { rx: 120, ry: 60, color: COL.good, life: 0.8, grow: 1.8, width: 8 });
});
// New elements opened (rank-up, a new year…): the same short banner.
bus.on('elements:unlocked', ({ ids }) => {
  const names = ids.map((id) => elementById(id)?.name).filter(Boolean);
  const body = names.length > 4 ? `${names.slice(0, 4).join(', ')} and ${names.length - 4} more` : names.join(', ');
  showBeat({ title: names.length === 1 ? 'New game element!' : 'New game elements!', body });
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
  comboHints: (recipe) => (settings.get('extraComboHints') ? combos.hints(recipe) : combos.hints(recipe).slice(0, 1)), // Milestone 15 (Milestone 34: Extra combo hints lists them all)
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
    showBeat({ title: `New station: ${st.def.name}!`, body: 'Tap it to plan your marketing.' });
    debug.log(`station opened: ${st.id}`);
  }
}
bus.on('reputation:rankUp', () => started && checkStations());
// A franchise reaches a higher status (Milestone 10): a short banner (Legendary gets the big moment).
bus.on('franchise:status', ({ ip, status }) => {
  if (status.id === 'legendary') return;
  showBeat({ title: `${ip.name} is now ${status.name}!`, body: 'Your franchise is growing. See it in Catalogue → Franchises.' });
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
  showBeat({ title: `Research done: ${node.name}`, body: names.length ? `Opens ${names.join(', ')}` : 'The studio knows more now.' });
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
  showBeat({ title: `Deal signed: ${publishers.publisherName(deal.publisher)}`, body: `+${deal.advance.toLocaleString('en-GB')} Credits advance · pick it on your next New Game` });
});
bus.on('deal:missed', ({ deal, milestone, penalty }) => {
  showBeat({ title: `Missed milestone: ${milestone.name}`, body: `${publishers.publisherName(deal.publisher)} charges ${penalty.toLocaleString('en-GB')} Credits` });
});
bus.on('deal:lapsed', ({ deal, repaid }) => {
  showBeat({ title: `Deal lapsed: ${publishers.publisherName(deal.publisher)}`, body: `No game started in time: ${repaid.toLocaleString('en-GB')} Credits paid back` });
});
bus.on('contract:success', ({ contract }) => {
  showBeat({ title: `Contract done for ${contract.client}`, body: `+${contract.pay.toLocaleString('en-GB')} Credits` });
});
bus.on('contract:failed', ({ contract, reason }) => {
  showBeat({ title: `Contract ${reason === 'cancelled' ? 'dropped' : 'missed'}: ${contract.client}`, body: 'No pay.' });
});
// Awards (Milestone 19): a win is a big moment with its trophy, and it hands out the award's extra; a place is a banner.
bus.on('award:result', ({ award, result }) => {
  if (result.winner === 'player' || !result.playerPlace) return;
  showBeat({ title: `${award.name}: #${result.playerPlace}`, body: `${result.entrants[0].name} won with "${result.entrants[0].title}"` });
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
  if (!job) return showBeat({ title: `${record.result.title}: support ended`, body: 'Moved on.' });
  const o = SUPPORT_OPTION_BY_ID(job.option);
  const bits = [effects.bugsFixed ? `${effects.bugsFixed} bugs fixed` : null, effects.playerScore ? `player score +${effects.playerScore}` : null, effects.trust ? `Fan Trust +${Math.round(effects.trust)}` : null, effects.tailPct ? `tail +${effects.tailPct}%` : null, effects.addonRevenue ? `add-on: ${effects.addonRevenue.toLocaleString('en-GB')} Credits over time` : null, effects.port?.ok ? `launches ${clock.shortLabel(effects.port.launchDay)}` : null].filter(Boolean);
  showBeat({ title: `${o.name} done: ${record.result.title}`, body: bits.join(' · ') || 'Done.' });
});
// Hardware (Milestone 23): a banner when a prototype starts; the first prototype is a big moment.
bus.on('hardware:start', ({ job }) => {
  showBeat({ title: 'Console prototype started', body: job.name });
});
bus.on('hardware:prototype', ({ prototype, first }) => {
  const v = prototype.validation;
  if (!first) return showBeat({ title: `${prototype.name} built`, body: v.passed ? 'It passed validation.' : `Failed: ${v.required.find((c) => !c.ok).why}` });
  feedback.show({
    title: 'Your first console prototype!',
    subtitle: `${prototype.name} · ${v.passed ? 'passed validation' : `failed validation: ${v.required.find((c) => !c.ok).why}`}. See it in Create → Hardware.`,
    accent: COL.purple,
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const s = Math.min(1, t / 0.35);
      const size = 560 * (0.6 + 0.4 * s);
      ctx.save();
      ctx.globalAlpha = s;
      assets.drawContained(ctx, HARDWARE.firstPrototypeEvent, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.3 - size / 2, w: size, h: size });
      ctx.restore();
    },
    onAck: afterFeedback,
  });
});
// Consoles (Milestone 24): the launch moment, defect waves (warning smoke over the studio), the verdict.
bus.on('console:launched', ({ console: c, previous }) => {
  feedback.show({
    title: `${c.name} launches!`,
    subtitle: previous
      ? `Generation ${c.gen}: your ${CONSOLE.forms[c.form].name.toLowerCase()} is on sale for ${c.price} Credits. ${previous.name} starts declining; its players and history stay in the Console Portfolio.`
      : `Your ${CONSOLE.forms[c.form].name.toLowerCase()} is on sale for ${c.price} Credits. Release your games on it; third-party studios follow when it sells.`,
    accent: COL.gold,
    onShow: () => {
      const H = renderer.height;
      celebrate.confetti('screen', W / 2, H * 0.72, { count: 40, speed: 900, spreadX: 120 });
    },
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const s = Math.min(1, t / 0.35);
      const size = 560 * (0.6 + 0.4 * s);
      ctx.save();
      ctx.globalAlpha = s;
      assets.drawContained(ctx, previous ? c.art : CONSOLE.launchArt, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.28 - size / 2, w: size, h: size }); // Gen 2+ show the new console
      const v = 220 * (0.5 + 0.5 * s); // the launch sparkle under the picture
      assets.drawContained(ctx, CONSOLE.launchVfx, { x: W / 2 - v / 2, y: sr.y + sr.h * 0.28 + size / 2 + 10, w: v, h: v });
      ctx.restore();
    },
    onAck: afterFeedback,
  });
});
bus.on('console:defects', ({ console: c, cost }) => {
  showBeat({ title: `${c.name}: a wave of faulty consoles`, body: `Repairs ${cost.toLocaleString('en-GB')} Credits · Fan Trust −${CONSOLE.defects.trustHit}` });
  if (router.currentName === 'studio') {
    const p = studio.screenPointOf(makerId);
    vfx.sprite('screen', CONSOLE.defectVfx, p.x, p.y - 160, { size: 260, life: 1.6, from: 0.4, to: 1, rise: 60, hold: 0.6 });
  }
});
// Milestone 27: the event flow. At most one blocking pop-up: a choice event's sheet (the clock waits while it is up) or
// a milestone moment; the next one only comes when nothing else is up. Toasts show one at a time as banners. The
// Inbox (top bar) keeps every message; an unanswered choice can be answered there.
let speedBeforeEvent = null;
let freeSec = 0; // how long the studio has been free: a pop-up waits EVENT_RULES.graceSec after anything else closes
function resumeAfterEvent() {
  if (speedBeforeEvent && !feedback.active) clock.setSpeed(speedBeforeEvent);
  speedBeforeEvent = null;
}
function showPopup(e) {
  if (e.kind === 'choice') {
    speedBeforeEvent = clock.paused ? null : clock.speed;
    clock.pause();
    openMenu('event', e.data.uid);
    return;
  }
  // A milestone moment with its picture.
  const ok = feedback.show({
    title: e.title,
    subtitle: e.body,
    accent: COL.gold,
    noInbox: true,
    onShow: () => celebrate.confetti('screen', W / 2, renderer.height * 0.72, { count: 36, speed: 850, spreadX: 120 }),
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const k = Math.min(1, t / 0.35);
      const size = 560 * (0.6 + 0.4 * k);
      ctx.save();
      ctx.globalAlpha = k;
      if (e.art) assets.drawContained(ctx, e.art, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.3 - size / 2, w: size, h: size });
      ctx.restore();
    },
    onAck: () => {
      studioEvents.done();
      afterFeedback();
    },
  });
  if (!ok) studioEvents.done();
}
const eventFlow = {
  update(dt) {
    const E = studioEvents;
    const cur = E.showing;
    // A choice sheet closed without an answer: it waits in the Inbox.
    if (cur?.kind === 'choice' && !(sheet.active && sheet.menu?.eventUid === cur.uid)) {
      E.dismiss();
      resumeAfterEvent();
    }
    const busy = feedback.active || sheet.active || dialog.active || textPrompt.active || router.currentName !== 'studio' || studio.buildMode;
    freeSec = busy ? 0 : freeSec + dt;
    if (!E.showing) {
      const e = E.pump({ busy: busy || freeSec < EVENT_RULES.graceSec });
      if (e) showPopup(e);
    }
    E.notes.update(dt, { hold: router.currentName !== 'studio' || sheet.active || feedback.active });
    const t = E.notes.toasts[0];
    if (t && !beat && !feedback.active) {
      beat = { entry: { title: t.entry.title, body: `${t.entry.body}${t.more ? ` (+${t.more} more in the Inbox)` : ''}`, icon: t.entry.icon }, age: 0 };
      E.notes.toasts.shift();
    }
  },
};
// A choice event's sheet.
menus.register('event', (uid) => {
  const v = studioEvents.view(uid);
  if (!v) return null;
  const answered = v.open ? null : v.choices[v.choice];
  return {
    eventUid: uid,
    title: v.title,
    subtitle: v.cls,
    art: v.icon,
    accent: COL.progress,
    sections: [
      { lines: [v.text, ...(answered ? [{ text: `You chose: ${answered.label}${v.auto ? ' (it went ahead by itself)' : ''}`, color: COL.good }] : [])] },
      {
        columns: 1,
        buttons: v.open
          ? v.choices.map((c, i) => ({
              id: `choice${i}`,
              label: c.label,
              sub: c.line,
              accent: COL.progress,
              onTap: () => {
                studioEvents.answer(uid, i);
                sheet.close();
                resumeAfterEvent();
              },
            }))
          : [],
      },
    ],
  };
});
// One message (not a choice).
menus.register('message', (id) => {
  const e = studioEvents.notes.get(id);
  if (!e) return null;
  return { title: e.title, subtitle: clock.shortLabel?.(e.day) ?? '', art: e.art ?? e.icon ?? 'dev_ui_05', accent: COL.progress, sections: [{ lines: [e.body || ' '] }, { columns: 1, buttons: [{ id: 'back', label: '‹ Inbox', accent: COL.progress, onTap: () => openMenu('inbox') }] }] };
});
// The Inbox: newest first, unread marked, choices still waiting first.
menus.register('inbox', () => {
  const N = studioEvents.notes;
  const waiting = N.inbox.filter((e) => e.kind === 'choice' && studioEvents.openChoice(e.data?.uid));
  const rest = N.inbox.filter((e) => !waiting.includes(e)).slice(0, 40);
  const row = (e) => {
    const open = e.kind === 'choice' && studioEvents.openChoice(e.data?.uid);
    const sub = open ? 'Waiting for your answer' : e.answer ? `You chose: ${e.answer.label}${e.answer.auto ? ' (by itself)' : ''}` : e.body;
    return {
      id: `msg${e.id}`,
      label: `${e.read ? '' : '● '}${e.title}`,
      sub: `${(sub ?? '').slice(0, 90)}${(sub ?? '').length > 90 ? '…' : ''}`,
      icon: e.art ?? e.icon ?? 'dev_ui_05',
      accent: open ? COL.action : e.read ? COL.progress : COL.purple,
      onTap: () => {
        N.markRead(e.id);
        if (e.kind === 'choice') openMenu('event', e.data.uid);
        else openMenu('message', e.id);
      },
    };
  };
  return {
    title: 'Inbox',
    subtitle: `${N.unread} unread · ${N.inbox.length} message${N.inbox.length === 1 ? '' : 's'}`,
    accent: COL.progress,
    sections: [
      ...(waiting.length ? [{ title: 'Waiting for you', columns: 1, buttons: waiting.map(row) }] : []),
      { title: 'Messages', columns: 1, buttons: rest.length ? rest.map(row) : [{ id: 'none', label: 'No messages yet', sub: 'News, events and big moments arrive here.', disabled: true }] },
      ...(N.unread ? [{ columns: 1, buttons: [{ id: 'readAll', label: 'Mark all read', accent: COL.progress, onTap: () => N.markAllRead() }] }] : []),
    ],
  };
});
// Milestone 28: the Rumour Archive and (debug) the why-false inspector.
const rumourScreen = createRumourScreen({ layout, assets, topBar: subTopBar, secrets, onWhy: DEBUG_SECRETS ? (id) => openMenu('secretWhy', id) : null });
menus.register('secretWhy', (id) => {
  const w = secrets.why(id);
  if (!w) return null;
  return { title: `Why not? ${w.name}`, subtitle: `${w.ok ? 'All conditions hold' : `${w.failing.length} failing`} · clue stage ${w.stage} · checked on ${w.triggers.join(', ')}${w.eased ? ' · eased' : ''}`, art: 'dev_ui_29', accent: COL.progress, sections: [{ lines: w.lines.map((l) => ({ text: `${l.ok ? '✓' : '✗'} ${l.text}`, color: l.ok ? COL.good : COL.bad })) }] };
});
bus.on('secret:unlocked', ({ rule }) => showBeat({ title: `Secret found: ${rule.name}`, body: `${rule.rewardText ?? 'See Compete → Rumour Archive.'}` }));
// Milestone 32: the Achievements and Hall of Fame screens and their banners.
const achievementsScreen = createAchievementsScreen({ layout, assets, topBar: subTopBar, achievements });
const hallOfFameScreen = createHallOfFameScreen({ layout, assets, topBar: subTopBar, achievements, museum: () => !!world.stationById('F33') });
bus.on('achievement:unlocked', ({ def }) => showBeat({ title: `Achievement: ${def.name}`, body: def.text }));
bus.on('halloffame:entry', ({ entry }) => showBeat({ title: `Hall of Fame: ${entry.name}`, body: entry.why.join(' · ') }));
// Milestone 31: PROJECT ONE / PROJECT X (the templates) and Studio Singularity (the true ending).
const prestige = createPrestige({ clock, world, projects, secrets, awards: () => awards, hardware: () => hardware, profile: () => profile, lanes });
// ---------------------------------------------------------------------------
// Milestone 33: the Year-20 ending (always, whatever the grade) and New Game+.
const ending = createEnding({ bus, clock, world, projects, business, research, engines: () => engines, global: () => global, awards: () => awards, combos: () => combos, secrets: () => secrets, consoles: () => consoles, profile: () => profile, debug: log });
const ngplus = createNgPlus({ bus, clock, world, business, research, projects, profile, secrets, combos, achievements, recruitment, shop, engines: () => engines, sponsors: () => sponsors, publishers: () => publishers, contracts: () => contracts, consoles: () => consoles, global: () => global, runId: () => business.marketing.seed, saveAccount: (data) => accountStore?.set(SAVE.legacyAccountKey, data).catch((e) => console.error('[DEVWORKS] legacy account save failed', e)) });
bus.on('campaign:ending', () => {
  const r = ending.result;
  if (!r) return;
  profile.setEnding({ band: r.grade.band, total: r.grade.total, title: r.title });
  ngplus.noteEnding(r); // the account's legacy summary
  studioEvents.note({ title: `Year-20 ending: grade ${r.grade.band}`, body: `${r.grade.total} / ${r.grade.max} · ${r.title}`, level: 'major', read: true });
});
// The ceremony opens as soon as nothing else is on screen (C10's own moment first), with the clock stopped.
function endingWatch() {
  if (!ending.pending || ['ending', 'ngplus', 'setup'].includes(router.currentName) || feedback.active || dialog.active || textPrompt.active) return;
  sheet.close();
  clock.pause();
  router.go('ending');
}
const endingCredits = () => {
  const f = profile.data?.founder;
  const founderName = f ? (staffDefById(f.id)?.name ?? f.id) : '';
  return [
    { heading: profile.name || 'Your studio', names: [`Studio Director ${profile.data?.director ?? ''}`, ...(founderName ? [`Founding Developer ${founderName}`] : [])] },
    { heading: 'The team', names: world.staffSystem.staff.filter((s) => s.id !== f?.id).map((s) => s.name) },
    { heading: 'DEVWORKS', names: ['A Banx Gamex game', 'Canvas Management Series'] },
  ];
};
const endingScreen = createEndingScreen({
  layout,
  assets,
  ending,
  credits: endingCredits,
  ngLevel: () => ngplus.offer().level,
  // The offer: the finished run is saved here (ending included); starting NG+ never writes it again.
  onOffer: () => {
    if (ending.stage === 'ceremony') ending.setStage('offer');
    autosave.request('ending');
  },
  onContinue: () => {
    ending.continuePostgame();
    autosave.request('ending');
    router.go('studio');
    showBeat({ title: 'Postgame', body: 'The years keep counting. New Game+ waits in Business → Studio.' });
  },
  onNgPlus: () => router.go('ngplus'),
});
let pendingNg = null; // { slot, choices } from the NG+ slot pick until START STUDIO
const ngplusScreen = createNgPlusScreen({
  layout,
  assets,
  topBar: subTopBar,
  ngplus,
  slots: () => slotCards,
  parentSlot: () => slotIndex,
  confirm: (o) => dialog.confirm(o),
  onChoose: (i, choices) => {
    pendingNg = { slot: i, choices };
    const d = profile.data;
    router.go('setup', { slot: i, ngPlus: ngplus.offer().level, prefill: { studio: d?.name ?? '', director: d?.director ?? '', colour: d?.colour, founder: d?.founder?.id } });
  },
});
// START STUDIO for an NG+ run: the package is built from the finished run, which is never saved again from here (it
// stays in its slot byte for byte), then the page reloads into the new slot (no state crosses between studios).
async function startNgPlusRun(i, setup) {
  const ng = pendingNg;
  pendingNg = null;
  await refreshSlots(); // the slot cards the NG+ screen showed are current
  const carry = ngplus.buildCarry(ng.choices, { slot: slotIndex, grade: ending.result?.grade?.band ?? null });
  // Every account record written now (the new run reads them after the reload).
  await Promise.all([accountStore?.set(SAVE.secretsAccountKey, secrets.serializeAccount()), accountStore?.set(SAVE.achievementsKey, achievements.serializeAccount()), accountStore?.set(SAVE.accountKey, combos.serializeAccount()), accountStore?.set(SAVE.legacyAccountKey, ngplus.serializeAccount())].map((x) => x?.catch?.((e) => console.error('[DEVWORKS] account save before NG+ failed', e))));
  slot = null; // nothing writes the parent slot again
  started = false;
  reloadInto({ action: 'new', slot: i, setup, carry });
}
const yearEnding = () => (ending.reached && !ending.pending ? { sub: `Grade ${ending.result?.grade?.band ?? '?'} · start NG+${ngplus.offer().level} in another slot`, onTap: () => { sheet.close(); clock.pause(); router.go('ending', { step: 'offer' }); } } : null);
const peakLines = (why, parts) => [...parts, why ? { text: why, color: COL.bad } : { text: 'Everything is in place.', color: COL.good }];
menus.register('projectOne', () => {
  const why = prestige.projectOneWhy();
  return { title: 'PROJECT ONE', subtitle: 'The ultimate game (NG+3)', art: PROJECT_ONE.cover, accent: COL.purple, sections: [{ lines: peakLines(why, ['RPG + Science Fiction + Management + Neural Tools + Mixed Media + User Creation, at Mega scope.', `Your ${PROJECT_ONE.prestigeStaff} Prestige people lead it with the rest of the free team. Launch it with at most ${PROJECT_ONE.maxBugs} bugs.`]) }, { columns: 1, buttons: [{ id: 'start', label: 'Start PROJECT ONE', sub: why ?? 'Premium audio, balanced budget', disabled: !!why, accent: COL.good, onTap: () => { const r = prestige.startProjectOne(studioRng); sheet.close(); if (!r.ok) showTip(r.why); else showBeat({ title: 'PROJECT ONE has begun', body: 'The whole studio is on it.' }); } }] }] };
});
menus.register('projectX', () => {
  const why = prestige.projectXWhy();
  return { title: 'PROJECT X', subtitle: 'The ultimate console (NG+3)', art: 'console_visual_08', accent: COL.purple, sections: [{ lines: peakLines(why, ['All six Prestige parts: Neural CPU, Render Core, Memory Fabric, Crystal Storage, Haptic Deck, Adaptive OS.', 'Build the prototype at the lab, then launch it from the Console Portfolio.']) }, { columns: 1, buttons: [{ id: 'design', label: 'Design PROJECT X', sub: why ?? 'Opens Hardware with the six parts', disabled: !!why, accent: COL.good, onTap: () => { const r = prestige.designProjectX(); sheet.close(); if (!r.ok) showTip(r.why); else router.go('hardware'); } }] }] };
});
bus.on('secret:unlocked', ({ rule }) => {
  if (rule.id === 'SEC-X-02') prestigeMoment({ title: 'PROJECT ONE', subtitle: 'The ultimate game is out. The software hidden ending is yours — and 5 Prestige Tokens.', art: 'dev_event_17', badge: PROJECT_ONE.cover });
  if (rule.id === 'SEC-HW-06') prestigeMoment({ title: 'PROJECT X', subtitle: 'The ultimate console is in the shops. The hardware hidden ending is yours.', art: 'dev_event_18', badge: 'console_visual_08' });
  if (rule.id === 'SEC-X-03') prestigeMoment({ title: 'Studio Singularity', subtitle: 'Both peaks in one lifetime. The true hidden ending — and the account crown, forever.', art: 'dev_event_19', badge: 'dev_vfx_12' });
});
// Milestone 30: a big moment with a picture (the Ghostlight reveal, C11, C12).
function prestigeMoment({ title, subtitle, art, badge = null }) {
  feedback.show({
    title,
    subtitle,
    accent: COL.purple,
    onShow: () => celebrate.confetti('screen', W / 2, renderer.height * 0.72, { count: 40, speed: 900, spreadX: 120 }),
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const k = Math.min(1, t / 0.35);
      const size = 540 * (0.6 + 0.4 * k);
      ctx.save();
      ctx.globalAlpha = k;
      assets.drawContained(ctx, art, { x: W / 2 - size / 2, y: sr.y + sr.h * 0.27 - size / 2, w: size, h: size });
      if (badge) {
        const p = 190 * (0.6 + 0.4 * k);
        assets.drawContained(ctx, badge, { x: W / 2 - p / 2, y: sr.y + sr.h * 0.27 + size / 2 - p * 0.35, w: p, h: p });
      }
      ctx.restore();
    },
    onAck: afterFeedback,
  });
}
bus.on('secret:unlocked', ({ rule }) => {
  if (rule.id === 'SEC-RIVAL-01') prestigeMoment({ title: 'Ghostlight Studio appears', subtitle: 'A secret rival that targets your strengths now releases prestige titles. See Compete → Rivals.', art: 'dev_event_14', badge: 'rival_logo_r08' });
});
// C11 / C12 wins: Prestige Tokens (once per year won, never twice even after a reload) and the software endgame flag.
bus.on('award:won', ({ award: a, result }) => {
  if (a.id !== 'C11' && a.id !== 'C12') return;
  if (a.tokens) secrets.grantOnce(`award:${a.id}:Y${result.year}:${business.marketing.seed}`, () => secrets.addTokens(a.tokens));
  if (a.id === 'C12') secrets.grantOnce(`award:C12:softwareEndgame`, () => secrets.setOpened('unlocks', 'softwareEndgame'));
  prestigeMoment({ title: `${a.name}!`, subtitle: `"${result.entrants[0].title}" wins. ${a.rewardText}. Prestige Tokens: ${secrets.prestigeTokens}.`, art: a.event, badge: a.trophy });
});
// Milestone 29: a Legendary / Prestige arrival — the big moment (dev_event_13 and their portrait) and a special card for 56 days.
bus.on('secret:arrival', ({ staffId }) => {
  const def = staffDefById(staffId);
  if (!def) return;
  recruitment.specialArrival(staffId, `${def.tier === 'secret' ? 'Prestige' : 'Legendary'} arrival: a secret brought them here`);
  feedback.show({
    title: `${def.name} wants to join!`,
    subtitle: `A ${def.tier === 'secret' ? 'Prestige' : 'Legendary'} ${def.role === 'PRG' ? 'Programmer' : def.role === 'DSN' ? 'Designer' : def.role === 'ART' ? 'Artist' : def.role === 'WRT' ? 'Writer' : 'Producer'} is on the Recruitment board for 56 days.`,
    accent: COL.gold,
    onShow: () => celebrate.confetti('screen', W / 2, renderer.height * 0.72, { count: 40, speed: 900, spreadX: 120 }),
    drawFn: (ctx, t) => {
      const sr = layout.safeRect;
      const k = Math.min(1, t / 0.35);
      const size = 520 * (0.6 + 0.4 * k);
      ctx.save();
      ctx.globalAlpha = k;
      assets.drawContained(ctx, 'dev_event_13', { x: W / 2 - size / 2, y: sr.y + sr.h * 0.26 - size / 2, w: size, h: size });
      const p = 200 * (0.6 + 0.4 * k);
      drawPortrait(ctx, assets, def.art, { x: W / 2 - p / 2, y: sr.y + sr.h * 0.26 + size / 2 - p * 0.3, w: p, h: p }, COL.gold);
      ctx.restore();
    },
    onAck: afterFeedback,
  });
});
bus.on('secret:clue', ({ rule, stage }) => studioEvents.note({ title: 'A new rumour', body: rule.clueStages?.[stage - 1]?.text ?? '', icon: 'dev_ui_29' }));
// Milestone 26: Early Access banners.
bus.on('ea:started', ({ record }) => {
  showBeat({ title: `${record.result.title} is in Early Access`, body: 'Players buy it early and report bugs. Full launch from Create when it is ready.' });
});
bus.on('ea:month', ({ record, fixed, trust }) => {
  showBeat({ title: `Early Access: ${record.result.title}`, body: `${fixed} bug${fixed === 1 ? '' : 's'} fixed from player reports${trust ? ` · fans are impatient: Fan Trust −${trust}` : ''}` });
});
// Milestone 25: a revision and a retired generation are banners.
bus.on('console:revised', ({ console: c }) => {
  showBeat({ title: `${consoles.modelName(c)} is on sale`, body: `${CONSOLE.revisions[c.revision.kind].line}` });
});
bus.on('console:retired', ({ console: c }) => {
  showBeat({ title: `${consoles.modelName(c)} retired`, body: `${c.sold.toLocaleString('en-GB')} sold in its life · see Create → Consoles` });
});
bus.on('console:verdict', ({ console: c, verdict }) => {
  showBeat({ title: `${c.name} after a year: ${verdict === 'hit' ? 'a hit!' : verdict === 'flop' ? 'a flop' : 'steady'}`, body: `${c.installBase.toLocaleString('en-GB')} players · see Create → Consoles` });
});
// Global business banners (Milestone 21).
bus.on('licence:signed', ({ licence }) => {
  showBeat({ title: `Engine licensed to ${licence.customer}`, body: `${licence.label}: fees every month for a year` });
});
bus.on('external:released', ({ project }) => {
  showBeat({ title: `${project.studio}'s game is out: review ${project.result.review}`, body: `Your share: ${project.result.share.toLocaleString('en-GB')} Credits over the next months` });
});
bus.on('acquisition:offered', ({ target }) => {
  showBeat({ title: `${target.studio} is for sale`, body: 'See Business → Acquisitions.' });
});
bus.on('acquisition:done', ({ target }) => {
  showBeat({ title: `You bought ${target.studio}!`, body: target.line });
});
// Sponsor banners (Milestone 18).
bus.on('sponsor:signed', ({ deal }) => {
  showBeat({ title: `Sponsor signed: ${sponsorName(deal.id)}`, body: 'A stipend every month for 6 months. See its obligation in Business → Sponsors.' });
});
bus.on('sponsor:ended', ({ deal, met, bonus, tier }) => {
  showBeat({ title: `${sponsorName(deal.id)}: deal ${met ? 'completed' : 'ended'}`, body: met ? `+${bonus.toLocaleString('en-GB')} Credits bonus · now ${tier.name}` : 'Obligation not met: no bonus this time.' });
});
// Engine banners (Milestone 16).
bus.on('engine:start', ({ job }) => {
  showBeat({ title: `Engine project started`, body: job.name });
});
bus.on('engine:complete', ({ job, version, kind }) => {
  showBeat({ title: version ? `${job.data.name} ${version.label} ready!` : `${job.name} done`, body: version ? 'Pick it on New Game → Engine.' : kind === 'researchPrototype' ? 'Research points gained.' : '' });
});
// A marketing action starts: a short banner.
bus.on('marketing:run', ({ action, gain, title }) => {
  showBeat({ title: `${action.name} started`, body: `${title}: +${Math.round(gain)} Hype over ${action.days} days` });
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
  if (settings.get('reducedMotion')) return; // Milestone 34
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
  showBeat({ title: `${staff.name} joined!`, body: `They're walking in to the ${station?.def.name ?? 'studio'}.` });
});
bus.on('staff:letGo', ({ name }) => {
  showBeat({ title: `${name} left the studio`, body: 'Their career record stays in the studio history.' });
});
bus.on('training:complete', ({ staff, course, gains }) => {
  const g = Object.entries(gains).map(([k, v]) => `${STATS.find((x) => x.key === k)?.label ?? k} +${v}`).join(', ');
  showBeat({ title: `${staff.name} finished ${course.name}`, body: g || 'Already at the tier cap' });
});
bus.on('mentor:tag', ({ mentor, mentee, trait }) => {
  showBeat({ title: `${mentee.name} learned ${TRAITS[trait]?.name ?? trait}`, body: `From their mentor ${mentor.name}.` });
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
  advanced: () => settings.get('statsMode') === 'advanced', // Milestone 34
  legacy: (id) => profile.isLegacy(id), // Milestone 33
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
  showBeat({ title: 'Sent to certification', body: `${record.result.title} launches ${clock.shortLabel(record.cert.launchDay)}` });
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
const awardsScreen = createAwardsScreen({ prestigeTokens: () => secrets.prestigeTokens, layout, assets, topBar: subTopBar, awards, dateLabel: (d) => clock.shortLabel(d), monthLabel });
const rivalsScreen = createRivalsScreen({ layout, assets, topBar: subTopBar, rivals, clock, monthLabel });
const rankingsScreen = createRankingsScreen({ layout, assets, topBar: subTopBar, awards, rivals });
// Milestone 23: the Hardware screen (Rename opens the text box over its button).
const hardwareScreen = createHardwareScreen({
  layout,
  assets,
  topBar: subTopBar,
  hardware,
  dateLabel: (d) => clock.shortLabel(d),
  openPick: (slot) => openMenu('hwPick', slot),
  openBuild: () => openMenu('hwBuild'),
  openConsoles: (id) => {
    consoles.setPlan('prototypeId', id);
    router.go('consoles');
  },
  onRename: () => {
    const rect = hardwareScreen.buttonRect('design:rename');
    if (rect) textPrompt.open({ rect, value: hardware.draft.family, maxLength: 24, placeholder: 'Console family', onDone: (v) => hardware.rename(v) });
  },
});
// Milestone 24: the Console Portfolio.
const consoleScreen = createConsoleScreen({ layout, assets, topBar: subTopBar, consoles, projects, dateLabel: (d) => clock.shortLabel(d), onLaunch: () => { const r = consoles.launch(); if (!r.ok) showTip(r.why); }, onRecover: (id) => { const r = consoles.recover(id); if (!r.ok) showTip(r.why); }, onRevise: (kind) => { const r = consoles.revise(kind); if (!r.ok) showTip(r.why); }, onDesignNext: (c) => { hardware.designNext(c.family, c.parts); router.go('hardware'); } });
// Milestone 21: the global business screens.
const licensingScreen = createLicensingScreen({ layout, assets, topBar: subTopBar, global, dateLabel: (d) => clock.shortLabel(d), onSign: (id) => { const r = global.signLicence(id); if (!r.ok) showTip(r.why); }, onDecline: (id) => global.declineLicence(id) });
const publishingOfficeScreen = createPublishingOfficeScreen({ layout, assets, topBar: subTopBar, global, dateLabel: (d) => clock.shortLabel(d), onChoose: (id, choice) => { const r = global.fund(id, choice); if (!r.ok) showTip(r.why); } });
const acquisitionsScreen = createAcquisitionsScreen({ layout, assets, topBar: subTopBar, global, dateLabel: (d) => clock.shortLabel(d), onBuy: () => { const r = global.acquire(); if (!r.ok) showTip(r.why); }, onDecline: () => global.declineAcquisition(), nameOf: (a) => (a.ipId ? `${business.franchises.byId(a.ipId)?.name} joined your franchises` : a.staffId ? `${staffDefById(a.staffId)?.name} came to the recruitment board` : null) });
const discoveryScreen = createDiscoveryScreen({ layout, assets, combos, topBar: subTopBar }); // Milestone 15
const researchScreen = createResearchScreen({ layout, assets, research, topBar: subTopBar, openDiscoveries: () => router.go('discoveries'), debugFinish: new URLSearchParams(window.location.search).has('debug') ? (b) => { for (const r of RESEARCH_LIST().filter((x) => x.branch === b)) research.complete(r.id); } : null });
const archiveScreen = createFranchiseArchiveScreen({ layout, assets, business, projects, topBar: subTopBar, textPrompt });

// ---------------------------------------------------------------------------
// Milestone 34: the first-run guide (coach marks from the empty studio to the first released, reviewed game), the
// one-time hint cards of the advanced screens, Help, Settings, the Store stub, the Project Board and the splash.
const GUIDE_OFF_SCREENS = ['title', 'setup', 'splash', 'boot', 'ending', 'ngplus', 'help', 'settings', 'store', 'test', 'route'];
const sheetButtons = () => (sheet.menu?.sections ?? []).flatMap((s) => s.buttons ?? []);
function guideTarget(name) {
  if (!name) return null;
  const onStudio = router.currentName === 'studio' && !studio.buildMode;
  if (name === 'founder') return onStudio && !sheet.active ? studio.workerScreenRect(profile.data?.founder?.id, { show: true }) : null;
  if (name === 'back') return router.currentName === 'staff' ? subTopBar.backRect() : null;
  if (name === 'create') return onStudio && !sheet.active ? bottomBar.buttonRect('create') : null;
  if (name === 'releasePath') {
    if (!onStudio) return null;
    if (!sheet.active) return bottomBar.buttonRect('create');
    if (sheet.t < 0.3) return null;
    const id = sheetButtons().find((b) => b.id === 'release')?.id ?? sheetButtons().find((b) => /^released+$/.test(b.id))?.id;
    if (!id) return null;
    sheet.scrollTo?.(id);
    return sheet.buttonRect(id);
  }
  if (name === 'speed') return onStudio && !sheet.active ? topBar.buttons().find((b) => b.id === 'speed1')?.rect ?? null : null;
  if (name.startsWith('sheet:')) {
    if (!sheet.active || sheet.t < 0.3) return null;
    const want = name.endsWith('*') ? sheetButtons().find((b) => /^release\d+$/.test(b.id))?.id : name.slice(6);
    if (!want || !sheetButtons().some((b) => b.id === want)) return null;
    sheet.scrollTo?.(want);
    return sheet.buttonRect(want);
  }
  if (router.currentName !== 'newProject' || sheet.active) return null;
  if (name === 'recipe') return newProject.rectOf('genre');
  if (name === 'title') return newProject.rectOf('title');
  if (name === 'start') return newProject.startRect();
  return null;
}
function guideFill(step) {
  const f = profile.data?.founder;
  const name = (f && staffDefById(f.id)?.name) || 'your Founder';
  const sub = (t) => t.split('{founderFirst}').join(name.split(' ')[0]).split('{founder}').join(name);
  return { ...step, title: sub(step.title), text: sub(step.text) };
}
const guide = new GuideSystem({
  steps: GUIDE_STEPS,
  bus,
  targetRect: guideTarget,
  screen: () => router.currentName,
  canShow: () => started && !feedback.active && !dialog.active && !textPrompt.active && !GUIDE_OFF_SCREENS.includes(router.currentName),
  pause: () => {
    if (clock.paused) return false;
    clock.pause();
    return true;
  },
  resume: () => clock.resume(),
});
const coach = new CoachMark({ layout, assets, face: GUIDE_FACE });
router.layers.unshift({
  get active() {
    return started && guide.active;
  },
  handleInput: (hook, p) => guide.handleInput(hook, p, hook === 'onTap' ? coach.hit(p) : null),
});
// A run loads its guide; one from before Milestone 34 that has made games already has nothing left to learn.
let hintsSeen = [];
function loadGuide(data, experienced = false) {
  guide.reset();
  hintsSeen = [...(data?.hints ?? [])];
  if (data) guide.load(data);
  else if (experienced) for (const s of GUIDE_STEPS) guide.state.done.push(s.id);
}
bus.on('guide:done', () => autosave.request('guide'));
// "Everything is filled in": the New Game screen is ready to start (the Start step waits for it).
let readySent = false;
bus.on('screen:change', () => (readySent = false));
// One-time hint cards (never a wall): the first time an advanced screen opens, a card with "Got it".
let pendingHint = null;
bus.on('screen:change', ({ to }) => {
  if (started && SCREEN_HINTS[to] && !hintsSeen.includes(to)) pendingHint = to;
});
function guideWatch() {
  if (!readySent && router.currentName === 'newProject' && newProject.ready) {
    readySent = true;
    bus.emit('guide:projectReady', {});
  }
  if (!pendingHint) return;
  if (router.currentName !== pendingHint) return void (pendingHint = null);
  if (guide.active || feedback.active || dialog.active || sheet.active) return;
  const h = SCREEN_HINTS[pendingHint];
  hintsSeen.push(pendingHint);
  pendingHint = null;
  dialog.show({ title: h.title, body: h.text, buttons: [{ id: 'ok', label: 'Got it', accent: COL.progress }] });
}
// Help (top bar): the topics, and every tip and hint card seen so far.
const helpGuide = {
  get seenSteps() {
    return [...guide.seenSteps.map(guideFill), ...hintsSeen.map((id) => ({ id: `hint-${id}`, ...SCREEN_HINTS[id] }))];
  },
  get state() {
    return guide.state;
  },
  turnOn: () => guide.turnOn(),
  turnOff: () => guide.turnOff(),
};
const helpScreen = createHelpArchive({ renderer, layout, assets, router, guide: helpGuide, topics: HELP_TOPICS, text: HELP_TEXT, icon: 'dev_ui_05' });
const settingsScreen = createSettingsScreen({ layout, assets, settings, onBack: () => router.back() });
const storeScreen = createStoreScreen({ layout, assets, onBack: () => router.back() });
const projectBoard = createProjectBoardScreen({ layout, assets, topBar: subTopBar, projects, business, lanes, onOpen: (id) => router.go('project', { id }), onRelease: (n) => openMenu('release', n), onNew: () => router.go('newProject') });
// Effects the Visual settings turn down (Reduced flashes / Low effects: no confetti; Low effects: no sparks or pops).
{
  const confetti = celebrate.confetti.bind(celebrate);
  celebrate.confetti = (...a) => (settings.get('reducedFlashes') || settings.get('lowVfx') ? null : confetti(...a));
  for (const k of ['sparks', 'pulse']) {
    const fn = vfx[k].bind(vfx);
    vfx[k] = (...a) => (settings.get('lowVfx') ? null : fn(...a));
  }
}
// The Banx Gamex splash (the dark logo) before loading, skippable by tap.
const splashScreen = createStudioSplash({
  renderer,
  assets,
  key: 'studio_logo_banx_gamex_dark',
  waitForArt: 10, // a slow first load still gets the logo
  prepare: () => assets.loadImage('studio_logo_banx_gamex_dark', ASSETS.studio_logo_banx_gamex_dark),
  drawNext: (ctx) => bootScreen.render(ctx),
  onDone: () => router.go('boot'),
});

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
  // Milestone 22: a full Global Campus (every facility that fits, 32 staff) for the readability checks.
  const debugFullStudio = () => {
    world.setStage(5);
    for (const fac of FACILITIES) if (!fac.unlock?.secret) world.addStation(fac.id);
    for (const d of ALL_STAFF) if (world.workers.length < stageById(5).staffCap) recruitment.debugJoin(d.id);
    return { staff: world.workers.length, stations: world.stations.length };
  };
  window.__dw = { openMenu, guide, coach, guideTarget, guideFill, helpScreen, settingsScreen, storeScreen, projectBoard, settings, splashScreen, get hintsSeen() { return hintsSeen; }, ending, ngplus, endingScreen, ngplusScreen, startNgPlusRun, get pendingNg() { return pendingNg; }, get accountStore() { return accountStore; }, achievements, achievementsScreen, hallOfFameScreen, secrets, rumourScreen, studioEvents, showBeat, eventFlow: () => eventFlow, distribution, consoles, consoleScreen, hardware, hardwareScreen, debugFullStudio, global, licensingScreen, publishingOfficeScreen, acquisitionsScreen, support, rivals, awards, awardsScreen, rivalsScreen, rankingsScreen, sponsors, sponsorsScreen, publishers, contracts, publishersScreen, contractsScreen, engines, engineScreen, combos, discoveryScreen, recruitment, training, staffActions, confirmLetGo, research, researchScreen, shop, archiveScreen, marketingScreen, checkStations, platformScreen, skipYear, decideNow, elements, renderer, layout, input, loop, router, assets, sheet, systemBack, clock, world, projects, business, ledger, catalogueScreen, floatFeed, vfx, celebrate, devPops, shipped, get beat() { return beat; }, get tip() { return tip; }, feedback, newProject, projectScreen, textPrompt, studioRng, studio, roster, staffDetail, topBar, subTopBar, bottomBar, autosave, badgeFor, get slot() { return slot; }, taps: [], profile, dialog, titleScreen, setupScreen, playSlot, startStudio, toTitle, deleteSlot, refreshSlots, get slots() { return slots; }, get slotIndex() { return slotIndex; }, get slotCards() { return slotCards; }, get started() { return started; } };
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
  .register('hardware', hardwareScreen)
  .register('consoles', consoleScreen)
  .register('rumours', rumourScreen) // Milestone 28
  .register('achievements', achievementsScreen) // Milestone 32
  .register('hallOfFame', hallOfFameScreen)
  .register('ending', endingScreen) // Milestone 33
  .register('splash', splashScreen) // Milestone 34
  .register('help', helpScreen)
  .register('settings', settingsScreen)
  .register('store', storeScreen)
  .register('projects', projectBoard)
  .register('ngplus', ngplusScreen)
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

// Milestone 34: the Banx Gamex splash on a cold start; straight to loading after a reload into a slot.
let reloadIntent = false;
try {
  reloadIntent = !!sessionStorage.getItem(INTENT_KEY);
} catch {
  reloadIntent = false;
}
router.go(reloadIntent || START_SCREEN === 'test' ? 'boot' : 'splash');
loop.start();
