// New Game+ (Milestone 33, bible §43, setup spec §8) on core NgPlusSystem, with data/ending.js NGPLUS / TOKEN_SHOP.
//
// Account-wide (always kept): combos, secret recipes and discoveries, achievements, the Hall of Fame, the account
// records, Prestige Tokens, the staff you have worked with ("discovered staff identities"), the legacy summaries of
// finished runs, Studio Tokens. Those already live in account records (combos, secrets, achievements) or in this
// module's own account record (the legacy summaries and the staff you have worked with, SAVE.legacyAccountKey); Studio
// Tokens are carried in the package.
// Chosen: Legacy Staff (people from the finished run; they keep tier, level, stats and traits, and are marked Legacy),
// Legacy Game Blueprints (a shipped game's recipe and franchise name: the franchise comes with a share of its fans and
// a Sequel of it starts from the whole recipe), and from NG+2 one discounted facility blueprint (its first purchase
// in the new run costs NGPLUS.facilityDiscountPct less).
// Reset: everything else a run owns (NGPLUS.fields.reset) — the new run starts from each system's newGame.
// Research conversion: NGPLUS.researchPctByLevel of the RP the finished run's done research topics cost comes back as RP.
// The Museum (F33, "NG+ legacy archive +1") in the finished studio adds one blueprint pick.
// Prestige Tokens' first spend: TOKEN_SHOP (an extra Legacy pick, an extra blueprint, a starting facility), paid when
// the new run starts. Nothing in it can be a secret, an award or a prestige unlock.
//
//   offer()                 → what the NG+ setup screen shows: { level, picks, options, tokens, shop }
//   problems(choices)       → [text] (empty = fine); choices: { legacyStaff: [id], blueprints: [id], facilityBlueprint,
//                             shop: [item id], startFacility }
//   snapshot()              → every declared field (always / chosen pools / reset), for core NgPlusSystem.transition
//   buildCarry(choices, parent) → the package the new run is built from (JSON; it crosses a page reload)
//   apply(carry)            → in the new run, after its newGame calls and profile.create: NG+ level, Legacy Staff,
//                             blueprints, RP, the facility discount, the shop's start facility, Studio Tokens, tokens paid
//   noteEnding(result)      → a legacy summary of the finished run (account)
import { NgPlusSystem } from '../../../../core/NgPlusSystem.js';
import { RunArchive } from '../../../../core/RunArchive.js';
import { NGPLUS, TOKEN_SHOP, ENDING, tokenItemById } from '../../data/ending.js';
import { RESEARCH } from '../../data/research.js';
import { staffDefById } from '../../data/staff.js';
import { facilityById, KEEP } from '../../data/facilities.js';
import { RECRUIT } from '../../data/recruitment.js';

export const ngRules = () => new NgPlusSystem({ rules: NGPLUS });
const copy = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

export function createNgPlus({ bus, clock, world, business, research, projects, profile, secrets, combos, achievements, recruitment = null, shop = null, engines = () => null, sponsors = () => null, publishers = () => null, contracts = () => null, consoles = () => null, global = () => null, runId = () => 'run', saveAccount = null }) {
  const sys = ngRules();
  const archive = new RunArchive({ max: ENDING.archiveMax });
  let known = {}; // staff id → { name, firstRun, runs: [runId] }  (discovered staff identities)
  const persist = () => saveAccount?.({ archive: archive.serialize(), known: copy(known) });

  function know(s) {
    if (!s?.id) return false;
    const k = (known[s.id] ||= { name: s.name, firstRun: runId(), runs: [] });
    if (k.runs.includes(runId())) return false;
    k.runs.push(runId());
    return true;
  }
  const knowAll = () => {
    let changed = false;
    for (const s of world.staffSystem.staff) changed = know(s) || changed;
    if (changed) persist();
  };
  bus?.on('staff:hired', ({ staff }) => know(staff) && persist());

  const level = () => profile.ngPlus ?? 0;
  const nextLevel = () => sys.levelAfter(level());
  const released = () => projects.catalogue.list().filter((r) => r.release);

  // --- what can be picked (from the finished run) ----------------------------------------------------------------
  function legacyPool() {
    const prev = new Map((profile.data?.legacy ?? []).map((l) => [l.id, l.runs]));
    return world.staffSystem.staff.map((s) => ({ id: s.id, name: s.name, role: s.role, tier: s.tier, level: s.level, xp: s.xp, stats: { ...s.stats }, traits: [...s.traits], salary: s.salary, art: s.art, everHired: true, runs: prev.get(s.id) ?? 0 }));
  }
  function blueprintPool() {
    return released().map((r) => {
      const ip = business.franchises.ipOf(r);
      const st = ip ? business.franchises.stats(ip) : null;
      return { id: `G${r.number}`, number: r.number, title: r.result.title, franchise: ip?.name ?? r.result.title, recipe: { ...r.result.recipe }, genre: r.result.recipe?.genre ?? null, theme: r.result.recipe?.theme ?? null, score: r.release.score, cover: r.result.cover ?? null, fans: Math.round(((st?.points ?? 0) * NGPLUS.blueprintFansPct) / 100) };
    });
  }
  // A facility blueprint: any bought facility in the finished studio (not the starting desks, nothing secret).
  function facilityPool() {
    const out = {};
    for (const st of world.stations) {
      const def = facilityById(st.id);
      if (!def || def.unlock?.start || def.unlock?.secret || KEEP[st.id]) continue;
      out[st.id] = { id: st.id, name: def.name, cost: def.cost, art: def.art ?? null };
    }
    return out;
  }
  function researchPoints() {
    const done = research.researched();
    return RESEARCH.filter((r) => done.has(r.id)).reduce((t, r) => t + (r.rp ?? 0), 0);
  }

  function picks(bought = [], lv = nextLevel()) {
    const n = (what) => bought.filter((id) => tokenItemById(id)?.effect.what === what).length;
    return {
      legacy: sys.picks('legacy', lv) + n('legacy'),
      blueprints: sys.picks('blueprints', lv) + n('blueprints') + (world.stationById('F33') ? 1 : 0),
      facility: NGPLUS.facilityBlueprintByLevel[Math.min(lv, NGPLUS.facilityBlueprintByLevel.length - 1)] ?? 0,
    };
  }
  const shopCost = (bought = []) => bought.reduce((t, id) => t + (tokenItemById(id)?.price ?? 0), 0);

  function offer() {
    const lv = nextLevel();
    return {
      level: lv,
      from: level(),
      picks: picks([], lv),
      researchPct: NGPLUS.researchPctByLevel[Math.min(lv, NGPLUS.researchPctByLevel.length - 1)],
      researchRp: Math.floor((researchPoints() * NGPLUS.researchPctByLevel[Math.min(lv, 3)]) / 100),
      options: { legacy: legacyPool(), blueprints: blueprintPool(), facilities: Object.values(facilityPool()) },
      tokens: secrets?.prestigeTokens ?? 0,
      shop: TOKEN_SHOP,
      ultimate: lv >= NGPLUS.ultimatePathsAt,
    };
  }

  function problems(choices = {}) {
    const out = [];
    const bought = choices.shop ?? [];
    if (new Set(bought).size !== bought.length) out.push('A shop item is bought twice');
    for (const id of bought) if (!tokenItemById(id)) out.push(`Unknown shop item ${id}`);
    if (shopCost(bought) > (secrets?.prestigeTokens ?? 0)) out.push('Not enough Prestige Tokens');
    const p = picks(bought);
    const legacy = choices.legacyStaff ?? [];
    const blue = choices.blueprints ?? [];
    if (new Set(legacy).size !== legacy.length) out.push('A Legacy worker is picked twice');
    if (legacy.length > p.legacy) out.push(`Only ${p.legacy} Legacy Staff`);
    const staffIds = new Set(world.staffSystem.staff.map((s) => s.id));
    for (const id of legacy) if (!staffIds.has(id)) out.push(`${id} can't be a Legacy worker`);
    if (new Set(blue).size !== blue.length) out.push('A blueprint is picked twice');
    if (blue.length > p.blueprints) out.push(`Only ${p.blueprints} blueprint${p.blueprints === 1 ? '' : 's'}`);
    const blueIds = new Set(blueprintPool().map((b) => b.id));
    for (const id of blue) if (!blueIds.has(id)) out.push(`Unknown blueprint ${id}`);
    if (choices.facilityBlueprint && !p.facility) out.push(`A facility blueprint needs NG+2`);
    if (choices.facilityBlueprint && p.facility && !facilityPool()[choices.facilityBlueprint]) out.push(`${choices.facilityBlueprint} isn't in the studio`);
    const sf = bought.includes('startFacility');
    if (sf && !tokenItemById('startFacility').effect.options.includes(choices.startFacility)) out.push('Pick the starting facility');
    if (!sf && choices.startFacility) out.push('The starting facility is not bought');
    return out;
  }

  // Every declared field (core refuses a snapshot that misses one or has an extra one).
  function snapshot() {
    const cons = consoles()?.consoles ?? [];
    const spons = sponsors();
    return {
      // always
      combos: combos?.serializeAccount?.() ?? null,
      secretRecipes: secrets?.serializeAccount?.() ?? null,
      achievements: achievements?.serializeAccount?.().achievements ?? null,
      hallOfFame: achievements?.serializeAccount?.().hallOfFame ?? null,
      records: achievements?.serializeAccount?.().records ?? null,
      prestigeTokens: secrets?.prestigeTokens ?? 0,
      staffIdentities: copy(known),
      legacySummaries: archive.serialize(),
      studioTokens: business.tokens,
      // chosen (the pools)
      legacyStaff: legacyPool(),
      blueprints: blueprintPool(),
      facilityBlueprint: facilityPool(),
      // reset
      credits: business.credits,
      rank: { index: business.reputation.highestRankIndex, fame: business.fame },
      studioStage: world.stage,
      studioLayout: world.stations.map((s) => s.id),
      contracts: contracts()?.serialize?.() ?? null,
      activeProjects: projects.jobs.map((j) => j.id),
      sponsors: copy(spons?.deals ?? []),
      publishers: publishers()?.serialize?.() ?? null,
      visibleResearch: [...research.researched()],
      consoles: cons.map((c) => c.platformId ?? c.id),
      installBase: cons.reduce((t, c) => t + (c.installBase ?? 0), 0),
      platformRelationships: { market: business.platforms.serialize?.() ?? null, sponsorRelation: copy(spons?.serialize?.().relation ?? null), publishing: global()?.state?.relationships ?? 0 },
      staff: world.staffSystem.staff.map((s) => s.id),
      catalogue: projects.catalogue.list().length,
      franchises: business.franchises.list().map((ip) => ip.name),
      engines: (engines()?.engines ?? []).map((e) => e.name),
      fanTrust: business.state.fanTrust,
      calendar: clock.totalDays,
    };
  }

  function buildCarry(choices = {}, parent = {}) {
    const lv = nextLevel();
    const t = sys.transition({ snapshot: snapshot(), choices: { legacyStaff: choices.legacyStaff ?? [], blueprints: choices.blueprints ?? [], facilityBlueprint: choices.facilityBlueprint ?? null }, level: lv });
    const pct = NGPLUS.researchPctByLevel[Math.min(lv, NGPLUS.researchPctByLevel.length - 1)];
    return {
      id: `${runId()}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`, // Milestone 35: pays once
      level: lv,
      always: { prestigeTokens: t.always.prestigeTokens, studioTokens: t.always.studioTokens },
      legacyStaff: t.chosen.legacyStaff,
      blueprints: t.chosen.blueprints,
      facilityBlueprint: t.chosen.facilityBlueprint,
      researchRp: Math.floor((researchPoints() * pct) / 100),
      researchPct: pct,
      shop: [...(choices.shop ?? [])],
      limits: picks(choices.shop ?? [], lv),
      museum: !!world.stationById('F33'),
      startFacility: choices.startFacility ?? null,
      reset: t.reset,
      parent: { slot: parent.slot ?? null, studio: profile.name, runId: runId(), ngPlus: level(), grade: parent.grade ?? null },
    };
  }

  // A station for a Legacy worker: their role's free station, else their role's station added, else any free one.
  function seat(role) {
    const free = world.freeStationFor(role);
    if (free) return free.id;
    const id = RECRUIT.roleStations[role];
    return (world.addStation(id) ?? world.freeStationFor(role))?.id ?? null;
  }

  function apply(carry) {
    if (!carry) return null;
    const day = clock.totalDays;
    let bought = [...(carry.shop ?? [])];
    const cost = shopCost(bought);
    // Paid once per package (Milestone 35: an NG+ start replayed after a force-close never charges again).
    if (cost && !secrets?.spendTokens?.(cost, `NG+${carry.level} setup: ${bought.join(', ')}`, carry.id ? `ngshop:${carry.id}` : null)) bought = []; // (can't happen: checked on the setup screen)
    const base = { legacy: sys.picks('legacy', carry.level), blueprints: sys.picks('blueprints', carry.level) + (carry.museum ? 1 : 0) };
    const lim = bought.length ? carry.limits ?? base : base;
    const legacy = [];
    for (const l of (carry.legacyStaff ?? []).slice(0, lim.legacy)) {
      const def = staffDefById(l.id);
      if (!def) continue;
      let s = world.staffSystem.get(l.id); // already in the founder's team: they become the Legacy one
      if (!s) {
        const w = world.hire(def, seat(def.role));
        s = w.staff;
        recruitment?.joinCareer?.(s, day);
      }
      Object.assign(s, { level: l.level, xp: l.xp ?? 0, stats: { ...l.stats }, traits: [...l.traits], salary: l.salary ?? s.salary });
      legacy.push({ id: l.id, name: l.name, runs: (l.runs ?? 0) + 1 });
    }
    const blueprints = [];
    for (const b of (carry.blueprints ?? []).slice(0, lim.blueprints)) {
      const ip = business.franchises.addAcquired({ name: b.franchise, genre: b.genre, theme: b.theme, basePoints: b.fans ?? 0, from: 'legacy' });
      ip.blueprint = { recipe: { ...b.recipe }, title: b.title, score: b.score, cover: b.cover ?? null };
      blueprints.push({ id: b.id, ipId: ip.id, title: b.title, franchise: b.franchise });
    }
    if (carry.researchRp > 0) research.system.addRp(carry.researchRp, `NG+${carry.level}: ${carry.researchPct}% of the last run's research`, day);
    const fb = carry.facilityBlueprint?.id ? { id: carry.facilityBlueprint.id, pct: NGPLUS.facilityDiscountPct, used: false } : null;
    let startFacility = null;
    if (bought.includes('startFacility') && carry.startFacility && !world.stationById(carry.startFacility)) startFacility = world.addStation(carry.startFacility)?.id ?? null;
    const st = carry.always?.studioTokens ?? 0;
    if (st > business.tokens) business.economy.add('tokens', st - business.tokens, 'Studio Tokens (account)', 'start');
    profile.startNgPlus({ level: carry.level, parent: carry.parent, legacy, blueprints, facilityBlueprint: fb, shop: bought, startFacility, researchRp: carry.researchRp });
    knowAll();
    return { legacy, blueprints, startFacility, bought };
  }

  // The ending: the finished run's legacy summary goes into the account (newest first).
  function noteEnding(result) {
    if (!result) return null;
    const e = archive.add({ runId: runId(), studio: profile.name, director: profile.data?.director ?? '', ngPlus: level(), band: result.grade.band, total: result.grade.total, title: result.title, shipped: result.recap.shipped, best: result.recap.best, year: result.recap.year, parent: profile.data?.parent ?? null, day: result.day });
    persist();
    return e;
  }

  // C10 won by a game with a Legacy worker credited (SEC-NGP-03).
  bus?.on('award:won', ({ award, result }) => {
    if (award?.id !== 'C10' || !profile.data?.legacy?.length) return;
    const rec = projects.catalogue.list().find((r) => r.result?.title === result?.entrants?.[0]?.title);
    const ids = new Set(profile.data.legacy.map((l) => l.id));
    if (rec && (rec.team ?? []).some((m) => ids.has(m.id))) profile.setLegacyOnC10();
  });

  return {
    rules: sys,
    offer,
    picks,
    shopCost,
    problems,
    snapshot,
    buildCarry,
    apply,
    noteEnding,
    knowAll,
    researchPoints,
    get archive() {
      return archive.list;
    },
    get known() {
      return known;
    },
    serializeAccount: () => ({ archive: archive.serialize(), known: copy(known) }),
    loadAccount(data) {
      archive.load(data?.archive ?? null);
      known = copy(data?.known ?? {}) ?? {};
    },
  };
}
