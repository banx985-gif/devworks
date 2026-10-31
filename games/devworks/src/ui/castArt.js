// The series cast's faces on screen (Milestone 40k, data/cast.js): the same rounded portrait frame as the staff
// (setupArt.js drawPortrait, data/portraits.js crops). A face whose file is missing (or still loading) draws nothing,
// so each place keeps the look it had before the cast — callers lay out their text by what castFace() returns.
//   castFace(assets, key)                 → key when its picture is in, else null
//   drawCastFace(ctx, assets, key, r, ring) → true if drawn
//   mentorBadge(assets, key, standIn)     a picture key for core parts that take one icon (Help): the mentor's face
//                                         when it is in, the old icon otherwise
//   DevHintLine                           the core next-step hint line with the mentor's face at its left end
import { THEME, font } from '../../../../core/Theme.js';
import { HintLine } from '../../../../core/ui/HintLine.js';
import { drawPortrait } from './setupArt.js';

const C = THEME.color;

export const castFace = (assets, key) => (key && assets.has(key) ? key : null);

export function drawCastFace(ctx, assets, key, r, ring = null) {
  if (!castFace(assets, key)) return false;
  drawPortrait(ctx, assets, key, r, ring);
  return true;
}

// A stand-in key drawn by a fallback (core AssetManager): never a file of its own.
export function mentorBadge(assets, key, standIn) {
  const badge = `cast_badge_${key}`;
  assets.setFallback(badge, (ctx, x, y, w, h) => {
    if (!drawCastFace(ctx, assets, key, { x, y, w, h })) assets.drawContained(ctx, standIn, { x, y, w, h });
  });
  return badge;
}

export class DevHintLine extends HintLine {
  constructor({ assets, face = () => null, ...opts }) {
    super(opts);
    this.assets = assets;
    this.face = face;
  }

  render(ctx) {
    const key = castFace(this.assets, this.face());
    if (!key) return super.render(ctx); // no face: the core line exactly as before
    const h = this.current;
    const r = this.rect();
    if (!h || !r) return;
    const text = typeof h.text === 'function' ? h.text() : h.text;
    ctx.save();
    ctx.globalAlpha = this.fade;
    ctx.fillStyle = C.panelGold ?? C.panel;
    ctx.strokeStyle = C.action;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fill();
    ctx.stroke();
    const fs = r.h + 16; // the face pokes a little out of the pill, like a speaker's head
    drawPortrait(ctx, this.assets, key, { x: r.x + 4, y: r.y + r.h / 2 - fs / 2, w: fs, h: fs }, C.action);
    ctx.fillStyle = C.text;
    ctx.font = font(THEME.size.small, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`→ ${text}`, r.x + fs + 20, r.y + r.h / 2, r.w - fs - 44);
    ctx.restore();
  }
}
