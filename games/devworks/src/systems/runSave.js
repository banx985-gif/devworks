// The run save (Milestone 35, bible §50): what one campaign slot holds, how it is written and read back, and how a new
// run starts — in one place, so the game (main.js) and the force-close tests use exactly the same code.
//
//   §50 run save: studio, staff, projects, catalogue, franchises, engines, hardware, platform market, economy, research,
//   deals, awards, secrets, event queue. RUN_PARTS maps each save key to the §50 part it belongs to. Nothing account-wide
//   is in here (combos found, secret discoveries, achievements, Hall of Fame, records, Prestige Tokens, NG+ live in the
//   account file, src/systems/accountFile.js).
//
//   serializeRun(sys, extra)    the save data (every system's serialize) + extra (the guide, the last boundary)
//   loadRun(sys, data)          every system's load, in the order they depend on each other; a key missing from an
//                               older save loads that system's "from before it" state
//   newRun(sys, { team, seed }) every system's newGame (a new studio; its profile is created by the caller)
// sys: { world, projects, business, profile, research, clock, elements, recruitment, training, combos, engines,
// publishers, contracts, sponsors, rivals, awards, support, global, hardware, consoles, distribution, studioEvents,
// secrets, ending, monetisation, requests, rewards } — any may be missing (a test that doesn't need it).
export const RUN_PARTS = {
  studio: 'studio',
  world: 'studio',
  clock: 'studio',
  guide: 'studio',
  boundary: 'studio',
  staff: 'staff',
  games: 'projects / catalogue',
  business: 'economy / platform market / franchises',
  elements: 'research',
  unlocked: 'research',
  research: 'research',
  combos: 'research',
  engines: 'engines',
  publishers: 'deals',
  contracts: 'deals',
  sponsors: 'deals',
  global: 'deals',
  support: 'projects / catalogue',
  distribution: 'economy / platform market / franchises',
  rivals: 'awards',
  awards: 'awards',
  hardware: 'hardware',
  consoles: 'hardware',
  secrets: 'secrets',
  studioEvents: 'event queue',
  ending: 'studio',
  requests: 'deals', // Milestone 40c: the Request Board, requests in the works, relations
  rewards: 'studio', // Milestone 40c: unopened reward drops, the idea boost, vouchers
  monetisation: 'economy / platform market / franchises', // Milestone 36: rewarded-ad uses this run, the VIP research queue
};
// What the account file holds (bible §50 "Account save"), never a run save.
export const ACCOUNT_PARTS = ['combos', 'secrets', 'achievements', 'legacy', 'monetisation']; // Milestone 36: entitlements, purchases, ad timing

const ser = (x) => (x ? x.serialize() : undefined);

export function serializeRun(s, extra = {}) {
  const out = {
    ...extra,
    ending: ser(s.ending),
    requests: ser(s.requests), // Milestone 40c
    rewards: ser(s.rewards),
    monetisation: s.monetisation?.serializeRun(),
    secrets: ser(s.secrets),
    studioEvents: ser(s.studioEvents),
    distribution: ser(s.distribution),
    consoles: ser(s.consoles),
    hardware: ser(s.hardware),
    global: ser(s.global),
    support: ser(s.support),
    rivals: ser(s.rivals),
    awards: ser(s.awards),
    sponsors: ser(s.sponsors),
    publishers: ser(s.publishers),
    contracts: ser(s.contracts),
    engines: ser(s.engines),
    combos: ser(s.combos),
    staff: s.recruitment || s.training ? { recruit: ser(s.recruitment), training: ser(s.training) } : undefined,
    research: ser(s.research),
    clock: ser(s.clock),
    world: ser(s.world),
    games: ser(s.projects),
    business: ser(s.business),
    elements: ser(s.elements),
    unlocked: s.elements?.open(),
    studio: ser(s.profile),
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

export function loadRun(s, data) {
  s.world.load(data.world);
  s.projects.load(data.games); // a Milestone 2 save has none: nothing in the works, an empty catalogue
  s.business.load(data.business); // a Milestone 3 save has none: the books start now (starting Credits)
  s.profile?.load(data.studio);
  s.research?.load(data.research); // Milestone 12 (a save from before it: nothing researched)
  s.clock.load(data.clock); // the saved speed is checked against the unlocks just loaded
  s.elements?.load(data.elements ?? data.unlocked); // after the rank and the date: anything already earned opens
  s.recruitment?.load(data.staff?.recruit ?? null); // Milestone 13 (a save from before it: a fresh board, careers rebuilt)
  s.training?.load(data.staff?.training ?? null);
  s.combos?.load(data.combos ?? null); // Milestone 15 (a save from before it: nothing found in this run)
  s.engines?.load(data.engines ?? null); // Milestone 16 (a save from before it: no engine)
  s.publishers?.load(data.publishers ?? null); // Milestone 17 (a save from before it: this month's offers now)
  s.contracts?.load(data.contracts ?? null);
  s.sponsors?.load(data.sponsors ?? null); // Milestone 18
  s.rivals?.load(data.rivals ?? null); // Milestone 19 (a save from before it: the rivals' past releases, no award results)
  s.awards?.load(data.awards ?? null);
  s.support?.load(data.support ?? null); // Milestone 20
  s.global?.load(data.global ?? null); // Milestone 21
  s.hardware?.load(data.hardware ?? null); // Milestone 23
  s.consoles?.load(data.consoles ?? null); // Milestone 24
  s.distribution?.load(data.distribution ?? null); // Milestone 26
  s.studioEvents?.load(data.studioEvents ?? null); // Milestone 27
  s.secrets?.load(data.secrets ?? null); // Milestone 28
  s.ending?.load(data.ending ?? null); // Milestone 33 (a save from before it: the ending fires at the next check if Year 20 is over)
  s.monetisation?.loadRun(data.monetisation ?? null); // Milestone 36
  s.requests?.load(data.requests ?? null); // Milestone 40c (a save from before it: open once a game is out)
  s.rewards?.load(data.rewards ?? null);
}

export function newRun(s, { team, seed }) {
  s.world.newGame(team);
  s.business.newGame({ seed }); // the run's platform market seed
  s.research?.newGame();
  s.elements?.newGame();
  s.recruitment?.newGame(); // Milestone 13: the first board (Start Candidates) and everyone's career
  s.training?.newGame();
  s.combos?.newRun(); // Milestone 15: the account's archive stays
  s.engines?.newGame(); // Milestone 16
  s.publishers?.newGame(); // Milestone 17: the first offers
  s.contracts?.newGame();
  s.sponsors?.newGame(); // Milestone 18
  s.rivals?.newGame(); // Milestone 19
  s.awards?.newGame();
  s.support?.newGame(); // Milestone 20
  s.global?.newGame(); // Milestone 21
  s.hardware?.newGame(); // Milestone 23
  s.consoles?.newGame(); // Milestone 24
  s.distribution?.newGame(); // Milestone 26
  s.studioEvents?.newGame(); // Milestone 27
  s.secrets?.newGame(); // Milestone 28
  s.ending?.newGame(); // Milestone 33
  s.monetisation?.newGame(); // Milestone 36
  s.requests?.newGame(); // Milestone 40c
  s.rewards?.newGame();
}

// Critical boundary saves (bible §50). On each boundary event the save is written once the event (and everything
// the same step does after it — the phase moving on, the Fame a release adds) has finished: a microtask, which still
// runs before the next frame shows the result. Several boundaries in one step make one save.
//   createBoundarySaver({ bus, boundaries: { event: label }, save(boundary) → Promise, enabled() }) → { last, pending }
export function createBoundarySaver({ bus, boundaries, save, enabled = () => true, now = () => 0 }) {
  let queued = null;
  const api = { last: null, writes: [] };
  const flush = () => {
    const b = queued;
    queued = null;
    if (!b || !enabled()) return;
    api.last = b;
    api.writes.push(Promise.resolve(save(b)).catch((e) => console.error('[DEVWORKS] boundary save failed', b.event, e)));
  };
  for (const event of Object.keys(boundaries)) {
    bus.on(event, () => {
      if (!enabled()) return;
      const first = !queued;
      queued = { label: boundaries[event], event, day: now() };
      if (first) queueMicrotask(flush);
    });
  }
  api.settle = () => new Promise((r) => queueMicrotask(r)).then(() => Promise.all(api.writes));
  return api;
}

// A slot whose copies can't be read, about to be started over: its copies are kept aside under
// '<key>:quarantine:<time>' (never deleted), then the slot is cleared for the new studio. Returns the quarantine key.
export async function quarantineSlot(adapter, key, rolling = 3, now = Date.now()) {
  const kept = {};
  for (const k of [key, ...Array.from({ length: rolling }, (_, n) => `${key}#${n}`)]) {
    let v = null;
    try {
      v = await adapter.get(k);
    } catch {
      v = null;
    }
    if (v != null) kept[k] = v;
  }
  if (!Object.keys(kept).length) return null;
  const qk = `${key}:quarantine:${now}`;
  await adapter.set(qk, kept);
  return qk;
}

// Save version 2 → 3 (Milestone 35): the shape is normalised — a key a system added after the save was made is written
// as null (its system then loads its "from before it" state, as before), the unlock list is kept, and the save gets its
// boundary record. Nothing is lost: every key the save had is carried over untouched.
export function migrateToV3(record) {
  const data = { ...record.data };
  for (const k of Object.keys(RUN_PARTS)) if (!(k in data)) data[k] = null;
  data.boundary ??= null;
  return { ...record, data };
}
