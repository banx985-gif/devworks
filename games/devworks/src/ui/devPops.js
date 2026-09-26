// Development made visible (Milestone 5, style guide §5, bible §2.2 / §49): while a game is being made, short art pops
// appear in the studio at the right spot —
//   a bug found        → the bug swarm (dev_vfx_01) over a lead on duty, who gives a little shake
//   a breakthrough     → the inspiration bulb (dev_vfx_02) over the lead strongest in that output's stat, with a sparkle
//   progress, now and then (only while someone is working) → code compile pulse (dev_vfx_03) at the Starter Desks,
//                        art (dev_vfx_04) / story (dev_vfx_05) over the lead strongest in Art / Writing; this
//                        milestone's emphasis on each output weights which one shows
// Everything goes through core/VfxSystem's pooled 'world' layer (drawn by the StudioScreen under its camera). Pops are
// short and never stacked: one at a time per spot, at most maxLive at once, and a gap between pops of the same kind in
// real seconds, so 4× speed does not flood the room. Nothing queues: a pop that can't show now is simply skipped (the
// numbers are all in the project view). Only while the studio is on screen.
import { DEV_POPS } from '../../data/studio.js';
import { PROJECT_BALANCE } from '../../data/balance.js';

export function createDevPops({ bus, world, projects, vfx, studio, isVisible, random = Math.random, maxLive = 3 }) {
  const P = DEV_POPS;
  const busy = new Map(); // spot key → seconds until it is free again
  const since = {}; // kind → real seconds since it last showed
  const log = []; // shown pops (tests / debug): { kind, at, t }
  let clock = 0;
  let progressIn = gap();

  function gap() {
    const [a, b] = P.progressGap;
    return a + random() * (b - a);
  }
  const onDutyTeam = () => {
    const job = projects.active;
    if (!job) return [];
    return job.slots.map((id) => world.workerById(id)).filter((w) => w && world.onDuty(w.id));
  };
  const working = () => onDutyTeam().filter((w) => w.phase === 'working');
  const bestAt = (team, stat) => team.reduce((best, w) => (!best || (w.staff.stats[stat] ?? 0) > (best.staff.stats[stat] ?? 0) ? w : best), null);
  const live = () => [...busy.values()].filter((t) => t > 0).length;

  // Show one pop of this kind over target (a worker or a station). false when it can't show now.
  function pop(kind, target, extra = null) {
    const cfg = P[kind];
    if (!target || !isVisible()) return false;
    const key = `${target.kind}:${target.id}`;
    if ((busy.get(key) ?? 0) > 0 || live() >= maxLive) return false;
    if (cfg.gap && (since[kind] ?? Infinity) < cfg.gap) return false;
    const at = studio.popPoint(target);
    if (!studio.onScreen(at)) return false;
    vfx.sprite('world', cfg.art, at.x, at.y, { size: cfg.size, life: cfg.life, from: 0.4, to: 1, rise: 36, hold: 0.45 });
    busy.set(key, cfg.life);
    since[kind] = 0;
    extra?.(at);
    log.push({ kind, at: target.id, t: +clock.toFixed(2) });
    if (log.length > 40) log.shift();
    return true;
  }

  // A bug: over a random lead on duty (the one who found it), with a shake.
  bus.on('project:bug', () => {
    const team = onDutyTeam();
    const w = team[Math.floor(random() * team.length)];
    pop('bug', w, () => studio.shake(w.id, P.bug.shakeSec));
  });

  // A breakthrough: over the lead strongest in that output's stat, with a gold sparkle.
  bus.on('project:breakthrough', ({ key }) => {
    const w = bestAt(onDutyTeam(), P.breakthroughStat[key] ?? 'des');
    pop('breakthrough', w, (at) => {
      vfx.sparks('world', at.x, at.y + 20, { count: 10, speedMin: 120, speedMax: 300, spread: 3 });
      vfx.pulse('world', at.x, at.y + 30, { rx: 70, ry: 70, color: '#FFD166', life: 0.6, grow: 1.6, width: 6 });
    });
  });

  // Progress now and then: which kind is weighted by this milestone's emphasis on its output.
  function progressPop() {
    const job = projects.active;
    const team = working();
    if (!job || !team.length) return false;
    const emphasis = PROJECT_BALANCE.phases[job.phaseIndex]?.emphasis ?? {};
    const kinds = Object.entries(P.progress).map(([kind, d]) => ({ kind, d, w: (emphasis[d.output] ?? 0) + 0.05 }));
    let roll = random() * kinds.reduce((t, k) => t + k.w, 0);
    const pick = kinds.find((k) => (roll -= k.w) <= 0) ?? kinds[0];
    const target = pick.d.atMaker ? world.stations.find((s) => s.def.role === 'Maker') : bestAt(team, pick.d.stat);
    return pop(pick.kind, target);
  }

  return {
    log,
    busy,
    // Real seconds (not scaled by the game speed); running = the game clock is going.
    update(dt, running) {
      clock += dt;
      for (const k of Object.keys(since)) since[k] += dt;
      for (const [k, t] of busy) busy.set(k, t - dt);
      if (!running || !projects.active) return;
      if ((progressIn -= dt) <= 0) {
        progressPop();
        progressIn = gap();
      }
    },
    // Tests: show a progress pop now.
    progressNow: progressPop,
  };
}
