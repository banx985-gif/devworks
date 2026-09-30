// Store / VIP (Milestone 36, bible §45; the Milestone 34 stub, now real): what you own, the products (prices from the
// store), VIP and its daily Studio Tokens, Restore purchases, the rewarded ads (optional, each with what it would do
// now or why not), the Studio Token spends — and with ?debug=1 the pretend store's switches (the next ad / purchase
// succeeds, is cancelled, fails or is offline; everything offline; replay the last purchase; end the subscription).
// No product, ad or spend can buy prestige: nothing here touches a secret, an award, Prestige Tokens or the grade.
import { THEME } from '../../../../core/Theme.js';
import { createStoreScreen } from './SettingsScreen.js';
import { PRODUCTS, PRODUCT_ORDER, VIP, REWARDED, TOKEN_SPENDS } from '../../data/monetisation.js';

const C = THEME.color;
const OUTCOMES = [['succeed', 'Succeed'], ['cancel', 'Cancel'], ['fail', 'Fail'], ['offline', 'Offline']];

export function createRealStoreScreen({ layout, assets, monetisation: m, business, hasRun = () => true, debugProvider = null, onBack }) {
  let note = null;
  let busy = false;
  const act = (p) => {
    if (busy) return;
    busy = true;
    Promise.resolve(p)
      .then((r) => (note = r?.message ?? (r?.ok ? 'Done.' : r?.why ?? 'Not now.')))
      .catch((e) => (note = String(e?.message ?? e)))
      .finally(() => (busy = false));
  };
  const build = () => {
    const E = m.entitlements;
    const status = [
      m.removeAds ? { text: 'Remove Ads: owned', color: C.good, bold: true } : 'Remove Ads: not owned',
      m.vip ? { text: `VIP: active${E.vip.expiresAt ? ` until ${new Date(E.vip.expiresAt).toLocaleDateString('en-GB')}` : ''}`, color: C.good, bold: true } : 'VIP: not active',
      `Studio Tokens: ${hasRun() ? business.tokens : 0}${m.heldTokens ? ` (+${m.heldTokens} waiting for your next studio)` : ''}`,
      ...(note ? [{ text: note, color: C.actionDark, bold: true }] : []),
    ];
    const product = (k) => {
      const p = PRODUCTS[k];
      const owned = (p.entitlement === 'removeAds' && m.removeAds) || (p.entitlement === 'vip' && m.vip);
      const price = m.commerce.price(k) ?? p.price;
      return { id: `buy-${k}`, logo: p.grant ? 'dev_reward_02' : p.entitlement === 'vip' ? 'dev_reward_10' : 'dev_ui_05', title: p.name, highlight: owned, lines: [p.line ?? `${p.grant.tokens} Studio Tokens for refreshes, speed-ups and cosmetics`, { text: owned ? 'Owned' : price, color: owned ? C.good : C.actionDark, bold: true }], buttons: owned ? [] : [{ id: 'buy', label: 'Buy', accent: C.action, disabled: busy, onTap: () => act(m.buy(k)) }] };
    };
    const reward = (r) => {
      const t = m.rewardTarget(r.id);
      return { id: `ad-${r.id}`, logo: 'dev_ui_16', title: `Watch an ad: ${r.name}`, lines: [r.line, ...(t.block ? [{ text: t.block, color: C.textMuted }] : [])], buttons: [{ id: 'watch', label: 'Watch', disabled: !!t.block || busy, accent: C.progress, onTap: () => act(m.watch(r.id)) }] };
    };
    const spendCard = (s) => {
      const why = hasRun() ? m.spendBlock(s.id) : 'Open a studio first';
      return { id: `spend-${s.id}`, logo: 'dev_reward_02', title: `${s.name} · ${s.cost} Studio Token${s.cost === 1 ? '' : 's'}`, lines: [s.line, ...(why ? [{ text: why, color: C.textMuted }] : [])], buttons: [{ id: 'spend', label: 'Spend', disabled: !!why, accent: C.purple, onTap: () => act(m.spend(s.id)) }] };
    };
    const P = debugProvider?.();
    return {
      title: 'Store / VIP',
      icon: 'dev_brand_04', // Milestone 37: the store feature graphic
      subtitle: 'DEVWORKS is fully playable without spending. Nothing here buys a secret, an award or a prestige unlock.',
      sections: [
        { heading: 'You have', cards: [{ id: 'status', title: 'Your account', lines: status, buttons: [{ id: 'restore', label: 'Restore purchases', accent: C.progress, disabled: busy, onTap: () => act(m.restore()) }] }] },
        { heading: 'VIP', cards: [{ id: 'vip', logo: 'dev_reward_10', title: m.vip ? 'VIP is active' : 'VIP', lines: VIP.lines, buttons: m.vip ? [{ id: 'claim', label: m.claimBlock() ?? `Claim ${VIP.dailyTokens} Studio Tokens`, disabled: !!m.claimBlock() || !hasRun(), accent: C.good, onTap: () => act(m.claimDaily()) }] : [] }] },
        { heading: 'Products', cards: PRODUCT_ORDER.map(product) },
        { heading: 'Free rewards (optional ads)', cards: REWARDED.map(reward), empty: 'No rewards right now.' },
        { heading: 'Spend Studio Tokens', cards: TOKEN_SPENDS.map(spendCard) },
        ...(P
          ? [
              {
                heading: 'Debug: pretend store',
                cards: [
                  { id: 'dbgAd', title: `Next ad: ${P.next.ad}`, lines: [], buttons: OUTCOMES.map(([o, l]) => ({ id: o, label: l, accent: P.next.ad === o ? C.good : C.progress, onTap: () => P.setNext('ad', o) })) },
                  { id: 'dbgBuy', title: `Next purchase: ${P.next.purchase}`, lines: [], buttons: OUTCOMES.map(([o, l]) => ({ id: o, label: l, accent: P.next.purchase === o ? C.good : C.progress, onTap: () => P.setNext('purchase', o) })) },
                  { id: 'dbgStore', title: `Store ${P.offline ? 'offline' : 'online'}`, lines: P.log.slice(-4).map((x) => ({ text: x.text, color: C.textMuted })), buttons: [{ id: 'offline', label: P.offline ? 'Go online' : 'Go offline', onTap: () => (P.offline = !P.offline) }, { id: 'replay', label: 'Replay last', onTap: () => (P.replayLast(), act(m.commerce.processPending().then((r) => ({ message: `Re-delivered: ${r.delivered} granted, ${r.duplicates} already had` })))) }, { id: 'endSub', label: 'End VIP', onTap: () => (P.endSubscription(), act(m.commerce.recheck().then(() => ({ message: 'The store says VIP has ended' })))) }] },
                ],
              },
            ]
          : []),
      ],
    };
  };
  const screen = createStoreScreen({ layout, assets, onBack, build });
  return {
    ...screen,
    enter() {
      screen.enter?.();
      note = null;
      m.commerce.loadProducts().catch(() => {});
    },
    get note() {
      return note;
    },
  };
}
