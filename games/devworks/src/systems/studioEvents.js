// Events and notifications (Milestone 27, bible §38 / §40, style guide §7). Saved with the studio. The definitions
// are data/events.js; the engine is core/EventSystem.js (seeded: an event's every number and every choice's outcome
// are rolled when it happens and saved, so reloading can never reroll a committed result) and the messages are
// core/NotificationSystem.js (the Inbox, toasts, and a capped queue of pop-ups).
//
// The flow — one blocking thing at a time:
//   • a choice event posts a pop-up to the queue; a flavour event is a toast; everything lands in the Inbox;
//   • a milestone moment (First Release, First Hit, …) is a big pop-up in the same queue;
//   • pump({ busy }) hands out the next pop-up only when nothing is showing and the game is not busy (a big moment,
//     a sheet or another screen is up) — the game shows it and pauses the clock while it is up;
//   • answer() / dismiss() / done() free the slot; a dismissed choice waits in the Inbox;
//   • past maxQueue waiting pop-ups, the lowest one folds into the Inbox (NotificationSystem);
//   • a choice left unanswered for answerDays takes its default — every event resolves.
// Crossover hooks (BOTWORKS demo, RACEWORKS licence) are ordinary events: they never read another game's files.
// Clues (for the secrets, Milestone 28) are only recorded.
//
// Events on the bus: core's 'event:fired' / 'event:resolved', 'notify:post' / 'notify:fold', and
// 'milestone:reached' { id, def }.
import { Rng } from '../../../../core/Rng.js';
import { EventSystem } from '../../../../core/EventSystem.js';
import { NotificationSystem } from '../../../../core/NotificationSystem.js';
import { EVENTS, EVENT_CLASSES, MILESTONES, EVENT_RULES as R } from '../../data/events.js';
import { PROJECT_BALANCE } from '../../data/balance.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const classOf = (cls) => EVENT_CLASSES.find((c) => c.id === cls) ?? EVENT_CLASSES[0];

export function createStudioEvents({ bus, clock, world, business, projects, research = null, sponsors = () => null, consoles = () => null, hardware = () => null, seed = () => 'devworks-run' }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;
  const defs = [...EVENTS, ...MILESTONES.map((m) => ({ ...m, kind: 'milestone', cls: 'milestone', effects: [] }))];
  const byId = Object.fromEntries(defs.map((d) => [d.id, d]));
  let clues = []; // { id, day, event }
  let showing = null; // { entryId, uid, kind } — the one blocking pop-up up now (saved, so a reload carries on the same)
  let peakShowing = 0;

  // --- triggers ---------------------------------------------------------------------------------------------------
  const jobs = () => [...projects.jobs].sort((a, b) => (a.id < b.id ? -1 : 1));
  const releasedCount = () => projects.catalogue.list().filter((r) => r.release).length;
  function conditionMet(t) {
    if (!t) return true;
    if (t.game && !jobs().length) return false;
    if (t.deal && !jobs().some((j) => j.data.deal)) return false;
    if (t.localised && !jobs().some((j) => j.data.localised)) return false;
    if (t.sponsor && !(sponsors()?.deals ?? []).some((d) => today() <= d.endDay)) return false;
    if (t.sponsorId && !(sponsors()?.deals ?? []).some((d) => d.id === t.sponsorId && today() <= d.endDay)) return false;
    if (t.console && !consoles()?.own?.()) return false;
    if (t.hardware && !(hardware()?.prototypes?.length || hardware()?.active)) return false;
    if (t.staffMin && staff.staff.length < t.staffMin) return false;
    if (t.yearMin && clock.year < t.yearMin) return false;
    if (t.released && releasedCount() < t.released) return false;
    return true;
  }
  // Who and which game (rolled once, saved on the event).
  function setup(inst, def, rng) {
    const out = {};
    const js = jobs().filter((j) => !def.trigger?.deal || j.data.deal).filter((j) => !def.trigger?.localised || j.data.localised);
    if (js.length) {
      const j = js[Math.floor(rng.next() * js.length)];
      out.jobId = j.id;
      out.game = j.data.title ?? j.name;
    }
    const pool = (out.jobId ? projects.jobs.find((j) => j.id === out.jobId)?.slots : null)?.filter((id) => staff.get(id)) ?? [];
    const people = pool.length ? pool : staff.staff.map((s) => s.id).sort();
    if (people.length) {
      out.who = people[Math.floor(rng.next() * people.length)];
      out.whoName = staff.get(out.who)?.name ?? 'Someone';
    }
    return out;
  }
  const words = (s, p) => `${s ?? ''}`.replace(/\{game\}/g, p.game ?? 'your game').replace(/\{who\}/g, p.whoName ?? 'Someone');

  // --- effects ----------------------------------------------------------------------------------------------------
  const applied = []; // (tests) every applied effect: { uid, type, value }
  function apply(e, inst) {
    const p = inst.params;
    const job = p.jobId ? projects.jobs.find((j) => j.id === p.jobId) : null;
    const d = job?.data;
    const s = p.who ? staff.get(p.who) : null;
    switch (e.type) {
      case 'hype':
        if (job) business.marketing.addHype(job.id, e.value);
        break;
      case 'bugs':
        if (d) d.bugs = Math.max(0, d.bugs + e.value);
        break;
      case 'work':
        if (job && job.phaseTarget) job.phaseTarget = Math.max(job.phaseProgress + 1, job.phaseTarget + ((PROJECT_BALANCE.scopes[d.scope]?.totalWork ?? 100) * (d.workScale ?? 1) * e.pct) / 100);
        break;
      case 'output':
        if (d) d.bonus[e.key] = (d.bonus[e.key] ?? 0) + e.value;
        break;
      case 'credits':
        if (e.value > 0) business.economy.add('credits', e.value, `Event: ${words(byId[inst.id].title, p)}`, 'events');
        else if (e.value < 0) business.economy.spend('credits', -e.value, `Event: ${words(byId[inst.id].title, p)}`, 'events');
        break;
      case 'fanTrust':
        business.state.fanTrust = +clamp(business.state.fanTrust + e.value, 0, 100).toFixed(2);
        break;
      case 'energy':
        if (s) s.energy = clamp(s.energy + e.value, 0, 100);
        break;
      case 'morale':
        if (s) s.morale = clamp(s.morale + e.value, 0, 100);
        break;
      case 'teamMorale':
        for (const x of staff.staff) x.morale = clamp(x.morale + e.value, 0, 100);
        break;
      case 'rp':
        research?.system?.addRp?.(e.value, `Event: ${words(byId[inst.id].title, p)}`, today());
        break;
      case 'signal':
        sponsors()?.signal?.(e.name);
        break;
      case 'clue':
        if (!clues.some((c) => c.id === e.id)) clues.push({ id: e.id, day: today(), event: inst.id });
        break;
      default:
        return;
    }
    applied.push({ uid: inst.uid, type: e.type, value: e.value ?? e.pct ?? e.key ?? e.name ?? e.id });
  }

  let rng = new Rng('devworks-events');
  const events = new EventSystem({ bus, rng, defs, caps: R.caps, rules: { startDay: R.startDay, dailyChance: R.dailyChance, maxOpen: R.maxOpen }, hooks: { conditionMet, setup, apply } });
  const notes = new NotificationSystem({ bus, maxQueue: R.maxQueue, inboxMax: R.inboxMax });

  // --- messages ---------------------------------------------------------------------------------------------------
  bus.on('event:fired', ({ instance: inst, def }) => {
    const p = inst.params;
    const icon = classOf(def.cls).icon;
    if (def.kind === 'choice') notes.post({ kind: 'choice', level: 'medium', popup: true, day: inst.day, title: words(def.title, p), body: words(def.text, p), icon, data: { uid: inst.uid } });
    else if (def.kind === 'flavour') notes.post({ kind: 'flavour', level: 'minor', toast: true, day: inst.day, title: words(def.title, p), body: words(def.text, p), icon, data: { uid: inst.uid } });
    else notes.post({ kind: 'milestone', level: 'major', popup: !def.shownBy, toast: false, day: inst.day, title: def.title, body: def.text, art: def.art, data: { uid: inst.uid, id: def.id }, read: !!def.shownBy });
  });
  bus.on('event:resolved', ({ instance: inst, def, choice, auto }) => {
    const e = notes.inbox.find((x) => x.data?.uid === inst.uid);
    if (e) {
      e.read = true;
      e.answer = { choice, label: words(def.choices?.[choice]?.label, inst.params), auto };
    }
  });
  // Any other news (the game's banners and big moments) goes in the Inbox too.
  function note({ title, body = '', level = 'minor', icon = null, art = null, kind = 'news', toast = false, read = false }) {
    return notes.post({ kind, level, title, body, icon, art, toast, read, popup: false, day: today() });
  }

  // --- milestones -------------------------------------------------------------------------------------------------
  function reach(on, params = {}) {
    const m = MILESTONES.find((x) => x.on === on);
    if (!m || events.seen(m.id)) return null;
    const inst = events.milestone(m.id, today(), params);
    if (inst) bus.emit('milestone:reached', { id: m.id, def: m });
    return inst;
  }
  bus.on('studio:stage', ({ stage }) => reach(`stage:${stage?.id ?? stage}`));
  bus.on('project:phase', ({ job, phase }) => {
    if (phase?.id === 'prototype' && job?.data?.scope) reach('firstPrototype');
  });
  bus.on('game:released', ({ record }) => {
    reach('firstRelease');
    if ((record.release?.score ?? 0) >= 80) reach('firstHit');
  });
  bus.on('deal:signed', () => reach('firstDeal'));
  bus.on('sponsor:signed', () => reach('firstSponsor'));
  bus.on('award:won', () => reach('firstAward'));
  bus.on('engine:complete', () => reach('firstEngine'));
  bus.on('hardware:prototype', ({ first }) => first && reach('firstConsolePrototype'));
  bus.on('console:launched', () => reach('consoleLaunch'));

  // --- the day ----------------------------------------------------------------------------------------------------
  bus.on('clock:day', () => {
    const day = today();
    events.dailyTick(day);
    // Every event resolves: an unanswered choice takes its default after answerDays.
    for (const inst of [...events.open]) if (day - inst.day >= R.answerDays && showing?.uid !== inst.uid) events.choose(inst.uid, null, { day, auto: true });
  });

  // --- the pop-up slot --------------------------------------------------------------------------------------------
  // The next pop-up to show, or null (busy: the game has something blocking up — a big moment, a sheet, a screen).
  function pump({ busy = false } = {}) {
    if (showing || busy) return null;
    for (let e = notes.take(); e; e = notes.take()) {
      if (e.kind === 'choice' && !events.open.some((i) => i.uid === e.data.uid)) continue; // answered already
      showing = { entryId: e.id, uid: e.data?.uid ?? null, kind: e.kind };
      peakShowing = Math.max(peakShowing, 1);
      return e;
    }
    return null;
  }
  const openChoice = (uid) => events.open.find((i) => i.uid === uid) ?? null;
  // The words and choices of a choice event (for its sheet): { title, text, icon, choices: [{ label, line }] }.
  function view(uid) {
    const inst = events.instance(uid);
    if (!inst) return null;
    const def = byId[inst.id];
    const p = inst.params;
    return { uid, id: inst.id, cls: classOf(def.cls).name, title: words(def.title, p), text: words(def.text, p), icon: classOf(def.cls).icon, open: inst.status === 'open', choice: inst.choice, auto: !!inst.auto, choices: (def.choices ?? []).map((c) => ({ id: c.id, label: words(c.label, p), line: words(c.line, p) })) };
  }
  function answer(uid, index) {
    const inst = events.choose(uid, index, { day: today() });
    if (showing?.uid === uid) showing = null;
    return inst;
  }
  // Closed without an answer: it waits in the Inbox (and takes its default after answerDays).
  function dismiss() {
    const e = showing && notes.get(showing.entryId);
    if (e && showing.kind === 'choice') e.read = false; // unread again: the badge points to it
    showing = null;
  }
  const done = () => (showing = null); // a milestone moment was tapped away

  return {
    events,
    notes,
    pump,
    view,
    answer,
    dismiss,
    done,
    note,
    reach,
    openChoice,
    get showing() {
      return showing;
    },
    get clues() {
      return clues;
    },
    get applied() {
      return applied;
    },
    get peakShowing() {
      return peakShowing;
    },
    unread: () => notes.unread,
    milestoneSeen: (id) => events.seen(id),
    newGame() {
      rng = new Rng(`${seed()}|events`);
      events.rng = rng;
      events.reset(today());
      notes.reset();
      clues = [];
      showing = null;
    },
    serialize: () => JSON.parse(JSON.stringify({ events: events.serialize(), notes: notes.serialize(), clues, showing })),
    load(data) {
      rng = new Rng(`${seed()}|events`);
      events.rng = rng;
      events.load(data?.events ?? null, today());
      notes.load(data?.notes ?? null);
      clues = JSON.parse(JSON.stringify(data?.clues ?? []));
      showing = data?.showing ? { ...data.showing } : null;
    },
  };
}
