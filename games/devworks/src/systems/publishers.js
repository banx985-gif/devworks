// Publishers (Milestone 17, bible §23; §3 recovery). Saved with the studio. Numbers in data/publishers.js.
//
// Offers arrive each month (core ContractSystem, its own seeded Rng): 1 + 1 per two ranks above E, +1 when the studio
// is short of cash (recovery weighting, which also makes the advances richer), at most 4. Each offer is for "your
// next game" and names every term: the publisher, the advance, its revenue share, the scope (exact under a
// creative-control clause, else the least), maybe 3 allowed genres (CrownArc's control clause), a platform the game
// must release on, the Hype its marketing adds, the milestone deadlines (from the team's own estimate × the
// publisher's slack, counted from the day the game starts), and maybe the IP clause. Offers are only ever made with
// what the studio can do: an open scope, open genres, a platform that is on sale now and still will be at the
// expected launch — and every deadline starts counting only when the game does, so none can already be missed.
//
// Accepting pays the advance (ledger "Publishers"); a signed deal must be put on a New Game within 56 days, else it
// lapses and the advance goes back. On a game: its Hype at the start; each missed milestone costs 15% of the advance
// (once, never a lock); at release the required platform must be in (waived if it can't be); the publisher takes its
// share of every sale (launch and back catalogue, ledger "Publishers") and adds its reach to launch sales. IP clause:
// the franchise belongs to the publisher, so a sequel / spin-off / remake / remaster of it needs a deal with them.
// Self-publishing is always possible.
//
// Events: 'deal:offered', 'deal:signed', 'deal:attached', 'deal:missed' { deal, milestone, penalty }, 'deal:done',
// 'deal:lapsed'.
import { ContractSystem } from '../../../../core/ContractSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { PUBLISHERS, publisherById, DEALS } from '../../data/publishers.js';
import { SCOPES } from '../../data/projects.js';
import { elementsOf } from '../../data/elements.js';
import { PROJECT_BALANCE, FAME } from '../../data/balance.js';
import { platformById } from '../../data/platforms.js';
import { releasable } from './platformMarket.js';

const SCOPE_ORDER = SCOPES.map((s) => s.id);
const phaseEnd = (i) => PROJECT_BALANCE.phases.slice(0, i + 1).reduce((t, p) => t + p.share, 0);

export function createPublishers({ bus, clock, world, business, projects, elements }) {
  const today = () => clock.totalDays;
  const rankIndex = () => business.reputation.highestRankIndex;
  const short = () => business.inDebt || business.credits < DEALS.recovery.shortCash;

  // Everything an offer may use, now (also what the tests hold every offer against).
  function context(day = today()) {
    const team = world.staffSystem.staff.map((s) => s.id);
    return {
      day,
      rankIndex: rankIndex(),
      short: short(),
      scopes: SCOPE_ORDER.filter((id) => elements.scopeOpen(id)),
      genres: elementsOf('genre').map((e) => e.id).filter((id) => elements.isOpen(id)),
      platformOk: (id, d) => releasable(business.platforms.state(id, d).status),
      estimate: (scope) => projects.estimate(team, scope).days,
      teamSize: team.length,
    };
  }

  // One offer's terms (or null). Pure over ctx and rng.
  function generate(ctx, rng) {
    const pubs = PUBLISHERS.filter((p) => !p.rank || ctx.rankIndex >= rankIndexOf(FAME.ranks, p.rank));
    const total = pubs.reduce((t, p) => t + p.weight, 0);
    let r = rng.range(0, total);
    const pub = pubs.find((p) => (r -= p.weight) < 0) ?? pubs.at(-1);
    if (!ctx.scopes.length || !Number.isFinite(ctx.estimate(ctx.scopes[0]))) return null;
    // The scope: one of the two biggest open ones (the smallest open one for Brightline).
    const choices = pub.id === 'PUB01' ? ctx.scopes.slice(0, 1) : ctx.scopes.slice(-2);
    const scope = rng.pick(choices);
    const est = ctx.estimate(scope);
    if (!Number.isFinite(est)) return null;
    const finishIn = Math.ceil(est * pub.slack);
    // The platform: on sale now and still at the latest launch (start window + finish + a month for certification).
    const launchBy = ctx.day + DEALS.startWithinDays + finishIn + 28;
    const pool = (pub.pcOnly ? ['P01'] : business.platforms.active(ctx.day).map((p) => p.id)).filter((id) => ctx.platformOk(id, ctx.day) && ctx.platformOk(id, launchBy));
    if (!pool.length) return null;
    const platform = pool.includes('P01') && rng.chance(0.5) ? 'P01' : rng.pick(pool);
    const genres = pub.control === 'genre' && ctx.genres.length > 3 ? rng.shuffle([...ctx.genres]).slice(0, 3) : null;
    const sc = PROJECT_BALANCE.scopes[scope];
    const rec = ctx.short ? DEALS.recovery.advanceMult : 1;
    const advance = Math.max(500, Math.round((sc.baseCostPerDay * est * (DEALS.advanceDaysPct / 100) * pub.advance * rec * (1 + (world.effect?.('advancePct') ?? 0) / 100)) / 50) * 50); // Milestone 18: Crown Finance
    return {
      publisher: pub.id,
      scope,
      exactScope: !!pub.control,
      genres,
      platform,
      advance,
      sharePct: pub.sharePct,
      hype: pub.hype,
      salesPct: pub.salesPct,
      ipOwned: rng.chance(pub.ipChance),
      // Deadlines, in days from the day the game starts.
      milestones: DEALS.milestones.map((m) => ({ ...m, dueIn: Math.ceil(est * phaseEnd(m.phase) * pub.slack), dueDay: null, state: 'open' })),
      deadlineDays: DEALS.startWithinDays, // to put it on a New Game
      recovery: ctx.short,
      jobId: null,
      record: null,
    };
  }

  const deals = new ContractSystem({
    rng: new Rng('devworks-publishers'),
    bus: null, // its own events (the contract board uses 'contract:*')
    maxActive: DEALS.maxSigned,
    offersPerMonth: DEALS.offersPerMonth,
    hooks: {
      generate,
      check: (c, d) => (d?.record?.jobId === c.jobId ? { ok: true, failures: [] } : { ok: false, failures: ['not this deal’s game'] }),
      onFail: (c, reason) => {
        if (c.jobId) return; // on a game: never fails (milestones cost money instead)
        const back = Math.round((c.advance * DEALS.lapseRepayPct) / 100);
        business.economy.spend('credits', back, `Advance returned: ${publisherById(c.publisher).name}`, 'publisher');
        bus.emit('deal:lapsed', { deal: c, reason, repaid: back });
      },
    },
  });
  const offersFor = (ctx) => Math.min(DEALS.maxOffers, DEALS.offersPerMonth + Math.floor(ctx.rankIndex / 2) + (ctx.short ? DEALS.recovery.extraOffers : 0));
  function monthStart() {
    const ctx = context();
    deals.offersPerMonth = offersFor(ctx);
    deals.monthStart(ctx, today());
    for (const c of deals.offers) if (c.offeredDay === today()) bus.emit('deal:offered', { deal: c });
  }

  // --- signing ------------------------------------------------------------------------------------------------------
  function sign(id) {
    const c = deals.offers.find((x) => x.id === id);
    if (!c) return { ok: false, why: 'No longer on offer' };
    if (!deals.canAccept) return { ok: false, why: `Only ${DEALS.maxSigned} publisher deals at once` };
    deals.accept(id, today());
    business.economy.add('credits', c.advance, `Advance: ${publisherById(c.publisher).name}`, 'publisher');
    bus.emit('deal:signed', { deal: c });
    return { ok: true, deal: c };
  }
  function decline(id) {
    const i = deals.offers.findIndex((x) => x.id === id);
    if (i < 0) return false;
    const [c] = deals.offers.splice(i, 1);
    c.status = 'declined';
    return true;
  }
  const signed = () => deals.active.filter((c) => !c.jobId); // waiting for a game
  const dealOfJob = (jobId) => deals.active.find((c) => c.jobId === jobId) ?? null;

  // Why this setup can't take this deal (null = it can). setup: the New Game setup.
  function setupWhy(dealId, setup) {
    const c = deals.active.find((x) => x.id === dealId && !x.jobId);
    if (!c) return 'Not a signed deal';
    const pub = publisherById(c.publisher);
    const si = SCOPE_ORDER.indexOf(setup.scope);
    if (c.exactScope ? setup.scope !== c.scope : si < SCOPE_ORDER.indexOf(c.scope)) return `${pub.name} wants a ${SCOPES.find((s) => s.id === c.scope).name}${c.exactScope ? '' : ' or bigger'} game`;
    if (c.genres && setup.recipe?.genre && !c.genres.includes(setup.recipe.genre)) return `${pub.name} wants one of its genres`;
    return null;
  }
  // The franchise's owner (IP clause): a follow-up to it needs a deal with them.
  function ipWhy(setup) {
    if (!setup || (setup.type ?? 'original') === 'original' || !setup.ipId) return null;
    const ip = business.franchises.byId(setup.ipId);
    if (!ip?.owner) return null;
    const c = setup.deal ? deals.active.find((x) => x.id === setup.deal) : null;
    return c?.publisher === ip.owner ? null : `a ${publisherById(ip.owner).name} deal (they own ${ip.name})`;
  }

  // --- on a game ----------------------------------------------------------------------------------------------------
  bus.on('project:start', ({ job }) => {
    const id = job?.data?.deal;
    const c = id ? deals.active.find((x) => x.id === id && !x.jobId) : null;
    if (!c) return;
    c.jobId = job.id;
    c.dueDay = 1e9; // on a game it never lapses; release delivers it
    for (const m of c.milestones) m.dueDay = today() + m.dueIn;
    if (c.hype) business.marketing.addHype(job.id, c.hype);
    bus.emit('deal:attached', { deal: c, job });
  });
  // Milestones: met when the phase is done; missed (once) when its day passes first.
  function checkMilestones() {
    for (const c of deals.active) {
      if (!c.jobId) continue;
      const job = projects.jobById(c.jobId);
      for (const m of c.milestones) {
        if (m.state !== 'open') continue;
        if (job && job.phaseIndex > m.phase) m.state = 'met';
        else if (today() > m.dueDay) {
          m.state = 'missed';
          const penalty = Math.round((c.advance * DEALS.missPct) / 100);
          business.economy.spend('credits', penalty, `Missed milestone (${m.name}): ${publisherById(c.publisher).name}`, 'publisher');
          bus.emit('deal:missed', { deal: c, milestone: m, penalty });
        }
      }
    }
  }
  bus.on('project:phase', () => checkMilestones());
  bus.on('project:complete', ({ record }) => {
    const c = dealOfJob(record.jobId);
    if (!c) return;
    for (const m of c.milestones) if (m.state === 'open') m.state = today() > m.dueDay ? 'missed' : 'met';
    for (const m of c.milestones.filter((x) => x.state === 'missed' && !x.charged)) m.charged = true;
    c.record = record.number;
    const pub = publisherById(c.publisher);
    record.result.deal = { id: c.id, publisher: c.publisher, name: pub.name, sharePct: c.sharePct, platform: c.platform, ipOwned: c.ipOwned, salesPct: c.salesPct, pcOnly: !!pub.pcOnly };
    if (c.ipOwned) {
      const ip = business.franchises.byId(record.result.ipId);
      if (ip && !ip.owner) ip.owner = c.publisher;
    }
  });
  // Release: the deal is done; the publisher's share of every sale.
  bus.on('game:released', ({ record }) => {
    const c = deals.active.find((x) => x.jobId === record.jobId);
    if (c) {
      deals.deliver(c.id, { record, ref: record.number }, today());
      bus.emit('deal:done', { deal: c });
    }
  });
  const cut = (record, revenue) => {
    const d = record.result?.deal;
    if (!d || !revenue) return;
    const share = Math.round((revenue * d.sharePct) / 100);
    if (share) business.economy.spend('credits', share, `Publisher share (${d.sharePct}%): ${record.result.title}`, 'publisher');
  };
  bus.on('sales:day', ({ record, revenue }) => cut(record, revenue));
  bus.on('catalogue:month', ({ record, revenue }) => cut(record, revenue));
  // The release sheet: the required platform (null when it can't be released on now, so it's waived).
  const requiredPlatform = (record, day = today()) => {
    const d = record?.result?.deal;
    return d?.platform && releasable(business.platforms.state(d.platform, day).status) ? d.platform : null;
  };

  bus.on('clock:day', () => {
    deals.dailyTick(today());
    checkMilestones();
  });
  bus.on('clock:month', () => monthStart());

  return {
    deals,
    context,
    generate,
    offersFor,
    monthStart,
    get offers() {
      return deals.offers;
    },
    signed,
    get active() {
      return deals.active;
    },
    dealOfJob,
    sign,
    decline,
    setupWhy,
    ipWhy,
    requiredPlatform,
    publisherName: (id) => publisherById(id)?.name ?? id,
    platformName: (id) => platformById(id)?.name ?? id,
    newGame() {
      deals.reset();
      monthStart(); // the first offers straight away
    },
    serialize: () => deals.serialize(),
    load(data) {
      if (!deals.load(data ?? null)) monthStart(); // a save from before Milestone 17: this month's offers now
    },
  };
}
