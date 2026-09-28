// The studio as a running place (Milestone 2), separate from how it is drawn: the grid, the stations, the staff
// and their loop — own station → work → Break Area when tired → rest → back. It keeps running while other screens
// are up (the Roster, a staff card), at the top bar's speed.
//
// Plan space (grid, pathing, positions) is flat; the StudioScreen projects it. Days come from core/Clock:
// each day the core StaffSystem drains Energy for whoever is working and restores it for whoever is resting.
//
// Milestone 11: every one of the 35 facilities (data/facilities.js) can stand here — the starting ones from
// data/studio.js STATIONS (home spots, seats), the rest bought (placed on the first free spot, then moved in Build
// Mode) and sold. effect(key) sums the facilities' effects (the effect query every system asks). Studio stages S1–S3
// grow the floor away from the back walls (setStage): the grid is rebuilt bigger and every placement is checked again,
// so a legal one never moves (migration); the stage is saved.
//
// Milestone 13: hiring and letting go. A hire walks in from the door to a free work station (freeStationFor: their
// role's station first, else any station with a seat that nobody uses); each worker's station is saved with them. A
// worker on a training course is away (off the floor, not on duty) until it ends. Anyone from the roster
// (data/staff.js ROSTER) can be loaded, not only the start staff.
import { Grid } from '../../../../core/Grid.js';
import { Agent } from '../../../../core/Agent.js';
import { StaffSystem } from '../../../../core/StaffSystem.js';
import { STUDIO, STATIONS, PROPS, DOORWAY, WALKER } from '../../data/studio.js';
import { STAFF_BALANCE } from '../../data/balance.js';
import { FACILITIES, stageById } from '../../data/facilities.js';
import { STARTERS, STAT_KEYS, ROLES, TIERS, TRAITS, staffDefById } from '../../data/staff.js';
import { RECRUIT } from '../../data/recruitment.js';

const inArea = (a, col, row) => col >= a.col && row >= a.row && col < a.col + a.w && row < a.row + a.h;
const overlaps = (a, b) => a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h;

export function createStudioWorld({ bus, rng, debug }) {
  const { cellSize: CELL } = STUDIO;
  let stage = 1; // Milestone 11: the studio stage (S1 = STUDIO's own size)
  let cols = STUDIO.cols;
  let rows = STUDIO.rows;
  let grid = new Grid({ cols, rows, tileSize: CELL });

  // --- stations and props ---------------------------------------------------------------
  // Every Start station exists once (pool); `stations` holds the ones in this studio (Milestone 5b): the "always" ones
  // plus the station each member of staff works at. The array is changed in place, so its holders see the change.
  // Milestone 11: the pool is all 35 facilities; a starting station's own data (home spot, seats, flags) wins.
  const pool = FACILITIES.map((f) => {
    const st = STATIONS.find((d) => d.id === f.id);
    const def = { ...f, ...(st ?? {}), purpose: st?.purpose ?? f.line, fp: st?.fp ?? { col: 0, row: 0, w: f.size.w, h: f.size.h } };
    return { kind: 'station', id: def.id, def, fp: { ...def.fp } };
  });
  const stations = [];
  const stationById = (id) => stations.find((s) => s.id === id) ?? null;
  const stationIdsFor = (defs, extra = []) => {
    const want = new Set([...extra, ...defs.map((d) => d?.station).filter(Boolean)]);
    return pool.filter((p) => p.def.always || want.has(p.id)).map((p) => p.id);
  };
  function setStations(ids) {
    stations.length = 0;
    for (const st of pool) if (ids.includes(st.id)) stations.push(st);
  }
  setStations(stationIdsFor(STARTERS));
  const breakArea = stations.find((s) => s.def.rest);
  // Props (Milestone 5) never move: their cells are simply taken (walked round, never built on).
  const props = PROPS.map((def) => ({ kind: 'prop', id: def.id, def, fp: { ...def.fp } }));
  const onProp = (col, row) => props.some((p) => inArea(p.fp, col, row));
  const seatsOf = (st, fp = st.fp) => st.def.seats.map((s) => ({ col: fp.col + s.dc, row: fp.row + s.dr }));
  const blockAll = () => {
    grid.blocked.fill(0);
    for (const it of [...stations, ...props]) grid.blockRect(it.fp.col, it.fp.row, it.fp.w, it.fp.h, true);
  };
  blockAll();

  // Can this station stand with its back corner at (col, row)? null = yes, else the reason (BUILD_TEXT key).
  // Rules (bible §36, style guide §4): on the floor, clear of the other stations and the doorway, its own spots
  // free, nobody else's spot covered, and every free floor cell still reachable from every other (the walkway).
  // among: the stations that count (all of them, except while settling an old save).
  function whyNot(st, col, row, among = stations) {
    const fp = { col, row, w: st.fp.w, h: st.fp.h };
    if (col < 0 || row < 0 || col + fp.w > cols || row + fp.h > rows) return 'offGrid';
    const others = among.filter((o) => o !== st);
    if (others.some((o) => overlaps(fp, o.fp))) return 'overlap';
    if (props.some((p) => overlaps(fp, p.fp))) return 'prop';
    if (overlaps(fp, DOORWAY)) return 'walkway';
    const blockedAt = (c, r) => !grid.inBounds(c, r) || inArea(fp, c, r) || others.some((o) => inArea(o.fp, c, r)) || onProp(c, r);
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

  // Every station on a spot it may stand on (Milestone 5): a save from before the props and the Showcase Shelf can
  // have a station where they now stand. Such a station goes back to its starting spot, or else the first free one.
  // Stations are placed one at a time, each checked against those already placed, so a station that was fine
  // stays put; if the result still breaks a rule, the whole room goes back to the starting layout.
  function settle() {
    const placed = [];
    for (const st of stations) {
      const ok = (c, r) => !whyNot(st, c, r, [...placed, st]);
      if (!ok(st.fp.col, st.fp.row)) {
        const home = st.def.fp;
        let spot = ok(home.col, home.row) ? home : null;
        for (let r = 0; !spot && r < rows; r++) for (let c = 0; !spot && c < cols; c++) if (ok(c, r)) spot = { col: c, row: r };
        if (spot) {
          debug?.log(`${st.def.name} moved from ${st.fp.col},${st.fp.row} to ${spot.col},${spot.row} (its spot was taken)`);
          st.fp = { ...st.fp, col: spot.col, row: spot.row };
        }
      }
      placed.push(st);
    }
    if (stations.some((st) => whyNot(st, st.fp.col, st.fp.row))) for (const st of stations) st.fp = { ...st.def.fp };
    blockAll();
  }

  // Add a station that opens later (Milestone 9: the Marketing Wall at Rank D): on its home spot, else the first free
  // spot. Returns the station, or null when it is already here or no spot is free.
  function addStation(id) {
    const st = pool.find((s) => s.id === id);
    if (!st || stationById(id)) return null;
    st.fp = { ...st.def.fp };
    stations.push(st);
    const ok = (c, r) => !whyNot(st, c, r);
    // Its home spot (a starting station), else the free spot nearest the front of the room, so a new facility stands
    // in view (not hidden behind others) and can be tapped and dragged at once (Milestone 11).
    const home = STATIONS.some((d) => d.id === id);
    let spot = home && ok(st.fp.col, st.fp.row) ? { col: st.fp.col, row: st.fp.row } : null;
    for (let d = cols + rows - 2; !spot && d >= 0; d--) for (let c = Math.min(cols - 1, d); !spot && c >= 0 && d - c < rows; c--) if (ok(c, d - c)) spot = { col: c, row: d - c };
    if (!spot) {
      stations.splice(stations.indexOf(st), 1);
      return null;
    }
    st.fp = { ...st.fp, ...spot };
    blockAll();
    for (const w of workers) if (w.phase === 'toWork') goToWork(w); else if (w.phase === 'toBreak') goToBreak(w); // re-path round it
    bus.emit('world:moved', { id, col: spot.col, row: spot.row });
    debug?.log(`${st.def.name} placed at ${spot.col},${spot.row}`);
    return st;
  }

  // Sell a facility (Milestone 11): it leaves the floor. The caller checks it may go (money, KEEP, nobody working).
  function removeStation(id) {
    const st = stationById(id);
    if (!st) return false;
    stations.splice(stations.indexOf(st), 1);
    blockAll();
    for (const w of workers) if (w.phase === 'toWork') goToWork(w); else if (w.phase === 'toBreak') goToBreak(w);
    bus.emit('world:moved', { id, sold: true });
    debug?.log(`${st.def.name} sold`);
    return true;
  }

  // The effect query (Milestone 11): the sum of one effect over every facility in the studio.
  // Milestone 18: other sources (the sponsors' perks) add to it through addEffectSource(fn(key) → number).
  const effectSources = [];
  const effect = (key) => stations.reduce((t, st) => t + (st.def.effects?.[key] ?? 0), 0) + effectSources.reduce((t, f) => t + (f(key) ?? 0), 0);

  // Studio stage (Milestone 11): a bigger floor. The grid is rebuilt at the new size; every station is checked again
  // where it stands (settle keeps a legal one exactly where it is; only an illegal one moves, to its home spot or the
  // first free one); walkers re-path.
  function setStage(n, { quiet = false } = {}) {
    const st = stageById(n);
    stage = st.id;
    cols = st.cols;
    rows = st.rows;
    grid = new Grid({ cols, rows, tileSize: CELL });
    settle();
    for (const w of workers) if (w.phase === 'toWork') goToWork(w); else if (w.phase === 'toBreak') goToBreak(w);
    if (!quiet) bus.emit('studio:stage', { stage: st });
    return st;
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
    // The day's activity follows their duty, not the exact walk: on duty (at or heading to their station) is a
    // working day, on a break (at or heading to the Break Area) a resting one. Days then come out the same at any
    // speed, so the same save and choices always give the same results (Milestone 3).
    planActivity: (s) => (onDuty(s.id) ? 'working' : 'resting'),
    restModifier: () => ({ energyMult: 1 + effect('restEnergyPct') / 100 }),
    // Milestone 7: projects can make work more tiring (Push Quality, Crunch): see setEnergyLossMultiplier.
    energyLossMultiplier: (s) => energyLossExtra(s),
  });
  let energyLossExtra = () => 1;

  const workers = []; // { kind: 'worker', id, staff, def, agent, station, breakSeat, phase }
  const workerById = (id) => workers.find((w) => w.id === id) ?? null;
  const onDuty = (id) => {
    const p = workerById(id)?.phase;
    return p === 'toWork' || p === 'working';
  };
  // Milestone 13: a work station = one with a seat that isn't the Break Area; free = nobody works there.
  // Milestone 22: from the Corporate HQ a work station holds deskShare people (its seats, or deskShare if more), so a
  // studio of 24–32 fits; they stand side by side (workSeat).
  const isWorkStation = (st) => st.def.seats?.length > 0 && !st.def.rest;
  const placesAt = (st) => (stageById(stage).deskShare ? Math.max(st.def.seats.length, stageById(stage).deskShare) : 1);
  const freeStations = () => stations.filter((st) => isWorkStation(st) && workers.filter((w) => w.station === st).length < placesAt(st));
  // Where a new hire of this role would sit: their role's station if it is free, else the first free work station.
  function freeStationFor(role) {
    const free = freeStations();
    return free.find((st) => st.id === RECRUIT.roleStations[role]) ?? free[0] ?? null;
  }
  const phaseLog = []; // recent phase changes (tests / debug)
  let simTime = 0;

  function makeWorker(staff, def, i, stationId = def.station) {
    const agent = new Agent({ id: staff.id, name: staff.name, speed: WALKER.speed });
    // tiredIcon: shown from "tired" until Energy is back above tiredIconUntil (Milestone 4), not only on the walk.
    const w = { kind: 'worker', id: staff.id, staff, def, agent, station: stationById(stationId) ?? stationById(def.station) ?? freeStationFor(staff.role) ?? stationById('F01'), breakSeat: i, phase: 'toWork', tiredIcon: false, away: false };
    workers.push(w);
    return w;
  }

  function setPhase(w, phase) {
    w.phase = phase;
    phaseLog.push({ id: w.id, phase, t: +simTime.toFixed(2), energy: w.staff.energy, teleports: w.agent.teleports });
    if (phaseLog.length > 120) phaseLog.shift();
  }

  // Where a worker stands at their station (Milestone 22: a big studio shares stations, so people spread out): the
  // n-th worker at a station takes its n-th seat; past the last seat, the walkable cells beside the first one along its
  // front row (right, left, further out…), so nobody stands on top of anyone else when there is room.
  function workSeat(w) {
    const seats = seatsOf(w.station);
    const n = workers.filter((x) => x.station === w.station).indexOf(w);
    if (n < seats.length) return seats[Math.max(0, n)];
    const s0 = seats[0];
    const taken = new Set([...workers.filter((x) => x !== w && x.seatCell).map((x) => `${x.seatCell.col},${x.seatCell.row}`), ...stations.flatMap((st) => seatsOf(st).map((s) => `${s.col},${s.row}`))]); // anyone's spot, any station's seat
    for (let k = 1; k <= 6; k++) {
      for (const dc of [k, -k]) {
        const c = { col: s0.col + dc, row: s0.row };
        if (grid.inBounds(c.col, c.row) && grid.isWalkable(c.col, c.row) && !taken.has(`${c.col},${c.row}`)) return c;
      }
    }
    return s0;
  }
  function goToWork(w) {
    const seat = workSeat(w);
    w.seatCell = seat;
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
    // Decided by duty, never by where the walk has got to, so the day comes out the same at any speed.
    for (const w of workers) {
      if (w.away) continue; // on a course (Milestone 13)
      if (w.staff.status.tired) w.tiredIcon = true;
      else if (w.staff.energy >= STAFF_BALANCE.tiredIconUntil) w.tiredIcon = false;
      if (onDuty(w.id) && w.staff.status.tired) goToBreak(w);
      else if (!onDuty(w.id) && w.staff.energy >= STAFF_BALANCE.backToWorkAt) goToWork(w);
    }
  });
  bus.on('clock:month', () => staffSystem.monthlyTick());

  // A new studio: the starting team (Milestone 5b: whoever the founder brings; the Milestone 2 three by default) walks
  // in through the door to their stations. Each starter's station is placed; the room starts from its home layout.
  function newGame(team = STARTERS) {
    setStage(1, { quiet: true });
    for (const st of pool) st.fp = { ...st.def.fp };
    setStations(stationIdsFor(team));
    settle();
    staffSystem.staff = [];
    workers.length = 0;
    team.forEach((def, i) => {
      const staff = staffSystem.addFromDefinition(def);
      const w = makeWorker(staff, def, i);
      w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row + (i % DOORWAY.h));
      goToWork(w);
    });
  }

  // --- hiring / letting go / away (Milestone 13) ---------------------------------------------------------------------
  // A new member of staff (def from data/staff.js ROSTER) walks in from the door to stationId.
  function hire(def, stationId) {
    const staff = staffSystem.addFromDefinition(def);
    const w = makeWorker(staff, def, workers.length, stationId);
    w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row + (workers.length % DOORWAY.h));
    goToWork(w);
    bus.emit('staff:hired', { staff, station: w.station });
    debug?.log(`${staff.name} hired: ${w.station.def.name}`);
    return w;
  }
  // They leave: off the floor and off the roster (core emits 'staff:removed').
  function fire(id) {
    const w = workerById(id);
    if (!w) return null;
    workers.splice(workers.indexOf(w), 1);
    return staffSystem.remove(id);
  }
  // Away on a course (off the floor, not on duty), or back: they walk in from the door.
  function setAway(id, away) {
    const w = workerById(id);
    if (!w || w.away === away) return false;
    w.away = away;
    if (away) {
      w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row);
      w.agent.setState('idle');
      setPhase(w, 'away');
      bus.emit('staff:away', { staff: w.staff, away: true });
    } else {
      w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row);
      goToWork(w);
      bus.emit('staff:away', { staff: w.staff, away: false });
    }
    return true;
  }

  function serialize() {
    return {
      stage, // Milestone 11
      stations: stations.map((s) => ({ id: s.id, fp: { ...s.fp } })),
      staff: staffSystem.serialize(),
      workers: workers.map((w) => ({ id: w.id, x: Math.round(w.agent.x), y: Math.round(w.agent.y), phase: w.phase, facing: w.agent.facing, tiredIcon: w.tiredIcon, station: w.station?.id ?? null, away: w.away })),
      rng: rng.getState(),
    };
  }

  // Back to where everyone was: walkers carry on to where they were going.
  function load(data) {
    setStage(data.stage ?? 1, { quiet: true }); // a save from before Milestone 11 is S1
    // This studio's stations: the saved ones, the "always" ones (a pre-Milestone 5 save gains the shelf) and each
    // member of staff's own station.
    for (const st of pool) st.fp = { ...st.def.fp };
    // A hire's own station is in the saved stations; the start staff keep theirs (data), as before.
    setStations(stationIdsFor((data.staff ?? []).map((s) => staffDefById(s.id)).filter((d) => d?.station), (data.stations ?? []).map((s) => s.id)));
    for (const s of data.stations ?? []) {
      const st = stationById(s.id);
      if (st) st.fp = { ...st.fp, col: s.fp.col, row: s.fp.row };
    }
    // Milestone 13: in the saved order (a new hire takes the first free station, so the order is part of the state).
    const order = (data.stations ?? []).map((s) => s.id);
    const at = (st) => (order.includes(st.id) ? order.indexOf(st.id) : order.length + pool.indexOf(st));
    stations.sort((a, b) => at(a) - at(b));
    settle();
    staffSystem.load(data.staff ?? []);
    workers.length = 0;
    staffSystem.staff.forEach((staff, i) => {
      const def = staffDefById(staff.id) ?? { id: staff.id, role: staff.role };
      const saved = (data.workers ?? []).find((x) => x.id === staff.id);
      const w = makeWorker(staff, def, i, saved?.station ?? def.station);
      if (saved?.away) {
        w.away = true;
        w.phase = 'away';
        w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row);
        return;
      }
      if (!saved) {
        w.agent.placeAtTile(grid, DOORWAY.col, DOORWAY.row);
        goToWork(w);
        return;
      }
      w.agent.x = saved.x;
      w.agent.y = saved.y;
      w.agent.facing = saved.facing ?? 1;
      w.tiredIcon = saved.tiredIcon ?? staff.status.tired;
      if (saved.phase === 'working' || saved.phase === 'resting') {
        w.phase = saved.phase;
        w.agent.setState(saved.phase);
      } else if (saved.phase === 'toBreak') goToBreak(w);
      else goToWork(w);
    });
    if (data.rng != null) rng.setState(data.rng);
  }

  return {
    get grid() {
      return grid;
    },
    get cols() {
      return cols;
    },
    get rows() {
      return rows;
    },
    get stage() {
      return stage;
    },
    setStage,
    removeStation,
    effect,
    addEffectSource: (fn) => effectSources.push(fn),
    stations,
    stationPool: pool,
    props,
    workers,
    staffSystem,
    phaseLog,
    breakArea,
    stationById,
    workerById,
    onDuty,
    seatsOf,
    whyNot,
    moveStation,
    addStation,
    goToWork,
    goToBreak,
    newGame,
    hire,
    fire,
    setAway,
    freeStations,
    freeStationFor,
    isWorkStation,
    get staffCap() {
      return stageById(stage).staffCap;
    },
    serialize,
    load,
    setEnergyLossMultiplier(fn) {
      energyLossExtra = fn ?? (() => 1);
    },
    get simTime() {
      return simTime;
    },
    // What a save stamp needs: changes whenever anyone moves or anything changes.
    stamp: () => workers.map((w) => `${w.id}${w.phase}${Math.round(w.agent.x)},${Math.round(w.agent.y)},${w.staff.energy}`).join('|') + stations.map((s) => `${s.fp.col},${s.fp.row}`).join(''),
    // Game-time seconds (already scaled by the speed; 0 while paused).
    update(gdt) {
      if (gdt <= 0) return;
      simTime += gdt;
      for (const w of workers) w.agent.update(gdt, grid);
    },
    // The "Working at the Starter Desks" line.
    stateLine(w, text) {
      if (w.away) return 'Away on a training course';
      const name = w.phase === 'toWork' || w.phase === 'working' ? w.station.def.name : breakArea.def.name;
      return text.replace('{station}', name);
    },
  };
}
