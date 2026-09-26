// DEVWORKS — boot.
// Starts the shared series engine from core/, loads the save (or starts a new studio) and opens the studio.
// Milestone 3: game projects (New Game Project, the active project view, "Game finished!").
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
import { SaveSlot } from '../../../core/SaveStore.js';
import { Autosave } from '../../../core/Autosave.js';
import { MajorFeedback } from '../../../core/MajorFeedback.js';
import { TextPrompt } from '../../../core/ui/TextPrompt.js';
import { BottomSheet } from '../../../core/ui/BottomSheet.js';
import { createTopBar } from '../../../core/ui/TopBar.js';
import { createBottomBar } from '../../../core/ui/BottomBar.js';
import { drawButton, hitRect, setPressPoint, clearPress } from '../../../core/ui/Button.js';
import { ASSETS } from '../data/assets.js';
import { CALENDAR, START_WALLET } from '../data/balance.js';
import { BOTTOM_SLOTS, TOP_ICONS, BADGES } from '../data/home.js';
import { SAVE } from '../data/save.js';
import { STARTING_UNLOCKED, FAMILIES, elementById } from '../data/elements.js';
import { SCOPES } from '../data/projects.js';
import { STATIONS } from '../data/studio.js';
import { createStudioWorld } from './systems/studioWorld.js';
import { createGameProjects } from './systems/gameProject.js';
import { createStudioScreen } from './screens/StudioScreen.js';
import { createRosterScreen } from './screens/RosterScreen.js';
import { createStaffDetailScreen } from './screens/StaffDetailScreen.js';
import { createNewProjectScreen } from './screens/NewProjectScreen.js';
import { createProjectScreen } from './screens/ProjectScreen.js';
import { drawCover, drawOutputs } from './ui/gameCard.js';
import { createTestScreen } from './screens/TestScreen.js';
import { createRouteTestScreen } from './screens/RouteTestScreen.js';
import { createStudioMenus } from './ui/studioMenus.js';
import { registerPlaceholders } from './ui/placeholders.js';
const COL = THEME.color;

const W = 1080;
const BASE_H = 1920; // 9:16; taller phones grow the height (see Renderer)
const MAX_H = 2640; // up to 9:22 fills edge to edge; taller still gets thin bars top and bottom
const START_SCREEN = new URLSearchParams(window.location.search).get('screen') === 'test' ? 'test' : 'studio';
const TEST_SCREENS = ['test', 'route']; // the Milestone 0 screens: pause button, full debug box
const WORLD_SCREENS = ['studio', 'roster', 'staff', 'newProject', 'project']; // where the top bar's Pause / speeds apply

const bus = new EventBus();
const rng = new Rng('devworks-m0');
const renderer = new Renderer(document.getElementById('game'), { width: W, height: BASE_H, maxHeight: MAX_H, maxDpr: 2, bus });
const layout = new UiLayout(renderer);
bus.on('renderer:resize', () => layout.refresh());
const input = new Input(renderer, bus);
const assets = new AssetManager({ bus });
const router = new ScreenRouter(bus, { roots: ['studio', 'test'] });
const sheet = new BottomSheet({ layout, assets, onClose: () => studio.selection.clear() });
registerPlaceholders(assets); // stand-ins for art not drawn yet

// The calendar (bible §4) and the studio. The studio runs on every world screen, at the top bar's speed.
const clock = new Clock({ bus, ...CALENDAR });
const log = { log: (m) => debug.log(m) };
const studioRng = new Rng('devworks-studio'); // the run's seeded randomness (saved with the studio)
const world = createStudioWorld({ bus, rng: studioRng, debug: log });
// Game projects work each day after the studio has settled Energy and breaks (so created after the world).
const projects = createGameProjects({ bus, world, clock, daysPerMonth: CALENDAR.daysPerMonth });
let unlocked = new Set(STARTING_UNLOCKED); // open recipe elements (research opens more from Milestone 6)
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
    }
    router.update(dt);
    sheet.update(dt);
    feedback.height = renderer.height;
    feedback.update(dt);
  },
  render: (alpha) => {
    const ctx = renderer.begin(COL.bg);
    router.render(ctx, alpha);
    sheet.render(ctx);
    feedback.render(ctx);
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
router.modal = {
  get active() {
    return loop.paused || feedback.active;
  },
  onTap: () => (loop.paused ? loop.resume('tap') : feedback.onTap()),
  onBack: () => (loop.paused ? loop.resume('back') : feedback.acknowledge()),
};
window.addEventListener('keydown', (e) => {
  if (e.key !== 'p' && e.key !== 'P' && e.key !== ' ') return;
  if (textPrompt.active || feedback.active) return;
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
  open: (kind) => openMenu(kind),
  projects: () => projects,
  newGame: () => router.go('newProject'),
  openProject: () => router.go('project'),
  isUnlocked: (id) => unlocked.has(id),
  picked: (family) => newProject.setup?.recipe[family] ?? null,
  onPick: (family, id) => {
    newProject.choose(family, id);
    sheet.close();
  },
});
function openMenu(kind) {
  const build = menus.for(kind);
  if (build) sheet.open(build);
}
const openStaff = (id) => router.go('staff', { id });
// Tapping a station: the Starter Desks open the game in the works when there is one; otherwise the station's sheet.
const openStation = (id) => (id === makerId && projects.active ? router.go('project') : openMenu(id));
const textPrompt = new TextPrompt({ renderer });
bus.on('screen:change', () => textPrompt.close());
bus.on('renderer:resize', () => textPrompt.close());
bus.on('screen:change', () => sheet.close());

// Red attention badges (data/home.js BADGES), plus the ?debug=1 toggle that lights them all.
let debugBadges = false;
const BADGE_RULES = {
  lowCondition: () => world.workers.filter((w) => w.staff.status.tired || w.staff.status.stressed).length,
};
const badgeFor = (id) => (debugBadges ? (id === 'inbox' ? 1 : '!') : BADGE_RULES[BADGES[id]]?.() || null);

// The bars (core/ui). The studio's top bar is the home one; the Roster and staff cards get a "‹ Back" in it.
const topBarOptions = {
  layout,
  assets,
  clock,
  stats: () => [
    { icon: TOP_ICONS.credits, text: START_WALLET.credits.toLocaleString('en-GB') },
    { icon: TOP_ICONS.tokens, text: String(START_WALLET.tokens), gap: 20 },
    { text: `Rank ${START_WALLET.rank}` },
  ],
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
  open: (id) => (id === 'staff' ? router.go('roster') : openMenu(id)),
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
// Saving: its own database; the last 3 saves kept; saved on month ends, speed changes, moved stations, every 10 s
// of running time if anything changed, and straight away when the app goes to the background.
let slot = null;
const saveData = () => ({ clock: clock.serialize(), world: world.serialize(), games: projects.serialize(), unlocked: [...unlocked] });
const autosave = new Autosave({
  bus,
  triggers: SAVE.triggers,
  save: () => (slot && started ? slot.save(saveData()) : Promise.resolve(null)),
  stamp: () => `${clock.totalDays}|${world.stamp()}|${projects.active?.phaseProgress ?? '-'}|${projects.catalogue.count}`,
  running: () => started && !clock.paused,
  intervalMs: SAVE.intervalMs,
  enabled: () => started && !!slot,
});
autosave.installBackground();

async function loadOrStart() {
  try {
    const adapter = await createStorageAdapter({ dbName: SAVE.dbName, prefix: SAVE.localPrefix });
    slot = new SaveSlot({ adapter, key: SAVE.key, rolling: SAVE.rolling, version: SAVE.version, bus });
    const data = await slot.load();
    if (data) {
      clock.load(data.clock);
      world.load(data.world);
      projects.load(data.games); // a Milestone 2 save has none: nothing in the works, an empty catalogue
      if (data.unlocked) unlocked = new Set(data.unlocked);
      debug.log(`save loaded: day ${clock.totalDays}, ${world.workers.length} staff`);
      return;
    }
  } catch (err) {
    console.error('[DEVWORKS] could not load the save; starting a new studio', err);
    debug.log('save unreadable: new studio');
  }
  world.newGame();
  debug.log('new studio');
}

// ---------------------------------------------------------------------------
// Boot screen: shows while the images and the save load, then hands over to the studio (or the test screen).
const bootScreen = {
  progress: 0,
  enter() {
    this.progress = 0;
    Promise.all([
      assets.loadImages(ASSETS, (done, total) => (this.progress = done / total)).then((r) => debug.log(`assets: ${r.loaded} loaded, ${r.missing.length} missing`)),
      loadOrStart(),
    ]).then(() => {
      started = true;
      router.go(START_SCREEN);
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

const studio = createStudioScreen({ renderer, layout, assets, bus, world, sheet, openStation, openStaff, projectView: () => projects.view(), topBar, bottomBar, debug: log });
const newProject = createNewProjectScreen({
  layout,
  assets,
  world,
  topBar: subTopBar,
  textPrompt,
  openPicker: (family) => openMenu(`pick:${family}`),
  onStart: (setup) => {
    projects.start(setup, studioRng);
    debug.log(`project started: ${setup.title}`);
    router.go('studio');
  },
});
const projectScreen = createProjectScreen({ layout, assets, world, projects, topBar: subTopBar });

// A finished game: the big result (pauses until tapped); the game itself is already in the catalogue.
bus.on('project:complete', ({ record }) => {
  const g = record.result;
  debug.log(`game finished: ${g.title}`);
  const scope = SCOPES.find((x) => x.id === g.scope)?.name ?? '';
  feedback.show({
    title: 'Game finished!',
    subtitle: `${g.title} · ${scope} game in ${record.days} days · ${g.bugs} bug${g.bugs === 1 ? '' : 's'} left`,
    accent: COL.good,
    drawFn: (ctx, t) => drawFinished(ctx, t, g),
    onAck: () => {
      if (speedBeforeFeedback) clock.setSpeed(speedBeforeFeedback);
      speedBeforeFeedback = null;
      if (router.currentName === 'project') router.go('studio');
    },
  });
});

// The result card over the dimmed game: the cover with the title, the six recipe icons, output stats and bugs.
function drawFinished(ctx, t, g) {
  const sr = layout.safeRect;
  const w = Math.min(sr.w - 48, 1000);
  const x = sr.x + (sr.w - w) / 2;
  const y = sr.y + 40 - Math.max(0, 1 - t / 0.3) ** 2 * 60;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 0.25);
  ctx.fillStyle = COL.panel;
  ctx.strokeStyle = COL.good;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 1010, 32);
  ctx.fill();
  ctx.stroke();
  const cover = { x: x + 32, y: y + 32, w: 336, h: 483 };
  drawCover(ctx, assets, g.cover, g.title, cover);
  const cx = cover.x + cover.w + 36;
  const cw = x + w - 32 - cx;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COL.text;
  ctx.font = font(THEME.size.heading, true);
  ctx.fillText('Recipe', cx, cover.y);
  const icon = Math.min(150, (cw - 24) / 3);
  FAMILIES.forEach((f, i) => {
    const el = elementById(g.recipe[f.id]);
    const r = { x: cx + (i % 3) * (icon + 12), y: cover.y + 64 + Math.floor(i / 3) * (icon + 50), w: icon, h: icon };
    ctx.fillStyle = COL.panelAlt;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 20);
    ctx.fill();
    if (el) assets.drawContained(ctx, el.art, { x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16 });
    ctx.fillStyle = COL.textMuted;
    ctx.font = font(22, true);
    ctx.textAlign = 'center';
    ctx.fillText(el?.name ?? '', r.x + r.w / 2, r.y + r.h + 8, r.w + 8);
    ctx.textAlign = 'left';
  });
  drawOutputs(ctx, g.outputs, g.bugs, x + 40, cover.y + cover.h + 30, w - 80, { rowH: 54 });
  ctx.restore();
}
const roster = createRosterScreen({ renderer, layout, assets, world, topBar: subTopBar, openStaff });
const staffDetail = createStaffDetailScreen({ layout, assets, world, topBar: subTopBar });

// ?debug=1: the badge toggle (bottom-left, above the bottom bar) and a test hook for automated checks.
if (debug.enabled) {
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
  window.__dw = { renderer, layout, input, loop, router, assets, sheet, systemBack, clock, world, projects, feedback, newProject, projectScreen, textPrompt, studioRng, studio, roster, staffDetail, topBar, subTopBar, bottomBar, autosave, badgeFor, get slot() { return slot; }, taps: [] };
}

router
  .register('boot', bootScreen)
  .register('studio', studio)
  .register('roster', roster)
  .register('staff', staffDetail)
  .register('newProject', newProject)
  .register('project', projectScreen)
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
