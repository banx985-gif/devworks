// Drawing bits shared by the active project view and the "Game finished!" result (Milestone 3):
// a cover with the title drawn over it in code (never baked into the art), a row of recipe icons, and the seven
// output bars (0–100) with the bug count.
import { THEME, font } from '../../../../core/Theme.js';
import { text } from '../../../../core/ui/Kit.js';
import { FAMILIES, elementById } from '../../data/elements.js';
import { OUTPUTS } from '../../data/projects.js';

const C = THEME.color;
const S = THEME.size;

// Cover art in r (cropped to fill), a dark band at the bottom with the title in it.
export function drawCover(ctx, assets, key, title, r) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 20);
  ctx.clip();
  const a = assets.aspect(key);
  const fit = r.w / r.h > a ? { w: r.w, h: r.w / a } : { w: r.h * a, h: r.h };
  assets.draw(ctx, key, r.x + (r.w - fit.w) / 2, r.y + (r.h - fit.h) / 2, fit.w, fit.h);
  const bandH = Math.max(70, r.h * 0.22);
  const g = ctx.createLinearGradient(0, r.y + r.h - bandH * 1.4, 0, r.y + r.h);
  g.addColorStop(0, 'rgba(20,18,28,0)');
  g.addColorStop(0.35, 'rgba(20,18,28,0.72)');
  g.addColorStop(1, 'rgba(20,18,28,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y + r.h - bandH * 1.4, r.w, bandH * 1.4);
  const size = Math.min(S.title, Math.max(26, r.w / 8));
  ctx.font = font(size, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = size / 7;
  ctx.strokeStyle = 'rgba(20,18,28,0.9)';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, r.x + r.w / 2, r.y + r.h - bandH / 2, r.w - 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(title, r.x + r.w / 2, r.y + r.h - bandH / 2, r.w - 24);
  ctx.restore();
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 20);
  ctx.stroke();
}

// The six recipe icons in a row, each size × size, from x; returns the row's width.
export function drawRecipeIcons(ctx, assets, recipe, x, y, size, gap = 12) {
  FAMILIES.forEach((f, i) => {
    const el = elementById(recipe[f.id]);
    const r = { x: x + i * (size + gap), y, w: size, h: size };
    ctx.fillStyle = C.panelAlt;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, size * 0.18);
    ctx.fill();
    if (el) assets.drawContained(ctx, el.art, { x: r.x + 6, y: r.y + 6, w: r.w - 12, h: r.h - 12 });
  });
  return FAMILIES.length * (size + gap) - gap;
}

// Seven output bars and a bug line in a column w wide from (x, y); rowH per bar. Returns the height used.
export function drawOutputs(ctx, outputs, bugs, x, y, w, { rowH = 58, labelW = 250, size = S.body } = {}) {
  let yy = y;
  for (const o of OUTPUTS) {
    const v = outputs[o.key] ?? 0;
    text(ctx, o.label, x, yy + rowH / 2, { size: size - 4, bold: true, baseline: 'middle', color: C.textMuted });
    const bx = x + labelW;
    const bw = w - labelW - 90;
    ctx.fillStyle = C.track;
    ctx.beginPath();
    ctx.roundRect(bx, yy + rowH / 2 - 13, bw, 26, 13);
    ctx.fill();
    ctx.fillStyle = v >= 70 ? C.good : v >= 40 ? C.progress : C.warn;
    ctx.beginPath();
    ctx.roundRect(bx, yy + rowH / 2 - 13, Math.max(26, (bw * v) / 100), 26, 13);
    ctx.fill();
    text(ctx, String(v), x + w, yy + rowH / 2, { size, bold: true, align: 'right', baseline: 'middle' });
    yy += rowH;
  }
  text(ctx, 'BUGS', x, yy + rowH / 2, { size: size - 4, bold: true, baseline: 'middle', color: C.textMuted });
  text(ctx, String(bugs), x + labelW, yy + rowH / 2, { size, bold: true, baseline: 'middle', color: bugs ? C.bad : C.good });
  return yy + rowH - y;
}
