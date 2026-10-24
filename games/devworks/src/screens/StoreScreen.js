// Store (Milestone 36, bible §45; the Milestone 34 stub, now real): what you own, the products (prices from the
// store), the Supporter Pack (Milestone 40h: one-time, replaced the VIP subscription), Restore purchases, the rewarded
// ads (optional, each with what it would do now or why not), the Studio Token spends — and with ?debug=1 the pretend
// store's switches (the next ad / purchase succeeds, is cancelled, fails or is offline; everything offline; replay the
// last purchase; refund the Supporter Pack).
// No product, ad or spend can buy prestige: nothing here touches a secret, an award, Prestige Tokens or the grade.
import { THEME } from '../../../../core/Theme.js';
import { createStoreScreen } from './SettingsScreen.js';
import { PRODUCTS, PRODUCT_ORDER, SUPPORTER, REWARDED, TOKEN_SPENDS } from '../../data/monetisation.js';

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
    const status = [
      m.removeAds ? { text: 'Remove Ads: owned', color: C.good, bold: true } : 'Remove Ads: not owned',
      m.supporter ? { text: 'Supporter Pack: owned. Thank you!', color: C.good, bold: true } : 'Supporter Pack: not owned',
      `Studio Tokens: ${hasRun() ? business.tokens : 0}${m.heldTokens ? ` (+${m.heldTokens} waiting for your next studio)` : ''}`,
      ...(note ? [{ text: note, color: C.actionDark, bold: true }] : []),
    ];
    const product = (k) => {
      const p = PRODUCTS[k];
      const owned = (p.entitlement === 'removeAds' && m.removeAds) || (p.supporter && m.supporter);
      const price = m.commerce.price(k) ?? p.price;
      return { id: `buy-${k}`, logo: p.supporter ? 'dev_reward_10' : p.grant ? 'dev_reward_02' : 'dev_ui_05', title: p.name, highlight: owned, lines: [p.line ?? `${p.grant.tokens} Studio Tokens for refreshes, speed-ups and cosmetics`, { text: owned ? 'Owned' : price, color: owned ? C.good : C.actionDark, bold: true }], buttons: owned ? [] : [{ id: 'buy', label: 'Buy', accent: C.action, disabled: busy, onTap: () => act(m.buy(k)) }] };
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
      title: 'Store',
      icon: 'dev_brand_04', // Milestone 37: the store feature graphic
      subtitle: 'DEVWORKS is fully playable without spending. Nothing here buys a secret, an award or a prestige unlock.',
      sections: [
        { heading: 'You have', cards: [{ id: 'status', title: 'Your account', lines: status, buttons: [{ id: 'restore', label: 'Restore purchases', accent: C.progress, disabled: busy, onTap: () => act(m.restore()) }] }] },
        { heading: 'Supporter Pack', cards: [{ id: 'supporter', logo: 'dev_reward_10', title: m.supporter ? 'You are a Supporter. Thank you!' : 'Supporter Pack · bought once, yours for good', highlight: m.supporter, lines: SUPPORTER.lines, buttons: [] }] },
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
                  { id: 'dbgStore', title: `Store ${P.offline ? 'offline' : 'online'}`, lines: P.log.slice(-4).map((x) => ({ text: x.text, color: C.textMuted })), buttons: [{ id: 'offline', label: P.offline ? 'Go online' : 'Go offline', onTap: () => (P.offline = !P.offline) }, { id: 'replay', label: 'Replay last', onTap: () => (P.replayLast(), act(m.commerce.processPending().then((r) => ({ message: `Re-delivered: ${r.delivered} granted, ${r.duplicates} already had` })))) }, { id: 'refund', label: 'Refund pack', onTap: () => ((P.state.owned[SUPPORTER.key] = false), act(m.commerce.recheck().then(() => ({ message: 'The store no longer lists the Supporter Pack' })))) }] },
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
