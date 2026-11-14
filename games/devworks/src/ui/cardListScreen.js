// A scrolling list of cards (Milestone 17: the Publishers and Contract Board screens). The screen's content comes from
// build() every frame: { title, icon, subtitle, sections: [{ heading, empty, cards: [{ id, logo, title, lines:
// [string | { text, color, bold }], buttons: [{ id, label, accent, disabled, onTap }], highlight, face }] }] }.
// Milestone 40k: face = a series cast face (a publisher's or sponsor's rep) in the staff portrait frame under the logo;
// a missing face file leaves the card as it was.
// Layout and tapping share one pass, so they never disagree. Drag scrolls.
// Milestone 41e (bigger text, the Fold's cover screen): every gap is measured from the real line heights at the chosen
// text size (core Theme lineH), and a card's buttons go one per row when their labels don't fit side by side.
// Milestone 41i (Larger = 1.8× on the Fold cover): at big text the long subtitle shows its first sentence and the rest
// behind "More"; a card may give bigTitle + value (the number on its own row, bigger and bolder than the words) and
// lines marked more: true, which wait behind the card's own "More" tap. Normal and Large are drawn exactly as before.
import { THEME, lineH, font, textScale } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text, para, wrapLines } from '../../../../core/ui/Kit.js';
import { castFace, drawCastFace } from './castArt.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const LOGO = 130;
const FACE = 110;
let measureCtx = null;
const labelW = (label) => {
  measureCtx ??= globalThis.document?.createElement('canvas').getContext('2d');
  if (!measureCtx) return 0;
  measureCtx.font = font(THEME.size.button, true);
  return Math.max(...String(label).split('\n').map((l) => measureCtx.measureText(l).width));
};

// Milestone 34: colour-blind-safe symbols (a setting): a good / bad line gets ✓ / ✗ in front. And the empty-state audit:
// a section with no cards and no `empty` text is reported to globalThis.__dwEmptyAudit (tests), so no panel is blank.
let symbols = false;
export const setCardSymbols = (on) => (symbols = !!on);
const mark = (l) => (!symbols || !l.color ? l : l.color === C.good ? { ...l, text: `✓ ${l.text}` } : l.color === C.bad ? { ...l, text: `✗ ${l.text}` } : l.color === C.warn ? { ...l, text: `! ${l.text}` } : l);

export function createCardListScreen({ layout, assets, topBar, build }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  let hits = [];
  let moreOpen = new Set(); // Milestone 41i: 'subtitle' and card ids opened with "More"
  const BIG = () => textScale() >= 1.6;
  const moreBtnH = () => Math.max(84, lineH(S.small, 1.9));
  function moreButton(ctx, x, y, w, key, n) {
    const r = { x, y, w, h: moreBtnH() };
    const isOpen = moreOpen.has(key);
    if (ctx) {
      ctx.fillStyle = C.panelInfo;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 18);
      ctx.fill();
      text(ctx, isOpen ? 'Less ▴' : `More ▾${n ? ` (${n})` : ''}`, r.x + r.w / 2, r.y + r.h / 2, { size: S.small, bold: true, color: C.progress, align: 'center', baseline: 'middle', maxWidth: r.w - 20 });
    }
    hits.push({ id: `more:${key}`, r, b: { onTap: () => (isOpen ? moreOpen.delete(key) : moreOpen.add(key)) } });
    return r.h;
  }

  // One pass: draws when ctx is given; always records the buttons (content coordinates). Returns the height.
  function pass(ctx, w) {
    const m = build();
    const cw = w - PAD * 2;
    hits = [];
    let y = PAD;
    if (m.icon && ctx) assets.drawContained(ctx, m.icon, { x: PAD, y: y - 6, w: 90, h: 90 });
    if (ctx) text(ctx, m.title, PAD + (m.icon ? 110 : 0), y, { size: S.title, bold: true, maxWidth: cw - 110 });
    y += Math.max(100, lineH(S.title, 1.15) + 24);
    const big = BIG();
    if (m.subtitle && big) {
      // The first sentence; the rest behind "More".
      const cut = m.subtitle.search(/[.;](\s|$)/);
      const first = cut > 0 && cut < m.subtitle.length - 2 ? m.subtitle.slice(0, cut + 1) : m.subtitle;
      const shown = moreOpen.has('subtitle') ? m.subtitle : first;
      y += para(ctx, shown, PAD, y, cw, { color: C.textMuted }) + 12;
      if (first !== m.subtitle) y += moreButton(ctx, PAD, y, Math.min(cw, 420), 'subtitle', 0) + 24;
      else y += 12;
    } else if (m.subtitle) {
      if (ctx) para(ctx, m.subtitle, PAD, y, cw, { color: C.textMuted });
      y += wrapLines(m.subtitle, cw, S.body).length * lineH(S.body) + 24;
    }
    for (const sec of m.sections) {
      if (sec.heading) {
        if (ctx) text(ctx, sec.heading, PAD, y, { size: S.heading, bold: true, maxWidth: cw });
        y += Math.max(70, lineH(S.heading, 1.15) + 18);
      }
      if (!sec.cards.length && !sec.empty && globalThis.__dwEmptyAudit) globalThis.__dwEmptyAudit.push(`${m.title}: ${sec.heading ?? '(no heading)'}`);
      if (!sec.cards.length && sec.empty) {
        if (ctx) para(ctx, sec.empty, PAD, y, cw, { color: C.textMuted });
        y += wrapLines(sec.empty, cw, S.body).length * lineH(S.body) + 30;
      }
      for (const c of sec.cards) {
        const face = castFace(assets, c.face);
        const sideH = (c.logo ? LOGO : 0) + (face ? (c.logo ? 16 : 0) + FACE : 0);
        const tx = sideH ? LOGO + 40 : 24;
        const tw = cw + 16 - tx - 24;
        const allLines = c.lines.map((l) => mark(typeof l === 'string' ? { text: l } : l));
        const hidden = big ? allLines.filter((l) => l.more).length : 0;
        const lines = big && !moreOpen.has(c.id) ? allLines.filter((l) => !l.more) : allLines;
        const linesH = lines.reduce((t, l) => t + wrapLines(l.text, tw, S.small, l.bold).length * lineH(S.small) + 8, 0);
        const titleLines = wrapLines(big && c.bigTitle ? c.bigTitle : c.title, tw, S.body, true);
        const valueH = big && c.value != null ? lineH(S.heading, 1.2) + 4 : 0;
        const titleH = Math.max(58, titleLines.length * lineH(S.body, 1.15) + 22) + valueH;
        const moreH = hidden ? moreBtnH() + 12 : 0;
        const bodyH = Math.max(sideH ? sideH + 10 : 0, titleH + 12 + linesH + moreH);
        // Buttons side by side while every label fits its share of the width; otherwise one per row (Milestone 41e).
        const nB = c.buttons?.length ?? 0;
        const share = nB ? (cw + 16 - 40 - (nB - 1) * 16) / nB : 0;
        const stack = nB > 1 && c.buttons.some((b) => labelW(b.label) > share - 28);
        const btnH = nB ? (stack ? nB * (THEME.button.minH + 14) - 14 : THEME.button.minH) + 24 : 0;
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
          if (face) drawCastFace(ctx, assets, face, { x: r.x + 20 + (LOGO - FACE) / 2, y: r.y + 24 + (c.logo ? LOGO + 16 : 0), w: FACE, h: FACE });
          titleLines.forEach((l, i) => text(ctx, l, r.x + tx, r.y + 22 + i * lineH(S.body, 1.15), { size: S.body, bold: true, maxWidth: tw }));
          if (valueH) text(ctx, String(c.value), r.x + tx, r.y + 22 + titleLines.length * lineH(S.body, 1.15) + 6, { size: S.heading, bold: true, color: c.valueColor ?? C.text, maxWidth: tw });
          let ly = r.y + 22 + titleH;
          for (const l of lines) ly += para(ctx, l.text, r.x + tx, ly, tw, { size: S.small, color: l.color ?? C.text, bold: l.bold }) + 8;
        }
        if (hidden) moreButton(ctx, r.x + tx, r.y + 22 + titleH + linesH + 4, Math.min(tw, 360), c.id, hidden);
        if (c.buttons?.length) {
          const n = c.buttons.length;
          const bw = stack ? r.w - 40 : (r.w - 40 - (n - 1) * 16) / n;
          c.buttons.forEach((b, i) => {
            const br = stack ? { x: r.x + 20, y: r.y + 24 + bodyH + i * (THEME.button.minH + 14), w: bw, h: THEME.button.minH } : { x: r.x + 20 + i * (bw + 16), y: r.y + 24 + bodyH, w: bw, h: THEME.button.minH };
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
    scroll, // Milestone 37: tests scroll the whole list (scrollY, contentHeight, clamp)
    enter() {
      scroll.scrollY = 0;
      moreOpen = new Set();
    },
    scrollToEnd() {
      scroll.contentHeight = pass(null, panelRect().w);
      scroll.scrollY = scroll.maxScroll;
      scroll.clamp();
    },
    // Milestone 41i (tests): open a card's (or the subtitle's) "More" at big text.
    openMore(key) {
      moreOpen.add(key);
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
