// Item art (Milestone 40e). The pictures (items/dev_item_01–24, ui/dev_ui_41 the Studio Store) are in
// docs/DEVWORKS_ITEM_ART_LIST.md for Aaron to draw; until a file exists the game draws a placeholder (the group's colour,
// a simple shape, the item's initials). main.js tries loading every file (AssetManager.loadOptional); once one has
// loaded it is drawn instead, with no code change. The rarity frame is always drawn by code: itemIcon(type, rarity) is
// an image key (type@rarity) whose drawing is the picture (or its placeholder) inside that rarity's frame.
import { THEME } from '../../../../core/Theme.js';
import { ITEM_TYPES, ITEM_RARITIES, ITEM_RULES, itemGroupById } from '../../data/items.js';

const C = THEME.color;
export const ITEM_OPTIONAL_ART = [...ITEM_TYPES.map((t) => [t.id, `assets/images/items/${t.id}.png`]), [ITEM_RULES.storeIcon, `assets/images/ui/${ITEM_RULES.storeIcon}.png`]];
export const itemIcon = (type, rarity) => `${type}@${rarity}`;

function rr(ctx, x, y, w, h, r, fill, stroke = C.outline, lw = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// The placeholder picture of one item type in box (x, y, w, h).
function drawItemPlaceholder(ctx, t, x, y, w, h) {
  const g = itemGroupById(t.group);
  const s = Math.min(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  ctx.fillStyle = g.color;
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = Math.max(2, s * 0.04);
  ctx.beginPath();
  // One shape per group: gear a slab, books a book, snacks a cup, toys a blob, inspiration a disc, trophies a cup.
  if (t.group === 'gear') ctx.roundRect(cx - s * 0.38, cy - s * 0.22, s * 0.76, s * 0.44, s * 0.08);
  else if (t.group === 'books') ctx.roundRect(cx - s * 0.28, cy - s * 0.36, s * 0.56, s * 0.72, s * 0.05);
  else if (t.group === 'snacks') ctx.roundRect(cx - s * 0.26, cy - s * 0.3, s * 0.52, s * 0.6, [s * 0.04, s * 0.04, s * 0.2, s * 0.2]);
  else if (t.group === 'toys') ctx.ellipse(cx, cy, s * 0.34, s * 0.3, 0, 0, Math.PI * 2);
  else if (t.group === 'inspiration') ctx.arc(cx, cy, s * 0.34, 0, Math.PI * 2);
  else {
    ctx.moveTo(cx - s * 0.3, cy - s * 0.32);
    ctx.lineTo(cx + s * 0.3, cy - s * 0.32);
    ctx.lineTo(cx + s * 0.18, cy + s * 0.08);
    ctx.lineTo(cx + s * 0.08, cy + s * 0.08);
    ctx.lineTo(cx + s * 0.08, cy + s * 0.26);
    ctx.lineTo(cx + s * 0.22, cy + s * 0.34);
    ctx.lineTo(cx - s * 0.22, cy + s * 0.34);
    ctx.lineTo(cx - s * 0.08, cy + s * 0.26);
    ctx.lineTo(cx - s * 0.08, cy + s * 0.08);
    ctx.lineTo(cx - s * 0.18, cy + s * 0.08);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  const initials = t.name.split(/[\s+-]+/).filter((wd) => /^[A-Z]/.test(wd)).slice(0, 2).map((wd) => wd[0]).join('');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(s * 0.22)}px ${THEME.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, cx, cy + s * 0.01);
  ctx.restore();
}

// The Studio Store icon placeholder: a supply crate.
function drawStorePlaceholder(ctx, x, y, w, h) {
  const s = Math.min(w, h);
  const bx = x + (w - s * 0.8) / 2;
  const by = y + (h - s * 0.62) / 2;
  rr(ctx, bx, by, s * 0.8, s * 0.62, s * 0.06, '#C8902F', C.outline, Math.max(2, s * 0.04));
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(bx, by + s * 0.2);
  ctx.lineTo(bx + s * 0.8, by + s * 0.2);
  ctx.moveTo(bx + s * 0.4, by + s * 0.2);
  ctx.lineTo(bx + s * 0.4, by + s * 0.62);
  ctx.stroke();
}

// Registers every placeholder (core AssetManager.setFallback): drawn only while the file is missing.
export function registerItemArt(assets) {
  for (const t of ITEM_TYPES) {
    assets.setFallback(t.id, (ctx, x, y, w, h) => drawItemPlaceholder(ctx, t, x, y, w, h));
    for (const [rid, rar] of Object.entries(ITEM_RARITIES)) {
      // type@rarity: the picture (or its placeholder) inside the rarity's frame (never a file: always this drawing).
      assets.setFallback(itemIcon(t.id, rid), (ctx, x, y, w, h) => {
        const s = Math.min(w, h);
        const fx = x + (w - s) / 2;
        const fy = y + (h - s) / 2;
        rr(ctx, fx + s * 0.03, fy + s * 0.03, s * 0.94, s * 0.94, s * 0.16, C.sheet ?? '#FFF6E5', rar.color, Math.max(3, s * (rid === 'common' ? 0.04 : 0.07)));
        const pad = s * 0.14;
        if (assets.has(t.id)) assets.drawContained(ctx, t.id, { x: fx + pad, y: fy + pad, w: s - pad * 2, h: s - pad * 2 });
        else drawItemPlaceholder(ctx, t, fx + pad, fy + pad, s - pad * 2, s - pad * 2);
        if (rid === 'legendary' || rid === 'elite') {
          ctx.fillStyle = rar.color;
          ctx.beginPath();
          ctx.arc(fx + s * 0.84, fy + s * 0.16, s * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }
  assets.setFallback(ITEM_RULES.storeIcon, drawStorePlaceholder);
}
