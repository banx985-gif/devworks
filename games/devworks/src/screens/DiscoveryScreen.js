// Discovery Archive (Milestone 15, bible §15), from Research and the Catalogue: every combo found in any run (the
// account's archive), each with its name, the recipe it was found with (the element icons), what it gives, and where
// it was found (this studio, or an earlier one). Combos nobody has found yet stay hidden — only the count shows.
// Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text, para, wrapLines } from '../../../../core/ui/Kit.js';
import { FAMILIES, elementById } from '../../data/elements.js';
import { COMBOS, rewardText } from '../../data/combos.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const HEAD_H = 200;
const ICON = 100;

export function createDiscoveryScreen({ layout, assets, combos, topBar }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  // A card's height: title row, icons, the reward text (wrapped), where it was found.
  const cardH = (f, w) => 90 + ICON + 30 + wrapLines(rewardText(f.combo.reward), w - 40, S.small).length * S.small * 1.3 + 70;

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    const list = combos.found();
    text(ctx, 'Discovery Archive', PAD, PAD, { size: S.title, bold: true });
    text(ctx, list.length ? `${list.length} combo${list.length === 1 ? '' : 's'} found · more are still secret` : 'No combos found yet. Some recipes just work together.', PAD, PAD + 84, { size: S.body, color: C.textMuted, maxWidth: cw }); // Milestone 32: never a total of unrevealed items
    let y = HEAD_H;
    for (const f of list) {
      const h = cardH(f, cw + 16);
      const r = { x: PAD - 8, y, w: cw + 16, h };
      ctx.fillStyle = f.inRun ? C.panelInfo : C.sheet;
      ctx.strokeStyle = f.inRun ? C.progress : C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      ctx.stroke();
      text(ctx, f.combo.name, r.x + 20, r.y + 22, { size: S.heading, bold: true, maxWidth: r.w - 40 });
      // The recipe it was found with: the families the combo uses first, then the rest faded.
      const recipe = f.info.recipe ?? {};
      const used = FAMILIES.filter((fam) => f.combo.need[fam.id]);
      const other = FAMILIES.filter((fam) => !f.combo.need[fam.id]);
      const n = FAMILIES.length;
      const gap = Math.min(16, (r.w - 40 - n * ICON) / (n - 1));
      const size = gap < 4 ? (r.w - 40 - (n - 1) * 8) / n : ICON;
      [...used, ...other].forEach((fam, i) => {
        const el = elementById(recipe[fam.id]);
        const ir = { x: r.x + 20 + i * (size + Math.max(8, gap)), y: r.y + 90, w: size, h: size };
        ctx.globalAlpha = f.combo.need[fam.id] ? 1 : 0.35;
        ctx.fillStyle = C.panelAlt;
        ctx.beginPath();
        ctx.roundRect(ir.x, ir.y, ir.w, ir.h, 18);
        ctx.fill();
        if (el) assets.drawContained(ctx, el.art, { x: ir.x + 6, y: ir.y + 6, w: ir.w - 12, h: ir.h - 12 });
        ctx.globalAlpha = 1;
      });
      let ty = r.y + 90 + size + 24;
      ty += para(ctx, rewardText(f.combo.reward), r.x + 20, ty, r.w - 40, { size: S.small, color: C.actionDark, bold: true });
      text(ctx, f.inRun ? `Found by this studio${f.info.title ? ` with "${f.info.title}"` : ''}` : `Found by an earlier studio · ${f.runs} run${f.runs === 1 ? '' : 's'}`, r.x + 20, ty + 14, { size: S.small, color: C.textMuted, maxWidth: r.w - 40 });
      y += h + 20;
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
