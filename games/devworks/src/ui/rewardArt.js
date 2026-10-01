// Reward drop and request art (Milestone 40c). The real pictures (dev_reward_11 gift box, dev_reward_12 chest,
// dev_ui_40 request letter) are asked for in DEVWORKS_EASY_TO_PLAY_NOTES.md; until the files exist these are drawn by
// code. main.js tries loading the files (AssetManager.loadOptional); once one has loaded it is drawn instead.
import { THEME } from '../../../../core/Theme.js';
import { REWARDS } from '../../data/rewards.js';
import { REQUESTS } from '../../data/requests.js';

const C = THEME.color;
export const OPTIONAL_ART = [
  [REWARDS.art.small, `assets/images/rewards/${REWARDS.art.small}.png`],
  [REWARDS.art.big, `assets/images/rewards/${REWARDS.art.big}.png`],
  [REQUESTS.icon, `assets/images/ui/${REQUESTS.icon}.png`],
];

function rr(ctx, x, y, w, h, r, fill, stroke = C.outline, lw = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

// A gift box (kind 'small') or a chest ('big') in box r. open: 0–1 (the lid lifts).
export function drawRewardBox(ctx, assets, kind, r, open = 0) {
  const key = REWARDS.art[kind];
  if (assets?.has?.(key)) {
    assets.drawContained(ctx, key, r);
    return;
  }
  const s = Math.min(r.w, r.h);
  const x = r.x + (r.w - s) / 2;
  const y = r.y + (r.h - s) / 2;
  const lw = Math.max(2, s * 0.05);
  ctx.save();
  if (kind === 'big') {
    // A chest: a brown body, a domed lid, a gold band and lock.
    rr(ctx, x + s * 0.08, y + s * 0.42, s * 0.84, s * 0.5, s * 0.08, '#8B5A2B', C.outline, lw);
    ctx.save();
    ctx.translate(x + s * 0.08, y + s * 0.44);
    ctx.rotate(-open * 0.6);
    rr(ctx, 0, -s * 0.3, s * 0.84, s * 0.32, s * 0.16, '#A86B34', C.outline, lw);
    ctx.restore();
    rr(ctx, x + s * 0.08, y + s * 0.5, s * 0.84, s * 0.1, s * 0.03, '#F2C14E', C.outline, lw * 0.7);
    rr(ctx, x + s * 0.42, y + s * 0.46, s * 0.16, s * 0.2, s * 0.04, '#F2C14E', C.outline, lw * 0.7);
    if (open > 0.2) {
      ctx.globalAlpha = Math.min(1, open);
      ctx.fillStyle = '#FFE38A';
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s * 0.42, s * 0.18 * open, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // A gift box: a coloured box, a ribbon cross and a bow.
    rr(ctx, x + s * 0.14, y + s * 0.4, s * 0.72, s * 0.52, s * 0.06, '#7E5CD6', C.outline, lw);
    ctx.save();
    ctx.translate(0, -open * s * 0.25);
    rr(ctx, x + s * 0.08, y + s * 0.28, s * 0.84, s * 0.16, s * 0.05, '#9B7BEA', C.outline, lw);
    ctx.fillStyle = '#F2C14E';
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = lw * 0.8;
    for (const dx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + s / 2 + dx * s * 0.12, y + s * 0.22, s * 0.13, s * 0.08, dx * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#F2C14E';
    ctx.fillRect(x + s * 0.45, y + s * 0.4, s * 0.1, s * 0.52);
  }
  ctx.restore();
}

// The request letter (Create → Requests).
export function drawRequestIcon(ctx, assets, r) {
  if (assets?.has?.(REQUESTS.icon)) {
    assets.drawContained(ctx, REQUESTS.icon, r);
    return;
  }
  const s = Math.min(r.w, r.h);
  const x = r.x + (r.w - s) / 2;
  const y = r.y + (r.h - s) / 2;
  const lw = Math.max(2, s * 0.05);
  ctx.save();
  rr(ctx, x + s * 0.1, y + s * 0.25, s * 0.8, s * 0.55, s * 0.06, '#FFF4D6', C.outline, lw);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.1, y + s * 0.27);
  ctx.lineTo(x + s * 0.5, y + s * 0.58);
  ctx.lineTo(x + s * 0.9, y + s * 0.27);
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.fillStyle = '#E4573D';
  ctx.beginPath();
  ctx.arc(x + s * 0.5, y + s * 0.58, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
