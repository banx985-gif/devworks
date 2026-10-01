// Milestone 40d: the unlock walkthroughs. data/guide.js has one block per feature (WALKTHROUGHS); their steps run in
// core/GuideSystem as group 'wt:<id>'. This keeps which features have opened and how far the player is with each:
//   new    — it has just opened: the game shows "New: <feature>. Show me / Later" when nothing else is on screen
//   later  — Later was tapped: a badge on Help until it is watched or dismissed
//   done   — watched to the end, skipped (Skip finishes a walkthrough) or dismissed
// One walkthrough runs at a time (active). Plain data in the run's save: serialize() / load().
import { WALKTHROUGHS, walkGroup } from '../../data/guide.js';
import { ENGINE_BALANCE } from '../../data/engines.js';

// When each feature counts as open. s: the run's systems (main.js / the test harness wire the same names).
export function walkUnlocks(s) {
  const released = () => s.projects.catalogue.list().filter((r) => r.release).length;
  return {
    afterGuide: () => true, // open from the start: offered once the first-game guide is finished
    twoStaff: () => s.world.staffSystem.staff.length >= 2,
    firstRelease: () => released() >= 1,
    stageNear: () => {
      const n = s.shop?.next?.();
      return !!n && n.reqs.filter((r) => !/Credits$/.test(r.label)).every((r) => r.ok);
    },
    publishers: () => !!(s.publishers?.offers.length || s.publishers?.active.length),
    contracts: () => !!(s.contracts?.offers.length || s.contracts?.active.length),
    requests: () => !!s.requests?.unlocked,
    sponsors: () => !!(s.sponsors?.offers.length || s.sponsors?.deals.length),
    yearTwo: () => s.clock.year >= 2,
    engines: () => ENGINE_BALANCE.facilities.some((id) => s.world.stationById(id)),
    support: () => released() >= 1 && s.clock.year >= 2,
    global: () => !!s.global && (!s.global.licensingWhy() || !s.global.externalWhy() || !!s.global.acqOffer),
    hardware: () => !!s.hardware && !s.hardware.hardwareWhy(),
    consoles: () => !!s.consoles && (!!s.consoles.own() || s.consoles.validPrototypes().length > 0),
    generations: () => !!s.consoles?.own(),
    storefront: () => !!s.distribution && !s.distribution.storefrontWhy(),
    events: () => (s.studioEvents?.notes.inbox.length ?? 0) > 0,
    secrets: () => (s.secrets?.rumours().length ?? 0) > 0,
    achievements: () => (s.achievements?.count() ?? 0) > 0,
    lateYears: () => s.clock.year >= 19,
  };
}

export function createWalkthroughs({ bus, guide, unlocks, list = WALKTHROUGHS }) {
  let status = {}; // feature id → 'new' | 'later' | 'done'
  let active = null;
  const byId = Object.fromEntries(list.map((w) => [w.id, w]));
  const idOf = (group) => (group?.startsWith('wt:') ? group.slice(3) : null);

  // A step of a walkthrough finished: Skip finishes the whole walkthrough; the last step marks it watched.
  bus.on('guide:done', ({ step, skipped }) => {
    const id = idOf(step.group);
    if (!id) return;
    if (skipped && !guide.groupDone(step.group)) guide.skipGroup(step.group);
    if (guide.groupDone(step.group)) {
      status[id] = 'done';
      if (active === id) active = null;
      bus.emit('walk:done', { id, skipped: !!skipped });
    }
  });

  // Every walkthrough's steps count as done unless it is the one running (a fresh run, a load, a reset).
  function settleGuide() {
    for (const w of list) if (w.id !== active) for (const s of guide.groupSteps(walkGroup(w.id))) if (!guide.state.done.includes(s.id)) guide.state.done.push(s.id);
  }

  const W = {
    list,
    byId: (id) => byId[id] ?? null,
    get active() {
      return active;
    },
    statusOf: (id) => status[id] ?? null,
    get status() {
      return { ...status };
    },
    // How many wait on Help (Later, not yet watched or dismissed).
    get waiting() {
      return Object.values(status).filter((v) => v === 'later').length;
    },
    // Newly opened features (call now and then): they become 'new', in the data's order.
    check() {
      const found = [];
      for (const w of list) {
        if (status[w.id]) continue;
        let ok = false;
        try {
          ok = !!unlocks[w.unlock]?.();
        } catch {
          ok = false;
        }
        if (ok) {
          status[w.id] = 'new';
          found.push(w.id);
        }
      }
      return found;
    },
    // The next "New: …" card to show.
    nextOffer: () => list.find((w) => status[w.id] === 'new') ?? null,
    later(id) {
      if (status[id] && status[id] !== 'done') status[id] = 'later';
    },
    dismiss(id) {
      if (!status[id]) return;
      status[id] = 'done';
      if (active === id) W.stop();
    },
    // Show me (again): runs it from its first step (the guide comes on if it was off).
    start(id) {
      if (!byId[id]) return false;
      if (active && active !== id) guide.skipGroup(walkGroup(active));
      active = id;
      status[id] ??= 'later';
      guide.restartGroup(walkGroup(id));
      return true;
    },
    stop() {
      const id = active;
      active = null;
      if (id) guide.skipGroup(walkGroup(id));
    },
    restart() {
      if (active) guide.restartGroup(walkGroup(active));
    },
    // Settings → Reset all walkthroughs: every opened feature asks again ("New: …").
    resetAll() {
      if (active) W.stop();
      status = {};
      settleGuide();
      W.check();
    },
    // NG+ (and the checks): everything counts as watched.
    allDone() {
      active = null;
      for (const w of list) status[w.id] = 'done';
      settleGuide();
    },
    // A run from before Milestone 40d: what is open already waits quietly on Help (Later), except the screens whose
    // M34 hint card it had seen.
    adopt(doneIds = []) {
      for (const id of doneIds) status[id] = 'done';
      for (const id of W.check()) status[id] = 'later';
    },
    settleGuide,
    newGame() {
      status = {};
      active = null;
      settleGuide();
    },
    serialize: () => JSON.parse(JSON.stringify({ status, active })),
    load(data) {
      status = { ...(data?.status ?? {}) };
      active = data?.active && byId[data.active] ? data.active : null;
      settleGuide();
    },
  };
  return W;
}
