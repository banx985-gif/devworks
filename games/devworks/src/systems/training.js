// Training and mentoring (Milestone 13, bible §11). Saved with the studio.
//
// Courses: core TrainingSystem with DEVWORKS rules (data/recruitment.js COURSES). A course costs Credits (ledger:
// "Training"), takes the worker away for its days (off the floor, not on duty, not on any game — someone making a game
// can't start one), then raises its stats by min–max each, never past the tier cap. Each course once per worker a
// year; two people on courses at once (TRAINING_SLOTS). Some need research (Engine Specialisation: Custom Toolchain)
// or a franchise with 2 released games (Franchise Mentorship).
//
// Mentoring: an Elite (or higher) mentors one worker of a lower tier (one mentee each; one mentor each). Every day both
// work on the same game (both on its team and on duty) the mentee gets MENTORING.xpPerDay XP (core StaffSystem levels,
// which raise stats); after MENTORING.tagDays shared days the mentee learns one of the mentor's traits (a specialty
// tag) they don't have yet. A specialty tag is extra: it doesn't use a trait slot, and each person learns one, ever
// (specialties). Signature traits never copy. Both careers record the link.
//
// Events: core's 'training:start' / 'training:complete' / 'training:cancel'; 'mentor:start' / 'mentor:stop' /
// 'mentor:tag' { mentor, mentee, trait }.
import { TrainingSystem } from '../../../../core/TrainingSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { COURSES, TRAINING_SLOTS, MENTORING } from '../../data/recruitment.js';
import { ROLES, TRAITS, STAT_KEYS } from '../../data/staff.js';
import { researchById } from '../../data/research.js';
import { tierRank } from './recruitment.js';

export function createTraining({ bus, clock, world, business, projects, research, recruitment, extraBusy = () => null }) {
  const staff = () => world.staffSystem;
  const today = () => clock.totalDays;
  const onGame = (id) => projects.jobs.find((j) => j.slots.includes(id)) ?? null;
  const franchiseGames = () => Math.max(0, ...business.franchises.list().map((ip) => business.franchises.releasedOf(ip).length));

  const courses = new TrainingSystem({
    rng: new Rng('devworks-training'),
    bus,
    staff: { get: (id) => staff().get(id) },
    statKeys: STAT_KEYS,
    courses: COURSES,
    slots: [{ id: 'course', name: 'Course', roles: null }],
    rules: { successMorale: 3 },
    hooks: {
      statCap: (s, k) => staff().statCap(s, k),
      primaryStat: (s) => ROLES[s.role]?.primaryStat,
      slotCount: () => TRAINING_SLOTS,
      conditionMet: (rule) => (rule.research ? research?.researched().has(rule.research) : rule.franchise ? franchiseGames() >= rule.franchise : true),
      busyElsewhere: (id) => {
        const job = onGame(id);
        return job ? `Making ${job.name}` : extraBusy(id); // Milestone 16: or the engine
      },
      durationPct: () => world.effect?.('trainingDaysPct') ?? 0, // Milestone 18: PixelDesk
      canPay: (c) => (business.credits < c.cost ? `Needs ${c.cost.toLocaleString('en-GB')} Credits` : null),
      pay: (c, s) => business.economy.spend('credits', c.cost, `Training: ${c.name} (${s.name})`, 'training'),
      now: () => ({ day: today(), year: clock.year }),
      onComplete: (s) => {
        world.setAway(s.id, false);
        recruitment?.careers.bump(s.id, 'trainings');
      },
    },
  });
  // What a locked course needs, in words.
  const requiresText = (c) => (c.requires?.research ? `Needs Research ${researchById(c.requires.research)?.name ?? c.requires.research}` : c.requires?.franchise ? `Needs a franchise with ${c.requires.franchise} released games` : null);
  // Every course for one worker: { course, ok, why, preview: [{ key, from, min, max }] }.
  function options(staffId) {
    return COURSES.map((c) => {
      let why = courses.courseBlock(c.id);
      if (why === 'Locked') why = requiresText(c);
      why ??= courses.workerBlock(c.id, staffId);
      return { course: c, ok: !why, why, preview: courses.preview(c.id, staffId) };
    });
  }
  function start(courseId, staffId) {
    const r = courses.start(courseId, staffId);
    if (r.ok) world.setAway(staffId, true);
    else if (r.reason === 'Locked') r.reason = requiresText(courses.course(courseId));
    return r;
  }

  // --- mentoring -------------------------------------------------------------------------------------------------
  let pairs = []; // { mentor, mentee, sharedDays, tag, since }
  let specialties = {}; // staffId → the trait they learned from a mentor
  const pairOfMentor = (id) => pairs.find((p) => p.mentor === id) ?? null;
  const pairOfMentee = (id) => pairs.find((p) => p.mentee === id) ?? null;
  const canMentor = (s) => !!s && MENTORING.mentorTiers.includes(s.tier);
  // Why this mentor can't take this mentee (null = can).
  function mentorWhy(mentorId, menteeId) {
    const m = staff().get(mentorId);
    const e = staff().get(menteeId);
    if (!m || !e) return 'Not in the studio';
    if (!canMentor(m)) return 'Only Elite staff (or higher) can mentor';
    if (mentorId === menteeId) return 'Not themselves';
    if (tierRank(e.tier) >= tierRank(m.tier)) return 'Only someone of a lower tier';
    if (pairOfMentor(mentorId)) return `Already mentoring ${staff().get(pairOfMentor(mentorId).mentee)?.name ?? 'someone'}`;
    if (pairOfMentee(menteeId)) return 'Already has a mentor';
    return null;
  }
  // The people this mentor could take on: [{ staff, ok, why }].
  const menteeOptions = (mentorId) => staff().staff.filter((s) => s.id !== mentorId).map((s) => ({ staff: s, why: mentorWhy(mentorId, s.id), ok: !mentorWhy(mentorId, s.id) }));
  function startMentoring(mentorId, menteeId) {
    const why = mentorWhy(mentorId, menteeId);
    if (why) return { ok: false, why };
    const p = { mentor: mentorId, mentee: menteeId, sharedDays: 0, tag: null, since: today() };
    pairs.push(p);
    const rm = recruitment?.careers.get(mentorId);
    const re = recruitment?.careers.get(menteeId);
    if (rm && !rm.mentees.includes(menteeId)) rm.mentees.push(menteeId);
    if (re && !re.mentors.includes(mentorId)) re.mentors.push(mentorId);
    bus.emit('mentor:start', { pair: p });
    return { ok: true, pair: p };
  }
  function stopMentoring(mentorId) {
    const p = pairOfMentor(mentorId);
    if (!p) return false;
    pairs = pairs.filter((x) => x !== p);
    bus.emit('mentor:stop', { pair: p });
    return true;
  }
  // The trait the mentee would learn: the first of the mentor's normal traits they don't have (null if none, or they
  // already learned a specialty).
  function tagFor(p) {
    const m = staff().get(p.mentor);
    const e = staff().get(p.mentee);
    if (!m || !e || specialties[e.id]) return null;
    return m.traits.find((t) => !TRAITS[t]?.signature && !e.traits.includes(t)) ?? null;
  }
  // One shared day: both on the same game's team, both on duty.
  function mentorDay() {
    for (const p of pairs) {
      const job = onGame(p.mentor);
      if (!job || !job.slots.includes(p.mentee) || !world.onDuty(p.mentor) || !world.onDuty(p.mentee) || job.data?.decision) continue;
      p.sharedDays++;
      staff().addXp(p.mentee, MENTORING.xpPerDay);
      if (!p.tag && p.sharedDays >= MENTORING.tagDays) {
        const t = tagFor(p);
        if (t) {
          staff().get(p.mentee).traits.push(t);
          p.tag = t;
          specialties[p.mentee] = t;
          bus.emit('mentor:tag', { mentor: staff().get(p.mentor), mentee: staff().get(p.mentee), trait: t });
        }
      }
    }
  }

  bus.on('clock:day', () => {
    courses.dailyTick();
    mentorDay();
  });
  // Someone left: their course and their mentoring end.
  bus.on('staff:removed', ({ staff: s }) => {
    courses.cancel(s.id);
    pairs = pairs.filter((p) => p.mentor !== s.id && p.mentee !== s.id);
  });

  return {
    courses,
    options,
    start,
    trainingOf: (id) => courses.trainingOf(id),
    daysLeft: (id) => {
      const t = courses.trainingOf(id);
      return t ? t.days - t.daysDone : 0;
    },
    get pairs() {
      return pairs;
    },
    canMentor,
    mentorWhy,
    menteeOptions,
    startMentoring,
    stopMentoring,
    pairOfMentor,
    pairOfMentee,
    tagFor,
    specialtyOf: (id) => specialties[id] ?? null,
    newGame() {
      courses.reset();
      pairs = [];
      specialties = {};
    },
    serialize: () => JSON.parse(JSON.stringify({ courses: courses.serialize(), pairs, specialties })),
    load(data) {
      courses.load(data?.courses ?? null);
      pairs = JSON.parse(JSON.stringify(data?.pairs ?? []));
      specialties = JSON.parse(JSON.stringify(data?.specialties ?? {}));
      // Anyone saved as away without a course (should not happen) comes back.
      for (const w of world.workers) if (w.away && !courses.trainingOf(w.id)) world.setAway(w.id, false);
    },
  };
}
