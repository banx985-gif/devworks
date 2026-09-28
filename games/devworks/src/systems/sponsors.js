// Sponsors (Milestone 18, bible §24). Saved with the studio. Numbers in data/sponsors.js.
//
// Why not core SponsorSystem: it holds one active deal and count / avoid obligations; DEVWORKS has 1–3 slots by rank
// and obligations counted over the deal's months ("4 of 6 months"). This keeps its shape (plain definitions, signals
// from play, benefits read through one effect query) for several deals at once.
//
// Slots: 1 at Rank E / D, 2 at C / B, 3 at A / S. A deal lasts 6 game months (168 days): it pays a monthly stipend at
// every month end and gives its perk (summed over the active deals: effect(key), which the studio's effect query adds).
// Obligations have a deterministic counter:
//   count   events during the deal: a convention run (marketing), a release on OpenDesk PC, a release with Co-op or
//           Competitive Online, a release with the Premium audio package
//   months  at each of the deal's 6 month ends: the month's average staff Morale ≥ 60 / the month's net Credits > 0
// At the deal's last month end: met → the completion bonus (2 months of stipend) and the relationship moves up a tier
// (Partner → Preferred → Major → Strategic; a higher tier pays a bigger stipend) and it offers to renew at once; not
// met → no bonus, the tier stays, and it waits 6 months before offering again. Never a lock.
// Sponsors whose obligation needs a later system (IronPeak: own hardware; BOTWORKS: its demo contract) are never offered
// yet.
//
// Events: 'sponsor:offered', 'sponsor:signed', 'sponsor:progress' { deal }, 'sponsor:ended' { deal, met, bonus, tier }.
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { SPONSORS, sponsorById, SPONSOR_TIERS, SPONSOR_BALANCE as S } from '../../data/sponsors.js';
import { FAME } from '../../data/balance.js';

export function createSponsors({ bus, clock, world, business }) {
  const today = () => clock.totalDays;
  const month = () => clock.daysPerMonth;
  let deals = []; // { id, startDay, endDay, count, monthsChecked, monthsPassed, lastCheckDay, tier }
  let offers = []; // { id, untilDay, renewal }
  let relation = {}; // id → tier index
  let cooldown = {}; // id → first day it may offer again
  let history = []; // { id, startDay, endDay, met, bonus, tier }

  const rankId = () => business.rank.id;
  const slots = () => S.slots[rankId()] ?? 1;
  const tierOf = (id) => relation[id] ?? 0;
  const stipendOf = (id, tier = tierOf(id)) => {
    const d = sponsorById(id);
    const base = (S.stipend.base + S.stipend.perRank * rankIndexOf(FAME.ranks, rankId())) * (1 + (S.stipend.tierPct * tier) / 100);
    return Math.round((base * (1 + (d.perk.stipendPct ?? 0) / 100)) / 10) * 10;
  };
  // The perks of every active deal, summed.
  const effect = (key) => deals.reduce((t, d) => t + (sponsorById(d.id).perk[key] ?? 0), 0);

  const offerable = (id, day = today()) => {
    const d = sponsorById(id);
    return !!d && !d.later && !deals.some((x) => x.id === id) && !offers.some((o) => o.id === id) && (cooldown[id] ?? 0) <= day;
  };
  function refreshOffers() {
    const day = today();
    offers = offers.filter((o) => o.untilDay >= day && !deals.some((x) => x.id === o.id));
    for (const d of SPONSORS) {
      if (offerable(d.id, day)) {
        const o = { id: d.id, untilDay: day + S.offerMonths * month(), renewal: false };
        offers.push(o);
        bus.emit('sponsor:offered', { offer: o });
      }
    }
  }
  function signWhy(id) {
    if (!offers.some((o) => o.id === id)) return 'Not on offer';
    if (deals.length >= slots()) return `All ${slots()} sponsor slot${slots() === 1 ? '' : 's'} in use (more at a higher rank)`;
    return null;
  }
  function sign(id) {
    const why = signWhy(id);
    if (why) return { ok: false, why };
    offers = offers.filter((o) => o.id !== id);
    const deal = { id, startDay: today(), endDay: today() + S.dealMonths * month(), count: 0, monthsChecked: 0, monthsPassed: 0, lastCheckDay: today(), tier: tierOf(id) };
    deals.push(deal);
    bus.emit('sponsor:signed', { deal });
    return { ok: true, deal };
  }

  // A signal from play: every active count-deal waiting for it counts one more.
  function signal(name) {
    for (const d of deals) {
      const ob = sponsorById(d.id).obligation;
      if (ob.kind !== 'count' || ob.signal !== name || today() > d.endDay) continue;
      d.count++;
      bus.emit('sponsor:progress', { deal: d });
    }
  }
  bus.on('marketing:run', ({ action }) => {
    if (action?.months) signal('convention'); // the Convention: shows in set months
  });
  bus.on('game:released', ({ record }) => {
    const plats = record.release?.platforms ?? [record.release?.platform];
    if (plats.includes('P01')) signal('releasePC');
    if (['FEA02', 'FEA03'].includes(record.result?.recipe?.feature)) signal('releaseOnline');
    if (record.result?.audio === 'premium') signal('releasePremiumAudio');
  });

  // Month end: the months-tests, the stipends, Volt Cola's morale, and deals that end.
  const tests = {
    morale60: () => {
      const st = world.staffSystem.staff;
      return st.length ? st.reduce((t, s) => t + s.morale, 0) / st.length >= S.morale : false;
    },
    positiveCash: (d) => business.economy.ledger.filter((l) => l.currency === 'credits' && l.day > d.lastCheckDay && l.day <= today() && l.category !== 'sponsor').reduce((t, l) => t + l.amount, 0) > 0,
  };
  function monthEnd() {
    for (const d of [...deals]) {
      const def = sponsorById(d.id);
      const ob = def.obligation;
      if (ob.kind === 'months' && d.monthsChecked < ob.of) {
        d.monthsChecked++;
        if (tests[ob.test](d)) d.monthsPassed++;
        bus.emit('sponsor:progress', { deal: d });
      }
      d.lastCheckDay = today();
      business.economy.add('credits', stipendOf(d.id, d.tier), `Sponsor stipend: ${def.name}`, 'sponsor');
      if (def.perk.moraleMonthly) for (const s of world.staffSystem.staff) world.staffSystem.changeMorale(s, def.perk.moraleMonthly);
      if (today() >= d.endDay) end(d);
    }
    refreshOffers();
  }
  const metOf = (d) => {
    const ob = sponsorById(d.id).obligation;
    return ob.kind === 'count' ? d.count >= ob.min : d.monthsPassed >= ob.min;
  };
  function end(d) {
    deals = deals.filter((x) => x !== d);
    const met = metOf(d);
    let bonus = 0;
    if (met) {
      bonus = S.bonusMonths * stipendOf(d.id, d.tier);
      business.economy.add('credits', bonus, `Sponsor bonus: ${sponsorById(d.id).name}`, 'sponsor');
      relation[d.id] = Math.min(SPONSOR_TIERS.length - 1, tierOf(d.id) + 1);
      offers.push({ id: d.id, untilDay: today() + S.offerMonths * month(), renewal: true });
    } else cooldown[d.id] = today() + S.cooldownMonths * month();
    const rec = { id: d.id, startDay: d.startDay, endDay: today(), met, bonus, tier: tierOf(d.id) };
    history.push(rec);
    bus.emit('sponsor:ended', { deal: d, met, bonus, tier: SPONSOR_TIERS[tierOf(d.id)] });
  }
  bus.on('clock:month', () => monthEnd());

  // What the Sponsors screen shows for a deal's obligation: "Conventions attended 1 / 2".
  function counter(d) {
    const def = sponsorById(d.id);
    const ob = def.obligation;
    if (ob.kind === 'count') return { text: `${def.counterText}: ${d.count} / ${ob.min}`, met: d.count >= ob.min };
    const left = ob.of - d.monthsChecked;
    return { text: `${def.counterText}: ${d.monthsPassed} of ${d.monthsChecked} so far (${ob.min} of ${ob.of} needed${left ? `, ${left} to go` : ''})`, met: d.monthsPassed >= ob.min, lost: d.monthsPassed + left < ob.min };
  }

  return {
    effect,
    slots,
    get deals() {
      return deals;
    },
    get offers() {
      return offers;
    },
    get history() {
      return history;
    },
    tierOf,
    tierName: (id) => SPONSOR_TIERS[tierOf(id)].name,
    stipendOf,
    offerable,
    refreshOffers,
    signWhy,
    sign,
    signal,
    counter,
    metOf,
    monthEnd,
    newGame() {
      deals = [];
      offers = [];
      relation = {};
      cooldown = {};
      history = [];
      refreshOffers();
    },
    serialize: () => JSON.parse(JSON.stringify({ deals, offers, relation, cooldown, history })),
    load(data) {
      deals = JSON.parse(JSON.stringify(data?.deals ?? []));
      offers = JSON.parse(JSON.stringify(data?.offers ?? []));
      relation = { ...(data?.relation ?? {}) };
      cooldown = { ...(data?.cooldown ?? {}) };
      history = JSON.parse(JSON.stringify(data?.history ?? []));
      if (!data) refreshOffers(); // a save from before Milestone 18: offers now
    },
  };
}
