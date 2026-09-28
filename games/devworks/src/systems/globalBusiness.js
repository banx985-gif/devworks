// Global business (Milestone 21, bible §19 licensing, §26 publishing other studios, §27 acquisitions, §44 capped
// passive income). Saved with the studio. Every number is in data/global.js. Localisation and the global publisher
// deals live where games are made and sold (gameProject.js, business.js, publishers.js); this file adds their research
// effect (BUS4: localised games sell more) through the studio's effect query.
//
// Passive income (engine licences, external publishing returns, an acquired catalogue) is paid only at month ends,
// through one gate: in each game year passive income may be at most PASSIVE.sharePct of all that year's income
// (starting funds and test money aside). The gate checks every payment against the year so far — the year's income
// only grows, so a year that was inside the cap stays inside it. What doesn't fit is held back (not paid), and shown.
//
// Engine licensing (Rank B + BUS5 + an own engine version with licence value): offers each month; at most
// maxActiveByRank licences at once; a licence runs termMonths, pays an upfront fee and a monthly fee that falls as the
// version ages (to nothing after ~3 years) and is smaller for each extra licence; each licence costs support every
// month. Customers are counted for the "Engine Licensed" / "Ten Engine Customers" achievement hooks.
//
// Publishing other studios (Rank A + a Publishing Office): pitch cards each month (concept, the team's reputation,
// budget, schedule, forecast, risk tags, whether they want your engine). Reject / Fund / Fund + Engine / Fund +
// Marketing. At most 3 funded projects at once (in development or still paying back). Results are simulated from the
// pitch's own seeded roll: at the end of the schedule it "releases" (review, copies, revenue); the studio's share is
// paid over payMonths (falling each month) and the project is settled: paid + held back = the share.
//
// Acquisitions (Rank A or Year 9): a rare opportunity (one open at a time); at most 2 ever; each grants one thing — an
// IP, a staff candidate, a catalogue, tools, or a publishing relationship. No floorplans.
//
// Events: 'licence:offered' / 'licence:signed' / 'licence:ended', 'pitch:offered', 'external:funded',
// 'external:released' { project }, 'external:settled', 'acquisition:offered', 'acquisition:done',
// 'achievement:hook' { id } (engineLicensed, tenEngineCustomers, firstExternal, externalHit — the achievements screen
// comes later).
import { Rng } from '../../../../core/Rng.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { FAME } from '../../data/balance.js';
import { elementsOf } from '../../data/elements.js';
import { ROSTER } from '../../data/staff.js';
import { LOCALISATION, PASSIVE, LICENSING as L, EXTERNAL as X, ACQUISITIONS as A, acquisitionById, externalChoiceById } from '../../data/global.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rankAt = (id) => rankIndexOf(FAME.ranks, id);

export function createGlobalBusiness({ bus, clock, world, business, projects, research, engines = () => null, recruitment = () => null, publishers = () => null, seed = () => 'devworks-run' }) {
  const today = () => clock.totalDays;
  const dpm = () => clock.daysPerMonth;
  const daysPerYear = () => clock.daysPerMonth * clock.monthsPerYear;
  const yearOf = (day) => Math.floor(day / daysPerYear()) + 1;
  const done = () => research?.researched() ?? new Set();
  const rankIndex = () => business.reputation.highestRankIndex;
  const rankId = () => business.rank.id;
  const eco = () => business.economy;

  let s = fresh();
  function fresh() {
    return {
      rng: null,
      nextId: 1,
      years: {}, // game year → { income, passive, held }
      licences: [],
      licenceHistory: [],
      licenceOffers: [],
      customers: 0,
      pitches: [],
      external: [], // funded: { ..., status: 'dev' | 'paying' | 'settled' }
      acqOffer: null,
      acquired: [], // { id, day, grant }
      catalogues: [], // acquired catalogues paying monthly
      tools: { progressPct: 0, bugFixPct: 0 },
      relationships: 0,
      hooks: {},
    };
  }
  let rng = new Rng('devworks-global');
  const saveRng = () => (s.rng = rng.getState());
  const id = (p) => `${p}${s.nextId++}`;

  // --- the passive income gate ----------------------------------------------------------------------------------------
  const yearRow = (y = yearOf(today())) => (s.years[y] ||= { income: 0, passive: 0, held: 0 });
  bus.on('economy:change', (line) => {
    if (line.currency !== 'credits' || line.amount <= 0 || line.category === 'start') return;
    const row = yearRow(yearOf(line.day));
    row.income += line.amount;
    if (PASSIVE.categories.includes(line.category)) row.passive += line.amount;
  });
  // How much passive income can still be paid this year: passive ≤ share × (active + passive).
  function allowance() {
    const row = yearRow();
    const k = PASSIVE.sharePct / (100 - PASSIVE.sharePct);
    return Math.max(0, Math.floor(k * (row.income - row.passive) - row.passive));
  }
  // Pay passive income (month ends only). Returns what was paid; the rest is held back.
  function payPassive(amount, reason, category) {
    amount = Math.round(amount);
    if (amount <= 0) return 0;
    const pay = Math.min(amount, allowance());
    if (pay > 0) eco().add('credits', pay, reason, category);
    if (amount > pay) yearRow().held += amount - pay;
    return pay;
  }
  const hook = (hid) => {
    if (s.hooks[hid] != null) return;
    s.hooks[hid] = today();
    bus.emit('achievement:hook', { id: hid });
  };

  // --- localisation (the research part; the rest is in gameProject / business) -----------------------------------------
  const localisationWhy = () => (done().has(LOCALISATION.research) || world.stationById(LOCALISATION.facility) ? null : 'Needs Localisation research (PRO3) or a Localisation Suite');
  world.addEffectSource?.((key) => {
    if (key === 'localisedSalesPct') return done().has('BUS4') ? LOCALISATION.bus4Pct : 0;
    if (key === 'progressPct') return s.tools.progressPct;
    if (key === 'bugFixPct') return s.tools.bugFixPct;
    return 0;
  });

  // --- engine licensing ---------------------------------------------------------------------------------------------
  const allVersions = () => (engines()?.engines ?? []).flatMap((e) => e.versions.map((v) => ({ engine: e, version: v })));
  const findVersion = (vid) => allVersions().find((x) => x.version.id === vid) ?? null;
  const ageFactor = (v, day = today()) => Math.max(0, 1 - L.decayPerYear * Math.max(0, (day - v.builtDay) / daysPerYear()));
  // A version's licence value now (0 once it is too old).
  function valueOf(v, day = today()) {
    const a = engines()?.aged ? engines().aged(v) : v.attrs;
    const base = (a.performance + a.tooling + a.stability + a.portability) / 4;
    return +(base * (1 + (L.tierPct / 100) * v.tier) * ageFactor(v, day)).toFixed(3);
  }
  const maxLicences = () => L.maxActiveByRank[rankId()] ?? 0;
  const bestVersion = () => allVersions().map((x) => ({ ...x, value: valueOf(x.version) })).filter((x) => x.value >= L.minValue).sort((a, b) => b.value - a.value)[0] ?? null;
  function licensingWhy() {
    if (rankIndex() < rankAt(L.rank)) return `Opens at Rank ${L.rank}`;
    if (!done().has(L.research)) return 'Needs Engine Licensing research (BUS5)';
    if (!allVersions().length) return 'Needs an own engine';
    if (!bestVersion()) return 'Your engine versions are too old or weak to license';
    return null;
  }
  const slotFactor = (n) => Math.pow(L.slotDecay, n);
  const feeOf = (v, slot, day = today()) => Math.round(valueOf(v, day) * L.feePerPoint * slot);
  function licenceOffer() {
    const best = bestVersion();
    if (!best) return null;
    const name = rng.pick(L.customers);
    return { id: id('L'), customer: name, versionId: best.version.id, label: `${best.engine.name} ${best.version.label}`, offeredDay: today(), untilDay: today() + L.offerMonths * dpm() };
  }
  function signWhy(offerId) {
    const o = s.licenceOffers.find((x) => x.id === offerId);
    if (!o) return 'No longer on offer';
    if (licensingWhy()) return licensingWhy();
    if (s.licences.length >= maxLicences()) return `At most ${maxLicences()} licences at Rank ${rankId()}`;
    const v = findVersion(o.versionId)?.version;
    if (!v || valueOf(v) < L.minValue) return 'That version is too old to license now';
    return null;
  }
  function signLicence(offerId) {
    const why = signWhy(offerId);
    if (why) return { ok: false, why };
    const o = s.licenceOffers.find((x) => x.id === offerId);
    s.licenceOffers = s.licenceOffers.filter((x) => x !== o);
    const v = findVersion(o.versionId).version;
    const slot = +slotFactor(s.licences.length).toFixed(4);
    const fee = feeOf(v, slot);
    const lic = { id: o.id, customer: o.customer, versionId: v.id, label: o.label, startDay: today(), endDay: today() + L.termMonths * dpm(), slot, feeAtSign: fee, support: Math.round((fee * L.supportPct) / 100), upfrontDue: fee * L.upfrontMonths, paid: 0, held: 0, months: 0 };
    s.licences.push(lic);
    s.customers++;
    hook('engineLicensed');
    if (s.customers >= L.tenCustomers) hook('tenEngineCustomers');
    bus.emit('licence:signed', { licence: lic });
    return { ok: true, licence: lic };
  }
  function declineLicence(offerId) {
    const n = s.licenceOffers.length;
    s.licenceOffers = s.licenceOffers.filter((x) => x.id !== offerId);
    return s.licenceOffers.length < n;
  }
  function licencesMonth() {
    for (const lic of [...s.licences]) {
      const v = findVersion(lic.versionId)?.version;
      const fee = (v ? feeOf(v, lic.slot) : 0) + lic.upfrontDue;
      lic.upfrontDue = 0;
      lic.months++;
      const paid = payPassive(fee, `Engine licence: ${lic.customer} (${lic.label})`, 'licensing');
      lic.paid += paid;
      lic.held += fee - paid;
      if (lic.support) eco().spend('credits', lic.support, `Engine licence support: ${lic.customer}`, 'licensing');
      if (today() >= lic.endDay) {
        s.licences = s.licences.filter((x) => x !== lic);
        s.licenceHistory.push({ ...lic, endedDay: today() });
        bus.emit('licence:ended', { licence: lic });
      }
    }
    s.licenceOffers = s.licenceOffers.filter((o) => today() < o.untilDay);
    if (licensingWhy()) return;
    for (let i = 0; i < L.offersPerMonth && s.licenceOffers.length < L.maxOffers; i++) {
      const o = licenceOffer();
      if (!o) break;
      s.licenceOffers.push(o);
      bus.emit('licence:offered', { offer: o });
    }
  }

  // --- publishing other studios -------------------------------------------------------------------------------------
  function externalWhy() {
    if (rankIndex() < rankAt(X.rank)) return `Opens at Rank ${X.rank}`;
    if (!world.stationById(X.facility)) return 'Needs a Publishing Office';
    return null;
  }
  const activeExternal = () => s.external.filter((p) => p.status !== 'settled');
  function makePitch() {
    const genres = elementsOf('genre');
    const themes = elementsOf('theme');
    const rep = rng.int(1, 5);
    const budget = Math.round((X.budgetBase * (0.6 + 0.2 * rep) * rng.range(0.8, 1.4)) / 500) * 500;
    const months = rng.int(X.monthsMin, X.monthsMax);
    const tags = rng.shuffle([...X.riskTags]).slice(0, rng.int(0, 2)).map((t) => t.id);
    const mid = X.reviewBase + X.reviewPerRep * rep - X.riskPenalty * tags.length;
    return {
      id: id('P'),
      studio: rng.pick(X.studios),
      concept: `${rng.pick(genres).name} · ${rng.pick(themes).name}`,
      reputation: rep,
      budget,
      months,
      riskTags: tags,
      wantsEngine: rng.chance(0.4),
      forecast: { reviewLo: clamp(Math.round(mid - X.reviewSpread), 10, 99), reviewHi: clamp(Math.round(mid + X.reviewSpread), 10, 99), copies: Math.round(budget * X.copiesPerCredit * Math.pow(clamp(mid, 10, 99) / 60, 3)) },
      roll: rng.int(0, 2 ** 31 - 1), // the result is fixed when the pitch is made
      offeredDay: today(),
      untilDay: today() + X.pitchMonths * dpm(),
    };
  }
  const costOf = (p, choiceId) => Math.round(p.budget * (1 + (externalChoiceById(choiceId)?.extraPct ?? 0) / 100));
  function fundWhy(pitchId, choiceId) {
    const p = s.pitches.find((x) => x.id === pitchId);
    const c = externalChoiceById(choiceId);
    if (!p || !c) return 'No longer on offer';
    if (choiceId === 'reject') return null;
    if (externalWhy()) return externalWhy();
    if (activeExternal().length >= X.maxActive) return `At most ${X.maxActive} external projects at once`;
    if (c.needsEngine && !bestVersion()) return 'Needs an own engine version to give them';
    if (business.credits < costOf(p, choiceId)) return `Needs ${costOf(p, choiceId).toLocaleString('en-GB')} Credits`;
    return null;
  }
  function fund(pitchId, choiceId) {
    const why = fundWhy(pitchId, choiceId);
    if (why) return { ok: false, why };
    const p = s.pitches.find((x) => x.id === pitchId);
    s.pitches = s.pitches.filter((x) => x !== p);
    if (choiceId === 'reject') return { ok: true, rejected: true };
    const c = externalChoiceById(choiceId);
    const cost = costOf(p, choiceId);
    eco().spend('credits', cost, `Publishing: ${p.studio} (${c.name})`, 'external');
    const project = { ...p, choice: choiceId, cost, engine: c.needsEngine ? bestVersion()?.version.id ?? null : null, startDay: today(), dueDay: today() + p.months * dpm(), status: 'dev', result: null, schedule: [], owed: 0, paid: 0, held: 0, supportPaid: 0 };
    s.external.push(project);
    bus.emit('external:funded', { project });
    return { ok: true, project };
  }
  // The simulated result (pure over the pitch's roll and the choice).
  function resultOf(p) {
    const c = externalChoiceById(p.choice);
    const r = new Rng(p.roll);
    const soften = c.riskSoften ?? 0;
    const tags = Math.max(0, p.riskTags.length - soften);
    const review = clamp(Math.round(X.reviewBase + X.reviewPerRep * p.reputation + r.range(-X.reviewSpread, X.reviewSpread) - X.riskPenalty * tags + (c.reviewBonus ?? 0)), 10, 98);
    const copies = Math.round(p.budget * X.copiesPerCredit * Math.pow(review / 60, 3) * (c.salesMult ?? 1) * r.range(0.85, 1.15));
    const revenue = Math.round((copies * X.price * X.netPct) / 100);
    const share = Math.round((revenue * X.sharePct) / 100);
    // Paid over payMonths, each month payDecay × the one before; rounding goes in the last one so it adds up.
    const w = Array.from({ length: X.payMonths }, (_, i) => Math.pow(X.payDecay, i));
    const tw = w.reduce((t, x) => t + x, 0);
    const schedule = w.map((x) => Math.floor((share * x) / tw));
    schedule[schedule.length - 1] += share - schedule.reduce((t, x) => t + x, 0);
    return { review, copies, revenue, share, schedule, hit: review >= X.hitReview };
  }
  function externalMonth() {
    for (const p of s.external) {
      if (p.status === 'dev') {
        const c = externalChoiceById(p.choice);
        if (c.supportPerMonth) {
          eco().spend('credits', c.supportPerMonth, `Engine support: ${p.studio}`, 'external');
          p.supportPaid += c.supportPerMonth;
        }
        if (today() >= p.dueDay) {
          p.result = resultOf(p);
          p.status = 'paying';
          p.owed = p.result.share;
          p.schedule = [...p.result.schedule];
          p.releasedDay = today();
          hook('firstExternal');
          if (p.result.hit) {
            hook('externalHit');
            business.reputation.add(X.hitFame, `External hit: ${p.studio}`);
          }
          bus.emit('external:released', { project: p });
        }
      } else if (p.status === 'paying') {
        const due = p.schedule.shift() ?? 0;
        const paid = payPassive(due, `Publishing returns: ${p.studio}`, 'external');
        p.paid += paid;
        p.held += due - paid;
        if (!p.schedule.length) {
          p.status = 'settled';
          p.settledDay = today();
          bus.emit('external:settled', { project: p });
        }
      }
    }
    s.pitches = s.pitches.filter((x) => today() < x.untilDay);
    if (externalWhy()) return;
    const n = X.pitchesPerMonth + (world.effect?.('dealOffers') ?? 0);
    for (let i = 0; i < n && s.pitches.length < X.maxPitches; i++) {
      const p = makePitch();
      s.pitches.push(p);
      bus.emit('pitch:offered', { pitch: p });
    }
  }

  // --- acquisitions --------------------------------------------------------------------------------------------------
  const acquisitionsOpen = () => rankIndex() >= rankAt(A.rank) || clock.year >= A.year;
  const staffPick = () => ROSTER.find((d) => (d.tier === 'rare' || d.tier === 'elite') && !world.staffSystem.get(d.id) && recruitment() && !recruitment().eligibilityWhy(d)) ?? null;
  function acquireWhy() {
    const o = s.acqOffer;
    if (!o) return 'No opportunity open';
    if (s.acquired.length >= A.max) return `At most ${A.max} acquisitions`;
    const t = acquisitionById(o.targetId);
    if (business.credits < t.price) return `Needs ${t.price.toLocaleString('en-GB')} Credits`;
    if (t.grant === 'staff' && !staffPick()) return 'Nobody to bring over right now';
    return null;
  }
  function acquire() {
    const why = acquireWhy();
    if (why) return { ok: false, why };
    const t = acquisitionById(s.acqOffer.targetId);
    s.acqOffer = null;
    eco().spend('credits', t.price, `Acquisition: ${t.studio}`, 'acquisition');
    const got = { id: t.id, day: today(), grant: t.grant };
    if (t.grant === 'ip') got.ipId = business.franchises.addAcquired({ name: t.ipName, genre: t.genre, theme: t.theme, basePoints: t.basePoints, from: t.studio })?.id ?? null;
    else if (t.grant === 'staff') {
      const def = staffPick();
      got.staffId = def.id;
      recruitment().specialArrival(def.id, `From ${t.studio}, now part of your studio`);
    } else if (t.grant === 'catalogue') s.catalogues.push({ id: t.id, studio: t.studio, next: t.monthly, decayPct: t.decayPct, monthsLeft: t.months, paid: 0, held: 0 });
    else if (t.grant === 'tools') {
      s.tools.progressPct += t.progressPct;
      s.tools.bugFixPct += t.bugFixPct;
    } else if (t.grant === 'relationship') s.relationships++;
    s.acquired.push(got);
    bus.emit('acquisition:done', { target: t, got });
    return { ok: true, got };
  }
  const declineAcquisition = () => ((s.acqOffer = null), true);
  function acquisitionsMonth() {
    for (const c of s.catalogues) {
      if (c.monthsLeft <= 0) continue;
      const due = Math.round(c.next);
      const paid = payPassive(due, `Acquired catalogue: ${c.studio}`, 'acquisition');
      c.paid += paid;
      c.held += due - paid;
      c.next = +(c.next * (1 - c.decayPct / 100)).toFixed(3);
      c.monthsLeft--;
    }
    for (let i = 0; i < s.relationships; i++) publishers()?.extraOffer?.();
    if (s.acqOffer && today() >= s.acqOffer.untilDay) s.acqOffer = null;
    if (s.acqOffer || s.acquired.length >= A.max || !acquisitionsOpen()) return;
    if (!rng.chance(A.chancePerMonth)) return;
    const pool = A.targets.filter((t) => !s.acquired.some((x) => x.id === t.id) && (t.grant !== 'staff' || staffPick()));
    if (!pool.length) return;
    const t = rng.pick(pool);
    s.acqOffer = { targetId: t.id, offeredDay: today(), untilDay: today() + A.offerMonths * dpm() };
    bus.emit('acquisition:offered', { target: t });
  }

  bus.on('clock:month', () => {
    licencesMonth();
    externalMonth();
    acquisitionsMonth();
    saveRng();
  });

  return {
    get state() {
      return s;
    },
    allowance,
    yearRow,
    payPassive,
    // localisation
    localisationWhy,
    // licensing
    licensingWhy,
    maxLicences,
    valueOf,
    feeOf,
    bestVersion,
    get licences() {
      return s.licences;
    },
    get licenceOffers() {
      return s.licenceOffers;
    },
    get customers() {
      return s.customers;
    },
    signWhy,
    signLicence,
    declineLicence,
    nextFee: (lic) => {
      const v = findVersion(lic.versionId)?.version;
      return v ? feeOf(v, lic.slot) : 0;
    },
    // external publishing
    externalWhy,
    get pitches() {
      return s.pitches;
    },
    get external() {
      return s.external;
    },
    activeExternal,
    costOf,
    fundWhy,
    fund,
    resultOf,
    // acquisitions
    acquisitionsOpen,
    get acqOffer() {
      return s.acqOffer;
    },
    get acquired() {
      return s.acquired;
    },
    acquireWhy,
    acquire,
    declineAcquisition,
    // tests / ?debug=1: open the next month's opportunity now
    debugOffer(targetId) {
      if (s.acquired.length >= A.max) return null;
      s.acqOffer = { targetId, offeredDay: today(), untilDay: today() + A.offerMonths * dpm() };
      return s.acqOffer;
    },
    debugPitch() {
      const p = makePitch();
      s.pitches.push(p);
      saveRng();
      return p;
    },
    newGame() {
      s = fresh();
      rng = new Rng(`${seed()}|global`);
      saveRng();
    },
    serialize: () => {
      saveRng();
      return JSON.parse(JSON.stringify(s));
    },
    // A save from before Milestone 21: nothing yet; this year's income is counted from the ledger.
    load(data) {
      if (data) {
        s = { ...fresh(), ...JSON.parse(JSON.stringify(data)) };
        rng = new Rng(1);
        if (s.rng) rng.setState(s.rng);
        else rng = new Rng(`${seed()}|global`);
        return;
      }
      s = fresh();
      rng = new Rng(`${seed()}|global`);
      for (const l of eco().ledger) {
        if (l.currency !== 'credits' || l.amount <= 0 || l.category === 'start') continue;
        yearRow(yearOf(l.day)).income += l.amount;
      }
      saveRng();
    },
  };
}
