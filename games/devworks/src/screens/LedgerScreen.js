// Ledger (Milestone 4), from Business → Ledger: the Credits balance, Emergency Credit when below zero, and income
// and costs month by month (newest first): sales, salaries, project costs, interest, the month's net and the balance
// at its end. Every figure comes from the core EconomySystem ledger, so it always adds up. Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text } from '../../../../core/ui/Kit.js';
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
  ['interest', 'Emergency Credit interest'],
];
const money = (n) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toLocaleString('en-GB')}`;

export function createLedgerScreen({ layout, assets, business, topBar }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });

  function drawContent(ctx, w) {
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
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    onTap(p) {
      topBar.handleTap(p);
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
