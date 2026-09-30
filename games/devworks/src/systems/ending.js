// The Year-20 ending (Milestone 33, bible §56, §3; plan review C "M33"). core CampaignEnding fires it once, on the
// first day after Year 20, Month 12 (after that month's awards — C10 is held then), whatever the grade: winning C10
// raises the grade and the title, it is not needed to reach the ending. Then the calendar keeps running as postgame
// (no second ending) or the player starts New Game+ (src/systems/ngplus.js).
//
//   facts()  the finished run's numbers the grade reads (data/ending.js ENDING.categories) — never hardware
//   grade(facts?)  core GradeEngine → { total, max, band, categories[…parts] } plus the run's title
//   recap()  games shipped, the best game, awards, staff, consoles, secrets, Studio Singularity reached
//   result   what was worked out when the ending fired (kept in the save): { grade, title, recap, facts, day }
//   campaign core CampaignEnding (reached / pending / postgame; stage: 'ceremony' → 'offer' → 'done')
//
// The grade's scoring is logged (debug) category by category so a player's result can be checked by hand.
// Events: core 'campaign:ending' { day }, 'ending:stage' { stage }.
import { CampaignEnding } from '../../../../core/CampaignEnding.js';
import { gradeRun } from '../../../../core/GradeEngine.js';
import { ENDING } from '../../data/ending.js';
import { staffDefById, PRESTIGE_TIERS } from '../../data/staff.js';
import { RESEARCH } from '../../data/research.js';

const VISIBLE_AWARDS = new Set(['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10']);

export function titleFor(band, c10Won) {
  const base = ENDING.titles[band] ?? ENDING.titles.D;
  return c10Won ? `${ENDING.c10Title} · ${base}` : base;
}

// Pure: the grade for these facts (the tests' synthetic runs use this directly).
export function gradeFacts(facts) {
  const g = gradeRun({ categories: ENDING.categories, bands: ENDING.bands, facts });
  return { ...g, title: titleFor(g.band, (facts.c10Won ?? 0) >= 1) };
}

export function createEnding({ bus, clock, world, projects, business, research, engines = () => null, global = () => null, awards = () => null, combos = () => null, secrets = () => null, consoles = () => null, profile = () => null, debug = null, endYear = ENDING.endYear }) {
  let result = null;
  const released = () => projects.catalogue.list().filter((r) => r.release);
  const copiesOf = (r) => (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0);

  // Years (1…) whose Credits income was above their costs (the Ledger's months, added up by year).
  function profitableYears() {
    const byYear = {};
    for (const m of business.months()) {
      const y = (byYear[m.year] ||= { income: 0, costs: 0 });
      y.income += m.income;
      y.costs += m.costs;
    }
    return Object.values(byYear).filter((y) => y.income + y.costs > 0).length;
  }

  function facts() {
    const games = released();
    const scores = games.map((r) => r.release.score).sort((a, b) => b - a);
    const top = scores.slice(0, 10);
    const wins = awards()?.wins ?? [];
    const staff = world.staffSystem.staff;
    const ips = business.franchises.list();
    const fstats = ips.map((ip) => business.franchises.stats(ip));
    const founder = profile()?.data?.founder;
    const secretsRun = secrets()?.engine ? Object.keys(secrets().engine.run.unlocked).length : 0;
    return {
      releases: games.length,
      bestReview: scores[0] ?? 0,
      topReviewAvg: top.length ? +(top.reduce((t, s) => t + s, 0) / top.length).toFixed(1) : 0,
      lifetimeCopies: games.reduce((t, r) => t + copiesOf(r), 0),
      awardWins: wins.length,
      awardKinds: new Set(wins.map((w) => w.award).filter((id) => VISIBLE_AWARDS.has(id))).size,
      c10Won: wins.some((w) => w.award === 'C10') ? 1 : 0,
      staffCount: staff.length,
      staffAvgLevel: staff.length ? +(staff.reduce((t, s) => t + (s.level ?? 1), 0) / staff.length).toFixed(2) : 0,
      legendaryHired: secrets()?.fact?.('legendaryHiredEver') ?? staff.filter((s) => PRESTIGE_TIERS.includes(staffDefById(s.id)?.tier)).length,
      founderStayed: founder ? (founder.continuous && world.staffSystem.get(founder.id) ? 1 : 0) : 0,
      researchedVisible: [...research.researched()].filter((id) => RESEARCH.some((x) => x.id === id)).length,
      engineVersions: (engines()?.engines ?? []).reduce((t, e) => t + e.versions.length, 0),
      engineCustomers: global()?.customers ?? 0,
      bigFranchises: fstats.filter((s) => s.released >= 3).length,
      legendaryFranchises: ips.filter((ip) => ip.status === 'legendary' || ip.legendaryDay != null).length,
      bestFranchiseCopies: Math.max(0, ...fstats.map((s) => s.copies)),
      credits: Math.max(0, business.credits),
      solvent: !business.inDebt && business.credits >= 0 ? 1 : 0,
      profitableYears: profitableYears(),
      stage: world.stage,
      facilities: world.stations.length,
      fanTrust: business.state.fanTrust,
      rankIndex: business.reputation.highestRankIndex,
      combosFound: combos()?.found?.().filter((x) => x.inRun).length ?? 0,
      secretsFound: secretsRun,
    };
  }

  function recap() {
    const games = released();
    const best = [...games].sort((a, b) => b.release.score - a.release.score || a.number - b.number)[0] ?? null;
    const launched = (consoles()?.consoles ?? []).length;
    return {
      studio: profile()?.name ?? '',
      director: profile()?.data?.director ?? '',
      ngPlus: profile()?.ngPlus ?? 0,
      shipped: games.length,
      best: best ? { title: best.result.title, score: best.release.score, cover: best.result.cover ?? null, copies: copiesOf(best) } : null,
      awards: (awards()?.wins ?? []).length,
      staff: world.staffSystem.staff.length,
      consoles: launched,
      rank: business.rank?.id ?? 'E',
      singularity: !!secrets()?.engine?.unlockedInRun?.('SEC-X-03'),
      year: clock.year,
      month: clock.month,
    };
  }

  function grade(f = facts()) {
    return gradeFacts(f);
  }

  function logGrade(g) {
    if (!debug) return;
    for (const c of g.categories) debug.log(`ending: ${c.name} ${c.score}/${c.max} (${c.parts.map((p) => `${p.label} ${p.value}→${p.got}/${p.points}`).join('; ')})`);
    debug.log(`ending: ${g.total}/${g.max} = ${g.band} "${g.title}"`);
  }

  const campaign = new CampaignEnding({
    bus,
    clock,
    endYear,
    onReach: () => {
      const f = facts();
      const g = grade(f);
      result = { grade: g, title: g.title, recap: recap(), facts: f, day: clock.totalDays };
      logGrade(g);
    },
  });

  return {
    campaign,
    facts,
    recap,
    grade,
    get result() {
      return result;
    },
    get reached() {
      return campaign.reached;
    },
    get pending() {
      return campaign.pending;
    },
    get postgame() {
      return campaign.postgame;
    },
    get stage() {
      return campaign.state.stage;
    },
    setStage: (s) => campaign.setStage(s),
    continuePostgame: () => campaign.continuePostgame(),
    // ?debug=1 / tests: fire the ending now.
    reachNow: () => campaign.reach(),
    newGame() {
      campaign.reset();
      result = null;
    },
    serialize: () => ({ campaign: campaign.serialize(), result: result ? JSON.parse(JSON.stringify(result)) : null }),
    load(data) {
      campaign.load(data?.campaign ?? null);
      result = data?.result ? JSON.parse(JSON.stringify(data.result)) : null;
      // A save from past Year 20 with no ending yet (before Milestone 33): the ending fires at the next check.
    },
  };
}
