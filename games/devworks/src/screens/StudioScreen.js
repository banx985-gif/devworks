// The studio (Milestones 1–3, 5): the home screen. S1 Rented Office — one cramped room on a hidden grid, seen in the
// 3/4 "dollhouse" view, drawn by code — between the shared top bar and five-button bottom bar (core/ui).
// The starting stations (one scale for every facility), the props that dress the room, and the starters walking their
// loop (studioWorld). Drag pans, pinch/wheel zooms (clamped to the room, in the space between the bars), tapping a
// station opens its sheet (the Showcase Shelf opens the Catalogue), tapping a worker opens their staff card, and a long
// press on empty floor enters Build Mode, where any station can be dragged to a new grid spot (invalid spots show red
// and are refused; the staff re-path). Props are decoration only: never tapped, never moved.
// Milestone 5: the workers hop and sway as they walk (one hop per stride, so no sliding), bounce as they type and
// breathe as they rest (core/CharacterMotion); a small progress card floats over the Starter Desks while a game is in
// the works; the art pops (src/ui/devPops.js) draw here, in the world, through core/VfxSystem's 'world' layer; the
// released games' covers stand on the Showcase Shelf, with a tag naming each in turn.
//
// Milestone 11: the room follows the studio stage (S1–S3: a bigger floor, its own colours; rebuilt on 'studio:stage'
// and whenever the world's size differs). Build Mode's banner has a Shop button (buy a facility) and tapping a
// station there opens its facility sheet (sell it).
//
// Milestone 22: S4 / S5 (bigger floors). Readability and speed with 24–32 staff: each stage has its own zoom-out limit
// (zoomMin); name tags fade out as the view zooms far out (TAG_FADE) so a full studio stays clear; the cached floor
// keeps at most ROOM_MAX_PX pixels (a bigger floor is a little softer at full zoom) and only the part on screen is drawn.
//
// Plan space lives in the world (studioWorld); only drawing and tapping go through the IsoProjection here.
import { THEME, font } from '../../../../core/Theme.js';
import { IsoProjection } from '../../../../core/IsoProjection.js';
import { Camera } from '../../../../core/Camera.js';
import { WorldGestures } from '../../../../core/WorldGestures.js';
import { CachedLayer } from '../../../../core/CachedLayer.js';
import { Selection } from '../../../../core/Selection.js';
import { characterPose, drawCharacter } from '../../../../core/CharacterMotion.js';
import { drawIsoRoom, isoPath, wallPatch, wallPoint } from '../../../../core/IsoRoom.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { STUDIO, STUDIO_LOOK, STUDIO_WALLS, STUDIO_FLOOR, FACILITY_DRAW, SHOWCASE, DOORWAY, WALKER, WORK_STATE, BUILD_TEXT } from '../../data/studio.js';
import { STATUS_ICONS } from '../../data/home.js';
import { stageById } from '../../data/facilities.js';

const C = THEME.color;
const S = THEME.size;
let L = STUDIO_LOOK; // Milestone 11: the stage's colours over S1's
const REFUSED_SEC = 2.5; // how long a refused move's reason stays in the banner
const STATE_COLOR = { Walking: C.progress, Working: C.action, Resting: C.good };
const TAG_H = 50; // name tags: small text (28), never smaller
const TAG_FADE = { full: 0.85, gone: 0.6 }; // Milestone 22: tags fully shown at zoom ≥ full, hidden at ≤ gone
const DETAIL_STEPS = [0.6, 0.9, 1.2, 1.6]; // Milestone 22: sprite cache sizes by zoom (was always full zoom)
const ROOM_MAX_PX = 6e6; // Milestone 22: the cached floor's pixel budget (a much bigger one cost ~20 ms a frame)
const COVER_ASPECT = 336 / 483;

export function createStudioScreen({ renderer, layout, assets, bus, world, sheet, openStation, openStaff, projectView, showcase, vfx, isRunning, topBar, bottomBar, debug, sign = () => null, openShop = null, openFacility = null, labPrototype = () => null, workerIcons = () => true, workerDetail = () => ({ full: 24, every: 3 }), levelOf = () => ({ level: 1, pending: false }), stationDecor = null, shakeScale = () => 1 }) {
  const W = renderer.width;
  const { cellSize: CELL, wallH, margin } = STUDIO;
  const { halfW: HW, halfH: HH } = STUDIO.view;
  const { stations, props, workers } = world;

  // --- the room (Milestone 11: sized by the studio stage) --------------------------------------------------------
  let cols;
  let rows;
  let iso;
  let worldW;
  let worldH;
  let room;
  function buildRoom() {
    cols = world.cols;
    rows = world.rows;
    L = { ...STUDIO_LOOK, ...(stageById(world.stage).look ?? {}) };
    iso = new IsoProjection({ tileSize: CELL, halfW: HW, halfH: HH, originX: margin + rows * HW, originY: margin + wallH });
    worldW = (cols + rows) * HW + margin * 2;
    worldH = (cols + rows) * HH + wallH + margin * 2;
    room = new CachedLayer({ width: worldW, height: worldH, draw: drawRoom });
  }
  buildRoom();

  const camera = new Camera({ viewW: W, viewH: renderer.height, worldW, worldH });
  const zoomMin = () => stageById(world.stage).zoomMin ?? STUDIO.zoom.min;
  camera.minZoom = zoomMin();
  // The floor's cache scale: sharp up to full zoom, within the pixel budget.
  const roomScale = () => Math.min(renderer.pixelScale * STUDIO.zoom.max, Math.sqrt(ROOM_MAX_PX / (worldW * worldH)));
  camera.maxZoom = STUDIO.zoom.max;

  // Where a station's or a prop's art is drawn (projected world): centred on the footprint, base just below its front
  // corner. Every facility at one scale (FACILITY_DRAW); a prop at its own size in cell widths.
  const artRect = (it, fp = it.fp) => {
    const w = it.kind === 'prop' ? it.def.size * 2 * HW : (fp.w + fp.h) * HW * FACILITY_DRAW.width;
    const h = w / assets.aspect(it.def.art);
    const cx = iso.corner(fp.col + fp.w / 2, fp.row + fp.h / 2).x;
    const base = iso.corner(fp.col + fp.w, fp.row + fp.h).y + HH * FACILITY_DRAW.drop;
    return { x: cx - w / 2, y: base - h, w, h };
  };
  const stationRect = artRect;
  const feetOf = (w) => {
    const f = iso.toWorld(w.agent.x, w.agent.y);
    return { x: f.x, y: f.y + HH * 0.25 };
  };
  const workerRect = (w) => {
    const f = feetOf(w);
    const h = WALKER.height;
    const wd = h * assets.aspect(w.def.art);
    return { x: f.x - wd / 2, y: f.y - h, w: wd, h };
  };
  const depthOf = (it) => (it.kind === 'worker' ? it.agent.x + it.agent.y : (it.fp.col + it.fp.w / 2 + it.fp.row + it.fp.h / 2) * CELL);

  // Tapping: everything is hit-tested where it is drawn (projected), nearest-to-viewer first. Props are not in it.
  const selection = new Selection(bus, {
    boundsOf: (it) => (it.kind === 'worker' ? workerRect(it) : stationRect(it)),
    depthOf,
  });
  const stationPicker = new Selection(null, { boundsOf: (it) => stationRect(it), depthOf }); // Build Mode: stations only
  // This studio's stations (Milestone 5b: they depend on the starting team), kept in step with the world's list.
  const syncStations = () => {
    for (const pick of [selection, stationPicker]) {
      for (const it of [...pick.items]) if (it.kind === 'station' && !stations.includes(it)) pick.remove(it);
      for (const st of stations) pick.add(st);
    }
  };
  syncStations();
  bus?.on('world:moved', () => syncStations()); // Milestone 11: bought / sold while the studio is on screen
  // Milestone 13: staff come and go (hired, let go, away on a course): only those on the floor can be tapped.
  const syncWorkers = () => {
    for (const it of [...selection.items]) if (it.kind === 'worker' && (!workers.includes(it) || it.away)) selection.remove(it);
    for (const w of workers) if (!w.away) selection.add(w);
  };
  const onFloor = () => workers.filter((w) => !w.away);
  bus?.on('staff:hired', () => syncWorkers());
  bus?.on('staff:removed', () => syncWorkers());
  bus?.on('staff:away', () => syncWorkers());

  // --- how each worker moves (Milestone 5) ---------------------------------------------------------------------
  // stride: plan distance walked (the walking clock, so hops keep pace with the feet at any speed); flip: the way
  // they face on screen; shake: seconds left of a bug's little shake.
  const motion = new Map(); // id → { x, y, stride, flip, shake, seed }
  const pose = { bob: 0, tilt: 0, flip: 1 };
  const poseAgent = { state: 'idle', facing: 1 };
  let animT = 0; // work / rest clock (stops while the game is paused)
  // Milestone 39 (bible §52): the workers nearest the middle of the view animate in full (24; fewer with Reduced worker
  // detail / low mode); other visible ones re-pose only every few frames; those off screen are logic only.
  const fullIds = new Set();
  let frameN = 0;
  const detailStats = { visible: 0, full: 0, reduced: 0, logicOnly: 0 };
  const motionOf = (w) => {
    let m = motion.get(w.id);
    if (!m) {
      m = { x: w.agent.x, y: w.agent.y, stride: 0, flip: 1, shake: 0, seed: motion.size * 1.7 + 0.4 };
      motion.set(w.id, m);
    }
    return m;
  };
  function updateMotion(dt) {
    if (isRunning()) animT += dt;
    for (const w of workers) {
      const m = motionOf(w);
      const dx = w.agent.x - m.x;
      const dy = w.agent.y - m.y;
      const d = Math.hypot(dx, dy);
      if (d > CELL * 3) m.stride = 0; // placed, not walked (a load, the stuck fallback)
      else m.stride += d;
      const sx = dx - dy; // plan → screen: x grows with col, shrinks with row
      if (Math.abs(sx) > 0.5) m.flip = sx > 0 ? 1 : -1;
      m.x = w.agent.x;
      m.y = w.agent.y;
      if (m.shake > 0) m.shake = Math.max(0, m.shake - dt);
    }
  }

  // --- UI rects ---------------------------------------------------------------------
  let buildMode = false;
  const bannerRect = () => {
    const sr = layout.safeRect;
    return { x: sr.x + 24, y: sr.y + 24, w: sr.w - 48, h: 190 };
  };
  const doneRect = () => {
    const b = bannerRect();
    return { x: b.x + b.w - 250, y: b.y + (b.h - 120) / 2, w: 226, h: 120 };
  };
  const shopRect = () => {
    const d = doneRect();
    return { x: d.x - 246, y: d.y, w: 226, h: d.h };
  };
  // A new stage: a new room, then look at it again.
  function restage() {
    buildRoom();
    camera.setWorld(worldW, worldH);
    camera.minZoom = zoomMin();
    room.setPixelScale(roomScale());
    if (screen.viewSet) resetView();
  }
  bus?.on('studio:stage', () => restage());

  // --- camera helpers ------------------------------------------------------------------
  // The camera sees the space between the two bars, so its clamp keeps every room edge reachable.
  function fitView() {
    const top = topBar.rect();
    const bottom = bottomBar.rect();
    camera.viewX = 0;
    camera.viewY = top.y + top.h + 8;
    camera.setView(W, bottom.y - 8 - camera.viewY);
  }
  // Start looking at the middle of the working stations (the shelf sits off to the side).
  function resetView() {
    fitView();
    camera.zoom = STUDIO.zoom.start;
    const pts = stations.filter((s) => !s.def.showcase).map((s) => iso.cellCenter(s.fp.col + s.fp.w / 2, s.fp.row + s.fp.h / 2));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    camera.centerOn((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
  }

  // --- gestures ---------------------------------------------------------------------------
  let active = false; // only while the studio is the current screen
  const gestures = new WorldGestures({ camera, bus, isActive: () => active });
  const overSheet = (p) => sheet.active && p.y >= sheet.rect().y;
  const onUi = (p) => (buildMode ? hitRect(p, bannerRect()) : topBar.contains(p) || bottomBar.contains(p) || debugBadgeHit(p));
  // Floor cell under a screen point, without clamping to the room (a dragged station can hang off the edge).
  const rawCell = (sx, sy) => {
    const w = camera.screenToWorld(sx, sy);
    const plan = iso.toPlan(w.x, w.y);
    return { col: Math.floor(plan.x / CELL), row: Math.floor(plan.y / CELL) };
  };
  const pickAt = (sx, sy) => {
    const w = camera.screenToWorld(sx, sy);
    return selection.pick(w.x, w.y);
  };

  // Build Mode: a press on a station drags it (instead of panning). Stations win over staff standing in front.
  let press = null; // { id, station } — a finger down on a station
  let moving = null; // { id, station, grab: {dc, dr}, col, row, reason }
  let refused = null; // { reason, t } — the last refused move, shown for a moment
  const taps = []; // recent taps and what they hit (tests / debug)
  const moves = []; // placed / refused moves (tests / debug)

  function updateMove(p) {
    const cell = rawCell(p.x, p.y);
    moving.col = cell.col - moving.grab.dc;
    moving.row = cell.row - moving.grab.dr;
    moving.reason = world.whyNot(moving.station, moving.col, moving.row);
  }
  function dropStation() {
    const m = moving;
    moving = null;
    press = null;
    if (m.col === m.station.fp.col && m.row === m.station.fp.row) return;
    const reason = world.moveStation(m.station, m.col, m.row);
    moves.push({ id: m.station.id, col: m.col, row: m.row, placed: !reason, reason });
    refused = reason ? { reason, t: 0 } : null;
    if (reason) debug?.log(`${m.station.def.name} refused at ${m.col},${m.row}: ${BUILD_TEXT[reason]}`);
  }

  const maker = stations.find((s) => s.def.role === 'Maker');
  const shelf = stations.find((s) => s.def.showcase);
  const fpNow = (st) => (moving?.station === st ? { ...st.fp, col: moving.col, row: moving.row } : st.fp);

  // ?debug=1: a small button that lights / clears every attention badge.
  let debugBadge = null; // set by main: { rect(), onTap(), label() }
  const debugBadgeHit = (p) => !!debugBadge && hitRect(p, debugBadge.rect());

  const screen = {
    camera,
    iso,
    selection,
    taps,
    moves,
    doneRect,
    shopRect,
    stationRect,
    motion,
    get buildMode() {
      return buildMode;
    },
    get moving() {
      return moving;
    },
    setDebugBadge(b) {
      debugBadge = b;
    },

    // Milestone 39: how many workers were drawn in full / reduced detail, and how many were logic only (debug overlay).
    get detailStats() {
      return detailStats;
    },
    // Milestone 39: leaving the studio for a full screen gives the floor's offscreen picture back (redrawn on return).
    releaseCaches() {
      room?.release();
    },
    // Milestone 34: a worker's box on the screen (the guide's coach mark points at the Founder), or null off screen.
    // show: first glide the camera so they stand well inside the screen (the guide's "Tap your Founder").
    workerScreenRect(id, { show = false } = {}) {
      const w = world.workerById(id);
      if (!w || w.away) return null;
      const r = workerRect(w);
      if (show) {
        const sr = layout.safeRect;
        const c = camera.worldToScreen(r.x + r.w / 2, r.y + r.h / 2);
        if (c.x < sr.x + sr.w * 0.25 || c.x > sr.x + sr.w * 0.75 || c.y < sr.y + sr.h * 0.3 || c.y > sr.y + sr.h * 0.6) camera.centerOn(r.x + r.w / 2, r.y + r.h / 2);
      }
      const a = camera.worldToScreen(r.x, r.y);
      const b = camera.worldToScreen(r.x + r.w, r.y + r.h);
      const box = { x: Math.min(a.x, b.x) - 10, y: Math.min(a.y, b.y) - 10, w: Math.abs(b.x - a.x) + 20, h: Math.abs(b.y - a.y) + 20 };
      const sr = layout.safeRect;
      return box.x + box.w < sr.x || box.x > sr.x + sr.w || box.y + box.h < sr.y || box.y > sr.y + sr.h ? null : box;
    },
    // Screen point at the middle of a station's art / a worker (tests).
    screenPointOf(id) {
      const w = world.workerById(id);
      const r = w ? workerRect(w) : stationRect(world.stationById(id));
      return camera.worldToScreen(r.x + r.w / 2, r.y + r.h * 0.6);
    },
    // A screen point where a tap reaches this station (nothing in front of it there), or null (tests).
    tapPointOf(id) {
      const st = world.stationById(id);
      if (!st) return null;
      const r = stationRect(st);
      for (let fy = 0.15; fy < 1; fy += 0.1) for (let fx = 0.2; fx < 0.85; fx += 0.1) {
        const x = r.x + r.w * fx;
        const y = r.y + r.h * fy;
        if ((buildMode ? stationPicker : selection).pick(x, y) === st) return camera.worldToScreen(x, y);
      }
      return null;
    },
    // Screen point at the centre of a floor cell (tests).
    screenPointOfCell(col, row) {
      const w = iso.cellCenter(col, row);
      return camera.worldToScreen(w.x, w.y);
    },
    // Floor cell under a screen point, or null if it is off the floor.
    cellAt(sx, sy) {
      const c = rawCell(sx, sy);
      return world.grid.inBounds(c.col, c.row) ? c : null;
    },
    // World point for an art pop: just over a worker's head, or over the top of a station's art (devPops).
    popPoint(target) {
      const w = target.kind === 'worker' ? target : null;
      if (w) {
        const r = workerRect(w); // beside the head, clear of the name tag and the progress card
        return { x: r.x + r.w + 40, y: r.y + 30 };
      }
      const r = stationRect(target, fpNow(target));
      return { x: r.x + r.w / 2, y: r.y + r.h * 0.2 };
    },
    // A bug's little shake on a worker.
    shake(id, sec) {
      const w = world.workerById(id);
      if (w) motionOf(w).shake = sec;
    },
    // Is a world point on screen now (pops off screen are skipped)?
    // Milestone 40b: a worker's head on the screen (speech bubbles, points flying to the live build panel), or null.
    headOnScreen(id) {
      const w = world.workerById(id);
      if (!w || !onFloor().includes(w)) return null;
      const r = workerRect(w);
      const p = camera.worldToScreen(r.x + r.w / 2, r.y + 12);
      return p.x > 0 && p.x < W && p.y > camera.viewY && p.y < camera.viewY + camera.viewH ? p : null;
    },
    onScreen(p) {
      const s = camera.worldToScreen(p.x, p.y);
      return s.x > -60 && s.x < W + 60 && s.y > camera.viewY - 60 && s.y < camera.viewY + camera.viewH + 60;
    },

    setBuildMode(on) {
      if (buildMode === on) return;
      buildMode = on;
      moving = null;
      press = null;
      refused = null;
      if (on) {
        sheet.close();
        selection.clear();
      }
      debug?.log(`Build Mode ${on ? 'on' : 'off'}`);
    },

    // Back: leave Build Mode first.
    onBack() {
      if (!buildMode) return false;
      screen.setBuildMode(false);
      return true;
    },

    enter() {
      active = true;
      if (cols !== world.cols || rows !== world.rows) restage(); // a save at another stage was loaded
      syncStations();
      syncWorkers();
      if (!screen.viewSet) {
        screen.viewSet = true;
        screen.resize();
        resetView();
      } else screen.resize(); // the window may have changed while another screen was up
    },

    exit() {
      active = false;
      gestures.reset();
      screen.setBuildMode(false);
    },

    resize() {
      camera.pixelScale = renderer.pixelScale;
      room.setPixelScale(roomScale()); // sharp up to full zoom (within the pixel budget)
      // Keep looking at the same spot in the new view.
      const cx = camera.x + camera.visibleW / 2;
      const cy = camera.y + camera.visibleH / 2;
      fitView();
      camera.centerOn(cx, cy);
    },

    update(dt) {
      if (refused && (refused.t += dt) > REFUSED_SEC) refused = null;
      updateMotion(dt);
    },

    onDown(p) {
      if (overSheet(p) || onUi(p)) return; // the bars, the banner and the sheet never pan or pinch the studio
      if (buildMode && gestures.fingers === 0) {
        const w = camera.screenToWorld(p.x, p.y);
        const st = stationPicker.pick(w.x, w.y);
        if (st) {
          press = { id: p.id, station: st }; // this finger moves the station
          return;
        }
      }
      gestures.down(p);
    },

    onUp(p) {
      if (press && p.id === press.id) {
        if (moving) dropStation();
        press = null;
        return;
      }
      gestures.up(p);
    },

    onDragStart(p) {
      if (press && p.id === press.id) {
        const st = press.station;
        const grabbed = rawCell(p.startX, p.startY);
        moving = { id: p.id, station: st, grab: { dc: grabbed.col - st.fp.col, dr: grabbed.row - st.fp.row }, col: st.fp.col, row: st.fp.row, reason: null };
        updateMove(p);
        return;
      }
      gestures.dragStart(p);
    },

    onDrag(p) {
      if (moving && p.id === moving.id) {
        updateMove(p);
        return;
      }
      gestures.drag(p);
    },

    onDragEnd(p) {
      if (moving && p.id === moving.id) {
        if (p.cancelled) {
          moving = null; // cancelled (e.g. paused): the station stays where it was
          press = null;
        }
        return;
      }
      gestures.dragEnd(p);
    },

    onWheel(p) {
      if (!moving) gestures.wheel(p);
    },

    onTap(p) {
      if (gestures.multiTouch && !press) return;
      if (buildMode) {
        let picked = null;
        if (hitRect(p, doneRect())) screen.setBuildMode(false);
        else if (openShop && hitRect(p, shopRect())) openShop();
        else if (!hitRect(p, bannerRect())) {
          // Milestone 11: tapping a station in Build Mode opens its facility sheet (sell it there).
          const w = camera.screenToWorld(p.x, p.y);
          picked = stationPicker.pick(w.x, w.y);
          if (picked && openFacility) openFacility(picked.id);
        }
        taps.push({ x: p.x, y: p.y, picked: picked?.id ?? null, build: true });
        press = null;
        return;
      }
      if (debugBadgeHit(p)) {
        debugBadge.onTap();
        return;
      }
      if (topBar.handleTap(p) || bottomBar.handleTap(p)) {
        taps.push({ x: p.x, y: p.y, picked: 'bar' });
        return;
      }
      const picked = pickAt(p.x, p.y);
      selection.select(picked);
      if (picked?.kind === 'worker') openStaff(picked.id);
      else if (picked) openStation(picked.id);
      taps.push({ x: p.x, y: p.y, picked: picked?.id ?? null });
      if (taps.length > 50) taps.shift();
    },

    // Long press on empty floor → Build Mode. On a station or a worker it opens their sheet / card.
    onHold(p) {
      if (gestures.multiTouch || gestures.fingers > 1 || buildMode || onUi(p) || overSheet(p)) return;
      const picked = pickAt(p.x, p.y);
      if (picked?.kind === 'worker') openStaff(picked.id);
      else if (picked) {
        selection.select(picked);
        openStation(picked.id);
      } else if (screen.cellAt(p.x, p.y)) screen.setBuildMode(true);
    },

    render(ctx) {
      camera.apply(ctx);
      room.renderView(ctx, { x: camera.x, y: camera.y, w: camera.visibleW, h: camera.visibleH }); // only what is on screen
      drawSign(ctx);
      if (buildMode) drawBuildFloor(ctx);
      drawSelectionMark(ctx);
      drawShadows(ctx);
      // Stations, props and staff, back to front. Sprites are cached at the next zoom step up (DETAIL_STEPS), so they stay
      // sharp without shrinking full-size copies far out. Milestone 22: only what is on screen is drawn.
      assets.detail = DETAIL_STEPS.find((z) => z >= camera.zoom - 1e-6) ?? STUDIO.zoom.max;
      const vis = { x: camera.x - 60, y: camera.y - 60, w: camera.visibleW + 120, h: camera.visibleH + 120 };
      const seen = (r) => r.x < vis.x + vis.w && r.x + r.w > vis.x && r.y < vis.y + vis.h && r.y + r.h > vis.y;
      const items = [...stations, ...props, ...onFloor()].filter((it) => it === moving?.station || seen(it.kind === 'worker' ? workerRect(it) : artRect(it))).sort((a, b) => depthOf(a) - depthOf(b));
      frameN++;
      const wd = workerDetail();
      const ccx = camera.x + camera.visibleW / 2;
      const ccy = camera.y + camera.visibleH / 2;
      const visWorkers = items.filter((it) => it.kind === 'worker');
      visWorkers.sort((a, b) => Math.hypot(a.agent.x - ccx, a.agent.y - ccy) - Math.hypot(b.agent.x - ccx, b.agent.y - ccy));
      fullIds.clear();
      for (let i = 0; i < Math.min(wd.full, visWorkers.length); i++) fullIds.add(visWorkers[i].id);
      detailStats.visible = visWorkers.length;
      detailStats.full = fullIds.size;
      detailStats.reduced = visWorkers.length - fullIds.size;
      detailStats.logicOnly = onFloor().length - visWorkers.length;
      for (const it of items) {
        if (it.kind === 'worker') drawWorker(ctx, it, fullIds.has(it.id), wd.every);
        else if (it.kind === 'prop') drawProp(ctx, it);
        else if (it !== moving?.station) {
          const r = stationRect(it);
          assets.draw(ctx, it.def.art, r.x, r.y, r.w, r.h);
          if (it === shelf) drawShelfCovers(ctx, r);
          if (it.id === 'F28' && labPrototype()) assets.drawContained(ctx, labPrototype(), { x: r.x + r.w * 0.3, y: r.y + r.h * 0.12, w: r.w * 0.4, h: r.h * 0.32 }); // Milestone 23: the prototype on the lab
          stationDecor?.(ctx, it, r); // Milestone 40e: the sponsor logo board
          drawLevelBadge(ctx, it, r); // Milestone 40e
        }
      }
      if (moving) drawMovingStation(ctx);
      assets.detail = 1;
      vfx?.render(ctx, 'world'); // the art pops, over the room but under the tags, so names always read
      for (const w of onFloor()) if (seen(workerRect(w))) drawNameTag(ctx, w);
      drawShelfTag(ctx);
      drawProjectCard(ctx);
      camera.restore(ctx);

      // Build Mode's banner takes the top bar's place; the bottom bar steps aside until Done.
      if (buildMode) drawBuildBanner(ctx);
      else {
        topBar.render(ctx);
        bottomBar.render(ctx);
        if (debugBadge) drawButton(ctx, debugBadge.rect(), debugBadge.label(), { accent: C.purple, font: font(S.small, true) });
      }
    },
  };

  // --- drawing -------------------------------------------------------------------
  // Floor, walls, the window, the door, the rug and the window's light, drawn once into the cached layer.
  function drawRoom(g) {
    drawIsoRoom(g, iso, {
      cols,
      rows,
      wallH,
      look: L,
      bands: [
        { from: 0, to: 0.08, color: L.skirting },
        { from: 0.34, to: 0.37, color: L.rail },
      ],
    });
    g.lineJoin = 'round';
    // A soft shade along the foot of both back walls (the floor meets the wall).
    const shade = (pts) => {
      isoPath(g, pts);
      g.fillStyle = L.shadow;
      g.fill();
    };
    shade([iso.corner(0, 0), iso.corner(cols, 0), iso.corner(cols, 0.3), iso.corner(0.3, 0.3)]);
    shade([iso.corner(0, 0), iso.corner(0.3, 0.3), iso.corner(0.3, rows), iso.corner(0, rows)]);
    // Window light on the floor, then the rug under the work area (a border and two stripes).
    const sun = STUDIO_FLOOR.sun;
    isoPath(g, iso.outline(sun.col, sun.row, sun.w, sun.h));
    g.fillStyle = L.sunlight;
    g.fill();
    const rug = STUDIO_FLOOR.rug;
    fillPatch(g, iso.outline(rug.col, rug.row, rug.w, rug.h), L.rugEdge, L.wallCap, 2);
    fillPatch(g, iso.outline(rug.col + 0.18, rug.row + 0.18, rug.w - 0.36, rug.h - 0.36), L.rug);
    for (const f of [0.3, 0.7]) fillPatch(g, iso.outline(rug.col + 0.18, rug.row + rug.h * f - 0.06, rug.w - 0.36, 0.12), L.rugStripe);
    // Window: frame, glass, cross bars and a shine.
    const wn = STUDIO_WALLS.window;
    fillPatch(g, wallPatch(iso, wn.side, wn.t0, wn.t1, wn.h0, wn.h1), L.windowFrame, L.wallCap, 3);
    fillPatch(g, wallPatch(iso, wn.side, wn.t0 + 0.15, wn.t1 - 0.15, wn.h0 + 10, wn.h1 - 10), L.windowGlass, L.wallLine, 1.5);
    const mid = (wn.t0 + wn.t1) / 2;
    fillPatch(g, wallPatch(iso, wn.side, mid - 0.05, mid + 0.05, wn.h0 + 10, wn.h1 - 10), L.windowFrame);
    fillPatch(g, wallPatch(iso, wn.side, wn.t0 + 0.15, wn.t1 - 0.15, (wn.h0 + wn.h1) / 2 - 3, (wn.h0 + wn.h1) / 2 + 3), L.windowFrame);
    fillPatch(g, wallPatch(iso, wn.side, wn.t0 + 0.4, wn.t0 + 0.75, wn.h0 + 60, wn.h1 - 18), L.windowShine);
    // Door (left wall) with a handle.
    const dr = STUDIO_WALLS.door;
    fillPatch(g, wallPatch(iso, dr.side, dr.t0 - 0.12, dr.t1 + 0.12, dr.h0, dr.h1 + 12), L.doorFrame, L.wallCap, 3);
    fillPatch(g, wallPatch(iso, dr.side, dr.t0, dr.t1, dr.h0, dr.h1), L.door, L.wallCap, 2);
    fillPatch(g, wallPatch(iso, dr.side, dr.t1 - 0.3, dr.t1 - 0.15, 88, 100), '#F2C66D', L.wallCap, 1.5);
  }

  // The studio sign on the right wall (Milestone 5b): the studio's name on a plate in the studio colour, drawn by code
  // (no art: the spec's badge frame isn't drawn yet). Text runs along the wall.
  function drawSign(ctx) {
    const sg = sign();
    const at = STUDIO_WALLS.sign;
    if (!sg || !at) return;
    fillPatch(ctx, wallPatch(iso, at.side, at.t0, at.t1, at.h0, at.h1), sg.colour, L.wallCap, 4);
    fillPatch(ctx, wallPatch(iso, at.side, at.t0 + 0.1, at.t1 - 0.1, at.h0 + 8, at.h1 - 8), 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.55)', 2);
    const o = wallPoint(iso, at.side, at.t0, (at.h0 + at.h1) / 2);
    const len = (at.t1 - at.t0) * HW;
    ctx.save();
    ctx.transform(1, HH / HW, 0, 1, o.x, o.y);
    ctx.font = font(30, true);
    ctx.fillStyle = C.textOnAction;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sg.name, len / 2, 2, len - 30);
    ctx.restore();
  }

  function fillPatch(g, pts, fill, stroke = null, width = 2) {
    isoPath(g, pts);
    g.fillStyle = fill;
    g.fill();
    if (stroke) {
      g.strokeStyle = stroke;
      g.lineWidth = width;
      g.stroke();
    }
  }

  function line(g, a, b) {
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
  }

  // Soft shadows on the floor: under each station and prop (its footprint, a little inset) and at each worker's feet
  // (the shadow stays on the floor while they hop, so the hop reads as a hop).
  function drawShadows(ctx) {
    ctx.fillStyle = L.shadow;
    for (const it of [...stations, ...props]) {
      if (it === moving?.station) continue;
      isoPath(ctx, iso.outline(it.fp.col + 0.08, it.fp.row + 0.08, it.fp.w - 0.16, it.fp.h - 0.16));
      ctx.fill();
    }
    for (const w of onFloor()) {
      const f = feetOf(w);
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - 4, 44, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Milestone 40e: a facility's level (code-drawn): a round badge with the level and stars; an arrow while upgrading.
  function drawLevelBadge(ctx, it, r) {
    const lv = levelOf(it.id);
    if (!lv || (lv.level <= 1 && !lv.pending)) return;
    const R = Math.max(26, Math.min(40, r.w * 0.09));
    const cx = r.x + r.w * 0.86;
    const cy = r.y + r.h * 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = lv.level >= 3 ? '#D99A00' : lv.level === 2 ? '#2F7FD0' : '#8A8F98';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(R * 1.1)}px ${THEME.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lv.pending ? '↑' : String(lv.level), cx, cy + 1);
    ctx.restore();
  }

  function drawProp(ctx, it) {
    const r = artRect(it);
    if (!it.def.flip) {
      assets.draw(ctx, it.def.art, r.x, r.y, r.w, r.h);
      return;
    }
    ctx.save();
    ctx.translate(r.x + r.w / 2, 0);
    ctx.scale(-1, 1);
    assets.draw(ctx, it.def.art, -r.w / 2, r.y, r.w, r.h);
    ctx.restore();
  }

  // A worker with their pose: hop + sway walking, typing bounce working, breathing resting, and a bug's shake.
  function drawWorker(ctx, w, full = true, every = 3) {
    const m = motionOf(w);
    // A reduced-detail worker keeps the pose it had, re-posed every few frames (staggered so they don't all move at once).
    const own = (w._pose ??= { bob: 0, tilt: 0, flip: 1 });
    if (full || (frameN + (w.breakSeat ?? 0)) % every === 0) {
      poseAgent.state = w.agent.state;
      poseAgent.facing = m.flip;
      const t = w.agent.state === 'walking' ? m.stride / WALKER.stride : animT;
      characterPose(poseAgent, t, m.seed, pose, WALKER.motion);
      own.bob = pose.bob;
      own.tilt = pose.tilt;
      own.flip = pose.flip;
      own.sx = pose.sx;
      own.sy = pose.sy;
    } else {
      pose.bob = own.bob;
      pose.tilt = own.tilt;
      pose.flip = own.flip;
      pose.sx = own.sx;
      pose.sy = own.sy;
    }
    const f = feetOf(w);
    const shakeX = m.shake > 0 ? Math.sin(animT * 70) * 5 * Math.min(1, m.shake / 0.2) * shakeScale() : 0; // Milestone 40e: Settings → Screen shake
    const r = workerRect(w);
    drawCharacter(ctx, assets, w.def.art, f.x + shakeX, f.y, r.w, r.h, pose);
  }

  // The released games' covers on the Showcase Shelf, newest first (art only; the tag over the shelf names them).
  let tagIndex = 0;
  function drawShelfCovers(ctx, r) {
    const list = showcase().slice(0, SHOWCASE.max);
    const cycle = list.length ? Math.floor(animT / SHOWCASE.cycleSec) % list.length : 0;
    tagIndex = cycle;
    list.forEach((rec, i) => {
      const slot = SHOWCASE.slots[i];
      const h = slot.h * r.h;
      const w = h * COVER_ASPECT;
      const x = r.x + slot.x * r.w - w / 2;
      const y = r.y + slot.y * r.h - h / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.clip();
      const a = assets.aspect(rec.result.cover);
      const fit = w / h > a ? { w, h: w / a } : { w: h * a, h };
      assets.draw(ctx, rec.result.cover, x + (w - fit.w) / 2, y + (h - fit.h) / 2, fit.w, fit.h);
      ctx.restore();
      ctx.strokeStyle = i === cycle ? C.gold : C.outline;
      ctx.lineWidth = i === cycle ? 4 : 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.stroke();
    });
  }

  // Tags and cards over the room keep one size on screen at any zoom (small text 28 is the floor, style guide §7):
  // fn draws around (0, 0) in screen units, with (0, 0) at the world point (wx, wy).
  function fixedSize(ctx, wx, wy, fn) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.scale(1 / camera.zoom, 1 / camera.zoom);
    fn();
    ctx.restore();
  }

  // The tag over the shelf: a star and the title of the cover being shown (small text, drawn by code).
  function drawShelfTag(ctx) {
    if (!shelf || shelf === moving?.station) return;
    const list = showcase().slice(0, SHOWCASE.max);
    if (!list.length) return;
    const rec = list[tagIndex % list.length];
    const r = stationRect(shelf);
    const label = `★ ${rec.result.title}`;
    fixedSize(ctx, r.x + r.w / 2, r.y - 8, () => {
      ctx.font = font(S.small, true);
      const w = Math.min(ctx.measureText(label).width + 36, 420);
      const x = -w / 2;
      const y = -TAG_H;
      ctx.fillStyle = C.panelGold;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, w, TAG_H, TAG_H / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + TAG_H / 2 + 1, w - 28);
    });
  }

  // Build Mode: the hidden grid, plus the doorway (no building there), the props and every station's spots, marked
  // faintly.
  function drawBuildFloor(ctx) {
    isoPath(ctx, iso.outline(DOORWAY.col, DOORWAY.row, DOORWAY.w, DOORWAY.h));
    ctx.fillStyle = 'rgba(59,51,44,0.12)';
    ctx.fill();
    for (const p of props) {
      isoPath(ctx, iso.outline(p.fp.col, p.fp.row, p.fp.w, p.fp.h));
      ctx.fill();
    }
    ctx.strokeStyle = L.gridLine;
    ctx.lineWidth = 3 / camera.zoom;
    for (let c = 0; c <= cols; c++) line(ctx, iso.corner(c, 0), iso.corner(c, rows));
    for (let r = 0; r <= rows; r++) line(ctx, iso.corner(0, r), iso.corner(cols, r));
    ctx.setLineDash([10 / camera.zoom, 8 / camera.zoom]);
    ctx.strokeStyle = 'rgba(59,51,44,0.45)';
    for (const st of stations) {
      if (st === moving?.station) continue;
      for (const s of world.seatsOf(st)) {
        isoPath(ctx, iso.outline(s.col, s.row));
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
  }

  // The dragged station: green or red footprint (and its spots), with the art drawn there, see-through.
  function drawMovingStation(ctx) {
    const st = moving.station;
    const fp = { ...st.fp, col: moving.col, row: moving.row };
    const ok = !moving.reason;
    isoPath(ctx, iso.outline(fp.col, fp.row, fp.w, fp.h));
    ctx.fillStyle = ok ? L.valid : L.invalid;
    ctx.fill();
    ctx.strokeStyle = ok ? L.validEdge : L.invalidEdge;
    ctx.lineWidth = 5 / camera.zoom;
    ctx.stroke();
    ctx.setLineDash([12 / camera.zoom, 8 / camera.zoom]);
    for (const s of world.seatsOf(st, fp)) {
      isoPath(ctx, iso.outline(s.col, s.row));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const r = stationRect(st, fp);
    ctx.globalAlpha = 0.8;
    assets.draw(ctx, st.def.art, r.x, r.y, r.w, r.h);
    ctx.globalAlpha = 1;
  }

  // The selected station's footprint glows on the floor while its sheet is open.
  function drawSelectionMark(ctx) {
    const it = selection.selected;
    if (!it || it.kind !== 'station' || !sheet.active) return;
    isoPath(ctx, iso.outline(it.fp.col, it.fp.row, it.fp.w, it.fp.h));
    ctx.fillStyle = C.glow;
    ctx.fill();
    ctx.strokeStyle = C.action;
    ctx.lineWidth = 5 / camera.zoom;
    ctx.stroke();
  }

  // Name tag over each worker's head (style guide §6): first name · state, in the state's colour, plus a status
  // icon when Energy or Morale is low. Small text (28), the smallest the game uses.
  function drawNameTag(ctx, w) {
    const fade = Math.max(0, Math.min(1, (camera.zoom - TAG_FADE.gone) / (TAG_FADE.full - TAG_FADE.gone)));
    if (fade <= 0) return;
    const st = WORK_STATE[w.phase];
    const r = workerRect(w);
    const label = `${w.staff.name.split(' ')[0]} · ${st.label}`;
    ctx.font = font(S.small, true);
    const tw = ctx.measureText(label).width;
    const tagW = tw + 36;
    const h = TAG_H;
    const icons = [];
    if (w.tiredIcon && workerIcons()) icons.push(STATUS_ICONS.tired); // Milestone 34: Reduced worker detail hides them
    if (w.staff.status.stressed && workerIcons()) icons.push(STATUS_ICONS.stressed);
    const iconS = 56;
    const total = tagW + icons.length * (iconS + 6);
    fixedSize(ctx, r.x + r.w / 2, r.y - 10, () => {
      ctx.globalAlpha = fade;
      const x = -total / 2;
      const y = -h;
      ctx.fillStyle = STATE_COLOR[st.label];
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, tagW, h, h / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.textOnAction;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + tagW / 2, y + h / 2 + 1);
      icons.forEach((key, i) => assets.draw(ctx, key, x + tagW + 6 + i * (iconS + 6), y + h / 2 - iconS / 2, iconS, iconS));
    });
  }

  // The game in the works: a small card over the Starter Desks — milestone name and % (small text), and a bar for the
  // whole game.
  function drawProjectCard(ctx) {
    const v = projectView();
    if (!v) return;
    const r = stationRect(maker, fpNow(maker));
    const w = 380;
    const h = 92;
    // Above the heads (and name tags) of whoever works at the desks.
    fixedSize(ctx, r.x + r.w / 2, r.y - 40 - 40 / camera.zoom, () => {
      const cx = 0;
      const x = -w / 2;
      const y = -h;
      ctx.fillStyle = C.sheet;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 18);
      ctx.fill();
      ctx.stroke();
      ctx.font = font(S.small, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.text;
      ctx.fillText(`${v.phaseName} · ${Math.floor(v.phaseFrac * 100)}%`, cx, y + 30, w - 24);
      ctx.fillStyle = C.track;
      ctx.beginPath();
      ctx.roundRect(x + 16, y + 60, w - 32, 16, 8);
      ctx.fill();
      ctx.fillStyle = C.action;
      ctx.beginPath();
      ctx.roundRect(x + 16, y + 60, Math.max(16, (w - 32) * v.totalFrac), 16, 8);
      ctx.fill();
    });
  }

  function drawBuildBanner(ctx) {
    const b = bannerRect();
    ctx.fillStyle = C.panel;
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = THEME.panel.line;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, THEME.panel.radius);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = C.text;
    ctx.font = font(S.title, true);
    ctx.fillText('Build Mode', b.x + 36, b.y + 34, b.w - 560);
    // While dragging: live verdict. After a refused drop: why, in red. Otherwise the hint.
    const reason = moving ? moving.reason : refused?.reason;
    ctx.font = font(S.body, !!reason);
    const tw = b.w - 560; // the text stops short of Shop and Done
    if (moving && !reason) {
      ctx.fillStyle = C.good;
      ctx.fillText('Free spot: let go to place', b.x + 36, b.y + 112, tw);
    } else if (reason) {
      ctx.fillStyle = C.bad;
      ctx.fillText(`Can't place: ${BUILD_TEXT[reason].toLowerCase()}`, b.x + 36, b.y + 112, tw);
    } else {
      ctx.fillStyle = C.textMuted;
      ctx.fillText(BUILD_TEXT.hint, b.x + 36, b.y + 112, tw);
    }
    if (openShop) drawButton(ctx, shopRect(), 'Shop', { accent: C.action });
    drawButton(ctx, doneRect(), 'Done', { accent: C.progress });
  }

  return screen;
}
