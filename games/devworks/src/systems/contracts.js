// Contract work (Milestone 17, bible §25): a monthly board of jobs for other studios — a deliberate recovery tool.
// Saved with the studio. Numbers in data/publishers.js (CONTRACT_KINDS, CONTRACTS).
//
// Core ContractSystem: 3 offers each month (each only of a kind the studio can do: a porting job needs 2 platforms on
// sale, engine integration an own engine, a launch demo a platform on sale), at most 2 active. Accepting picks the
// team (their time: nobody on a game, a course or the engine); each day the team on duty adds Σ(its stat × work
// multiplier) ÷ 60 progress; when the work is done it delivers and pays (ledger "Contract work"). The deadline is the
// studio's best two people for that stat working it × 1.8 (at least 14 days), counted from acceptance, so it can
// always be met. A missed deadline pays nothing (a recovery tool: no other penalty).
//
// Events: core's 'contract:offered' / 'contract:accepted' / 'contract:success' / 'contract:failed'.
import { ContractSystem } from '../../../../core/ContractSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { CONTRACT_KINDS, CONTRACTS as K, contractKindById } from '../../data/publishers.js';

export function createContracts({ bus, clock, world, business, engines = () => null, isBusy = () => null }) {
  const staff = world.staffSystem;
  const today = () => clock.totalDays;

  // What the studio can do now: the kinds whose needs are met, and the best daily pace for a stat.
  function context(day = today()) {
    const platforms = business.platforms.active(day).length;
    const hasEngine = !!engines()?.engines.length;
    return {
      day,
      rankIndex: business.reputation.highestRankIndex,
      kinds: CONTRACT_KINDS.filter((k) => (!k.needs.platforms || platforms >= k.needs.platforms) && (!k.needs.engine || hasEngine)).map((k) => k.id),
      pace: (stat) => staff.staff.map((s) => s.stats[stat] ?? 0).sort((a, b) => b - a).slice(0, 2).reduce((t, v) => t + v, 0) / K.progressDivisor,
    };
  }
  function generate(ctx, rng) {
    if (!ctx.kinds.length) return null;
    const kind = contractKindById(rng.pick(ctx.kinds));
    const pace = ctx.pace(kind.stat);
    if (!(pace > 0)) return null;
    const work = Math.round(kind.work * (0.8 + rng.next() * 0.4));
    const est = work / pace;
    return {
      kind: kind.id,
      client: rng.pick(K.clients),
      stat: kind.stat,
      work,
      progress: 0,
      pay: Math.round((work * kind.pay * (1 + (K.payRankPct * ctx.rankIndex) / 100)) / 10) * 10,
      deadlineDays: Math.max(K.minDays, Math.ceil(est * K.slack)),
      team: [],
    };
  }
  const board = new ContractSystem({
    rng: new Rng('devworks-contracts'),
    bus,
    maxActive: K.maxActive,
    offersPerMonth: K.offersPerMonth,
    hooks: {
      generate,
      check: (c) => (c.progress >= c.work ? { ok: true, failures: [] } : { ok: false, failures: ['not done yet'] }),
      onSuccess: (c) => business.economy.add('credits', c.pay, `Contract: ${contractKindById(c.kind).name} for ${c.client}`, 'contracts'),
    },
  });

  // Who could work on one now: [{ staff, why }].
  const teamOptions = () => staff.staff.map((s) => ({ staff: s, why: isBusy(s.id) ?? (jobOf(s.id) ? 'On another contract' : null) }));
  const jobOf = (id) => board.active.find((c) => c.team.includes(id)) ?? null;
  function accept(id, team) {
    const c = board.offers.find((x) => x.id === id);
    if (!c) return { ok: false, why: 'No longer on offer' };
    if (!team.length) return { ok: false, why: 'Pick at least one person' };
    const busy = team.map((t) => teamOptions().find((o) => o.staff.id === t)).find((o) => !o || o.why);
    if (busy) return { ok: false, why: busy ? `${busy.staff.name}: ${busy.why}` : 'Unknown' };
    const r = board.accept(id, today());
    if (!r.ok) return { ok: false, why: r.reason };
    r.contract.team = [...team];
    return { ok: true, contract: r.contract };
  }
  function dayWork() {
    for (const c of [...board.active]) {
      let p = 0;
      for (const id of c.team) {
        const s = staff.get(id);
        if (s && world.onDuty(id)) p += ((s.stats[c.stat] ?? 0) * staff.workMultiplier(s)) / K.progressDivisor;
      }
      c.progress = +(c.progress + p).toFixed(4);
      if (c.progress >= c.work) board.deliver(c.id, { ref: 'work' }, today());
    }
    board.dailyTick(today());
  }
  bus.on('clock:day', () => dayWork());
  bus.on('clock:month', () => board.monthStart(context(), today()));
  // Someone left: off their contract.
  bus.on('staff:removed', ({ staff: s }) => {
    for (const c of board.active) c.team = c.team.filter((id) => id !== s.id);
  });

  return {
    board,
    context,
    generate,
    get offers() {
      return board.offers;
    },
    get active() {
      return board.active;
    },
    teamOptions,
    jobOf,
    divisor: K.progressDivisor,
    accept,
    cancel: (id) => board.cancel(id, today()),
    decline(id) {
      const i = board.offers.findIndex((x) => x.id === id);
      if (i < 0) return false;
      board.offers.splice(i, 1)[0].status = 'declined';
      return true;
    },
    newGame() {
      board.reset();
      board.monthStart(context(), today());
    },
    serialize: () => board.serialize(),
    load(data) {
      if (!board.load(data ?? null)) board.monthStart(context(), today());
    },
  };
}
