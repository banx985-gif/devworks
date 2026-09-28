// Marketing, Hype, Fan Trust and the release calendar (Milestone 9, bible §21 / §30). Owned by the business (saved
// with it). Every number is in data/balance.js (MARKETING_BALANCE), where the rules are written out; the actions and
// the placeholder competitors are in data/marketing.js.
//
// A game's campaign is kept by its project id (job.id while it is made, record.jobId once it is finished), so the
// Hype built during development carries on to the finished game and is frozen when it launches:
//   { hype, done: [actionId], running: [{ id, startDay, days, gain, given }], log: [{ id, day, cost, gain }], launched }
// Each day (before launches and sales): every campaign not yet launched fades by decayPct %, then running actions add
// their share. A reload carries on exactly (all state is plain numbers, worked out in a fixed order).
//
// The release calendar is generated, never stored: month m's competitor releases come from the run's seed and m alone.
//
// Events: 'marketing:run' { key, action, cost, gain, title }.
import { Rng } from '../../../../core/Rng.js';
import { MARKETING_BALANCE, PROJECT_BALANCE, FAN_TRUST, FAME } from '../../data/balance.js';
import { MARKETING_ACTIONS, actionById, CONVENTIONS, COMPETITOR_STUDIOS, COMPETITOR_TITLE } from '../../data/marketing.js';
import { elementsOf } from '../../data/elements.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r4 = (x) => +x.toFixed(4);
const GENRES = elementsOf('genre').map((e) => e.id);

// --- pure rules (tested in tests/devworks/m9.test.mjs) -------------------------------------------------------
export const fanExpectationFor = (hype, M = MARKETING_BALANCE) => r4(M.expectation.base + clamp(hype, 0, 100) * M.expectation.perHype);

// The competitor releases of month m (0 = Year 1 Month 1): 0–2, from the run's seed.
export function competitorsIn(seed, m, M = MARKETING_BALANCE) {
  const rng = new Rng(`${seed}|rivals|${m}`);
  const roll = rng.next();
  let count = 0;
  for (let acc = 0; count < M.competitors.count.length; count++) if (roll < (acc += M.competitors.count[count])) break;
  const out = [];
  for (let i = 0; i < count; i++) {
    const pick = (list) => list[Math.floor(rng.next() * list.length)];
    const studio = pick(COMPETITOR_STUDIOS);
    const title = `${pick(COMPETITOR_TITLE.first)} ${pick(COMPETITOR_TITLE.second)}`;
    const genre = pick(GENRES);
    const big = rng.next() < M.competitors.bigChance;
    out.push({ id: `${m}-${i}`, month: m, studio, title, genre, big });
  }
  return out;
}

// What a launch in month m loses to a same-genre release that month: { competitor, pct, days } or null (the biggest).
export function clashIn(seed, m, genre, M = MARKETING_BALANCE) {
  const same = competitorsIn(seed, m, M).filter((c) => c.genre === genre).sort((a, b) => b.big - a.big);
  if (!same.length) return null;
  const c = same[0];
  return { competitor: c, pct: c.big ? M.clash.bigPct : M.clash.smallPct, days: M.clash.days };
}

// Fan Trust change at launch, in parts: review, bugs, overhype (a review short of Fan Expectation), met (a hyped game
// that delivered). total = their sum.
export function launchTrust({ score, fanExpectation, hype = 0, bugs = 0 }, M = MARKETING_BALANCE, FT = FAN_TRUST) {
  const T = M.trust;
  const review = (score - FT.pivot) * FT.perPoint;
  const bug = -Math.min(T.bugMax, Math.max(0, bugs - T.bugFree) * T.bugPer);
  const short = fanExpectation - score;
  const overhype = short > T.overhypeGrace ? -Math.min(T.overhypeMax, (short - T.overhypeGrace) * T.overhypePer) : 0;
  const met = hype > 0 && short <= 0 ? (T.metPer * clamp(hype, 0, 100)) / 100 : 0;
  const parts = { review: r4(review), bugs: r4(bug), overhype: r4(overhype), met: r4(met) };
  return { ...parts, total: r4(review + bug + overhype + met) };
}

// --- the system ------------------------------------------------------------------------------------------------
// hypeEffect() → the facilities' Hype % (Milestone 11: the Marketing Wall and the Media Studio, world.effect('hypePct')).
// rankIndex() → the highest rank reached.
export function createMarketing({ bus, clock, projects, economy, state, hypeEffect = () => 0, rankIndex = () => 0, M = MARKETING_BALANCE }) {
  let seed = 'devworks-run';
  let campaigns = {};
  const today = () => clock.totalDays;
  const monthOf = (day = today()) => Math.floor(day / clock.daysPerMonth);
  const monthOfYear = (day = today()) => (monthOf(day) % clock.monthsPerYear) + 1;

  const campaign = (key) => (campaigns[key] ||= { hype: 0, done: [], running: [], log: [], launched: false });

  // The games that can be marketed now: the one being made, then the finished ones not launched yet.
  // Each: { key, title, stage (0–5), job | record, genre }.
  function targets() {
    const out = [];
    for (const job of projects.jobs ?? [projects.active].filter(Boolean)) out.push({ key: job.id, title: job.name, stage: job.phaseIndex, job, genre: job.data.recipe?.genre }); // Milestone 13: every lane
    for (const r of projects.catalogue.list()) if (!r.release) out.push({ key: r.jobId, title: r.result.title, stage: 5, record: r, genre: r.result.recipe?.genre });
    return out;
  }
  const targetByKey = (key) => targets().find((t) => t.key === key) ?? null;

  // Hype boost for a game (%): Marketing-Heavy (its focus now, or the average it ran with) and the facilities.
  function boostPct(t) {
    const focus = t.job ? (PROJECT_BALANCE.budgetFocus[t.job.data.focus]?.hypePct ?? 0) : (t.record.result.hypePct ?? 0);
    return focus + hypeEffect();
  }

  // Every action for a game: { action, ok, why, cost, gain, days }.
  function options(key) {
    const t = targetByKey(key);
    if (!t) return [];
    const c = campaigns[key];
    const boost = boostPct(t);
    const credits = economy.balance('credits');
    return MARKETING_ACTIONS.map((a) => {
      let why = null;
      if (c?.done.includes(a.id)) why = 'Done for this game';
      else if (a.rank && rankIndex() < rankIndexOf(FAME.ranks, a.rank)) why = `Opens at Rank ${a.rank}`;
      else if (t.stage < a.from) why = `From ${['Prototype', 'Vertical Slice', 'Production', 'Alpha / Beta', 'Gold Master', 'the finished game'][a.from]}`;
      else if (a.months && !a.months.includes(monthOfYear())) why = `Shows in Months ${a.months.slice(0, -1).join(', ')} and ${a.months.at(-1)}`;
      else if (credits < a.cost) why = `Needs ${a.cost.toLocaleString('en-GB')} Credits`;
      return { action: a, ok: !why, why, cost: a.cost, gain: r4(a.hype * (1 + boost / 100)), days: a.days };
    });
  }

  // Run an action for a game: pay now, then its Hype comes in over its days. Returns true when it started.
  function run(actionId, key) {
    const t = targetByKey(key);
    const o = options(key).find((x) => x.action.id === actionId);
    if (!t || !o?.ok) return false;
    const a = o.action;
    economy.spend('credits', a.cost, `Marketing: ${a.name} (${t.title})`, 'marketing');
    const c = campaign(key);
    c.done.push(a.id);
    c.running.push({ id: a.id, startDay: today(), days: a.days, gain: o.gain, given: 0 });
    c.log.push({ id: a.id, day: today(), cost: a.cost, gain: o.gain });
    bus?.emit('marketing:run', { key, action: a, cost: a.cost, gain: o.gain, title: t.title });
    return true;
  }

  // One day: fade, then running actions add today's share (the last day adds whatever is left).
  function daily() {
    for (const c of Object.values(campaigns)) {
      if (c.launched) continue;
      let h = c.hype * (1 - M.decayPct / 100);
      for (const r of c.running) {
        const left = r.gain - r.given;
        const give = today() - r.startDay >= r.days ? left : Math.min(left, r.gain / r.days);
        r.given = r4(r.given + give);
        h += give;
      }
      c.running = c.running.filter((r) => r.given < r.gain - 1e-9);
      c.hype = r4(clamp(h, 0, 100));
    }
  }

  // Delay / Cut Feature (Milestone 7) take Hype off at once; a Delay also costs Fan Trust.
  bus?.on('project:decided', ({ job, choice }) => {
    const D = PROJECT_BALANCE.decisions;
    if (choice === 'delay') {
      const c = campaign(job.id);
      c.hype = r4(clamp(c.hype + D.delay.hype, 0, 100));
      state.fanTrust = +clamp(state.fanTrust - M.trust.delay, 0, 100).toFixed(2);
    } else if (choice === 'cut') {
      const c = campaign(job.id);
      c.hype = r4(clamp(c.hype + D.cut.hype, 0, 100));
    }
  });

  return {
    targets,
    targetByKey,
    options,
    run,
    daily,
    campaign: (key) => campaigns[key] ?? null,
    hypeOf: (key) => campaigns[key]?.hype ?? 0,
    // Hype from elsewhere (Milestone 10: a new entry's waiting fans).
    addHype(key, amount) {
      const c = campaign(key);
      c.hype = r4(clamp(c.hype + amount, 0, 100));
    },
    // Frozen at launch: this game's Hype, from now on only read.
    launch(key) {
      const c = campaign(key);
      c.launched = true;
      c.running = [];
      return c.hype;
    },
    competitors: (m = monthOf()) => competitorsIn(seed, m, M),
    clashFor: (genre, day = today()) => clashIn(seed, monthOf(day), genre, M),
    monthOf,
    monthOfYear,
    get seed() {
      return seed;
    },
    newGame(s) {
      seed = `${s}`;
      campaigns = {};
    },
    serialize: () => ({ seed, campaigns: JSON.parse(JSON.stringify(campaigns)) }),
    // A save from before Milestone 9 has none: a fixed seed for the calendar, and no campaigns.
    load(data) {
      seed = data?.seed ?? 'devworks-old-save';
      campaigns = JSON.parse(JSON.stringify(data?.campaigns ?? {}));
    },
  };
}

