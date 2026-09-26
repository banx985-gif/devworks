// Stand-ins for DEVWORKS art that is not drawn yet, or a file that fails to load (Milestones 1–2). Registered as
// AssetManager fallbacks, so they show wherever the image would (studio, sheets, cards), and the real files (same
// keys, final art-list paths) replace them with no code change. Each drawer fits itself inside its box.
// Also the small code-drawn icons: Credits and Studio Tokens (Batch 6 will draw them) and the tired / low-Morale
// status icons over a worker's head.
import { THEME, font } from '../../../../core/Theme.js';
import { STATIONS, STUDIO } from '../../data/studio.js';
import { STARTERS } from '../../data/staff.js';
import { TOP_ICONS, STATUS_ICONS } from '../../data/home.js';
import { ELEMENTS } from '../../data/elements.js';
import { COVER_BY_GENRE, DEFAULT_COVER } from '../../data/covers.js';

const C = THEME.color;
const DESK_H = 80 / STUDIO.view.halfW; // block height, in cell half-widths

export function registerPlaceholders(assets) {
  for (const st of STATIONS) {
    const { w: fw, h: fh } = st.fp;
    assets.setFallback(st.art, (ctx, x, y, w, h) => drawDeskBlock(ctx, x, y, w, h, fw, fh, st.name), { aspect: (fw + fh) / ((fw + fh) / 2 + DESK_H) });
  }
  for (const def of STARTERS) assets.setFallback(def.art, (ctx, x, y, w, h) => drawPerson(ctx, x, y, w, h, def.name.split(' ')[0]), { aspect: PERSON_ASPECT });
  assets.setFallback(TOP_ICONS.credits, drawCoin);
  assets.setFallback(TOP_ICONS.tokens, drawGem);
  assets.setFallback(STATUS_ICONS.tired, drawTired);
  assets.setFallback(STATUS_ICONS.stressed, drawStressed);
  // Element icons (two are held back for a redraw, and research may add art later): a lettered tile per family.
  for (const e of ELEMENTS) assets.setFallback(e.art, (ctx, x, y, w, h) => drawElementTile(ctx, x, y, w, h, e));
  // Covers: a plain gradient card (the title is drawn over any cover in code anyway).
  for (const key of new Set([...Object.values(COVER_BY_GENRE), DEFAULT_COVER])) assets.setFallback(key, drawCoverCard, { aspect: 336 / 483 });
}

const FAMILY_COLOR = { genre: '#F2862B', theme: '#7650C4', gameplay: '#1597BF', technology: '#3B4150', artDirection: '#D8352A', feature: '#2E8B57' };

// Element stand-in: a rounded tile in its family's colour with the element's initials.
function drawElementTile(ctx, x, y, w, h, e) {
  const { cx, cy, s } = square(x, y, w, h);
  const r = s * 0.44;
  ctx.fillStyle = FAMILY_COLOR[e.family] ?? C.progress;
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.35);
  ctx.fill();
  ctx.stroke();
  const initials = e.name.split(/[s-]+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = font(s * 0.36, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, cx, cy + s * 0.02);
}

function drawCoverCard(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#7650C4');
  g.addColorStop(1, '#1597BF');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// --- small icons (square box; each draws inside the largest centred square) --------------------------------
const square = (x, y, w, h) => {
  const s = Math.min(w, h);
  return { cx: x + w / 2, cy: y + h / 2, s };
};

// Credits: a gold coin with a "C".
function drawCoin(ctx, x, y, w, h) {
  const { cx, cy, s } = square(x, y, w, h);
  ctx.fillStyle = '#F2B233';
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#B87A00';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#8A5A00';
  ctx.font = font(s * 0.42, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', cx, cy + s * 0.02);
}

// Studio Tokens: a purple gem.
function drawGem(ctx, x, y, w, h) {
  const { cx, cy, s } = square(x, y, w, h);
  const t = cy - s * 0.3;
  const m = cy - s * 0.08;
  const b = cy + s * 0.42;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#9B6BE0';
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.24, t);
  ctx.lineTo(cx + s * 0.24, t);
  ctx.lineTo(cx + s * 0.44, m);
  ctx.lineTo(cx, b);
  ctx.lineTo(cx - s * 0.44, m);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, t + s * 0.05);
  ctx.lineTo(cx, t + s * 0.05);
  ctx.lineTo(cx - s * 0.08, m);
  ctx.lineTo(cx - s * 0.34, m);
  ctx.closePath();
  ctx.fill();
}

// Tired (low Energy): an almost empty battery on a warm badge.
function drawTired(ctx, x, y, w, h) {
  const { cx, cy, s } = square(x, y, w, h);
  badge(ctx, cx, cy, s, C.warn);
  const bw = s * 0.5;
  const bh = s * 0.28;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = s * 0.06;
  ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx + bw / 2, cy - bh * 0.22, s * 0.06, bh * 0.44);
  ctx.fillStyle = C.bad;
  ctx.fillRect(cx - bw / 2 + s * 0.05, cy - bh / 2 + s * 0.05, bw * 0.2, bh - s * 0.1);
}

// Low Morale: a small rain cloud on a blue badge.
function drawStressed(ctx, x, y, w, h) {
  const { cx, cy, s } = square(x, y, w, h);
  badge(ctx, cx, cy, s, C.purple);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - s * 0.1, cy - s * 0.05, s * 0.13, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.08, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.2, cy - s * 0.02, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - s * 0.22, cy - s * 0.04, s * 0.44, s * 0.1);
  ctx.strokeStyle = '#BFE3F0';
  ctx.lineWidth = s * 0.05;
  ctx.lineCap = 'round';
  for (const dx of [-0.12, 0.02, 0.16]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * dx, cy + s * 0.12);
    ctx.lineTo(cx + s * (dx - 0.04), cy + s * 0.24);
    ctx.stroke();
  }
}

function badge(ctx, cx, cy, s, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
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
