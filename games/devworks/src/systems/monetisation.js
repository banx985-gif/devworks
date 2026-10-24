// DEVWORKS monetisation stubs (Milestone 36, bible §45, §2.8, §44): the shared core services — AdService,
// CommerceService, EntitlementService — with this game's data (data/monetisation.js) and what each rewarded ad,
// purchase and Studio Token spend does here. Milestone 40h: no subscription — the one-time Supporter Pack (Remove Ads,
// the studio plaque, a one-off 120 Studio Tokens; no power perks) replaced VIP (monthly). No real provider: a normal
// web build has none (ads and the store say "not available"; the game carries on); ?debug=1 (and the tests) install
// core FakeStoreProvider.
//
// Paid convenience never buys prestige: every grant here is a refresh, a speed-up, RP or Studio Tokens. Nothing reads
// or writes a secret, an award, Prestige Tokens, C11 / C12, PROJECT ONE / X, the true ending or the grade.
//
// Saving: entitlements, processed purchase ids, interstitial timing, real-time reward limits and Studio Tokens bought
// with no run open are account data (the account file's `monetisation` part: they survive new saves, NG+ and a
// reinstall's "restore purchases"); rewarded uses per game month / contract / course are run data.
//
//   const m = createMonetisation({ bus, clock, business, research, recruitment, training, sponsors, publishers,
//                                  contracts, world, profile, commit, saveAccount, now, context })
//   m.setProvider(p) · m.startup()
//   m.rewardTarget(id) → { show, scope, target, block, line }   m.watch(id) → Promise<{ ok, status, message }>
//   m.buy(key) · m.restore() · m.spend(id) · m.interstitial(breakPoint)
//   m.supporter (the Supporter Pack is owned) · m.removeAds · m.adFree
//   serializeAccount / loadAccount · serializeRun / loadRun · payHeld()
import { EntitlementService } from '../../../../core/EntitlementService.js';
import { AdService } from '../../../../core/AdService.js';
import { CommerceService } from '../../../../core/CommerceService.js';
import { PRODUCTS, REWARDED, SUPPORTER, INTERSTITIAL_CAPS, TOKEN_SPENDS, STORE_MESSAGES, AD_TEXT } from '../../data/monetisation.js';
import { STUDIO_COLOURS } from '../../data/setup.js';

const REWARD_BY_ID = Object.fromEntries(REWARDED.map((r) => [r.id, r]));
const SPEND_BY_ID = Object.fromEntries(TOKEN_SPENDS.map((s) => [s.id, s]));

export function createMonetisation({ bus, clock, business, research = null, recruitment = null, training = null, sponsors = null, publishers = null, contracts = null, profile = null, commit = async () => {}, saveAccount = null, now = () => Date.now(), context = () => ({}) }) {
  const entitlements = new EntitlementService({ now, bus });
  // Milestone 40h: the Supporter Pack — bought (the store lists it as owned; a refund takes it away at the next store
  // check) or carried over from an old VIP save (kept for good). Either way: no automatic ads, the studio plaque.
  let supporterBought = false;
  let supporterFromVip = false;
  const supporter = () => supporterBought || supporterFromVip;
  const adFree = () => entitlements.removeAds || supporter();
  const ads = new AdService({ caps: INTERSTITIAL_CAPS, placements: REWARDED, now, adFree, bus });
  let heldTokens = 0; // bought with no run open: paid into the next one
  let hasRun = () => !!clock && business.credits != null;
  const persist = () => saveAccount?.(api.serializeAccount());
  const tokensIn = (n, why) => {
    if (!hasRun()) heldTokens += n;
    else business.economy.add('tokens', n, why, 'store');
  };
  const commerce = new CommerceService({
    products: PRODUCTS,
    entitlements,
    grant: (p) => {
      if (p.supporter) {
        if (supporter()) return; // already owned: the one-off Studio Tokens are never given twice
        setSupporter(true);
      }
      if (p.grant?.tokens) tokensIn(p.grant.tokens, `Store: ${p.name}`);
    },
    owned: (keys) => setSupporter(keys.includes(SUPPORTER.key)), // Restore purchases / the quiet store check
    commit: async () => {
      persist();
      await commit();
    },
    messages: STORE_MESSAGES,
    now,
    bus,
  });
  let provider = null;
  function setSupporter(on) {
    if (supporterBought === !!on) return;
    supporterBought = !!on;
    persist();
    bus?.emit('entitlements:change', { removeAds: entitlements.removeAds, supporter: supporter() });
  }
  bus?.on('commerce:purchased', () => ads.notePurchase());
  bus?.on('entitlements:change', () => persist());

  const gameMonth = () => clock.year * 100 + clock.month;
  const today = () => clock.totalDays;
  const firstOr = (list) => list?.[0] ?? null;

  // --- what an ad / a spend would be used on right now --------------------------------------------------------------
  function contractTarget() {
    const c = firstOr((contracts?.active ?? []).filter((x) => !x.adBonusPct));
    return c ? { scope: c.id, target: c } : null;
  }
  function trainingTarget() {
    const list = [...(training?.system?.active ?? training?.courses?.active ?? [])].filter((t) => t.daysDone < t.days);
    list.sort((a, b) => b.daysDone / b.days - a.daysDone / a.days);
    const t = list[0];
    return t ? { scope: `${t.staffId}:${t.courseId}:${t.startedDay}`, target: t } : null;
  }
  function rewardTarget(id) {
    const p = REWARD_BY_ID[id];
    if (!p) return { show: false, block: 'unknown' };
    let scope = null;
    let target = null;
    let block = null;
    if (id === 'recruitRefresh' || id === 'offerRefresh') scope = gameMonth();
    else if (id === 'contractBoost') {
      const t = contractTarget();
      if (!t) block = 'No contract in progress';
      else ({ scope, target } = t);
    } else if (id === 'trainingBoost') {
      const t = trainingTarget();
      if (!t) block = 'Nobody is on a course';
      else ({ scope, target } = t);
    }
    block ??= ads.rewardBlock(id, scope);
    return { show: true, scope, target, block, line: p.line, name: p.name };
  }
  function grantReward(id, target) {
    const p = REWARD_BY_ID[id];
    if (id === 'recruitRefresh') return recruitment?.refreshWith('ad')?.ok ? { kind: 'recruitRefresh' } : false;
    if (id === 'offerRefresh') {
      sponsors?.refreshOffers?.();
      publishers?.extraOffer?.();
      return { kind: 'offerRefresh' };
    }
    if (id === 'contractBoost') {
      if (!target) return false;
      target.adBonusPct = p.bonusPct;
      return { kind: 'contractBonus', pct: p.bonusPct };
    }
    if (id === 'trainingBoost') {
      if (!target) return false;
      const d = Math.max(1, Math.ceil((target.days * p.pct) / 100));
      target.daysDone = Math.min(target.days - 1, target.daysDone + d);
      return { kind: 'trainingDays', days: d };
    }
    if (id === 'smallGrant') {
      research?.system?.addRp(p.rp, 'Rewarded ad', today());
      tokensIn(p.tokens, 'Rewarded ad');
      return { kind: 'rp', rp: p.rp, tokens: p.tokens };
    }
    return false;
  }
  async function watch(id) {
    const t = rewardTarget(id);
    if (t.block) return { ok: false, status: null, message: t.block === 'no ad available' ? AD_TEXT.unavailable : t.block };
    const r = await ads.rewarded(id, t.scope, () => grantReward(id, t.target));
    if (r.ok) persist();
    return { ...r, message: r.ok ? 'Reward received.' : AD_TEXT[r.status] ?? r.reason };
  }

  // --- Studio Token spends ----------------------------------------------------------------------------------------------
  function spendBlock(id) {
    const s = SPEND_BY_ID[id];
    if (!s) return 'Unknown';
    if (business.tokens < s.cost) return `Needs ${s.cost} Studio Token${s.cost === 1 ? '' : 's'}`;
    if (id === 'trainingBoost' && !trainingTarget()) return 'Nobody is on a course';
    if (id === 'researchBoost' && !research?.active) return 'Nothing being researched';
    return null;
  }
  function spend(id) {
    const block = spendBlock(id);
    if (block) return { ok: false, why: block };
    const s = SPEND_BY_ID[id];
    if (id === 'recruitRefresh') return recruitment.refreshWith('token'); // takes its own 1 token
    business.economy.spend('tokens', s.cost, `Studio Tokens: ${s.name}`, 'tokens');
    if (id === 'offerRefresh') {
      sponsors?.refreshOffers?.();
      publishers?.extraOffer?.();
    } else if (id === 'trainingBoost') {
      const t = trainingTarget().target;
      t.daysDone = Math.min(t.days - 1, t.daysDone + Math.max(1, Math.ceil((t.days * s.pct) / 100)));
    } else if (id === 'researchBoost') {
      const sys = research.system;
      const node = research.active;
      sys.progress[node] = Math.min(sys.costOf(node) - 1, (sys.progress[node] ?? 0) + Math.ceil((sys.costOf(node) * s.pct) / 100));
    } else if (id === 'signRepaint' && profile?.data) {
      const i = STUDIO_COLOURS.findIndex((c) => c.id === profile.data.colour);
      profile.data.colour = STUDIO_COLOURS[(i + 1) % STUDIO_COLOURS.length].id;
    }
    return { ok: true };
  }

  // --- interstitials: natural break points only, capped, never over a decision / ending / ceremony / sheet ------------
  async function interstitial(breakPoint) {
    const ctx = context();
    return ads.interstitial(breakPoint, { tutorial: !!ctx.tutorial, decisionPending: !!ctx.busy });
  }

  const api = {
    entitlements,
    ads,
    commerce,
    get provider() {
      return provider;
    },
    setProvider(p) {
      provider = p ?? null;
      ads.setProvider(p);
      commerce.setProvider(p);
    },
    setHasRun(fn) {
      hasRun = fn;
    },
    async startup() {
      await commerce.loadProducts();
      const pending = await commerce.processPending();
      const check = await commerce.recheck();
      return { pending, check };
    },
    get supporter() {
      return supporter();
    },
    get removeAds() {
      return adFree();
    },
    get adFree() {
      return adFree();
    },
    get heldTokens() {
      return heldTokens;
    },
    rewardTarget,
    watch,
    spendBlock,
    spend,
    interstitial,
    buy: (key) => commerce.buy(key),
    restore: () => commerce.restore(),
    // force: the run is being opened right now (its first frame hasn't run yet).
    payHeld(force = false) {
      if (!heldTokens || (!force && !hasRun())) return 0;
      const n = heldTokens;
      heldTokens = 0;
      business.economy.add('tokens', n, 'Studio Tokens bought earlier', 'store');
      persist();
      return n;
    },
    serializeAccount: () => ({ entitlements: entitlements.serialize(), processed: entitlements.serializeProcessed(), ads: ads.serializeAccount(), heldTokens, supporter: supporterBought, supporterFromVip }),
    loadAccount(d) {
      // Milestone 40h: an old account with VIP (active, or bought and in its grace time) becomes a Supporter Pack owner
      // for good, with the pack's one-off Studio Tokens (paid into the next run opened); its VIP state is dropped.
      const e = d?.entitlements ?? null;
      const hadVip = !!(e && d?.supporterFromVip == null && (e.vipActive || e.vipExpiresAt != null || e.vipGraceUntil != null));
      entitlements.load(e ? { ...e, vipActive: false, vipExpiresAt: null, vipGraceUntil: null, vipLastValidatedAt: null } : null);
      entitlements.loadProcessed(d?.processed ?? []);
      ads.loadAccount(d?.ads ?? null);
      heldTokens = d?.heldTokens ?? 0;
      supporterBought = !!d?.supporter;
      supporterFromVip = !!d?.supporterFromVip || hadVip;
      if (hadVip) {
        if (!supporterBought) heldTokens += SUPPORTER.giftTokens;
        persist();
      }
    },
    serializeRun: () => ({ ads: ads.serializeRun() }),
    loadRun(d) {
      ads.loadRun(d?.ads ?? null); // a save from before Milestone 40h may hold VIP's research queue: ignored
    },
    newGame() {
      ads.loadRun(null);
    },
  };
  ads.loadAccount(null);
  ads.loadRun(null);
  return api;
}

// The pretend provider's product list (core FakeStoreProvider wants { price, title, kind, entitlement }).
export const fakeProducts = () => Object.fromEntries(Object.entries(PRODUCTS).map(([k, p]) => [k, { price: p.price, title: p.name, kind: p.kind, entitlement: p.entitlement }]));
