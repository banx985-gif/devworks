// Post-launch support (Milestone 20, bible §22). Saved with the studio. Numbers in data/support.js.
//
// On a released game: Patch, Free Update, Expansion, DLC, Port (small projects: a team, work at Σ(stat × work
// multiplier) ÷ 60 a day on duty, Credits every day, and a game lane while they run) and Move On (instant: support
// ends for that game). Remaster / Remake are project types (Milestone 10) — the Support sheet links to New Game.
// Finishing one: bugs fixed, a player score (the game's after-launch score, starting at its review — the original
// review and the four outlets never change), Fan Trust, a longer sales tail on every platform, an add-on's own sales to
// the game's owners (paid day by day, ledger "Post-launch"), or a new platform (business.addPlatform: porting and
// certification as at release). Everything is kept on record.support for the Catalogue.
//
// Events: 'support:start' { job }, 'support:done' { job, record, effects }.
import { SUPPORT_OPTIONS, supportOptionById, SUPPORT_BALANCE as S } from '../../data/support.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createSupport({ bus, clock, world, business, projects, lanes = () => 1, isBusy = () => null }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;
  let jobs = []; // { id, option, number, team, work, progress, cost, startedDay, platform }
  let nextId = 1;

  const record = (n) => projects.catalogue.get(n);
  // The game's support state (made on first use): playerScore starts at the review.
  const supportOf = (rec) => (rec.support ||= { playerScore: rec.release?.score ?? 0, bugsLeft: (rec.result.bugs ?? 0) + (rec.release?.qaBugs ?? 0), uses: {}, log: [], ended: false, trust: 0, tailPct: 0, addons: [] });
  const laneFree = () => projects.jobs.length + jobs.length < lanes();
  const jobOf = (id) => jobs.find((j) => j.team.includes(id)) ?? null;
  // Platforms a Port could add now: on sale, not already there.
  const portTargets = (rec) => business.platforms.active(today()).map((p) => p.id).filter((id) => !(rec.release.platforms ?? [rec.release.platform]).includes(id) && !(rec.pendingPorts ?? []).some((x) => x.id === id));

  // Every option for a released game: { option, ok, why }.
  function options(number) {
    const rec = record(number);
    return SUPPORT_OPTIONS.map((o) => {
      let why = null;
      if (!rec?.release) why = 'Not released yet';
      else if (rec.support?.ended) why = 'Support has ended (Move On)';
      else if (!o.instant) {
        const used = rec.support?.uses[o.id] ?? 0;
        if (jobs.some((j) => j.number === number)) why = 'Already being supported';
        else if (used >= (S.perUse[o.id] ?? 1)) why = `Done ${used} time${used === 1 ? '' : 's'} already`;
        else if (o.port && !portTargets(rec).length) why = 'On every platform on sale';
        else if (o.bugsPct && o.id === 'patch' && supportOf(rec).bugsLeft <= 0) why = 'No bugs left to fix';
        else if (!laneFree()) why = 'Every game lane is busy';
        else if (business.credits < o.costPerDay * 5) why = `Needs ${(o.costPerDay * 5).toLocaleString('en-GB')} Credits`;
      }
      return { option: o, ok: !why, why, targets: o.port && rec?.release ? portTargets(rec) : null };
    });
  }
  // Start one. team: staff ids (not for Move On). platform: the Port's target.
  function start(optionId, number, team = [], platform = null) {
    const o = supportOptionById(optionId);
    const opt = options(number).find((x) => x.option.id === optionId);
    if (!o || !opt?.ok) return { ok: false, why: opt?.why ?? 'Unknown' };
    const rec = record(number);
    const sup = supportOf(rec);
    if (o.instant) {
      sup.ended = true;
      sup.log.push({ option: o.id, day: today() });
      bus.emit('support:done', { job: null, record: rec, effects: { ended: true } });
      return { ok: true };
    }
    if (!team.length) return { ok: false, why: 'Pick at least one person' };
    const busy = team.map((id) => isBusy(id) ?? (jobOf(id) ? 'On other support' : null)).find(Boolean);
    if (busy) return { ok: false, why: busy };
    if (o.port && !portTargets(rec).includes(platform)) return { ok: false, why: 'Pick a platform to port to' };
    const job = { id: `S${nextId++}`, option: o.id, number, team: [...team], work: o.work, progress: 0, cost: 0, startedDay: today(), platform };
    jobs.push(job);
    bus.emit('support:start', { job });
    return { ok: true, job };
  }

  function finish(job) {
    jobs = jobs.filter((j) => j !== job);
    const o = supportOptionById(job.option);
    const rec = record(job.number);
    const sup = supportOf(rec);
    sup.uses[o.id] = (sup.uses[o.id] ?? 0) + 1;
    const fx = {};
    if (o.bugsPct) {
      fx.bugsFixed = Math.round((sup.bugsLeft * o.bugsPct) / 100);
      sup.bugsLeft -= fx.bugsFixed;
    }
    const tens = Math.floor((fx.bugsFixed ?? 0) / 10);
    if (o.playerScore) {
      const before = sup.playerScore;
      sup.playerScore = clamp(sup.playerScore + o.playerScore + (o.perBugsFixed ?? 0) * tens, 0, S.maxPlayerScore);
      fx.playerScore = sup.playerScore - before;
    }
    const trust = (o.trust ?? 0) + (o.trustPerBugs ?? 0) * tens;
    if (trust) {
      const gain = trust * (1 + (world.effect?.('fanTrustGainPct') ?? 0) / 100);
      business.state.fanTrust = +clamp(business.state.fanTrust + gain, 0, 100).toFixed(2);
      sup.trust = +(sup.trust + gain).toFixed(2);
      fx.trust = gain;
    }
    if (o.tailPct) {
      for (const st of Object.values(rec.sales.byPlatform ?? { one: rec.sales })) {
        const c = st.curve;
        if (!c?.tail) continue;
        c.tail = { ...c.tail, share: +(c.tail.share * (1 + o.tailPct / 100)).toFixed(6), days: +(c.tail.days * (1 + (o.tailDaysPct ?? 0) / 100)).toFixed(3) };
      }
      sup.tailPct = +((1 + sup.tailPct / 100) * (1 + o.tailPct / 100) * 100 - 100).toFixed(2);
      fx.tailPct = o.tailPct;
    }
    if (o.addon) {
      const owners = rec.sales?.copies ?? 0;
      const price = (rec.release.price ?? 12) * (o.addon.priceOfGamePct / 100) * 0.7; // the store keeps 30%
      const total = Math.round(owners * (o.addon.attachPct / 100) * price);
      sup.addons.push({ option: o.id, total, days: o.addon.days, from: today(), paid: 0 });
      fx.addonRevenue = total;
    }
    if (o.port) fx.port = business.addPlatform(rec.number, job.platform);
    sup.log.push({ option: o.id, day: today(), cost: job.cost, ...fx });
    bus.emit('support:done', { job, record: rec, effects: fx });
  }

  function day() {
    for (const job of [...jobs]) {
      const o = supportOptionById(job.option);
      job.cost += o.costPerDay;
      business.economy.spend('credits', o.costPerDay, `Post-launch: ${o.name} (${record(job.number)?.result.title})`, 'support');
      for (const id of job.team) {
        const s = staff.get(id);
        if (s && world.onDuty(id)) job.progress += ((s.stats[o.stat] ?? 0) * staff.workMultiplier(s)) / S.progressDivisor;
      }
      job.progress = +job.progress.toFixed(4);
      if (job.progress >= job.work) finish(job);
    }
    // Add-on sales, a slice a day.
    for (const rec of projects.catalogue.list()) {
      for (const a of rec.support?.addons ?? []) {
        if (a.paid >= a.total) continue;
        const due = Math.min(a.total, Math.round((a.total * Math.min(a.days, today() - a.from)) / a.days));
        if (due > a.paid) {
          business.economy.add('credits', due - a.paid, `Add-on sales: ${rec.result.title}`, 'support');
          a.paid = due;
        }
      }
    }
  }
  bus.on('clock:day', () => day());
  bus.on('staff:removed', ({ staff: s }) => {
    for (const j of jobs) j.team = j.team.filter((id) => id !== s.id);
  });

  return {
    options,
    start,
    get jobs() {
      return jobs;
    },
    jobOf,
    supportOf,
    portTargets,
    playerScore: (number) => record(number)?.support?.playerScore ?? record(number)?.release?.score ?? null,
    newGame() {
      jobs = [];
      nextId = 1;
    },
    serialize: () => JSON.parse(JSON.stringify({ jobs, nextId })),
    load(data) {
      jobs = JSON.parse(JSON.stringify(data?.jobs ?? []));
      nextId = data?.nextId ?? 1;
    },
  };
}
