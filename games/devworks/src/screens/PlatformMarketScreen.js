// Platform Market (Milestone 8), from Business → Platform Market: all 12 platforms (bible §17) — picture, name and
// holder, audience, dev-friendliness, era, install base today with a bar, and status (Upcoming / Growing / Peak /
// Declining / Dead). The platforms you can release on now come first. Drag scrolls. Read-only.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text } from '../../../../core/ui/Kit.js';
import { PLATFORM_BALANCE } from '../../data/balance.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const ROW_H = 250;
const HEAD_H = 190;
const ORDER = { Peak: 0, Growing: 1, Declining: 2, Upcoming: 3, Dead: 4 };

export function createPlatformMarketScreen({ layout, assets, business, clock, topBar }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  const statusColour = (st) => ({ Upcoming: C.textMuted, Growing: C.good, Peak: C.progress, Declining: C.warn, Dead: C.bad })[st];
  const maxPeak = Math.max(...Object.values(PLATFORM_BALANCE.platforms).map((p) => p.peak * PLATFORM_BALANCE.success.max));
  const rows = () => business.platforms.list(clock.totalDays).map((x, i) => ({ ...x, i })).sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.i - b.i);
  const era = (p) => (p.era.to == null ? `Year ${p.era.from} on` : `Years ${p.era.from}–${p.era.to}`);

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    const list = rows();
    text(ctx, 'Platform Market', PAD, PAD, { size: S.title, bold: true });
    const out = list.filter((x) => ['Growing', 'Peak', 'Declining'].includes(x.status)).length;
    text(ctx, `Year ${clock.year} · ${out} platform${out === 1 ? '' : 's'} out now`, PAD, PAD + 84, { size: S.body, color: C.textMuted, maxWidth: cw });
    list.forEach((x, k) => {
      const p = x.platform;
      const r = { x: PAD - 8, y: HEAD_H + k * (ROW_H + 16), w: cw + 16, h: ROW_H };
      const dim = x.status === 'Upcoming' || x.status === 'Dead';
      ctx.fillStyle = dim ? C.panelDim : C.panelAlt;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      if (dim) ctx.globalAlpha = 0.55;
      assets.drawContained(ctx, p.art, { x: r.x + 16, y: r.y + 20, w: 170, h: 170 });
      ctx.restore();
      const tx = r.x + 206;
      const tw = r.x + r.w - 20 - tx;
      text(ctx, p.name, tx, r.y + 20, { size: S.heading, bold: true, maxWidth: tw - 200 });
      // Status chip, top right.
      ctx.font = `bold ${S.small}px ${THEME.family}`;
      const chipW = ctx.measureText(x.status).width + 36;
      ctx.fillStyle = statusColour(x.status);
      ctx.beginPath();
      ctx.roundRect(r.x + r.w - 20 - chipW, r.y + 20, chipW, 48, 24);
      ctx.fill();
      text(ctx, x.status, r.x + r.w - 20 - chipW / 2, r.y + 44, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: C.textOnDark });
      text(ctx, `${p.holder} · ${era(p)}`, tx, r.y + 78, { size: S.small, color: C.textMuted, maxWidth: tw });
      text(ctx, `${p.audienceLabel} · Dev-friendliness ${p.friendliness}`, tx, r.y + 120, { size: S.small, color: C.text, maxWidth: tw });
      // Install base: number and a bar against the biggest a platform can get.
      text(ctx, x.status === 'Upcoming' ? 'Not out yet' : `${x.base.toLocaleString('en-GB')} players`, tx, r.y + 166, { size: S.body, bold: true, color: dim ? C.textMuted : C.actionDark, maxWidth: tw });
      const bar = { x: tx, y: r.y + 210, w: tw, h: 18 };
      ctx.fillStyle = C.track;
      ctx.beginPath();
      ctx.roundRect(bar.x, bar.y, bar.w, bar.h, 9);
      ctx.fill();
      if (x.base > 0) {
        ctx.fillStyle = statusColour(x.status);
        ctx.beginPath();
        ctx.roundRect(bar.x, bar.y, Math.max(18, (bar.w * x.base) / maxPeak), bar.h, 9);
        ctx.fill();
      }
    });
    return HEAD_H + list.length * (ROW_H + 16) + PAD;
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
    rows,
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
