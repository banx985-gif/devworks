// Title screen (Milestone 5b, bible §6 "Main Menu", spec §7): opens on launch. The DEVWORKS title logo (dev_brand_03;
// the name drawn by code until it has loaded), the
// five start staff, and Continue (the last-played slot), Load / Slots, New Game and Settings (a placeholder sheet).
// Load / Slots shows the four save slots as cards: an occupied slot shows the studio name, "Studio Director <name>",
// the founder's portrait and name, Year / Month, rank, NG+ level (0 for now) and play time, with Play and Delete
// (Delete asks first); an empty one says NEW STUDIO and starts the setup for that slot.
// Milestone 33: an NG+ run says where it came from ("NG+1 from Slot 1"), and a finished run shows its Year-20 grade.
// Layout and tapping share one pass (lay out → draw and/or hit-test), so they can never disagree.
import { THEME, font } from '../../../../core/Theme.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { card, text } from '../../../../core/ui/Kit.js';
import { START_STAFF } from '../../data/staff.js';
import { drawPortrait } from '../ui/setupArt.js';
import { playTimeLabel } from '../systems/studioProfile.js';

const C = THEME.color;
const S = THEME.size;
const BTN_H = 130;

// slots(): [{ index, summary, error }] (null summary = empty); last(): index of the last-played slot or null.
// Milestone 31: crown() → the account crown (Studio Singularity, SEC-X-03): a permanent badge by the logo and on every
// save slot (the Prestige Legends Crown over the Prestige Aura).
// Milestone 35: a slot no copy of which can be read shows why (damaged, or made by a newer version of DEVWORKS) with
// Start new (its copies are kept aside first) and Restore (paste a save exported from the save inspector).
export function createTitleScreen({ layout, assets, slots, last, onContinue, onPlay, onNewGame, onNewInSlot, onDelete, onSettings, crown = () => false, onRestore = null }) {
  const drawCrown = (ctx, x, y, size) => {
    assets.drawContained(ctx, 'dev_vfx_12', { x: x - size * 0.2, y: y - size * 0.2, w: size * 1.4, h: size * 1.4 });
    assets.drawContained(ctx, 'award_trophy_08', { x, y, w: size, h: size });
  };
  let view = 'main';
  let note = null; // a line shown over the slots (e.g. "All 4 slots are full…")

  const lastInfo = () => {
    const i = last();
    const s = i == null ? null : slots()[i];
    return s?.summary ? s : null;
  };

  // --- main -------------------------------------------------------------------------------------------------------
  function mainPass(ctx, tap) {
    const sr = layout.safeRect;
    const cx = sr.x + sr.w / 2;
    let hit = null;
    const box = (r, fn) => {
      if (tap && !hit && hitRect(tap, r)) hit = fn;
    };
    // The whole block (logo, staff, buttons) sits in the middle of the screen, whatever its height.
    const logoH = Math.round(Math.min(420, Math.max(260, sr.h * 0.2))); // the logo art (1209 × 977)
    const headH = logoH + 80;
    const crewH = Math.min(420, Math.max(200, sr.h - headH - 4 * (BTN_H + 30) - 260 - 140));
    const blockH = headH + crewH + 40 + BTN_H + 60 + 3 * (BTN_H + 26);
    let y = sr.y + Math.max(50, (sr.h - blockH) / 2 - 30);
    if (ctx && assets.has?.('dev_brand_03')) {
      const lw = Math.min(sr.w - 80, logoH * assets.aspect('dev_brand_03'));
      const lh = lw / assets.aspect('dev_brand_03');
      assets.draw(ctx, 'dev_brand_03', cx - lw / 2, y + (logoH - lh) / 2, lw, lh);
      if (crown()) drawCrown(ctx, cx + lw / 2 - 60, y - 10, 150); // Milestone 31
      text(ctx, 'Build a game studio, one hit at a time.', cx, y + logoH + 16, { size: S.body, bold: true, color: C.textMuted, align: 'center', maxWidth: sr.w - 80 });
    } else if (ctx) {
      ctx.save();
      ctx.font = font(150, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 18;
      ctx.strokeStyle = C.outline;
      ctx.strokeText('DEVWORKS', cx, y, sr.w - 80);
      ctx.fillStyle = C.action;
      ctx.fillText('DEVWORKS', cx, y, sr.w - 80);
      ctx.restore();
      text(ctx, 'Build a game studio, one hit at a time.', cx, y + 175, { size: S.body, bold: true, color: C.textMuted, align: 'center', maxWidth: sr.w - 80 });
    }
    y += headH;
    // The five start staff, side by side on a soft floor shadow.
    if (ctx) {
      const each = Math.min(190, (sr.w - 80) / 5);
      START_STAFF.forEach((d, i) => {
        const x = cx + (i - 2) * each;
        const w = crewH * assets.aspect(d.art);
        ctx.fillStyle = 'rgba(59,51,44,0.16)';
        ctx.beginPath();
        ctx.ellipse(x, y + crewH - 6, w * 0.34, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        assets.draw(ctx, d.art, x - w / 2, y, w, crewH);
      });
    }
    y += crewH + 40;
    const bw = Math.min(sr.w - 120, 820);
    const bx = cx - bw / 2;
    const li = lastInfo();
    const cont = { x: bx, y, w: bw, h: BTN_H };
    if (ctx) drawButton(ctx, cont, 'Continue', { disabled: !li, font: font(44, true) });
    if (li) box(cont, () => onContinue(li.index));
    y += BTN_H + 8;
    if (ctx) {
      const line = li ? `Slot ${li.index + 1} · ${li.summary.studio} · Year ${li.summary.year}, Month ${li.summary.month}` : 'No studio yet: start a New Game.';
      text(ctx, line, cx, y, { size: S.small, color: C.textMuted, align: 'center', maxWidth: bw });
    }
    y += 52;
    const rows = [
      ['slots', 'Load / Slots', () => showSlots()],
      ['new', 'New Game', () => onNewGame()],
      ['settings', 'Settings', () => onSettings()],
    ];
    for (const [id, label, fn] of rows) {
      const r = { x: bx, y, w: bw, h: BTN_H };
      if (ctx) drawButton(ctx, r, label, { accent: id === 'new' ? C.action : C.progress, font: font(S.button, true) });
      box(r, fn);
      rects[id] = r;
      y += BTN_H + 26;
    }
    rects.continue = cont;
    return hit;
  }

  // --- slots ------------------------------------------------------------------------------------------------------
  const backRect = () => {
    const sr = layout.safeRect;
    return { x: sr.x + 24, y: sr.y + 24, w: 220, h: 110 };
  };
  function slotsPass(ctx, tap) {
    const sr = layout.safeRect;
    let hit = null;
    const box = (r, fn, id) => {
      if (id) rects[id] = r;
      if (tap && !hit && hitRect(tap, r)) hit = fn;
    };
    const br = backRect();
    if (ctx) {
      drawButton(ctx, br, '‹ Back', { accent: C.progress });
      text(ctx, 'Save slots', sr.x + sr.w / 2 + 60, br.y + br.h / 2 - 4, { size: S.title, bold: true, align: 'center', baseline: 'middle' });
    }
    box(br, () => (view = 'main'), 'back');
    let y = br.y + br.h + 24;
    if (note) {
      if (ctx) text(ctx, note, sr.x + sr.w / 2, y, { size: S.body, bold: true, color: C.actionDark, align: 'center', maxWidth: sr.w - 60 });
      y += 60;
    }
    const x = sr.x + 24;
    const w = sr.w - 48;
    const gap = 24;
    const h = Math.min(340, (sr.y + sr.h - 30 - y - gap * 3) / 4);
    const lastIndex = last();
    for (const s of slots()) {
      const r = { x, y, w, h };
      rects[`slot${s.index}`] = r;
      if (s.summary) drawOccupied(ctx, r, s, s.index === lastIndex, box);
      else if (s.error) drawDamaged(ctx, r, s, box);
      else {
        if (ctx) drawEmpty(ctx, r, s);
        box(r, () => onNewInSlot(s.index), `new${s.index}`);
      }
      y += h + gap;
    }
    return hit;
  }

  function drawOccupied(ctx, r, s, isLast, box) {
    const m = s.summary;
    const bw = 210;
    const play = { x: r.x + r.w - bw - 24, y: r.y + r.h / 2 - 120, w: bw, h: 110 };
    const del = { x: play.x, y: play.y + 130, w: bw, h: 110 };
    // Buttons first (they win over the card).
    box(play, () => onPlay(s.index), `play${s.index}`);
    box(del, () => onDelete(s.index), `delete${s.index}`);
    box(r, () => onPlay(s.index), `card${s.index}`);
    if (!ctx) return;
    card(ctx, r, isLast ? 'info' : 'normal');
    ctx.fillStyle = m.colour;
    ctx.beginPath();
    ctx.roundRect(r.x + 10, r.y + 18, 14, r.h - 36, 7);
    ctx.fill();
    const ps = Math.min(r.h - 60, 230);
    const founder = START_STAFF.find((d) => d.id === m.founderId);
    drawPortrait(ctx, assets, founder?.art, { x: r.x + 40, y: r.y + (r.h - ps) / 2 - 14, w: ps, h: ps }, m.colour);
    text(ctx, m.founderName, r.x + 40 + ps / 2, r.y + (r.h + ps) / 2 - 4, { size: S.small, bold: true, align: 'center', maxWidth: ps + 20 });
    const tx = r.x + 40 + ps + 28;
    const tw = play.x - 20 - tx;
    const k = Math.min(1, r.h / 330); // lines close up a little on short screens
    let y = r.y + 22 * k;
    text(ctx, `SLOT ${s.index + 1}${isLast ? ' · LAST PLAYED' : ''}`, tx, y, { size: S.small, bold: true, color: isLast ? C.progress : C.textMuted, maxWidth: tw });
    y += 40 * k;
    text(ctx, m.studio, tx, y, { size: S.heading, bold: true, maxWidth: tw });
    y += 58 * k;
    text(ctx, `Studio Director ${m.director}`, tx, y, { size: S.body, maxWidth: tw });
    y += 50 * k;
    text(ctx, `Year ${m.year} · Month ${m.month} · Rank ${m.rank}`, tx, y, { size: S.body, bold: true, color: C.actionDark, maxWidth: tw });
    y += 50 * k;
    text(ctx, `${m.ngPlus ? `NG+${m.ngPlus}${m.parentSlot != null ? ` from Slot ${m.parentSlot + 1}` : ''}` : 'NG+ 0'}${m.grade ? ` · Grade ${m.grade}` : ''} · Played ${playTimeLabel(m.playSec)}`, tx, y, { size: S.small, color: C.textMuted, maxWidth: tw });
    drawButton(ctx, play, 'Play');
    drawButton(ctx, del, 'Delete', { accent: C.bad });
    if (crown()) drawCrown(ctx, play.x - 110, r.y + 14, 84); // Milestone 31: the account crown
  }

  function drawEmpty(ctx, r, s) {
    ctx.save();
    ctx.fillStyle = C.panelAlt;
    ctx.strokeStyle = C.action;
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, THEME.panel.radius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const cy = r.y + r.h / 2;
    ctx.fillStyle = C.action;
    ctx.beginPath();
    ctx.arc(r.x + 120, cy, 62, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '+', r.x + 120, cy + 4, { size: 96, bold: true, color: C.textOnAction, align: 'center', baseline: 'middle' });
    text(ctx, 'NEW STUDIO', r.x + 220, cy - 34, { size: S.title, bold: true, color: C.actionDark, baseline: 'middle', maxWidth: r.w - 260 });
    text(ctx, `Slot ${s.index + 1} is empty · tap to start`, r.x + 222, cy + 34, { size: S.body, color: C.textMuted, baseline: 'middle', maxWidth: r.w - 260 });
  }

  function drawDamaged(ctx, r, s, box) {
    // The words on top, the three buttons in a row along the bottom (fits the shortest slot card).
    const bh = 110;
    const bw = (r.w - 48 - 32) / 3;
    const by = r.y + r.h - bh - 16;
    const fresh = { x: r.x + 24, y: by, w: bw, h: bh };
    const restore = { x: r.x + 24 + bw + 16, y: by, w: bw, h: bh };
    const del = { x: r.x + 24 + 2 * (bw + 16), y: by, w: bw, h: bh };
    const x = r.x + r.w - 20;
    box(fresh, () => onNewInSlot(s.index), `fresh${s.index}`);
    if (onRestore) box(restore, () => onRestore(s.index, restore), `restore${s.index}`);
    box(del, () => onDelete(s.index), `delete${s.index}`);
    if (!ctx) return;
    card(ctx, r, 'bad');
    const newer = /newer than this game/.test(String(s.error?.message ?? s.error ?? ''));
    const tw = x - r.x - 60;
    text(ctx, newer ? `Slot ${s.index + 1}: saved by a newer DEVWORKS` : `Slot ${s.index + 1}: damaged`, r.x + 40, r.y + 44, { size: S.heading, bold: true, color: C.bad, baseline: 'middle', maxWidth: tw });
    text(ctx, newer ? 'Update the game to play it. It is kept as it is.' : 'Start new or restore. Its copies are kept.', r.x + 40, r.y + 100, { size: S.body, color: C.textMuted, baseline: 'middle', maxWidth: tw });
    drawButton(ctx, fresh, 'Start new', { accent: C.action });
    drawButton(ctx, restore, 'Restore', { accent: C.progress, disabled: !onRestore });
    drawButton(ctx, del, 'Delete', { accent: C.bad });
  }

  const rects = {};
  const pass = (ctx, tap) => {
    for (const k of Object.keys(rects)) delete rects[k]; // only this view's buttons
    return view === 'main' ? mainPass(ctx, tap) : slotsPass(ctx, tap);
  };
  function showSlots(message = null) {
    view = 'slots';
    note = message;
  }

  return {
    get view() {
      return view;
    },
    showSlots,
    enter(params = {}) {
      view = params.view ?? 'main';
      note = params.note ?? null;
    },
    onBack() {
      if (view === 'main') return false;
      view = 'main';
      return true;
    },
    onTap(p) {
      pass(null, p)?.();
    },
    render(ctx) {
      pass(ctx, null);
    },
    // Screen rect of a tappable thing (tests): 'continue', 'slots', 'new', 'settings', 'back', 'play0', 'delete1', 'new2'…
    rectOf(id) {
      pass(null, null);
      return rects[id] ?? null;
    },
  };
}
