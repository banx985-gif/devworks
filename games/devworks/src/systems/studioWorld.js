// The studio as a running place (Milestone 2), separate from how it is drawn: the grid, the stations, the staff
// and their loop — own station → work → Break Area when tired → rest → back. It keeps running while other screens
// are up (the Roster, a staff card), at the top bar's speed.
//
// Plan space (grid, pathing, positions) is flat; the StudioScreen projects it. Days come from core/Clock:
// each day the core StaffSystem drains Energy for whoever is working and restores it for whoever is resting.
import { Grid } from '../../../../core/Grid.js';
import { Agent } from '../../../../core/Agent.js';
import { StaffSystem } from '../../../../core/StaffSystem.js';
import { STUDIO, STATIONS, DOORWAY, WALKER } from '../../data/studio.js';
import { STAFF_BALANCE } from '../../data/balance.js';
import { STARTERS, STAT_KEYS, ROLES, TIERS, TRAITS } from '../../data/staff.js';

const inArea = (a, col, row) => col >= a.col && row >= a.row && col < a.col + a.w && row < a.row + a.h;
const overlaps = (a, b) => a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h;

export function createStudioWorld({ bus, rng, debug }) {
  const { cols, rows, cellSize: CELL } = STUDIO;
  const grid = new Grid({ cols, rows, tileSize: CELL });

  // --- stations ---------------------------------------------------------------------
  const stations = STATIONS.map((def) => ({ kind: 'station', id: def.id, def, fp: { ...def.fp } }));
  const stationById = (id) => stations.find((s) => s.id === id) ?? null;
  const breakArea = stations.find((s) => s.def.rest);
  const seatsOf = (st, fp = st.fp) => st.def.seats.map((s) => ({ col: fp.col + s.dc, row: fp.row + s.dr }));
  const blockAll = () => {
    grid.blocked.fill(0);
    for (const st of stations) grid.blockRect(st.fp.col, st.fp.row, st.fp.w, st.fp.h, true);
  };
  blockAll();

  // Can this station stand with its back corner at (col, row)? null = yes, else the reason (BUILD_TEXT key).
  // Rules (bible §36, style guide §4): on the floor, clear of the other stations and the doorway, its own spots
  // free, nobody else's spot covered, and every free floor cell still reachable from every other (the walkway).
  function whyNot(st, col, row) {
    const fp = { col, row, w: st.fp.w, h: st.fp.h };
    if (col < 0 || row < 0 || col + fp.w > cols || row + fp.h > rows) return 'offGrid';
    const others = stations.filter((o) => o !== st);
    if (others.some((o) => overlaps(fp, o.fp))) return 'overlap';
    if (overlaps(fp, DOORWAY)) return 'walkway';
    const blockedAt = (c, r) => !grid.inBounds(c, r) || inArea(fp, c, r) || others.some((o) => inArea(o.fp, c, r));
    if (seatsOf(st, fp).some((s) => blockedAt(s.col, s.row))) return 'noSeat';
    if (others.some((o) => seatsOf(o).some((s) => inArea(fp, s.col, s.row)))) return 'seatBlocked';
    // Flood fill the free floor from the doorway.
    const seen = new Uint8Array(cols * rows);
    const stack = [[DOORWAY.col, DOORWAY.row]];
    seen[DOORWAY.row * cols + DOORWAY.col] = 1;
    let reached = 0;
    while (stack.length) {
      const [c, r] = stack.pop();
      reached++;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (!grid.inBounds(nc, nr) || blockedAt(nc, nr) || seen[nr * cols + nc]) continue;
        seen[nr * cols + nc] = 1;
        stack.push([nc, nr]);
      }
    }
    let free = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!blockedAt(c, r)) free++;
    return reached === free ? null : 'walkway';
  }

  // Move a station (Build Mode). Returns the reason it was refused, or null when it moved.
  function moveStation(st, col, row) {
    const why = whyNot(st, col, row);
    if (why) return why;
    st.fp = { ...st.fp, col, row };
    blockAll();
    // Anyone heading to or using it walks to the new spot; everyone else walking re-paths round it.
    for (const w of workers) {
      if (w.phase === 'toWork' || w.phase === 'working') {
        if (w.station === st || w.phase === 'toWork') goToWork(w);
      } else if (w.phase === 'toBreak' || w.phase === 'resting') {
        if (st === breakArea || w.phase === 'toBreak') goToBreak(w);
      }
    }
    bus.emit('world:moved', { id: st.id, col, row });
    debug?.log(`${st.def.name} moved to ${col},${row}`);
    return null;
  }

  // --- staff ---------------------------------------------------------------------------
  const staffSystem = new StaffSystem({
    rng,
    bus,
    statKeys: STAT_KEYS,
    roles: ROLES,
    tiers: TIERS,
    traits: TRAITS,
    rules: STAFF_BALANCE,
    // The day's activity follows where they are: at their station working, in the Break Area resting.
    planActivity: (s) => {
      const w = workerById(s.id);
      return w?.phase === 'working' ? 'working' : w?.phase === 'resting' ? 'resting' : 'walking';
    },
    restModifier: () => ({ energyMult: 1 + (breakArea?.def.effects?.restEnergyPct ?? 0) / 100 }),
  });

  const workers = []; // { kind: 'worker', id, staff, def, agent, station, breakSeat, phase }
  const workerById = (id) => workers.find((w) => w.id === id) ?? null;
  const phaseLog = []; // recent phase changes (tests / debug)
  let simTime = 0;

  function makeWorker(staff, def, i) {
    const agent = new Agent({ id: staff.id, name: staff.name, speed: WALKER.speed });
    const w = { kind: 'worker', id: staff.id, staff, def, agent, station: stationById(def.station), breakSeat: i, phase: 'toWork' };
    workers.push(w);
    return w;
  }

  function setPhase(w, phase) {
    w.phase = phase;
    phaseLog.push({ id: w.id, phase, t: +simTime.toFixed(2), energy: w.staff.energy, teleports: w.agent.teleports });
    if (phaseLog.length > 120) phaseLog.shift();
  }

  function goToWork(w) {
    const seat = seatsOf(w.station)[0];
    setPhase(w, 'toWork');
    w.agent.walkTo(grid, seat.col, seat.row, () => {
      setPhase(w, 'working');
      w.agent.setState('working');
    });
  }

  function goToBreak(w) {
    const seats = seatsOf(breakArea);
    const seat = seats[w.breakSeat % seats.length];
    setPhase(w, 'toBreak');
    w.agent.walkTo(grid, seat.col, seat.row, () => {
      setPhase(w, 'resting');
      w.agent.setState('resting');
    });
  }

  // After each day's Energy change: tired workers go to rest, rested ones go back to work.
  bus.on('clock:day', () => {
    staffSystem.dailyTick();
    for (const w of workers) {
      if (w.phase === 'working' && w.staff.status.tired) goToBreak(w);
      else if (w.phase === 'resting' && w.staff.energy >= STAFF_BALANCE.backToWorkAt) goToWork(w);
    }
  });
  bus.on('clock:month', () => staffSystem.monthlyTick());

  // A new studio: the three starters walk in through the door to their stations.
  function newGame() {
    staffSystem.staff = [];
    workers.length = 0;
    STARTERS.forEach((def, i) => {
      const staff = staffSystem.addFromDefinition(def);
      const w = makeWorker(staff, def, i);
      w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row + (i % DOORWAY.h));
      goToWork(w);
    });
  }

  function serialize() {
    return {
      stations: stations.map((s) => ({ id: s.id, fp: { ...s.fp } })),
      staff: staffSystem.serialize(),
      workers: workers.map((w) => ({ id: w.id, x: Math.round(w.agent.x), y: Math.round(w.agent.y), phase: w.phase, facing: w.agent.facing })),
      rng: rng.getState(),
    };
  }

  // Back to where everyone was: walkers carry on to where they were going.
  function load(data) {
    for (const s of data.stations ?? []) {
      const st = stationById(s.id);
      if (st) st.fp = { ...st.fp, col: s.fp.col, row: s.fp.row };
    }
    blockAll();
    staffSystem.load(data.staff ?? []);
    workers.length = 0;
    staffSystem.staff.forEach((staff, i) => {
      const def = STARTERS.find((d) => d.id === staff.id);
      if (!def) return;
      const w = makeWorker(staff, def, i);
      const saved = (data.workers ?? []).find((x) => x.id === staff.id);
      if (!saved) {
        w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row);
        goToWork(w);
        return;
      }
      w.agent.x = saved.x;
      w.agent.y = saved.y;
      w.agent.facing = saved.facing ?? 1;
      if (saved.phase === 'working' || saved.phase === 'resting') {
        w.phase = saved.phase;
        w.agent.setState(saved.phase);
      } else if (saved.phase === 'toBreak') goToBreak(w);
      else goToWork(w);
    });
    if (data.rng != null) rng.setState(data.rng);
  }

  return {
    grid,
    stations,
    workers,
    staffSystem,
    phaseLog,
    breakArea,
    stationById,
    workerById,
    seatsOf,
    whyNot,
    moveStation,
    goToWork,
    goToBreak,
    newGame,
    serialize,
    load,
    get simTime() {
      return simTime;
    },
    // What a save stamp needs: changes whenever anyone moves or anything changes.
    stamp: () => workers.map((w) => `${w.phase}${Math.round(w.agent.x)},${Math.round(w.agent.y)},${w.staff.energy}`).join('|') + stations.map((s) => `${s.fp.col},${s.fp.row}`).join(''),
    // Game-time seconds (already scaled by the speed; 0 while paused).
    update(gdt) {
      if (gdt <= 0) return;
      simTime += gdt;
      for (const w of workers) w.agent.update(gdt, grid);
    },
    // The "Working at the Starter Desks" line.
    stateLine(w, text) {
      const name = w.phase === 'toWork' || w.phase === 'working' ? w.station.def.name : breakArea.def.name;
      return text.replace('{station}', name);
    },
  };
}
