// DEVWORKS's top bar (Milestone 40i): the core top bar (core/ui/TopBar.js), with the stats chip drawn here so every stat
// always fits. The core chip draws one row at body size and squeezes only the last stat, so on a phone with Studio Tokens
// the rank pill was cut to "Ra…". Here the chip tries, in order, until everything fits (nothing is ever left out):
//   1. as given   2. tighter gaps   3. smaller icons   4. short numbers (1,234,567 → 1.23M)   5. small text
//   6. two rows (small text, short numbers)   7. two rows, squeezed (TextFit) — only at the biggest text sizes.
// stats() items: { icon?, iconSize? (52), text, short? (a shorter text with the same meaning), color?, gap? (12) }.
import { createTopBar } from '../../../../core/ui/TopBar.js';
import { THEME, font } from '../../../../core/Theme.js';
import { text } from '../../../../core/ui/Kit.js';
const COL = THEME.color;
const S = THEME.size;

// A number for a tight chip: up to 99,999 in full, then three figures with k / M / B (−1.25M when in debt).
export function shortNumber(n) {
  const a = Math.abs(n);
  if (a < 100000) return Math.round(n).toLocaleString('en-GB');
  const [d, u] = a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : [1e3, 'k'];
  const v = a / d;
  const s = v >= 100 ? Math.floor(v) : v >= 10 ? Math.floor(v * 10) / 10 : Math.floor(v * 100) / 100;
  return `${n < 0 ? '−' : ''}${s}${u}`;
}

const STEPS = [
  { gap: 1, icon: 1, short: false, size: S.body, rows: 1 },
  { gap: 0.5, icon: 1, short: false, size: S.body, rows: 1 },
  { gap: 0.5, icon: 0.8, short: false, size: S.body, rows: 1 },
  { gap: 0.5, icon: 0.8, short: true, size: S.body, rows: 1 },
  { gap: 0.5, icon: 0.7, short: true, size: S.small, rows: 1 },
  { gap: 1.5, icon: 0.75, short: true, size: S.small, rows: 2 },
];
const PAD = 12;
const ICON_GAP = 4;

export function createDevTopBar(options) {
  const { stats = () => [] } = options;
  const bar = createTopBar({ ...options, stats: () => [] });
  let lastFit = null;

  // The width of one row of items at a step.
  function rowWidth(ctx, items, st) {
    ctx.font = font(st.size, true);
    return items.reduce((w, it, i) => {
      const icon = it.icon ? Math.round((it.iconSize ?? 52) * st.icon) + ICON_GAP : 0;
      const gap = i < items.length - 1 ? Math.round((it.gap ?? 12) * st.gap) : 0;
      return w + icon + ctx.measureText(st.short && it.short ? it.short : it.text).width + gap;
    }, 0);
  }
  // Two rows: the split that makes the wider row narrowest.
  function split(ctx, items, st) {
    let best = null;
    for (let k = 1; k < items.length; k++) {
      const rows = [items.slice(0, k), items.slice(k)];
      const w = Math.max(...rows.map((r) => rowWidth(ctx, r, st)));
      if (!best || w < best.w) best = { rows, w };
    }
    return best ?? { rows: [items], w: rowWidth(ctx, items, st) };
  }
  // The first step at which every stat fits the chip.
  function fit(ctx, items, room) {
    for (const [i, st] of STEPS.entries()) {
      const { rows, w } = st.rows === 2 ? split(ctx, items, st) : { rows: [items], w: rowWidth(ctx, items, st) };
      if (w <= room) return { step: i + 1, st, rows, fits: true };
    }
    const st = STEPS.at(-1);
    return { step: STEPS.length + 1, st, rows: split(ctx, items, st).rows, fits: false };
  }

  function drawRow(ctx, items, st, x, cy, right) {
    items.forEach((it, i) => {
      if (it.icon) {
        const s = Math.round((it.iconSize ?? 52) * st.icon);
        options.assets.drawContained(ctx, it.icon, { x, y: cy - s / 2, w: s, h: s });
        x += s + ICON_GAP;
      }
      const str = st.short && it.short ? it.short : it.text;
      text(ctx, str, x, cy, { size: st.size, bold: true, baseline: 'middle', color: it.color ?? COL.text, maxWidth: Math.max(1, right - x) });
      x += ctx.measureText(str).width + Math.round((it.gap ?? 12) * st.gap);
    });
  }

  function drawStats(ctx) {
    const m = bar.statsRect();
    const items = stats();
    const room = m.w - PAD * 2;
    const f = fit(ctx, items, room);
    lastFit = { step: f.step, rows: f.rows.length, fits: f.fits, room: Math.round(room), texts: f.rows.map((r) => r.map((it) => (f.st.short && it.short ? it.short : it.text))) };
    const inner = { y: m.y + 4, h: m.h - 8 };
    f.rows.forEach((row, i) => {
      const cy = inner.y + (inner.h * (2 * i + 1)) / (2 * f.rows.length);
      drawRow(ctx, row, f.st, m.x + PAD, cy, m.x + m.w - PAD);
    });
  }

  const render = bar.render;
  bar.render = (ctx) => {
    render(ctx);
    ctx.save();
    drawStats(ctx);
    ctx.restore();
  };
  // For tests: how the chip was drawn last frame ({ step, rows, fits, room, texts }).
  bar.statsFit = () => lastFit;
  return bar;
}
