// Ledger (Milestone 4), from Business → Ledger: the Credits balance, Emergency Credit when below zero, and income
// and costs month by month (newest first): sales, salaries, project costs, interest, the month's net and the balance
// at its end. Every figure comes from the core EconomySystem ledger, so it always adds up. Drag scrolls.
import { THEME, lineH, textScale } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text, para } from '../../../../core/ui/Kit.js';
import { ECONOMY } from '../../data/balance.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const ROWS = [
  ['start', 'Starting funds'],
  ['sales', 'Game sales'],
  ['salaries', 'Salaries'],
  ['project', 'Game projects'],
  ['release', 'Porting and certification'], // Milestone 8
  ['marketing', 'Marketing'], // Milestone 9
  ['catalogue', 'Back catalogue'], // Milestone 10
  ['facilities', 'Facilities and studio'], // Milestone 11
  ['hiring', 'Recruitment'], // Milestone 13
  ['training', 'Training'],
  ['engine', 'Own engine'], // Milestone 16
  ['publisher', 'Publishers'], // Milestone 17
  ['contracts', 'Contract work'],
  ['sponsor', 'Sponsors'], // Milestone 18
  ['support', 'Post-launch'], // Milestone 20
  ['licensing', 'Engine licensing'], // Milestone 21
  ['external', 'Publishing other studios'],
  ['acquisition', 'Acquisitions'],
  ['hardware', 'Hardware'], // Milestone 23
  ['interest', 'Emergency Credit interest'],
];
// Milestone 41i (big text on the Fold cover): shorter names for the long ones, one row each.
const SHORT = { facilities: 'Facilities', external: 'Other studios', release: 'Porting', interest: 'Credit interest', licensing: 'Licensing', support: 'Post-launch' };
const BIG_TEXT = 1.6;
const money = (n) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toLocaleString('en-GB')}`;

function toggleIn(open, h) {
  // The newest month starts open: closing it is remembered as "!key".
  if (h.first) {
    if (open.has('!' + h.key)) open.delete('!' + h.key);
    else open.add('!' + h.key);
  } else if (open.has(h.key)) open.delete(h.key);
  else open.add(h.key);
}

export function createLedgerScreen({ layout, assets, business, topBar }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  // Milestone 41i: at big text each month is a short card (net and balance); its lines open with a tap (the newest is open).
  let open = new Set();
  let heads = []; // [{ key, y, h }] in content coordinates
  const toggle = (h) => toggleIn(open, h);
  const L = (base, size = S.body, lead = 1.3) => Math.max(base, lineH(size, lead));

  function drawBig(ctx, w) {
    const cw = w - PAD * 2;
    let y = PAD;
    heads = [];
    text(ctx, 'Ledger', PAD, y, { size: S.title, bold: true });
    y += L(80, S.title, 1.2);
    const bal = business.credits;
    text(ctx, 'Balance', PAD, y, { color: C.textMuted });
    y += L(50);
    const coin = lineH(S.major, 1);
    assets.drawContained(ctx, 'dev_reward_01', { x: PAD, y, w: coin, h: coin });
    text(ctx, `${bal.toLocaleString('en-GB')} Cr`, PAD + coin + 16, y + coin / 2, { size: S.major, bold: true, baseline: 'middle', color: bal < 0 ? C.bad : C.text, maxWidth: cw - coin - 16 });
    y += coin + 24;
    if (business.inDebt) {
      y += para(ctx, `Emergency Credit: ${ECONOMY.monthlyInterestPct}% interest a month on what you owe.`, PAD, y, cw, { bold: true, color: C.bad }) + 16;
    }
    para(ctx, 'Tap a month to see its lines.', PAD, y, cw, { size: S.small, color: C.textMuted });
    y += L(50, S.small) + 8;
    const months = business.months();
    months.forEach((m, i) => {
      const key = `${m.year}-${m.month}`;
      const isOpen = open.has(key) || (i === 0 && !open.has('!' + key));
      const top = y;
      const headH = L(64, S.heading, 1.2) + L(60, S.heading, 1.15) + 24;
      ctx.fillStyle = C.panelAlt;
      ctx.beginPath();
      ctx.roundRect(PAD - 12, y, cw + 24, headH, 18);
      ctx.fill();
      y += 12;
      text(ctx, `Y${m.year} · M${m.month}`, PAD, y, { size: S.heading, bold: true });
      text(ctx, isOpen ? '▴' : '▾', PAD + cw, y, { size: S.heading, bold: true, align: 'right', color: C.progress });
      y += L(64, S.heading, 1.2);
      text(ctx, 'Net', PAD, y + 6, { color: C.textMuted });
      text(ctx, money(m.net), PAD + cw * 0.42, y, { size: S.heading, bold: true, color: m.net >= 0 ? C.good : C.bad, maxWidth: cw * 0.58 - 8 });
      y = top + headH;
      heads.push({ key, first: i === 0, y: top, h: headH });
      y += 12;
      if (isOpen) {
        const lines = [...ROWS.filter(([cat]) => m.byCategory[cat]).map(([cat, label]) => [SHORT[cat] ?? label, m.byCategory[cat]]), ...Object.entries(m.byCategory).filter(([cat, v]) => v && !ROWS.some((r) => r[0] === cat))];
        for (const [label, v] of lines) {
          text(ctx, label, PAD + 12, y, { color: C.textMuted, maxWidth: cw * 0.6 });
          text(ctx, money(v), PAD + cw, y, { bold: true, align: 'right', color: v > 0 ? C.good : C.text, maxWidth: cw * 0.4 - 16 });
          y += L(52);
        }
      }
      text(ctx, 'Balance at end', PAD + 12, y, { size: S.small, color: C.textFaint });
      text(ctx, m.endBalance.toLocaleString('en-GB'), PAD + cw, y, { size: S.small, bold: true, align: 'right', color: m.endBalance < 0 ? C.bad : C.textMuted });
      y += L(56, S.small, 1.3) + 20;
    });
    return y + PAD;
  }

  function drawContent(ctx, w) {
    if (textScale() >= BIG_TEXT) return drawBig(ctx, w);
    const cw = w - PAD * 2;
    let y = PAD;
    text(ctx, 'Ledger', PAD, y, { size: S.title, bold: true });
    y += 80;
    assets.drawContained(ctx, 'dev_reward_01', { x: PAD, y: y - 6, w: 70, h: 70 });
    const bal = business.credits;
    text(ctx, `${bal.toLocaleString('en-GB')} Credits`, PAD + 86, y + 28, { size: S.major, bold: true, baseline: 'middle', color: bal < 0 ? C.bad : C.text });
    y += 90;
    if (business.inDebt) {
      text(ctx, `Emergency Credit: ${ECONOMY.monthlyInterestPct}% interest a month on what you owe.`, PAD, y, { size: S.body, bold: true, color: C.bad, maxWidth: cw });
      y += 56;
    }
    for (const m of business.months()) {
      y += 16;
      ctx.fillStyle = C.panelAlt;
      ctx.beginPath();
      ctx.roundRect(PAD - 12, y - 10, cw + 24, 70, 18);
      ctx.fill();
      text(ctx, `Year ${m.year} · Month ${m.month}`, PAD, y + 25, { size: S.heading, bold: true, baseline: 'middle' });
      text(ctx, `Net ${money(m.net)}`, PAD + cw, y + 25, { size: S.body, bold: true, baseline: 'middle', align: 'right', color: m.net >= 0 ? C.good : C.bad });
      y += 80;
      for (const [cat, label] of ROWS) {
        const v = m.byCategory[cat];
        if (!v) continue;
        text(ctx, label, PAD + 20, y, { size: S.body, color: C.textMuted });
        text(ctx, money(v), PAD + cw, y, { size: S.body, bold: true, align: 'right', color: v > 0 ? C.good : C.text });
        y += 52;
      }
      for (const [cat, v] of Object.entries(m.byCategory)) {
        if (ROWS.some((r) => r[0] === cat) || !v) continue;
        text(ctx, cat, PAD + 20, y, { size: S.body, color: C.textMuted });
        text(ctx, money(v), PAD + cw, y, { size: S.body, bold: true, align: 'right' });
        y += 52;
      }
      text(ctx, 'Balance at month end', PAD + 20, y, { size: S.small, color: C.textFaint });
      text(ctx, m.endBalance.toLocaleString('en-GB'), PAD + cw, y, { size: S.small, bold: true, align: 'right', color: m.endBalance < 0 ? C.bad : C.textMuted });
      y += 56;
    }
    return y + PAD;
  }

  return {
    enter() {
      scroll.scrollY = 0;
      open = new Set();
    },
    scrollToEnd() {
      scroll.scrollY = scroll.maxScroll;
    },
    // Milestone 41i (tests): open or close a month at big text by its index (0 = newest).
    toggleMonth(i) {
      const h = heads[i];
      if (h) toggle(h);
      return !!h;
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    onTap(p) {
      if (topBar.handleTap(p)) return;
      if (textScale() < BIG_TEXT || !scroll.contains(p)) return;
      const c = scroll.toContent(p);
      const h = heads.find((x) => c.y >= x.y && c.y <= x.y + x.h);
      if (h) toggle(h);
    },
    render(ctx) {
      const r = panelRect();
      ctx.fillStyle = C.panel;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = THEME.panel.line;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, THEME.panel.radius);
      ctx.fill();
      ctx.stroke();
      scroll.begin(ctx);
      scroll.contentHeight = drawContent(ctx, r.w);
      scroll.end(ctx);
      topBar.render(ctx);
    },
  };
}
