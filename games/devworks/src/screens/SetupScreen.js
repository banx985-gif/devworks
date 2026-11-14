// New Game setup (Milestone 5b, spec §1, §2, §5, §6), for one save slot. Top to bottom: RANDOMISE ALL, the studio name
// (type it or Random), the Studio Director (type it or Random; shown as "Studio Director <name>"), the studio colour
// (six swatches or Random, with the sign preview drawn by code — it tints the sign only), and the Founding Developer
// (one of the five start staff, with their trait, founder perk and the team they start with). Every field stays
// editable after RANDOMISE ALL. "Review" opens the confirmation panel (spec §6); START STUDIO creates the save.
// Drag scrolls. Layout and tapping share one pass (lay out → draw and/or hit-test), so they can never disagree.
import { THEME, font } from '../../../../core/Theme.js';
import { lineH as lineHeight } from '../../../../core/Theme.js'; // Milestone 41i
import { isBig } from '../ui/bigText.js'; // Milestone 41i: big text on the Fold cover
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { card, text, para } from '../../../../core/ui/Kit.js';
import { ROLES, TRAITS, startStaffById } from '../../data/staff.js';
import { FOUNDERS, STUDIO_COLOURS, STUDIO_NAMES, DIRECTOR_NAMES, NAME_MAX, founderById, colourById } from '../../data/setup.js';
import { drawDice, diceButton, drawSign, drawPortrait, drawDashedCard } from '../ui/setupArt.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;

const pick = (list, not = null) => {
  if (list.length < 2) return list[0];
  let v;
  do v = list[Math.floor(Math.random() * list.length)];
  while (v === not);
  return v;
};

export function createSetupScreen({ layout, assets, textPrompt, onBack, onStart }) {
  let slot = 0;
  let ngPlus = 0; // Milestone 33: an NG+ run's setup (filled in from the finished run; the title says New Game+ n)
  let setup = null; // { studio, director, colour, founder }
  let confirming = false;

  const headerRect = () => {
    const sr = layout.safeRect;
    return { x: sr.x + 24, y: sr.y + 24, w: 220, h: 110 };
  };
  const bottomRect = () => layout.anchor('bottom', layout.safeRect.w - 64, THEME.button.minH + 20, 24);
  const panelRect = () => {
    const h = headerRect();
    const sr = layout.safeRect;
    const y = h.y + h.h + 20;
    return { x: sr.x + 16, y, w: sr.w - 32, h: bottomRect().y - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  const missing = () => [!setup.studio.trim() && 'a studio name', !setup.director.trim() && "the director's name"].filter(Boolean);

  const random = {
    studio: () => (setup.studio = pick(STUDIO_NAMES, setup.studio)),
    director: () => (setup.director = pick(DIRECTOR_NAMES, setup.director)),
    colour: () => (setup.colour = pick(STUDIO_COLOURS, colourById(setup.colour)).id),
    founder: () => (setup.founder = pick(FOUNDERS, founderById(setup.founder)).id),
  };
  const randomiseAll = () => Object.values(random).forEach((fn) => fn());

  // One pass over the scrolling content (content coordinates). Draws when ctx is given, returns the action under
  // `tap`, and records every tappable rect by id in `rects`.
  // Milestone 40p: each section (names, colour + sign, founder) sits on its own cream card with a coloured dashed edge,
  // over the title picture. The cards' sizes come from the last layout pass (pass(null) runs first every frame).
  let sections = {};
  function pass(ctx, tap, rects = null) {
    const w = panelRect().w;
    const cw = w - PAD * 2;
    let y = PAD;
    let hit = null;
    const laid = {};
    let secTop = 0;
    const beginSection = (id, accent) => {
      y += 8;
      secTop = y;
      if (ctx && sections[id]) drawDashedCard(ctx, sections[id], accent);
      y += 26;
    };
    const endSection = (id) => {
      y += 6;
      laid[id] = { x: PAD - 20, y: secTop, w: cw + 40, h: y - secTop };
      y += 30;
    };
    const box = (r, fn, id) => {
      if (rects && id) rects[id] = r;
      if (tap && !hit && hitRect(tap, r)) hit = fn;
    };
    const big = isBig();
    const heading = (label, sub = null) => {
      if (big) {
        // Milestone 41i: the note under the heading, on its own line.
        if (ctx) text(ctx, label, PAD, y, { size: S.heading, bold: true, maxWidth: cw });
        y += lineHeight(S.heading, 1.2);
        if (sub) y += para(ctx, sub, PAD, y, cw, { size: S.small, color: C.textMuted, maxLines: 2 }) + 8;
        y += 8;
        return;
      }
      if (ctx) {
        text(ctx, label, PAD, y, { size: S.heading, bold: true });
        if (sub) text(ctx, sub, PAD + cw, y + 8, { size: S.small, color: C.textMuted, align: 'right', maxWidth: cw * 0.5 });
      }
      y += 66;
    };

    // RANDOMISE ALL.
    const all = { x: PAD, y, w: cw, h: 120 };
    if (ctx) diceButton(ctx, all, 'RANDOMISE ALL', { accent: C.purple, font: font(S.button, true) });
    box(all, randomiseAll, 'randomAll');
    y += 120 + 40;

    // A typed field with a Random button beside it.
    const field = (id, label, value, placeholder, max) => {
      heading(label);
      const fh = big ? Math.max(110, lineHeight(S.heading, 1.5)) : 110;
      const f = big ? { x: PAD, y, w: cw, h: fh } : { x: PAD, y, w: cw - 270, h: 110 };
      const rnd = big ? { x: PAD, y: y + fh + 14, w: cw, h: Math.max(110, lineHeight(S.button, 1.6)) } : { x: PAD + cw - 250, y, w: 250, h: 110 };
      if (ctx) {
        ctx.fillStyle = C.sheet;
        ctx.strokeStyle = value.trim() ? C.outline : C.action;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(f.x, f.y, f.w, f.h, 22);
        ctx.fill();
        ctx.stroke();
        text(ctx, value || placeholder, f.x + 28, f.y + f.h / 2, { size: S.heading, bold: !!value, color: value ? C.text : C.textFaint, baseline: 'middle', maxWidth: f.w - 56 });
        diceButton(ctx, rnd, 'Random', { accent: C.progress });
      }
      box(f, () => edit(id, f, max, placeholder), id);
      box(rnd, random[id], `${id}Random`);
      y += big ? rnd.y + rnd.h - y + 20 : 110 + 20;
    };
    beginSection('names', C.action);
    field('studio', 'Studio name', setup.studio, 'Tap to name your studio', NAME_MAX.studio);
    y += 16;
    field('director', 'Studio Director (you)', setup.director, 'Tap to type your name', NAME_MAX.director);
    if (big) y += para(ctx, `Studio Director ${setup.director.trim() || '…'} — ${setup.studio.trim() || '…'}`, PAD, y, cw, { size: S.body, color: C.actionDark, bold: true, maxLines: 2 }) + 10;
    else {
      if (ctx) text(ctx, `Studio Director ${setup.director.trim() || '…'} — ${setup.studio.trim() || '…'}`, PAD, y, { size: S.body, color: C.actionDark, bold: true, maxWidth: cw });
      y += 50;
    }
    endSection('names');

    // Colour: six swatches + Random, then the sign preview.
    beginSection('colour', colourById(setup.colour).hex);
    heading('Studio colour', 'tints your studio sign');
    const n = STUDIO_COLOURS.length + 1;
    const sw = Math.min(120, (cw - (n - 1) * 16) / n);
    STUDIO_COLOURS.forEach((c, i) => {
      const r = { x: PAD + i * (sw + 16), y, w: sw, h: sw };
      const on = setup.colour === c.id;
      if (ctx) {
        ctx.fillStyle = c.hex;
        ctx.strokeStyle = C.outline;
        ctx.lineWidth = on ? 8 : 4;
        ctx.beginPath();
        ctx.roundRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12, 22);
        ctx.fill();
        ctx.stroke();
        if (on) text(ctx, '✓', r.x + r.w / 2, r.y + r.h / 2 + 2, { size: 56, bold: true, color: '#FFFFFF', align: 'center', baseline: 'middle' });
      }
      box(r, () => (setup.colour = c.id), `colour:${c.id}`);
    });
    const rr = { x: PAD + (n - 1) * (sw + 16), y, w: sw, h: sw };
    if (ctx) {
      drawButton(ctx, rr, '', { accent: C.progress });
      drawDice(ctx, rr.x + rr.w / 2, rr.y + (rr.h - THEME.button.lip) / 2, sw * 0.46);
    }
    box(rr, random.colour, 'colourRandom');
    y += sw + 24;
    if (ctx) drawSign(ctx, { x: PAD, y, w: cw, h: 220 }, setup.studio.trim(), colourById(setup.colour).hex);
    y += 220;
    endSection('colour');

    // Founder: five cards.
    beginSection('founder', C.purple);
    heading('Founding Developer', 'one of five · perk lasts the whole run');
    for (const f of FOUNDERS) {
      const d = startStaffById(f.id);
      const on = setup.founder === f.id;
      const team = f.team.map((id) => startStaffById(id).name.split(' ')[0]).join(', ');
      const PW = big ? 150 : 200; // Milestone 41i: a smaller portrait, the lines by their real heights at big text
      const tw = big ? cw - PW - 60 : cw - 230 - 40;
      const perkH = para(null, f.perk.text, 0, 0, tw, { size: S.small });
      const roleLine = `${ROLES[d.role].name} · ${TRAITS[d.traits[0]].name}`;
      const bigLines = big ? [lineHeight(S.heading, 1.15), para(null, roleLine, 0, 0, tw, { maxLines: 2, lead: 1.2 }) + 6, para(null, f.perk.name, 0, 0, tw, { bold: true, maxLines: 2, lead: 1.2 }) + 6, perkH + 10, para(null, `Starts with: ${team}`, 0, 0, tw, { size: S.small, bold: true, maxLines: 2 })] : null;
      const h = big ? Math.max(PW + 40, 48 + bigLines.reduce((a, b) => a + b, 0)) : Math.max(240, 244 + perkH);
      const r = { x: PAD, y, w: cw, h };
      if (ctx) {
        card(ctx, r, on ? 'selected' : 'normal');
        if (on) {
          ctx.fillStyle = colourById(setup.colour).hex; // Milestone 40p: the Save slots' colour stripe
          ctx.beginPath();
          ctx.roundRect(r.x + 4, r.y + 22, 10, r.h - 44, 5);
          ctx.fill();
        }
        drawPortrait(ctx, assets, d.art, { x: r.x + 20, y: r.y + 20, w: PW, h: PW }, on ? C.good : null);
        const tx = r.x + PW + 50;
        let ty = r.y + 24;
        if (big) {
          text(ctx, d.name, tx, ty, { size: S.heading, bold: true, maxWidth: on ? tw - 60 : tw });
          if (on) text(ctx, '✓', r.x + r.w - 24, ty, { size: S.heading, bold: true, color: C.good, align: 'right' });
          ty += bigLines[0];
          ty += para(ctx, roleLine, tx, ty, tw, { color: C.textMuted, maxLines: 2, lead: 1.2 }) + 6;
          ty += para(ctx, f.perk.name, tx, ty, tw, { bold: true, color: C.purple, maxLines: 2, lead: 1.2 }) + 6;
          ty += para(ctx, f.perk.text, tx, ty, tw, { size: S.small }) + 10;
          para(ctx, `Starts with: ${team}`, tx, ty, tw, { size: S.small, bold: true, color: C.actionDark, maxLines: 2 });
        } else {
        text(ctx, d.name, tx, ty, { size: S.heading, bold: true, maxWidth: tw - 140 });
        if (on) text(ctx, '✓ Founder', r.x + r.w - 24, ty + 6, { size: S.small, bold: true, color: C.good, align: 'right' });
        ty += 56;
        text(ctx, `${ROLES[d.role].name} · ${TRAITS[d.traits[0]].name}`, tx, ty, { size: S.body, color: C.textMuted, maxWidth: tw });
        ty += 48;
        text(ctx, f.perk.name, tx, ty, { size: S.body, bold: true, color: C.purple, maxWidth: tw });
        ty += 46;
        ty += para(ctx, f.perk.text, tx, ty, tw, { size: S.small });
        ty += 10;
        text(ctx, `Starts with: ${team}`, tx, ty, { size: S.small, bold: true, color: C.actionDark, maxWidth: tw });
        }
      }
      box(r, () => (setup.founder = f.id), `founder:${f.id}`);
      y += h + 20;
    }
    y -= 20;
    endSection('founder');
    if (!ctx) sections = laid;
    return { height: y + PAD, hit };
  }

  function edit(id, fieldContent, max, placeholder) {
    const pr = panelRect();
    const rect = { x: pr.x + fieldContent.x, y: pr.y + fieldContent.y - scroll.scrollY, w: fieldContent.w, h: fieldContent.h };
    textPrompt.open({ rect, value: setup[id], maxLength: max, placeholder, onDone: (v) => (setup[id] = v.trim().slice(0, max)) });
  }

  // --- the confirmation panel (spec §6) -------------------------------------------------------------------------
  const confirmLayout = () => {
    const sr = layout.safeRect;
    const w = Math.min(sr.w - 48, 1000);
    const h = Math.min(sr.h - 80, 1150);
    const x = sr.x + (sr.w - w) / 2;
    const y = sr.y + (sr.h - h) / 2;
    const start = { x: x + 40, y: y + h - 40 - 130, w: w - 80, h: 130 };
    const change = { x: x + 40, y: start.y - 30 - 110, w: w - 80, h: 110 };
    return { box: { x, y, w, h }, start, change };
  };
  function drawConfirm(ctx) {
    const L = confirmLayout();
    const b = L.box;
    const sr = layout.safeRect;
    ctx.fillStyle = C.overlay;
    ctx.fillRect(sr.x - 2000, sr.y - 2000, sr.w + 4000, sr.h + 4000);
    card(ctx, b, 'gold');
    const f = founderById(setup.founder);
    const d = startStaffById(f.id);
    const colour = colourById(setup.colour);
    let y = b.y + 36;
    text(ctx, 'Ready to open your studio?', b.x + b.w / 2, y, { size: S.title, bold: true, align: 'center', maxWidth: b.w - 60 });
    y += 90;
    drawSign(ctx, { x: b.x + 40, y, w: b.w - 80, h: 200 }, setup.studio, colour.hex);
    y += 230;
    drawPortrait(ctx, assets, d.art, { x: b.x + 40, y, w: 190, h: 190 }, colour.hex);
    const tx = b.x + 260;
    const tw = b.x + b.w - 40 - tx;
    const rows = [
      ['Studio', setup.studio],
      ['Studio Director', setup.director],
      ['Founder', `${d.name} · ${ROLES[d.role].name}`],
      ['Colour', colour.name],
    ];
    let ry = y;
    for (const [k, v] of rows) {
      text(ctx, k, tx, ry, { size: S.small, color: C.textMuted });
      text(ctx, v, tx + tw, ry - 4, { size: S.body, bold: true, align: 'right', maxWidth: tw - 230 });
      ry += 50;
    }
    y = Math.max(ry, y + 190) + 30;
    text(ctx, `Founder Perk: ${f.perk.name}`, b.x + 40, y, { size: S.body, bold: true, color: C.purple, maxWidth: b.w - 80 });
    y += 50;
    y += para(ctx, f.perk.text, b.x + 40, y, b.w - 80, { size: S.body });
    y += 16;
    text(ctx, `Starting team: ${f.team.map((id) => startStaffById(id).name).join(', ')}`, b.x + 40, y, { size: S.small, bold: true, color: C.actionDark, maxWidth: b.w - 80 });
    drawButton(ctx, L.change, 'Change something', { accent: C.progress });
    drawButton(ctx, L.start, 'START STUDIO', { font: font(48, true) });
  }

  const screen = {
    get setup() {
      return setup;
    },
    get slot() {
      return slot;
    },
    get confirming() {
      return confirming;
    },
    get ready() {
      return missing().length === 0;
    },
    randomiseAll,
    enter(params = {}) {
      slot = params.slot ?? 0;
      confirming = false;
      ngPlus = params.ngPlus ?? 0;
      setup = { studio: '', director: '', colour: STUDIO_COLOURS[0].id, founder: FOUNDERS[0].id, ...(params.prefill ?? {}) };
      scroll.scrollY = 0;
    },
    exit() {
      textPrompt.close();
    },
    onBack() {
      if (confirming) {
        confirming = false;
        return true;
      }
      onBack();
      return true;
    },
    onDragStart(p) {
      if (!confirming) scroll.beginDrag(p);
    },
    onDrag(p) {
      if (!confirming) scroll.drag(p);
    },
    onDragEnd(p) {
      scroll.endDrag(p);
    },
    onUp(p) {
      scroll.endDrag(p);
    },
    onTap(p) {
      if (confirming) {
        const L = confirmLayout();
        if (hitRect(p, L.start)) {
          confirming = false;
          onStart(slot, { ...setup, studio: setup.studio.trim(), director: setup.director.trim() });
        } else if (hitRect(p, L.change) || !hitRect(p, L.box)) confirming = false;
        return;
      }
      if (hitRect(p, headerRect())) return void onBack();
      if (hitRect(p, bottomRect())) {
        if (screen.ready) {
          textPrompt.close();
          confirming = true;
        }
        return;
      }
      if (!scroll.contains(p)) return;
      pass(null, scroll.toContent(p)).hit?.();
    },
    render(ctx) {
      const hr = headerRect();
      const sr = layout.safeRect;
      drawButton(ctx, hr, '‹ Back', { accent: C.progress });
      // Milestone 40p: a cream plate behind the title so it reads over the picture.
      const tcx = sr.x + sr.w / 2 + 60;
      const tw = Math.min(560, sr.x + sr.w - 24 - (hr.x + hr.w + 24));
      drawDashedCard(ctx, { x: tcx - tw / 2, y: hr.y - 4, w: tw, h: hr.h + 8 }, C.action, { dash: [], line: 4 });
      if (isBig()) {
        // Milestone 41i: one line on the plate at big text (the slot number after the name).
        text(ctx, `${ngPlus ? `New Game+ ${ngPlus}` : 'New Studio'} · ${slot + 1}`, sr.x + sr.w / 2 + 60, hr.y + hr.h / 2, { size: S.heading, bold: true, align: 'center', baseline: 'middle', maxWidth: tw - 24 });
      } else {
      text(ctx, ngPlus ? `New Game+ ${ngPlus}` : 'New Studio', sr.x + sr.w / 2 + 60, hr.y + hr.h / 2 - 20, { size: S.title, bold: true, align: 'center', baseline: 'middle' });
      text(ctx, `Save slot ${slot + 1}`, sr.x + sr.w / 2 + 60, hr.y + hr.h / 2 + 34, { size: S.small, color: C.textMuted, align: 'center', baseline: 'middle' });
      }
      // Milestone 40p: no plain panel any more — the sections are cards over the title picture.
      scroll.contentHeight = pass(null, null).height;
      scroll.begin(ctx);
      scroll.contentHeight = pass(ctx, null).height;
      scroll.end(ctx);
      const miss = missing();
      drawButton(ctx, bottomRect(), miss.length ? `Needs ${miss.join(' and ')}` : 'Review and start', { disabled: miss.length > 0, font: font(miss.length ? (isBig() ? S.small : S.body) : S.button, true) });
      if (confirming) drawConfirm(ctx);
    },
  };
  // Screen rect of a tappable thing (tests): 'randomAll', 'studio', 'studioRandom', 'colour:cyan', 'founder:ART01'…
  // plus 'review', 'start', 'change'.
  screen.rectOf = (what) => {
    if (what === 'review') return bottomRect();
    if (what === 'start' || what === 'change') return confirmLayout()[what];
    const rects = {};
    scroll.contentHeight = pass(null, null, rects).height;
    const r = rects[what];
    const pr = panelRect();
    return r ? { x: pr.x + r.x, y: pr.y + r.y - scroll.scrollY, w: r.w, h: r.h } : null;
  };
  screen.scrollTo = (what) => {
    const rects = {};
    scroll.contentHeight = pass(null, null, rects).height;
    const r = rects[what];
    if (r) {
      scroll.scrollY = r.y - 40;
      scroll.clamp();
    }
  };
  return screen;
}
