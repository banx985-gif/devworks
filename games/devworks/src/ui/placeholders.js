// Stand-ins for DEVWORKS art that is not drawn yet (Milestone 1). Registered as AssetManager fallbacks, so they
// show in the studio and in sheet headers now, and the real files (same keys, final art-list paths) replace them
// with no code change. Each drawer fits itself inside the box it is given, keeping its own shape.
import { THEME, font } from '../../../../core/Theme.js';
import { DESK, WORKER, STUDIO } from '../../data/studio.js';

const C = THEME.color;
const DESK_H = 80 / STUDIO.view.halfW; // desk height, in cell half-widths

export function registerPlaceholders(assets) {
  const { w: fw, h: fh } = DESK.fp;
  assets.setFallback(DESK.art, (ctx, x, y, w, h) => drawDeskBlock(ctx, x, y, w, h, fw, fh, 'Starter Desks'), {
    aspect: (fw + fh) / ((fw + fh) / 2 + DESK_H),
  });
  assets.setFallback(WORKER.art, (ctx, x, y, w, h) => drawPerson(ctx, x, y, w, h, WORKER.name.split(' ')[0]), { aspect: PERSON_ASPECT });
}

// A labelled 3/4 block with a footprint of fw × fh cells: wood top, darker sides, a row of little monitors.
function drawDeskBlock(ctx, x, y, w, h, fw, fh, label) {
  const span = fw + fh;
  const hw = Math.min(w / span, h / (span / 2 + DESK_H)); // one cell's half-width, in box units
  const hh = hw / 2;
  const bh = DESK_H * hw;
  const drawnW = span * hw;
  const ox = x + (w - drawnW) / 2 + fh * hw; // the footprint's back corner
  const oy = y + h - span * hh; // base of the back corner (bottom-aligned)
  const at = (c, r, up = 0) => ({ x: ox + (c - r) * hw, y: oy + (c + r) * hh - up });
  const poly = (pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = Math.max(1.5, hw * 0.05);
  ctx.lineJoin = 'round';
  poly([at(0, fh), at(fw, fh), at(fw, fh, bh), at(0, fh, bh)], '#9A6A44'); // front-left side
  poly([at(fw, 0), at(fw, fh), at(fw, fh, bh), at(fw, 0, bh)], '#86593A'); // front-right side
  poly([at(0, 0, bh), at(fw, 0, bh), at(fw, fh, bh), at(0, fh, bh)], '#D9A56C'); // desk top
  // Monitors along the back half of the desk.
  for (let i = 0; i < fw; i++) {
    const base = at(i + 0.5, 0.55, bh);
    const mw = hw * 0.62;
    const mh = hw * 0.5;
    ctx.fillStyle = '#2A2F3A';
    ctx.fillRect(base.x - mw / 2, base.y - mh - hw * 0.12, mw, mh);
    ctx.fillStyle = C.progress;
    ctx.fillRect(base.x - mw / 2 + mw * 0.1, base.y - mh - hw * 0.12 + mh * 0.14, mw * 0.8, mh * 0.62);
    ctx.fillStyle = '#2A2F3A';
    ctx.fillRect(base.x - hw * 0.04, base.y - hw * 0.12, hw * 0.08, hw * 0.12);
  }
  // Label on the front of the top.
  const lp = at(fw / 2, fh * 0.78, bh);
  const size = Math.max(10, hw * 0.3);
  ctx.font = font(size, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = Math.min(ctx.measureText(label).width, drawnW * 0.8);
  ctx.fillStyle = 'rgba(255,248,236,0.92)';
  ctx.beginPath();
  ctx.roundRect(lp.x - tw / 2 - size * 0.4, lp.y - size * 0.7, tw + size * 0.8, size * 1.4, size * 0.4);
  ctx.fill();
  ctx.fillStyle = C.text;
  ctx.fillText(label, lp.x, lp.y, drawnW * 0.8);
}

// A simple capsule person: head, hoodie body, legs. Feet at the bottom of the box.
const PERSON_ASPECT = 0.46;
function drawPerson(ctx, x, y, w, h, name) {
  const ph = Math.min(h, w / PERSON_ASPECT);
  const pw = ph * PERSON_ASPECT;
  const px = x + (w - pw) / 2;
  const py = y + h - ph;
  const cx = px + pw / 2;
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = Math.max(1.5, ph * 0.018);
  ctx.lineJoin = 'round';
  // Legs
  ctx.fillStyle = '#3B4150';
  ctx.beginPath();
  ctx.roundRect(cx - pw * 0.3, py + ph * 0.66, pw * 0.26, ph * 0.33, pw * 0.1);
  ctx.roundRect(cx + pw * 0.04, py + ph * 0.66, pw * 0.26, ph * 0.33, pw * 0.1);
  ctx.fill();
  ctx.stroke();
  // Body (programmer blue hoodie)
  ctx.fillStyle = '#3D7DD8';
  ctx.beginPath();
  ctx.roundRect(px + pw * 0.06, py + ph * 0.3, pw * 0.88, ph * 0.44, pw * 0.34);
  ctx.fill();
  ctx.stroke();
  // Head + hair
  const r = pw * 0.3;
  const hy = py + r + ph * 0.02;
  ctx.fillStyle = '#F1C8A0';
  ctx.beginPath();
  ctx.arc(cx, hy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3B2A20';
  ctx.beginPath();
  ctx.arc(cx, hy, r, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  // Name on the hoodie
  if (ph > 60) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = font(pw * 0.2, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, cx, py + ph * 0.5, pw * 0.8);
  }
}
