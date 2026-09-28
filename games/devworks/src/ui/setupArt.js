// Code-drawn pieces for the title screen, the save slots and New Game setup (Milestone 5b). The spec's four UI frames
// (studio badge frame, founder select frame, dice, save-slot frame) aren't drawn yet, so these stand in for them.
//   drawDice(ctx, cx, cy, size)                     the Random icon
//   drawSign(ctx, r, name, colour)                  the studio sign preview: a plate in the studio colour on a bit of
//                                                   cream wall, the name drawn on it (same look as the sign in the studio)
//   drawPortrait(ctx, assets, art, r, ring)         a staff head-and-shoulders in a rounded frame
//   diceButton(ctx, r, label, opts)                 a button with the dice beside its label
import { THEME, font } from '../../../../core/Theme.js';
import { drawButton } from '../../../../core/ui/Button.js';

const C = THEME.color;
import { portraitFit } from '../../data/portraits.js'; // Milestone 14: the same head crop as every card

export function drawDice(ctx, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = Math.max(3, s * 0.07);
  ctx.beginPath();
  ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.outline;
  const d = s * 0.26;
  for (const [x, y] of [[-d, -d], [d, -d], [0, 0], [-d, d], [d, d]]) {
    ctx.beginPath();
    ctx.arc(x, y, s * 0.085, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function diceButton(ctx, r, label, opts = {}) {
  drawButton(ctx, r, '', opts);
  ctx.save();
  ctx.font = opts.font ?? font(THEME.size.button, true);
  const tw = Math.min(ctx.measureText(label).width, r.w - 110);
  const dice = Math.min(56, r.h * 0.5);
  const x0 = r.x + r.w / 2 - (dice + 16 + tw) / 2;
  const cy = r.y + (r.h - THEME.button.lip) / 2 + 1;
  drawDice(ctx, x0 + dice / 2, cy, dice);
  ctx.fillStyle = opts.disabled ? C.textFaint : C.textOnAction;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x0 + dice + 16, cy, r.w - 110);
  ctx.restore();
}

export function drawSign(ctx, r, name, colour) {
  ctx.save();
  // A bit of the studio's cream wall with its rail, then the plate running along the wall (the studio's angle).
  ctx.fillStyle = '#F6ECD6';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 20);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 20);
  ctx.clip();
  ctx.fillStyle = '#E2CFA9';
  ctx.fillRect(r.x, r.y + r.h * 0.82, r.w, r.h * 0.05);
  const pw = r.w * 0.8;
  const skew = 0.12;
  const ph = Math.min(r.h * 0.46, r.h - 40 - pw * skew);
  ctx.translate(r.x + (r.w - pw) / 2, r.y + (r.h - ph - pw * skew) / 2 - 6);
  ctx.transform(1, skew, 0, 1, 0, 0);
  ctx.fillStyle = colour;
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(0, 0, pw, ph, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(10, 10, pw - 20, ph - 20, 8);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(Math.min(44, ph * 0.42), true);
  ctx.fillText(name || 'Your Studio', pw / 2, ph / 2 + 2, pw - 40);
  ctx.restore();
}

export function drawPortrait(ctx, assets, art, r, ring = null) {
  ctx.save();
  ctx.fillStyle = C.panelAlt;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 22);
  ctx.fill();
  if (ring) {
    ctx.strokeStyle = ring;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.clip();
  if (art) assets.drawCrop(ctx, art, portraitFit(art, (r.w - 12) / (r.h - 8)), { x: r.x + 6, y: r.y + 8, w: r.w - 12, h: r.h - 8 });
  ctx.restore();
}
