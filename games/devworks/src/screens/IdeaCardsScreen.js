// Idea cards (Milestone 40b, Aaron's play-feel notes §1): a recipe slot opens as a grid of picture cards, not a list.
// Open cards pick; locked ones are greyed with their reason; the one used last is marked "Last"; the chosen one is
// ticked; a card the recipe so far can't take says what it needs. Tapping a card fills the info strip at the bottom
// (src/ui/ideaInfo.js: fit with your genre — "?" until that pairing has shipped — who is good at it, how hard it is,
// what it plays to) and the big Choose button puts it in the recipe and goes back to New Game.
import { THEME, font } from '../../../../core/Theme.js';
import { drawButton, drawPadlock, hitRect } from '../../../../core/ui/Button.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text } from '../../../../core/ui/Kit.js';
import { FAMILIES, elementsOf, needsProblem } from '../../data/elements.js';
import { ideaInfo } from '../ui/ideaInfo.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 24;
const GAP = 20;
const STRIP_H = 450;
const FIT_COL = { Great: C.good, Good: C.progress, OK: C.actionDark, Poor: C.bad, '?': C.textMuted };

export function createIdeaCardsScreen({ layout, assets, topBar, recipe = () => ({}), isUnlocked, lockReason = () => 'Locked', lastUsed = () => null, shipped = () => false, onChoose }) {
  let family = 'genre';
  let selected = null;
  let rects = []; // content-space { id, r }
  const fam = () => FAMILIES.find((f) => f.id === family) ?? FAMILIES[0];
  const area = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const gridRect = () => {
    const a = area();
    return { x: a.x, y: a.y + 110, w: a.w, h: a.h - 110 - STRIP_H - 16 };
  };
  const stripRect = () => {
    const a = area();
    return { x: a.x, y: a.y + a.h - STRIP_H, w: a.w, h: STRIP_H };
  };
  const chooseRect = () => {
    const s = stripRect();
    return { x: s.x + s.w - 24 - Math.min(380, s.w * 0.36), y: s.y + s.h - 24 - 110, w: Math.min(380, s.w * 0.36), h: 110 };
  };
  const scroll = new ScrollPanel({ getRect: gridRect });
  const list = () =>
    [...elementsOf(family)].sort((a, b) => isUnlocked(b.id) - isUnlocked(a.id)).map((e) => {
      const open = isUnlocked(e.id);
      const clash = open ? needsProblem(e, { ...recipe(), [family]: e.id }) : null;
      return { e, open, clash, why: open ? null : lockReason(e.id) };
    });
  const pickable = (x) => x && x.open && !x.clash;

  function drawGrid(ctx, w) {
    const cols = Math.max(3, Math.floor((w + GAP) / 300));
    const cw = (w - GAP * (cols - 1)) / cols;
    const ch = cw + 96;
    const now = recipe()[family];
    const last = lastUsed(family);
    rects = [];
    list().forEach((x, i) => {
      const r = { x: (i % cols) * (cw + GAP), y: Math.floor(i / cols) * (ch + GAP), w: cw, h: ch };
      rects.push({ id: x.e.id, r });
      const sel = selected === x.e.id;
      ctx.save();
      ctx.fillStyle = sel ? '#FFF1C9' : x.open ? C.panel : '#E9E1D3';
      ctx.strokeStyle = sel ? C.action : C.outline;
      ctx.lineWidth = sel ? 8 : 4;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      ctx.stroke();
      if (!x.open) ctx.globalAlpha = 0.35;
      assets.drawContained(ctx, x.e.art, { x: r.x + 16, y: r.y + 14, w: r.w - 32, h: r.w - 40 });
      ctx.globalAlpha = 1;
      text(ctx, x.e.name, r.x + r.w / 2, r.y + r.w - 10, { size: S.body, bold: true, align: 'center', color: x.open ? C.text : C.textFaint, maxWidth: r.w - 20 });
      const tag = !x.open ? x.why : now === x.e.id ? '✓ Chosen' : x.clash ? `Needs ${x.clash.split(' needs ')[1] ?? 'more'}` : null;
      if (tag) text(ctx, tag, r.x + r.w / 2, r.y + r.w + 36, { size: S.small, bold: true, align: 'center', color: !x.open || x.clash ? C.bad : C.good, maxWidth: r.w - 20 });
      if (!x.open) drawPadlock(ctx, r.x + r.w - 40, r.y + 44, 32, C.textFaint);
      if (last === x.e.id) {
        ctx.fillStyle = C.purple;
        ctx.beginPath();
        ctx.roundRect(r.x + 12, r.y + 12, 104, 50, 25);
        ctx.fill();
        text(ctx, 'Last', r.x + 64, r.y + 37, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: '#FFFFFF' });
      }
      ctx.restore();
    });
    return Math.ceil(rects.length / cols) * (ch + GAP);
  }

  function drawStrip(ctx) {
    const s = stripRect();
    ctx.save();
    ctx.fillStyle = C.panel;
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = THEME.panel.line;
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, s.h, THEME.panel.radius);
    ctx.fill();
    ctx.stroke();
    const x = list().find((q) => q.e.id === selected);
    const tw = s.w - 48;
    if (!x) {
      text(ctx, `Tap a card to see how it plays. ${fam().name}: pick one for this game.`, s.x + 24, s.y + 30, { size: S.body, color: C.textMuted, maxWidth: tw });
    } else {
      const info = ideaInfo(x.e, { genre: recipe().genre ?? null, shipped });
      text(ctx, x.e.name, s.x + 24, s.y + 24, { size: S.heading, bold: true, maxWidth: tw });
      let y = s.y + 90;
      const row = (label, value, color = C.text) => {
        text(ctx, label, s.x + 24, y, { size: S.small, bold: true, color: C.textMuted });
        text(ctx, value, s.x + 24 + 230, y, { size: S.small, bold: true, color, maxWidth: s.w - 24 - 230 - 24 });
        y += 50;
      };
      if (info.fit.grade) row('Fit', `${info.fit.grade === '?' ? '?' : info.fit.grade} — ${info.fit.line}`, FIT_COL[info.fit.grade] ?? C.text);
      else row('Fit', info.fit.line);
      row('Who', info.who);
      row('Difficulty', info.difficulty, info.difficulty === 'Hard' ? C.bad : info.difficulty === 'Medium' ? C.actionDark : C.good);
      row('Plays to', info.playsTo);
      if (!x.open) text(ctx, x.why, s.x + 24, y, { size: S.small, bold: true, color: C.bad, maxWidth: chooseRect().x - s.x - 40 });
      else if (x.clash) text(ctx, x.clash, s.x + 24, y, { size: S.small, bold: true, color: C.bad, maxWidth: chooseRect().x - s.x - 40 });
    }
    const ok = pickable(x);
    drawButton(ctx, chooseRect(), recipe()[family] === selected && ok ? '✓ Chosen' : 'Choose', { accent: C.good, disabled: !ok, font: font(S.button, true) });
    ctx.restore();
  }

  return {
    get family() {
      return family;
    },
    get selected() {
      return selected;
    },
    enter(params) {
      family = params?.family ?? 'genre';
      selected = recipe()[family] ?? null;
      scroll.scrollY = 0;
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    onTap(p) {
      if (topBar.handleTap(p)) return;
      if (hitRect(p, chooseRect())) {
        const x = list().find((q) => q.e.id === selected);
        if (pickable(x)) onChoose(family, selected);
        return;
      }
      if (!scroll.contains(p)) return;
      const c = scroll.toContent(p);
      const hit = rects.find((x) => hitRect(c, x.r));
      if (hit) selected = hit.id;
    },
    // Tests / the guide: a card's screen rect, the Choose button.
    cardRect(id) {
      const x = rects.find((q) => q.id === id);
      const g = gridRect();
      return x ? { x: g.x + x.r.x, y: g.y + x.r.y - scroll.scrollY, w: x.r.w, h: x.r.h } : null;
    },
    scrollTo(id) {
      const x = rects.find((q) => q.id === id);
      if (x) {
        scroll.scrollY = x.r.y - 20;
        scroll.clamp();
      }
    },
    chooseRect,
    // Tests: the cards in grid order (id, open, why).
    cards: () => list().map((x) => ({ id: x.e.id, open: x.open, why: x.why, clash: x.clash })),
    // Tests: the info strip of the selected card.
    info() {
      const x = list().find((q) => q.e.id === selected);
      return x ? ideaInfo(x.e, { genre: recipe().genre ?? null, shipped }) : null;
    },
    render(ctx) {
      const a = area();
      text(ctx, `Pick a ${fam().name}`, a.x + 8, a.y + 10, { size: S.title, bold: true, maxWidth: a.w - 16 });
      const g = gridRect();
      scroll.begin(ctx);
      scroll.contentHeight = drawGrid(ctx, g.w);
      scroll.end(ctx);
      drawStrip(ctx);
      topBar.render(ctx);
    },
  };
}
