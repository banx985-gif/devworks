// Items for staff (Milestone 40e; core/ItemSystem + data/items.js). The Studio Store holds what has come in; an item given
// to one person raises one work stat for good (×1.5 for a loved group plus a little Morale, ×0.5 for a disliked one),
// never past their tier cap or the year's item-point cap. Items only ever come from play (data ITEM_SOURCES): a release
// reviewed 75+, fan mail after a hit, a request hit, a great training session, sponsors (a deal met or a tier up), awards,
// achievements and a well-wisher now and then. Never a shop, Studio Tokens or real money.
//   createItems({ bus, clock, world, business, seed }) → { system (core ItemSystem), give, sell, preview, store(), likesOf,
//     receivedBy, newGame, serialize, load }   Events: 'item:gained' { item, source }, 'item:full', 'item:given', 'item:sold'
import { ItemSystem } from '../../../../core/ItemSystem.js';
import { Rng } from '../../../../core/Rng.js';
import { ITEM_TYPES, ITEM_RARITIES, ITEM_RULES, ITEM_SOURCES, ITEM_GROUPS } from '../../data/items.js';
import { STAFF_LIKES } from '../../data/staff.js';

export function createItems({ bus, clock, world, business, seed = () => 'items' }) {
  const rng = new Rng(`devworks-items-${seed()}`);
  const staff = () => world.staffSystem;
  const sys = new ItemSystem({
    types: ITEM_TYPES,
    rarities: ITEM_RARITIES,
    rules: ITEM_RULES,
    rng,
    bus,
    person: (id) => staff().get(id) ?? null,
    statOf: (p, k) => p.stats[k] ?? 0,
    statCap: (p, k) => staff().statCap(p, k),
    raise: (p, k, n) => (p.stats[k] = Math.min(staff().statCap(p, k), (p.stats[k] ?? 0) + n)),
    morale: (p, n) => staff().changeMorale(p, n),
  });
  const S = ITEM_SOURCES;
  const groups = ITEM_GROUPS.map((g) => g.id);

  // Likes: the named staff's are data; anyone else rolls theirs when they join (saved).
  function ensureLikes(id) {
    if (sys.likes[id]) return sys.likes[id];
    if (STAFF_LIKES[id]) sys.setLikes(id, STAFF_LIKES[id]);
    else sys.rollLikes(id, groups);
    return sys.likes[id];
  }
  const ensureAll = () => staff().staff.forEach((s) => ensureLikes(s.id));
  bus.on('staff:hired', ({ staff: s }) => ensureLikes(s.id));

  // One item from a source (a random type, a rarity by that source's weights).
  function grant(source, why = null) {
    const src = S[source];
    const type = sys.rollType();
    const rarity = sys.rollRarity(src.weights);
    const item = sys.add(type, rarity, source, clock.totalDays);
    if (item) bus.emit('items:arrived', { item, source, text: why ?? src.text });
    return item;
  }
  const roll = (p) => rng.next() < p;

  bus.on('game:released', ({ record }) => {
    const score = record?.release?.score ?? 0;
    if (score >= S.release.minReview && roll(S.release.chance)) grant('release');
    if (score >= S.fans.minReview) {
      const trust = business.state.fanTrust ?? 50;
      if (roll(S.fans.chance + Math.max(0, trust - 50) * S.fans.trustBonus)) grant('fans');
    }
  });
  bus.on('request:result', ({ result }) => result?.hit && roll(S.request.chestChance) && grant('request'));
  bus.on('training:complete', () => roll(S.training.chance) && grant('training'));
  bus.on('sponsor:ended', ({ met }) => {
    if (!met) return;
    for (let i = 0; i < S.sponsor.met; i++) grant('sponsor'); // the deal met (its completion bonus)
    if (roll(S.sponsor.tierUpChance)) grant('sponsor'); // and now and then a gift for the new tier
  });
  bus.on('award:won', () => roll(S.award.chance) && grant('award'));
  bus.on('achievement:unlocked', () => roll(S.achievement.chance) && grant('achievement'));
  bus.on('clock:month', () => roll(S.wellWisher.monthlyChance) && grant('wellWisher'));
  bus.on('event:item', ({ source }) => grant(S[source] ? source : 'sponsor')); // a sponsor event's gift (M27 events)
  bus.on('clock:year', () => sys.newPeriod(clock.year));

  return {
    system: sys,
    grant, // (tests / debug: by a listed source only)
    store: () => sys.inventory,
    get count() {
      return sys.inventory.length;
    },
    get max() {
      return ITEM_RULES.inventoryMax;
    },
    likesOf: (id) => ensureLikes(id),
    receivedBy: (id) => sys.received[id] ?? [],
    pointsLeft: (id) => sys.pointsLeft(id),
    preview: (uid, id) => (ensureLikes(id), sys.preview(uid, id)),
    give: (uid, id) => (ensureLikes(id), sys.give(uid, id)),
    sell(uid) {
      const it = sys.get(uid);
      const value = sys.sell(uid);
      if (value != null) business.economy.add('credits', value, `Sold an item: ${ITEM_TYPES.find((t) => t.id === it.type)?.name ?? it.type}`, 'items');
      return value;
    },
    newGame() {
      sys.reset();
      sys.newPeriod(clock.year);
      ensureAll();
    },
    serialize: () => sys.serialize(),
    load(data) {
      sys.load(data ?? null);
      if (sys.period == null) sys.newPeriod(clock.year);
      ensureAll(); // an older save: everyone gets their likes now
    },
  };
}
