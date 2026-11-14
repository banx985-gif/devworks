// Visitors in the studio (Milestone 40v; data/visitors.js). Cosmetic only: nothing here changes the game, the save or
// any number, and it never uses the studio's seeded random (so a run plays out the same with visitors on or off).
//
//   Fans: a visit is asked for (fanVisit) on a launch day, a convention or a fan event. It waits a few game days for you
//   to be in the studio, then 2–6 fans (more for a better review and more Fame; half, at most 3, on Graphics Low) step
//   in through the door one after another, walk to 1–2 stops (a desk, the trophy shelf), look, cheer and walk out.
//   Never more than 6 on screen. Tapping one shows a one-line comment about your latest game (the screen does the hit
//   test; staff and facilities are always tested first).
//   Uncle Ray: asked for when the first-time guide speaks or on the year's awards day; walks in to just inside the
//   door, stands there while his hint shows (guide) or for a few seconds (awards day, with a line), then leaves.
//   Off the studio screen, or with "Show visitors" off: none (anyone inside is gone at once). Paused: nobody new comes
//   in and those inside stand still.
//
//   const v = createVisitors({ world, has, want, random, today, latestGame, fame })
//   v.fanVisit(reason, { review }) · v.mentor(reason, { line }) · v.update(dt, { onStudio, running, enabled, low, hint })
//   v.list → the visitors inside ({ kind: 'visitor', id, sheet, agent, phase, mentor, line, lineT }) · v.tap(visitor)
import { Agent } from '../../../../core/Agent.js';
import { DOORWAY } from '../../data/studio.js';
import { VISITORS as V, FAN_SHEETS, MENTOR_SHEET, FAN_LINES, FAN_REVIEW_BANDS, MENTOR_AWARDS_LINES } from '../../data/visitors.js';

export function visitorGroupSize({ reason = 'launch', review = 0, fame = 0, low = false } = {}) {
  let n = V.base + (V.reasons[reason]?.extra ?? 0);
  for (const s of V.reviewSteps) if (review >= s) n++;
  for (const s of V.fameSteps) if (fame >= s) n++;
  n = Math.max(2, Math.min(V.maxOnScreen, n));
  return low ? Math.min(V.lowMax, Math.max(1, Math.ceil(n / 2))) : n;
}

export function fanLine(game, pick = 0) {
  const band = !game ? 'none' : game.review >= FAN_REVIEW_BANDS.great ? 'great' : game.review >= FAN_REVIEW_BANDS.good ? 'good' : 'mixed';
  const list = FAN_LINES[band];
  return list[Math.abs(Math.floor(pick)) % list.length].replace('{game}', game?.title ?? 'your game');
}

export function createVisitors({ world, has = () => true, want = () => {}, random = Math.random, today = () => 0, latestGame = () => null, fame = () => 0 }) {
  const list = []; // the visitors inside
  const pending = []; // fan visits waiting for you to be in the studio: { reason, review, until }
  let mentorAsk = null; // { reason, line }
  let arriving = []; // fans of the visit now under way, still to step in
  let gap = 0;
  let uid = 0;
  const log = { visits: [], arrived: 0, left: 0, cleared: 0, comments: [], mentor: [] }; // tests and the debug overlay
  const pickOf = (arr) => arr[Math.floor(random() * arr.length) % arr.length];
  const grid = () => world.grid;

  // Fans: on a launch day, a convention, a fan event.
  function fanVisit(reason = 'fan', { review = latestGame()?.review ?? 0 } = {}) {
    const r = V.reasons[reason] ?? V.reasons.fan;
    pending.push({ reason, review, until: today() + r.waitDays });
    if (pending.length > 3) pending.shift(); // a burst of events: the latest few are enough
    log.visits.push({ reason, review, day: today() });
    if (log.visits.length > 40) log.visits.shift();
  }
  // Uncle Ray: the guide speaks / the awards day.
  function mentor(reason = 'guide', { line = null } = {}) {
    want(MENTOR_SHEET);
    const m = list.find((v) => v.mentor);
    if (m) {
      // Already inside: he stays (or turns back from the door) for this one too.
      m.reason = reason;
      if (line || reason === 'awards') Object.assign(m, { line: line ?? pickOf(MENTOR_AWARDS_LINES), lineT: V.mentorSec });
      if (m.phase === 'leaving') walk(m, mentorCell(), 'standing');
      return;
    }
    mentorAsk = { reason, line: line ?? (reason === 'awards' ? pickOf(MENTOR_AWARDS_LINES) : null) };
    log.mentor.push({ reason, day: today() });
    if (log.mentor.length > 20) log.mentor.shift();
  }

  const fans = () => list.filter((v) => !v.mentor);
  // Walkable spots by a desk or the trophy shelf: beside / in front of a seat, never on a seat or where a visitor stands.
  function stops() {
    const g = grid();
    const seats = new Set(world.stations.flatMap((st) => world.seatsOf(st).map((s) => `${s.col},${s.row}`)));
    const taken = new Set(list.map((v) => v.target && `${v.target.col},${v.target.row}`).filter(Boolean));
    const out = [];
    for (const st of world.stations) {
      if (!(st.def.showcase || world.isWorkStation?.(st))) continue;
      for (const s of world.seatsOf(st)) {
        for (const c of [{ col: s.col, row: s.row + 1 }, { col: s.col + 1, row: s.row }, { col: s.col - 1, row: s.row }]) {
          const k = `${c.col},${c.row}`;
          if (g.inBounds(c.col, c.row) && g.isWalkable(c.col, c.row) && !seats.has(k) && !taken.has(k)) out.push({ ...c, shelf: !!st.def.showcase });
        }
      }
    }
    return out;
  }
  const doorCell = (i = 0) => ({ col: DOORWAY.col, row: DOORWAY.row + (i % DOORWAY.h) });
  // Uncle Ray's spot: just inside the door (the first walkable cell of a few; the doorway itself is always clear). If
  // the screen says the door is out of view (a phone shows the middle of the room), the walkable cell nearest the door
  // that is on screen, so you see him while his hint shows.
  let onScreen = null; // (col, row) → bool, from the studio screen (update opts)
  function mentorCell() {
    const g = grid();
    const s = V.mentorSpot;
    const ok = (c) => g.inBounds(c.col, c.row) && g.isWalkable(c.col, c.row);
    const near = [s, { col: s.col, row: s.row - 1 }, { col: s.col, row: s.row + 1 }, { col: DOORWAY.col + 1, row: s.row }].filter(ok);
    if (onScreen && !near.some((c) => onScreen(c.col, c.row))) {
      const seats = new Set(world.stations.flatMap((st) => world.seatsOf(st).map((x) => `${x.col},${x.row}`)));
      let best = null;
      for (let row = 0; row < world.rows; row++)
        for (let col = 0; col < world.cols; col++) {
          const c = { col, row };
          if (!ok(c) || seats.has(`${col},${row}`) || !onScreen(col, row)) continue;
          const d = Math.hypot(col - s.col, row - s.row);
          if (!best || d < best.d) best = { ...c, d };
        }
      if (best) return { col: best.col, row: best.row };
    }
    return near[0] ?? { col: DOORWAY.col + 1, row: DOORWAY.row + 1 };
  }

  function spawn({ sheet, mentor: isMentor = false, reason = null, line = null }) {
    const a = new Agent({ id: `visitor_${++uid}`, speed: V.speed });
    const d = doorCell(uid);
    a.placeAtTile(grid(), d.col, d.row);
    const v = { kind: 'visitor', id: a.id, sheet, agent: a, mentor: isMentor, reason, phase: 'in', target: null, wait: 0, stopsLeft: isMentor ? 0 : V.stops[0] + Math.floor(random() * (V.stops[1] - V.stops[0] + 1)), line, lineT: 0, cheer: 0 };
    list.push(v);
    log.arrived++;
    if (isMentor) walk(v, mentorCell(), 'standing');
    else nextStop(v);
    return v;
  }
  function walk(v, cell, then) {
    v.target = cell;
    v.phase = 'walking';
    v.agent.walkTo(grid(), cell.col, cell.row, () => {
      v.phase = then;
      v.wait = then === 'looking' ? V.lookSec[0] + random() * (V.lookSec[1] - V.lookSec[0]) : 0;
      v.cheer = 0;
    });
  }
  function nextStop(v) {
    if (v.stopsLeft <= 0) return leave(v);
    v.stopsLeft--;
    const s = stops();
    if (!s.length) return leave(v);
    // The trophy shelf now and then, else a desk.
    const shelf = s.filter((c) => c.shelf);
    walk(v, shelf.length && random() < 0.35 ? pickOf(shelf) : pickOf(s), 'looking');
  }
  function leave(v) {
    v.phase = 'leaving';
    const d = doorCell(list.indexOf(v));
    v.target = d;
    v.agent.walkTo(grid(), d.col, d.row, () => {
      v.phase = 'gone';
    });
  }
  function clear() {
    if (list.length) log.cleared += list.length;
    list.length = 0;
    arriving = [];
  }

  function update(dt, { onStudio = true, running = true, enabled = true, low = false, hint = () => false, cellOnScreen = null } = {}) {
    onScreen = cellOnScreen;
    // Old asks lapse (game days), wherever you are.
    for (let i = pending.length - 1; i >= 0; i--) if (pending[i].until < today()) pending.splice(i, 1);
    if (!enabled) {
      pending.length = 0;
      mentorAsk = null;
      return clear();
    }
    if (!onStudio) return clear();
    if (!running) return; // paused: nobody new, those inside stand still
    // A new group when the last one has gone in (never over the cap).
    if (!arriving.length && pending.length && fans().length === 0) {
      const p = pending[0];
      const n = visitorGroupSize({ reason: p.reason, review: p.review, fame: fame(), low });
      // Milestone 41f (phone memory): the group's looks are picked first and only their sheets load; wait for them (a
      // few seconds at most; a missing sheet just means that look stays home).
      if (!p.looks) {
        const pool = [...FAN_SHEETS];
        p.looks = [];
        for (let i = 0; i < n && pool.length; i++) p.looks.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
      }
      for (const look of p.looks) want(look);
      p.waited = (p.waited ?? 0) + dt;
      if (p.looks.every(has) || p.waited > V.sheetWaitSec) {
        pending.shift();
        arriving.push(...p.looks.filter(has));
        gap = 0;
      }
    }
    gap -= dt;
    const cap = low ? V.lowMax : V.maxOnScreen;
    if (arriving.length && gap <= 0 && fans().length < cap) {
      spawn({ sheet: arriving.shift() });
      gap = V.arriveGap;
    }
    if (mentorAsk && has(MENTOR_SHEET)) {
      spawn({ sheet: MENTOR_SHEET, mentor: true, reason: mentorAsk.reason, line: mentorAsk.line });
      if (mentorAsk.line) list[list.length - 1].lineT = V.mentorSec;
      mentorAsk = null;
    }
    for (const v of list) {
      v.agent.update(dt, grid());
      if (v.lineT > 0) v.lineT = Math.max(0, v.lineT - dt);
      if (v.phase === 'looking') {
        v.wait -= dt;
        if (v.wait <= 0) {
          if (random() < V.cheerChance) {
            v.phase = 'cheering';
            v.cheer = V.cheerSec;
          } else nextStop(v);
        }
      } else if (v.phase === 'cheering') {
        v.cheer -= dt;
        if (v.cheer <= 0) nextStop(v);
      } else if (v.phase === 'standing') {
        // Uncle Ray: while the guide's hint shows (or his own line), then out.
        const showing = v.reason === 'guide' ? hint() : v.lineT > 0;
        if (!showing && v.agent.stateTime > 1.2) leave(v);
      }
    }
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].phase === 'gone') {
        list.splice(i, 1);
        log.left++;
      }
    }
  }

  // A tapped fan's line (Uncle Ray says nothing new: the hint line speaks for him).
  function tap(v) {
    if (!v || v.mentor) return null;
    v.line = fanLine(latestGame(), random() * 1000);
    v.lineT = V.commentSec;
    log.comments.push(v.line);
    if (log.comments.length > 20) log.comments.shift();
    return v.line;
  }

  return {
    list,
    pending,
    log,
    fanVisit,
    mentor,
    update,
    tap,
    clear,
    // What the screen draws for a visitor now: 'walking' | 'cheering' | 'idle'.
    animOf: (v) => (v.agent.state === 'walking' ? 'walking' : v.phase === 'cheering' ? 'cheering' : 'idle'),
    get mentorAsked() {
      return !!mentorAsk;
    },
  };
}
