// The studio (Milestones 1–3): the home screen. S1 Rented Office — one cramped room on a hidden grid, seen in the
// 3/4 "dollhouse" view, drawn by code — between the shared top bar and five-button bottom bar (core/ui).
// The four starting stations and the three starters walking their loop (studioWorld). Drag pans, pinch/wheel zooms
// (clamped to the room, in the space between the bars), tapping a station opens its sheet, tapping a worker opens
// their staff card, and a long press on empty floor enters Build Mode, where any station can be dragged to a new
// grid spot (invalid spots show red and are refused; the staff re-path). While a game is in the works a small
// progress bar floats over the Starter Desks, and bugs / breakthroughs pop up there (placeholders until Milestone 5).
//
// Plan space lives in the world (studioWorld); only drawing and tapping go through the IsoProjection here.
import { THEME, font } from '../../../../core/Theme.js';
import { IsoProjection } from '../../../../core/IsoProjection.js';
import { Camera } from '../../../../core/Camera.js';
import { WorldGestures } from '../../../../core/WorldGestures.js';
import { CachedLayer } from '../../../../core/CachedLayer.js';
import { Selection } from '../../../../core/Selection.js';
import { drawIsoRoom, isoPath, wallPatch } from '../../../../core/IsoRoom.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { STUDIO, STUDIO_LOOK, STUDIO_WALLS, DOORWAY, WALKER, WORK_STATE, BUILD_TEXT } from '../../data/studio.js';
import { STATUS_ICONS } from '../../data/home.js';

const C = THEME.color;
const S = THEME.size;
const L = STUDIO_LOOK;
const REFUSED_SEC = 2.5; // how long a refused move's reason stays in the banner
const STATE_COLOR = { Walking: C.progress, Working: C.action, Resting: C.good };
const POP_SEC = 1.6; // how long a bug / breakthrough pop floats

export function createStudioScreen({ renderer, layout, assets, bus, world, sheet, openStation, openStaff, projectView, topBar, bottomBar, debug }) {
  const W = renderer.width;
  const { cols, rows, cellSize: CELL, wallH, margin } = STUDIO;
  const { halfW: HW, halfH: HH } = STUDIO.view;
  const { grid, stations, workers } = world;

  // --- the room --------------------------------------------------------------
  const iso = new IsoProjection({ tileSize: CELL, halfW: HW, halfH: HH, originX: margin + rows * HW, originY: margin + wallH });
  const worldW = (cols + rows) * HW + margin * 2;
  const worldH = (cols + rows) * HH + wallH + margin * 2;
  const room = new CachedLayer({ width: worldW, height: worldH, draw: drawRoom });

  const camera = new Camera({ viewW: W, viewH: renderer.height, worldW, worldH });
  camera.minZoom = STUDIO.zoom.min;
  camera.maxZoom = STUDIO.zoom.max;

  // Where a station's art is drawn (projected world): centred on the footprint, base just below its front corner.
  const stationRect = (st, fp = st.fp) => {
    const { draw } = st.def;
    const w = (fp.w + fp.h) * HW * draw.width;
    const h = w / assets.aspect(st.def.art);
    const cx = iso.corner(fp.col + fp.w / 2, fp.row + fp.h / 2).x;
    const base = iso.corner(fp.col + fp.w, fp.row + fp.h).y + HH * draw.drop;
    return { x: cx - w / 2, y: base - h, w, h };
  };
  const workerRect = (w) => {
    const f = iso.toWorld(w.agent.x, w.agent.y);
    const h = WALKER.height;
    const wd = h * assets.aspect(w.def.art);
    return { x: f.x - wd / 2, y: f.y - h + HH * 0.25, w: wd, h };
  };
  const depthOf = (it) => (it.kind === 'worker' ? it.agent.x + it.agent.y : (it.fp.col + it.fp.w / 2 + it.fp.row + it.fp.h / 2) * CELL);

  // Tapping: everything is hit-tested where it is drawn (projected), nearest-to-viewer first.
  const selection = new Selection(bus, {
    boundsOf: (it) => (it.kind === 'worker' ? workerRect(it) : stationRect(it)),
    depthOf,
  });
  const stationPicker = new Selection(null, { boundsOf: (it) => stationRect(it), depthOf }); // Build Mode: stations only
  stations.forEach((s) => {
    selection.add(s);
    stationPicker.add(s);
  });
  const syncWorkers = () => {
    for (const it of [...selection.items]) if (it.kind === 'worker' && !workers.includes(it)) selection.remove(it);
    for (const w of workers) selection.add(w);
  };

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

  // --- camera helpers ------------------------------------------------------------------
  // The camera sees the space between the two bars, so its clamp keeps every room edge reachable.
  function fitView() {
    const top = topBar.rect();
    const bottom = bottomBar.rect();
    camera.viewX = 0;
    camera.viewY = top.y + top.h + 8;
    camera.setView(W, bottom.y - 8 - camera.viewY);
  }
  // Start looking at the middle of the stations.
  function resetView() {
    fitView();
    camera.zoom = STUDIO.zoom.start;
    const pts = stations.map((s) => iso.cellCenter(s.fp.col + s.fp.w / 2, s.fp.row + s.fp.h / 2));
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

  // Placeholder pops over the Starter Desks: "+1 bug" (red) and "Breakthrough! +4 GAMEPLAY" (gold). Real effects: M5.
  const pops = []; // { text, color, t }
  const maker = stations.find((s) => s.def.role === 'Maker');
  const pushPop = (text, color) => {
    pops.push({ text, color, t: 0 });
    if (pops.length > 4) pops.shift();
  };
  bus.on('project:bug', ({ count }) => pushPop(`+${count} bug${count > 1 ? 's' : ''}`, C.bad));
  bus.on('project:breakthrough', ({ key, points }) => pushPop(`Breakthrough! +${points} ${key === 'audienceFit' ? 'AUDIENCE FIT' : key.toUpperCase()}`, C.gold));

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
    stationRect,
    get buildMode() {
      return buildMode;
    },
    get moving() {
      return moving;
    },
    setDebugBadge(b) {
      debugBadge = b;
    },

    // Screen point at the middle of a station's art / a worker (tests).
    screenPointOf(id) {
      const w = world.workerById(id);
      const r = w ? workerRect(w) : stationRect(world.stationById(id));
      return camera.worldToScreen(r.x + r.w / 2, r.y + r.h * 0.6);
    },
    // Screen point at the centre of a floor cell (tests).
    screenPointOfCell(col, row) {
      const w = iso.cellCenter(col, row);
      return camera.worldToScreen(w.x, w.y);
    },
    // Floor cell under a screen point, or null if it is off the floor.
    cellAt(sx, sy) {
      const c = rawCell(sx, sy);
      return grid.inBounds(c.col, c.row) ? c : null;
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
      room.setPixelScale(renderer.pixelScale * STUDIO.zoom.max); // sharp up to full zoom
      // Keep looking at the same spot in the new view.
      const cx = camera.x + camera.visibleW / 2;
      const cy = camera.y + camera.visibleH / 2;
      fitView();
      camera.centerOn(cx, cy);
    },

    update(dt) {
      if (refused && (refused.t += dt) > REFUSED_SEC) refused = null;
      for (const p of pops) p.t += dt;
      while (pops.length && pops[0].t > POP_SEC) pops.shift();
    },
    pops,

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
        if (hitRect(p, doneRect())) screen.setBuildMode(false);
        taps.push({ x: p.x, y: p.y, picked: null, build: true });
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
      room.render(ctx, 0, 0);
      if (buildMode) drawBuildFloor(ctx);
      drawSelectionMark(ctx);
      // Stations and staff, back to front. Sprites are cached at full-zoom size so they stay sharp when zoomed.
      assets.detail = STUDIO.zoom.max;
      const items = [...stations, ...workers].sort((a, b) => depthOf(a) - depthOf(b));
      for (const it of items) {
        if (it.kind === 'worker') {
          const r = workerRect(it);
          assets.draw(ctx, it.def.art, r.x, r.y, r.w, r.h);
        } else if (it !== moving?.station) {
          const r = stationRect(it);
          assets.draw(ctx, it.def.art, r.x, r.y, r.w, r.h);
        }
      }
      if (moving) drawMovingStation(ctx);
      assets.detail = 1;
      for (const w of workers) drawNameTag(ctx, w);
      drawProjectBar(ctx);
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
  // Floor, walls, the window, the whiteboard and the door, drawn once into the cached layer.
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
    // Window: frame, glass, cross bars and a shine.
    const wn = STUDIO_WALLS.window;
    fillPatch(g, wallPatch(iso, wn.side, wn.t0, wn.t1, wn.h0, wn.h1), L.windowFrame, L.wallCap, 3);
    fillPatch(g, wallPatch(iso, wn.side, wn.t0 + 0.15, wn.t1 - 0.15, wn.h0 + 10, wn.h1 - 10), L.windowGlass, L.wallLine, 1.5);
    const mid = (wn.t0 + wn.t1) / 2;
    fillPatch(g, wallPatch(iso, wn.side, mid - 0.05, mid + 0.05, wn.h0 + 10, wn.h1 - 10), L.windowFrame);
    fillPatch(g, wallPatch(iso, wn.side, wn.t0 + 0.15, wn.t1 - 0.15, (wn.h0 + wn.h1) / 2 - 3, (wn.h0 + wn.h1) / 2 + 3), L.windowFrame);
    fillPatch(g, wallPatch(iso, wn.side, wn.t0 + 0.4, wn.t0 + 0.75, wn.h0 + 60, wn.h1 - 18), L.windowShine);
    // Whiteboard with a few coloured scribbles.
    const bd = STUDIO_WALLS.board;
    fillPatch(g, wallPatch(iso, bd.side, bd.t0, bd.t1, bd.h0, bd.h1), L.board, L.wallCap, 3);
    L.boardInk.forEach((ink, i) => {
      const h = bd.h1 - 22 - i * 24;
      fillPatch(g, wallPatch(iso, bd.side, bd.t0 + 0.25, bd.t0 + 0.25 + (1.6 - i * 0.4), h - 4, h + 4), ink);
    });
    // Door (left wall) with a handle.
    const dr = STUDIO_WALLS.door;
    fillPatch(g, wallPatch(iso, dr.side, dr.t0 - 0.12, dr.t1 + 0.12, dr.h0, dr.h1 + 12), L.doorFrame, L.wallCap, 3);
    fillPatch(g, wallPatch(iso, dr.side, dr.t0, dr.t1, dr.h0, dr.h1), L.door, L.wallCap, 2);
    fillPatch(g, wallPatch(iso, dr.side, dr.t1 - 0.3, dr.t1 - 0.15, 88, 100), '#F2C66D', L.wallCap, 1.5);
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

  // Build Mode: the hidden grid, plus the doorway (no building there) and every station's spots, marked faintly.
  function drawBuildFloor(ctx) {
    isoPath(ctx, iso.outline(DOORWAY.col, DOORWAY.row, DOORWAY.w, DOORWAY.h));
    ctx.fillStyle = 'rgba(59,51,44,0.12)';
    ctx.fill();
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
  // icon when Energy or Morale is low.
  function drawNameTag(ctx, w) {
    const st = WORK_STATE[w.phase];
    const r = workerRect(w);
    const label = `${w.staff.name.split(' ')[0]} · ${st.label}`;
    ctx.font = font(26, true);
    const tw = ctx.measureText(label).width;
    const tagW = tw + 36;
    const h = 44;
    const icons = [];
    if (w.tiredIcon) icons.push(STATUS_ICONS.tired);
    if (w.staff.status.stressed) icons.push(STATUS_ICONS.stressed);
    const iconS = 52;
    const total = tagW + icons.length * (iconS + 6);
    const x = r.x + r.w / 2 - total / 2;
    const y = r.y - h - 10;
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
  }

  // The game in the works: a small bar over the Starter Desks (milestone name + progress through the whole game),
  // with the pops rising above it.
  function drawProjectBar(ctx) {
    const v = projectView();
    const r = stationRect(maker, moving?.station === maker ? { ...maker.fp, col: moving.col, row: moving.row } : maker.fp);
    const cx = r.x + r.w / 2;
    let y = r.y - 20;
    if (v) {
      const w = 300;
      const h = 64;
      const x = cx - w / 2;
      y = r.y - h - 12;
      ctx.fillStyle = C.sheet;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.stroke();
      ctx.font = font(22, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.text;
      ctx.fillText(`${v.phaseName} · ${Math.floor(v.phaseFrac * 100)}%`, cx, y + 20, w - 20);
      ctx.fillStyle = C.track;
      ctx.beginPath();
      ctx.roundRect(x + 14, y + 38, w - 28, 14, 7);
      ctx.fill();
      ctx.fillStyle = C.action;
      ctx.beginPath();
      ctx.roundRect(x + 14, y + 38, Math.max(14, (w - 28) * v.totalFrac), 14, 7);
      ctx.fill();
    }
    for (const p of pops) {
      const k = p.t / POP_SEC;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      ctx.font = font(30, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = C.textOnDark;
      const py = y - 30 - k * 90;
      ctx.strokeText(p.text, cx, py);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, cx, py);
      ctx.globalAlpha = 1;
    }
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
    ctx.fillText('Build Mode', b.x + 36, b.y + 34, b.w - 320);
    // While dragging: live verdict. After a refused drop: why, in red. Otherwise the hint.
    const reason = moving ? moving.reason : refused?.reason;
    ctx.font = font(S.body, !!reason);
    if (moving && !reason) {
      ctx.fillStyle = C.good;
      ctx.fillText('Free spot: let go to place', b.x + 36, b.y + 112, b.w - 320);
    } else if (reason) {
      ctx.fillStyle = C.bad;
      ctx.fillText(`Can't place: ${BUILD_TEXT[reason].toLowerCase()}`, b.x + 36, b.y + 112, b.w - 320);
    } else {
      ctx.fillStyle = C.textMuted;
      ctx.fillText(BUILD_TEXT.hint, b.x + 36, b.y + 112, b.w - 320);
    }
    drawButton(ctx, doneRect(), 'Done', { accent: C.progress });
  }

  return screen;
}
