// A scrolling list of cards (Milestone 17: the Publishers and Contract Board screens). The screen's content comes from
// build() every frame: { title, icon, subtitle, sections: [{ heading, empty, cards: [{ id, logo, title, lines:
// [string | { text, color, bold }], buttons: [{ id, label, accent, disabled, onTap }], highlight }] }] }.
// Layout and tapping share one pass, so they never disagree. Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text, para, wrapLines } from '../../../../core/ui/Kit.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const LOGO = 130;

export function createCardListScreen({ layout, assets, topBar, build }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  let hits = [];

  // One pass: draws when ctx is given; always records the buttons (content coordinates). Returns the height.
  function pass(ctx, w) {
    const m = build();
    const cw = w - PAD * 2;
    hits = [];
    let y = PAD;
    if (m.icon && ctx) assets.drawContained(ctx, m.icon, { x: PAD, y: y - 6, w: 90, h: 90 });
    if (ctx) text(ctx, m.title, PAD + (m.icon ? 110 : 0), y, { size: S.title, bold: true, maxWidth: cw - 110 });
    y += 100;
    if (m.subtitle) {
      if (ctx) para(ctx, m.subtitle, PAD, y, cw, { color: C.textMuted });
      y += wrapLines(m.subtitle, cw, S.body).length * S.body * 1.3 + 24;
    }
    for (const sec of m.sections) {
      if (sec.heading) {
        if (ctx) text(ctx, sec.heading, PAD, y, { size: S.heading, bold: true, maxWidth: cw });
        y += 70;
      }
      if (!sec.cards.length && sec.empty) {
        if (ctx) para(ctx, sec.empty, PAD, y, cw, { color: C.textMuted });
        y += wrapLines(sec.empty, cw, S.body).length * S.body * 1.3 + 30;
      }
      for (const c of sec.cards) {
        const tx = c.logo ? LOGO + 40 : 24;
        const tw = cw + 16 - tx - 24;
        const lines = c.lines.map((l) => (typeof l === 'string' ? { text: l } : l));
        const linesH = lines.reduce((t, l) => t + wrapLines(l.text, tw, S.small, l.bold).length * S.small * 1.3 + 8, 0);
        const bodyH = Math.max(c.logo ? LOGO + 10 : 0, 70 + linesH);
        const btnH = c.buttons?.length ? THEME.button.minH + 24 : 0;
        const r = { x: PAD - 8, y, w: cw + 16, h: 24 + bodyH + btnH + 16 };
        if (ctx) {
          ctx.fillStyle = c.highlight ? C.panelInfo : C.sheet;
          ctx.strokeStyle = c.highlight ? C.progress : C.line;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(r.x, r.y, r.w, r.h, 24);
          ctx.fill();
          ctx.stroke();
          if (c.logo) assets.drawContained(ctx, c.logo, { x: r.x + 20, y: r.y + 24, w: LOGO, h: LOGO });
          text(ctx, c.title, r.x + tx, r.y + 22, { size: S.body, bold: true, maxWidth: tw });
          let ly = r.y + 80;
          for (const l of lines) ly += para(ctx, l.text, r.x + tx, ly, tw, { size: S.small, color: l.color ?? C.text, bold: l.bold }) + 8;
        }
        if (c.buttons?.length) {
          const n = c.buttons.length;
          const bw = (r.w - 40 - (n - 1) * 16) / n;
          c.buttons.forEach((b, i) => {
            const br = { x: r.x + 20 + i * (bw + 16), y: r.y + 24 + bodyH, w: bw, h: THEME.button.minH };
            if (ctx) drawButton(ctx, br, b.label, { accent: b.accent ?? C.progress, disabled: b.disabled });
            hits.push({ id: `${c.id}:${b.id}`, r: br, b });
          });
        }
        y += r.h + 20;
      }
      y += 10;
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
    // Screen rect of a card's button (tests): '<cardId>:<buttonId>'.
    buttonRect(id) {
      pass(null, panelRect().w);
      const h = hits.find((x) => x.id === id);
      const pr = panelRect();
      return h ? { x: pr.x + h.r.x, y: pr.y + h.r.y - scroll.scrollY, w: h.r.w, h: h.r.h } : null;
    },
    scrollTo(id) {
      pass(null, panelRect().w);
      const h = hits.find((x) => x.id === id);
      if (h) {
        scroll.scrollY = h.r.y - 400;
        scroll.clamp();
      }
    },
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const q = scroll.toContent(p);
      const h = hits.find((x) => hitRect(q, x.r));
      if (h && !h.b.disabled) h.b.onTap();
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
      scroll.contentHeight = pass(ctx, r.w);
      scroll.end(ctx);
      topBar.render(ctx);
    },
  };
}
