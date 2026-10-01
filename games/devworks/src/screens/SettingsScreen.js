// Settings / Accessibility (Milestone 34, bible §51) and the Store / VIP stub (Milestone 36 fills it), card lists
// (src/ui/cardListScreen.js) with their own small bar (a Back button), so they open from the title screen too.
// Each setting is a card with its choices as buttons; the chosen one is ticked. Values: core/Settings (data/settings.js).
import { THEME } from '../../../../core/Theme.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { SETTINGS } from '../../data/settings.js';

const C = THEME.color;

// A bar with just "‹ Back" (the card list's top bar contract: rect, handleTap, render).
export function backBar(layout, onBack) {
  const rect = () => {
    const sr = layout.safeRect;
    return { x: sr.x + 16, y: sr.y + 16, w: sr.w - 32, h: THEME.button.minH + 8 };
  };
  const backRect = () => {
    const r = rect();
    return { x: r.x, y: r.y, w: 240, h: THEME.button.minH };
  };
  return {
    rect,
    backRect,
    handleTap(p) {
      if (!hitRect(p, rect())) return false;
      if (hitRect(p, backRect())) onBack();
      return true;
    },
    render(ctx) {
      drawButton(ctx, backRect(), '‹ Back', { accent: C.progress });
    },
  };
}

export function createSettingsScreen({ layout, assets, settings, onBack, extra = () => [] }) {
  const bar = backBar(layout, () => onBack());
  const screen = createCardListScreen({
    layout,
    assets,
    topBar: bar,
    build: () => {
      const groups = [...new Set(SETTINGS.map((s) => s.group))];
      // Milestone 40e: the series list first, then the game's own sections (extra), then DEVWORKS's extras (tail).
      const section = (g) => ({
        heading: g,
        cards: SETTINGS.filter((s) => s.group === g).map((s) => ({
          id: s.id,
          title: s.label,
          lines: s.line ? [{ text: s.line, color: C.textMuted }] : [],
          buttons: s.options.map((o) => ({ id: String(o.id), label: `${settings.get(s.id) === o.id ? '✓ ' : ''}${o.label}`, accent: settings.get(s.id) === o.id ? C.good : C.progress, onTap: () => settings.set(s.id, o.id) })),
        })),
      });
      const tail = (g) => SETTINGS.some((s) => s.group === g && s.tail);
      return {
        title: 'Settings',
        icon: 'dev_ui_05',
        subtitle: 'Kept on this device for every studio. Accessibility never changes rewards or secrets.',
        sections: [
          ...groups.filter((g) => !tail(g)).map(section),
          ...extra(),
          ...groups.filter(tail).map(section),
        ],
      };
    },
  });
  return { ...screen, bar }; // Back (the bar, or the phone's) → the router goes back a screen
}

// Store / VIP (bible §6): a stub until Milestone 36 (no real store; nothing here can be bought yet).
export function createStoreScreen({ layout, assets, onBack, build = null }) {
  const bar = backBar(layout, () => onBack());
  const screen = createCardListScreen({
    layout,
    assets,
    topBar: bar,
    build:
      build ??
      (() => ({
        title: 'Store / VIP',
        icon: 'dev_reward_01',
        subtitle: 'The store opens in a later update. DEVWORKS is fully playable without spending.',
        sections: [{ heading: 'Coming later', cards: [], empty: 'Remove Ads, Studio Tokens and VIP will be offered here. Nothing paid ever buys a secret, an award or a prestige unlock.' }],
      })),
  });
  return { ...screen, bar }; // Back (the bar, or the phone's) → the router goes back a screen
}
