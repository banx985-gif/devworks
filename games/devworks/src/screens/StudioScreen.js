// The studio (Milestone 1): the home screen. S1 Rented Office — one cramped room on a hidden grid, seen in the 3/4
// "dollhouse" view, drawn by code. The Starter Desks, a rest spot and Alex Byte walking his loop
// (desk → work → rest spot → rest → desk). Drag pans, pinch/wheel zooms (clamped to the room), tapping the desks or
// Alex opens their sheet, and a long press on empty floor enters Build Mode, where the desks can be dragged to a new
// grid spot (invalid spots show red and are refused; Alex re-paths to the new spot).
//
// Plan space (grid, pathing, Alex's position) is flat; only drawing and tapping go through the IsoProjection.
import { THEME, font } from '../../../../core/Theme.js';
import { Grid } from '../../../../core/Grid.js';
import { IsoProjection } from '../../../../core/IsoProjection.js';
import { Camera } from '../../../../core/Camera.js';
import { WorldGestures } from '../../../../core/WorldGestures.js';
import { CachedLayer } from '../../../../core/CachedLayer.js';
import { Agent } from '../../../../core/Agent.js';
import { Selection } from '../../../../core/Selection.js';
import { drawIsoRoom, isoPath, wallPatch } from '../../../../core/IsoRoom.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { STUDIO, STUDIO_LOOK, STUDIO_WALLS, DESK, REST_SPOT, DOORWAY, WORKER, WORKER_STATE, BUILD_TEXT } from '../../data/studio.js';

const C = THEME.color;
const S = THEME.size;
const L = STUDIO_LOOK;
const REFUSED_SEC = 2.5; // how long a refused move's reason stays in the banner

export function createStudioScreen({ renderer, layout, assets, bus, sheet, openMenu, debug }) {
  const W = renderer.width;
  const { cols, rows, cellSize: CELL, wallH, margin } = STUDIO;
  const { halfW: HW, halfH: HH } = STUDIO.view;

  // --- the room --------------------------------------------------------------
  const grid = new Grid({ cols, rows, tileSize: CELL });
  const iso = new IsoProjection({ tileSize: CELL, halfW: HW, halfH: HH, originX: margin + rows * HW, originY: margin + wallH });
  const worldW = (cols + rows) * HW + margin * 2;
  const worldH = (cols + rows) * HH + wallH + margin * 2;
  const room = new CachedLayer({ width: worldW, height: worldH, draw: drawRoom });

  const camera = new Camera({ viewW: W, viewH: renderer.height, worldW, worldH });
  camera.minZoom = STUDIO.zoom.min;
  camera.maxZoom = STUDIO.zoom.max;

  const inArea = (a, col, row) => col >= a.col && row >= a.row && col < a.col + a.w && row < a.row + a.h;
  const overlaps = (a, b) => a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h;

  // --- the desks -------------------------------------------------------------------
  const desk = { kind: 'station', id: DESK.id, def: DESK, fp: { ...DESK.fp }, rect: null, depth: 0 };
  const deskSpot = (fp = desk.fp) => ({ col: fp.col + DESK.spot.dc, row: fp.row + DESK.spot.dr });
  // Where the art is drawn (projected world): centred on the footprint, base just below its front corner.
  const placeDesk = (fp = desk.fp) => {
    const { draw } = DESK;
    const w = (fp.w + fp.h) * HW * draw.width;
    const h = w / assets.aspect(DESK.art);
    const cx = iso.corner(fp.col + fp.w / 2, fp.row + fp.h / 2).x;
    const base = iso.corner(fp.col + fp.w, fp.row + fp.h).y + HH * draw.drop;
    return { x: cx - w / 2, y: base - h, w, h };
  };
  const setDesk = (fp) => {
    grid.blockRect(desk.fp.col, desk.fp.row, desk.fp.w, desk.fp.h, false);
    desk.fp = { ...fp };
    grid.blockRect(fp.col, fp.row, fp.w, fp.h, true);
    desk.rect = placeDesk();
    desk.depth = (fp.col + fp.w / 2 + fp.row + fp.h / 2) * CELL;
  };
  grid.blockRect(desk.fp.col, desk.fp.row, desk.fp.w, desk.fp.h, true);

  // Can the desks stand with their back corner at (col, row)? null = yes, else the reason (BUILD_TEXT key).
  // Rules (bible §36): on the floor, not on the rest spot or in the doorway, a free seat in front, and every free
  // floor cell still reachable from every other (the walkway stays open).
  function whyNot(col, row) {
    const fp = { col, row, w: desk.fp.w, h: desk.fp.h };
    if (col < 0 || row < 0 || col + fp.w > cols || row + fp.h > rows) return 'offGrid';
    if (overlaps(fp, REST_SPOT.area)) return 'overlap';
    if (overlaps(fp, DOORWAY)) return 'walkway';
    const seat = deskSpot(fp);
    if (!grid.inBounds(seat.col, seat.row) || inArea(fp, seat.col, seat.row)) return 'noSeat';
    // Flood fill the floor with the desks at the new spot (and not at the old one).
    const free = (c, r) => grid.inBounds(c, r) && !inArea(fp, c, r);
    const seen = new Uint8Array(cols * rows);
    const stack = [[REST_SPOT.spot.col, REST_SPOT.spot.row]];
    seen[REST_SPOT.spot.row * cols + REST_SPOT.spot.col] = 1;
    let reached = 0;
    while (stack.length) {
      const [c, r] = stack.pop();
      reached++;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (!free(nc, nr) || seen[nr * cols + nc]) continue;
        seen[nr * cols + nc] = 1;
        stack.push([nc, nr]);
      }
    }
    return reached === cols * rows - fp.w * fp.h ? null : 'walkway';
  }

  // --- Alex ---------------------------------------------------------------------------
  const worker = new Agent({ id: WORKER.id, name: WORKER.name, speed: WORKER.speed });
  worker.kind = 'worker';
  worker.phase = 'resting';
  worker.loops = 0; // completed desk → rest rounds
  worker.placeAtTile(grid, REST_SPOT.spot.col, REST_SPOT.spot.row);
  worker.setState('resting');
  const workerRect = () => {
    const f = iso.toWorld(worker.x, worker.y);
    const h = WORKER.height;
    const w = h * assets.aspect(WORKER.art);
    return { x: f.x - w / 2, y: f.y - h + HH * 0.25, w, h };
  };

  const phaseLog = []; // recent phase changes (tests / debug)
  let simTime = 0;
  const setPhase = (phase) => {
    worker.phase = phase;
    phaseLog.push({ phase, t: +simTime.toFixed(2), teleports: worker.teleports, tile: worker.tile(grid) });
    if (phaseLog.length > 60) phaseLog.shift();
    debug?.log(`Alex: ${phase}`);
  };
  function goToDesk() {
    const seat = deskSpot();
    setPhase('toDesk');
    worker.walkTo(grid, seat.col, seat.row, () => {
      setPhase('working');
      worker.setState('working');
    });
  }
  function goToRest() {
    setPhase('toRest');
    worker.walkTo(grid, REST_SPOT.spot.col, REST_SPOT.spot.row, () => {
      worker.loops++;
      setPhase('resting');
      worker.setState('resting');
    });
  }
  function updateWorker(dt) {
    worker.update(dt, grid);
    if (worker.phase === 'resting' && worker.state === 'resting' && worker.stateTime >= WORKER.restSec) goToDesk();
    else if (worker.phase === 'working' && worker.state === 'working' && worker.stateTime >= WORKER.workSec) goToRest();
  }

  // Tapping: everything is hit-tested where it is drawn (projected), nearest-to-viewer first.
  const depthOf = (it) => (it.kind === 'worker' ? worker.x + worker.y : it.depth);
  const selection = new Selection(bus, {
    boundsOf: (item) => (item.kind === 'worker' ? workerRect() : item.rect),
    depthOf,
  });
  selection.add(desk);
  selection.add(worker);
  const menuKind = (item) => (item.kind === 'worker' ? 'worker' : item.id);

  // --- UI rects ---------------------------------------------------------------------
  // The temporary bottom-bar shortcut (Milestone 1; the real five-button bar comes later).
  const shortcutRect = () => layout.anchor('bottom', 560, THEME.button.minH + 20, 40);
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
  // The camera sees the safe area above the shortcut, so its clamp keeps every room edge reachable.
  function fitView() {
    const sr = layout.safeRect;
    camera.viewX = 0;
    camera.viewY = sr.y;
    camera.setView(W, shortcutRect().y - 16 - sr.y);
  }
  // Start looking at the desks and the rest spot.
  function resetView() {
    fitView();
    camera.zoom = STUDIO.zoom.start;
    const a = iso.cellCenter(desk.fp.col + 1, desk.fp.row + 1);
    const b = iso.cellCenter(REST_SPOT.spot.col, REST_SPOT.spot.row);
    camera.centerOn((a.x + b.x) / 2, (a.y + b.y) / 2 - HH);
  }

  // --- gestures ---------------------------------------------------------------------------
  let active = false; // only while the studio is the current screen
  const gestures = new WorldGestures({ camera, bus, isActive: () => active });
  const overSheet = (p) => sheet.active && p.y >= sheet.rect().y;
  const onUi = (p) => (buildMode ? hitRect(p, bannerRect()) : hitRect(p, shortcutRect()));
  // Floor cell under a screen point, without clamping to the room (a dragged desk can hang off the edge).
  const rawCell = (sx, sy) => {
    const w = camera.screenToWorld(sx, sy);
    const plan = iso.toPlan(w.x, w.y);
    return { col: Math.floor(plan.x / CELL), row: Math.floor(plan.y / CELL) };
  };
  const pickAt = (sx, sy) => {
    const w = camera.screenToWorld(sx, sy);
    return selection.pick(w.x, w.y);
  };

  // Build Mode: a press on the desks drags them (instead of panning).
  let deskPress = null; // pointer id pressed on the desks
  let moving = null; // { id, grab: {dc, dr}, col, row, reason }
  let refused = null; // { reason, t } — the last refused move, shown for a moment
  const taps = []; // recent taps and what they hit (tests / debug)
  const moves = []; // placed / refused moves (tests / debug)

  function updateMove(p) {
    const cell = rawCell(p.x, p.y);
    moving.col = cell.col - moving.grab.dc;
    moving.row = cell.row - moving.grab.dr;
    moving.reason = whyNot(moving.col, moving.row);
  }
  function dropDesk() {
    const m = moving;
    moving = null;
    deskPress = null;
    if (m.col === desk.fp.col && m.row === desk.fp.row) return;
    if (m.reason) {
      refused = { reason: m.reason, t: 0 };
      moves.push({ col: m.col, row: m.row, placed: false, reason: m.reason });
      debug?.log(`desks refused at ${m.col},${m.row}: ${BUILD_TEXT[m.reason]}`);
      return;
    }
    setDesk({ ...desk.fp, col: m.col, row: m.row });
    refused = null;
    moves.push({ col: m.col, row: m.row, placed: true });
    debug?.log(`desks moved to ${m.col},${m.row}`);
    // Alex heads for the new seat if he was going there or working; a walk to the rest spot is re-pathed round it.
    if (worker.phase === 'toDesk' || worker.phase === 'working') goToDesk();
    else if (worker.phase === 'toRest') goToRest();
  }

  const screen = {
    camera,
    grid,
    iso,
    desk,
    worker,
    selection,
    taps,
    moves,
    phaseLog,
    whyNot,
    doneRect,
    shortcutRect,
    get buildMode() {
      return buildMode;
    },
    get moving() {
      return moving;
    },
    get simTime() {
      return simTime;
    },
    deskSpot: () => deskSpot(),

    // Screen point at the middle of the desks' art / Alex (tests).
    screenPointOf(id) {
      const r = id === 'worker' ? workerRect() : desk.rect;
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
      deskPress = null;
      refused = null;
      if (on) {
        sheet.close();
        selection.clear();
      }
      debug?.log(`Build Mode ${on ? 'on' : 'off'}`);
    },

    enter() {
      active = true;
      if (!desk.rect) {
        setDesk(desk.fp); // needs the art's shape, so after loading
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

    // Fixed step (stops while the game is paused).
    update(dt) {
      simTime += dt;
      updateWorker(dt);
      if (refused && (refused.t += dt) > REFUSED_SEC) refused = null;
    },

    onDown(p) {
      if (overSheet(p) || onUi(p)) return; // the shortcut, the banner and the sheet never pan or pinch the studio
      // In Build Mode the desks win even with Alex standing in front of them (only the desks can move).
      const w = camera.screenToWorld(p.x, p.y);
      if (buildMode && gestures.fingers === 0 && selection.hits(desk, w.x, w.y)) {
        deskPress = p.id; // this finger moves the desks
        return;
      }
      gestures.down(p);
    },

    onUp(p) {
      if (p.id === deskPress) {
        if (moving) dropDesk();
        deskPress = null;
        return;
      }
      gestures.up(p);
    },

    onDragStart(p) {
      if (p.id === deskPress) {
        const grabbed = rawCell(p.startX, p.startY);
        moving = { id: p.id, grab: { dc: grabbed.col - desk.fp.col, dr: grabbed.row - desk.fp.row }, col: desk.fp.col, row: desk.fp.row, reason: null };
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
          moving = null; // cancelled (e.g. paused): the desks stay where they were
          deskPress = null;
        }
        return;
      }
      gestures.dragEnd(p);
    },

    onWheel(p) {
      if (!moving) gestures.wheel(p);
    },

    onTap(p) {
      if (gestures.multiTouch && p.id !== deskPress) return;
      if (buildMode) {
        if (hitRect(p, doneRect())) screen.setBuildMode(false);
        taps.push({ x: p.x, y: p.y, picked: null, build: true });
        deskPress = null;
        return;
      }
      if (hitRect(p, shortcutRect())) {
        selection.select(desk);
        openMenu(DESK.id, desk);
        taps.push({ x: p.x, y: p.y, picked: 'shortcut' });
        return;
      }
      const w = camera.screenToWorld(p.x, p.y);
      const picked = selection.handleTap(w.x, w.y);
      if (picked) openMenu(menuKind(picked), picked);
      taps.push({ x: p.x, y: p.y, picked: picked ? (picked.kind === 'worker' ? 'worker' : picked.id) : null });
      if (taps.length > 50) taps.shift();
    },

    // Long press on empty floor → Build Mode. On the desks or Alex it just opens their sheet.
    onHold(p) {
      if (gestures.multiTouch || gestures.fingers > 1 || buildMode || onUi(p) || overSheet(p)) return;
      const picked = pickAt(p.x, p.y);
      if (picked) {
        selection.select(picked);
        openMenu(menuKind(picked), picked);
      } else if (screen.cellAt(p.x, p.y)) screen.setBuildMode(true);
    },

    render(ctx) {
      camera.apply(ctx);
      room.render(ctx, 0, 0);
      if (buildMode) drawBuildFloor(ctx);
      drawSelectionMark(ctx);
      // The desks and Alex, back to front. Sprites are cached at full-zoom size so they stay sharp when zoomed.
      assets.detail = STUDIO.zoom.max;
      const items = [desk, worker].sort((a, b) => depthOf(a) - depthOf(b));
      for (const it of items) {
        if (it.kind === 'worker') {
          const r = workerRect();
          assets.draw(ctx, WORKER.art, r.x, r.y, r.w, r.h);
        } else if (!moving) assets.draw(ctx, DESK.art, desk.rect.x, desk.rect.y, desk.rect.w, desk.rect.h);
      }
      if (moving) drawMovingDesk(ctx);
      assets.detail = 1;
      drawStateChip(ctx);
      camera.restore(ctx);

      // Build Mode's banner takes the top; the shortcut steps aside until Done.
      if (buildMode) drawBuildBanner(ctx);
      else drawButton(ctx, shortcutRect(), DESK.name);
    },
  };

  // --- drawing -------------------------------------------------------------------
  // Floor, walls, the window, the whiteboard, the door and the rest-spot rug, drawn once into the cached layer.
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
    // Rest-spot rug: a rounded mat with a border and a little cushion.
    const a = REST_SPOT.area;
    const inset = 0.12;
    isoPath(g, iso.outline(a.col + inset, a.row + inset, a.w - inset * 2, a.h - inset * 2));
    g.fillStyle = L.rugEdge;
    g.fill();
    g.strokeStyle = L.wallCap;
    g.lineWidth = 3;
    g.stroke();
    isoPath(g, iso.outline(a.col + 0.3, a.row + 0.3, a.w - 0.6, a.h - 0.6));
    g.fillStyle = L.rug;
    g.fill();
    const cc = iso.corner(a.col + a.w / 2, a.row + a.h / 2);
    g.fillStyle = 'rgba(255,248,236,0.85)';
    g.font = font(22, true);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('REST', cc.x, cc.y);
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

  // Build Mode: the hidden grid, plus the no-build areas (rest spot, doorway) hatched faintly.
  function drawBuildFloor(ctx) {
    for (const a of [REST_SPOT.area, DOORWAY]) {
      isoPath(ctx, iso.outline(a.col, a.row, a.w, a.h));
      ctx.fillStyle = 'rgba(59,51,44,0.12)';
      ctx.fill();
    }
    ctx.strokeStyle = L.gridLine;
    ctx.lineWidth = 3 / camera.zoom;
    for (let c = 0; c <= cols; c++) line(ctx, iso.corner(c, 0), iso.corner(c, rows));
    for (let r = 0; r <= rows; r++) line(ctx, iso.corner(0, r), iso.corner(cols, r));
  }

  // The dragged desks: green or red footprint (and seat), with the desks drawn there, see-through.
  function drawMovingDesk(ctx) {
    const fp = { ...desk.fp, col: moving.col, row: moving.row };
    const ok = !moving.reason;
    isoPath(ctx, iso.outline(fp.col, fp.row, fp.w, fp.h));
    ctx.fillStyle = ok ? L.valid : L.invalid;
    ctx.fill();
    ctx.strokeStyle = ok ? L.validEdge : L.invalidEdge;
    ctx.lineWidth = 5 / camera.zoom;
    ctx.stroke();
    const seat = deskSpot(fp);
    isoPath(ctx, iso.outline(seat.col, seat.row));
    ctx.setLineDash([12 / camera.zoom, 8 / camera.zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
    const r = placeDesk(fp);
    ctx.globalAlpha = 0.8;
    assets.draw(ctx, DESK.art, r.x, r.y, r.w, r.h);
    ctx.globalAlpha = 1;
  }

  // The selected thing's footprint (or Alex's cell) glows on the floor while its sheet is open.
  function drawSelectionMark(ctx) {
    const it = selection.selected;
    if (!it || !sheet.active) return;
    const t = it.kind === 'worker' ? worker.tile(grid) : null;
    const pts = it.kind === 'worker' ? (t ? iso.outline(t.col, t.row) : null) : iso.outline(desk.fp.col, desk.fp.row, desk.fp.w, desk.fp.h);
    if (!pts) return;
    isoPath(ctx, pts);
    ctx.fillStyle = C.glow;
    ctx.fill();
    ctx.strokeStyle = C.action;
    ctx.lineWidth = 5 / camera.zoom;
    ctx.stroke();
  }

  // Alex's state, always shown in a little chip over his head.
  function drawStateChip(ctx) {
    const st = WORKER_STATE[worker.phase];
    const r = workerRect();
    const colors = { Walking: C.progress, Working: C.action, Resting: C.good };
    ctx.font = font(26, true);
    const tw = ctx.measureText(st.label).width;
    const w = tw + 36;
    const h = 44;
    const x = r.x + r.w / 2 - w / 2;
    const y = r.y - h - 10;
    ctx.fillStyle = colors[st.label];
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.textOnAction;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.label, x + w / 2, y + h / 2 + 1);
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
