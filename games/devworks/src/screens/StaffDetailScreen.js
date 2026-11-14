// Staff detail (Milestone 2), from a roster card or by tapping a worker in the studio: portrait, name, role, tier,
// level / XP, salary, what they are doing now, Energy / Morale, the five work stats (bar against the tier's cap;
// the role's main stat is marked) and traits with what they do. Drag scrolls when it does not fit.
// Milestone 5b: the Founding Developer gets their flag, founder perk and history (years, games credited) at the end.
// Milestone 13: the career (continuous employment, games credited, genres and themes, franchises, awards, trainings,
// mentoring links) and the actions: Train, Mentor (Elite and up), Let go (asks first).
import { THEME, font, lineH, textScale } from '../../../../core/Theme.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { elementById } from '../../data/elements.js';
import { text, para, wrapLines } from '../../../../core/ui/Kit.js';
import { WORK_STATE } from '../../data/studio.js';
import { STATS, ROLES, TIERS, TRAITS, staffDefById } from '../../data/staff.js';
import { STATUS_ICONS } from '../../data/home.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 36;
// Milestone 41i (big text on the Fold cover): at "Larger" (1.8×) the screen goes one item per row — short labels, the
// numbers bigger than the words, the long career behind a "More" tap. Normal and Large keep the old layout exactly.
export const BIG_TEXT = 1.6;
const isBig = () => textScale() >= BIG_TEXT;
const L = (base, size = S.body, lead = 1.3) => Math.max(base, lineH(size, lead)); // a row height that grows with the text

// history(id) → { crunchDays, crunches } (Milestone 7: crunch exposure) or null.
// career(id) → the record from recruitment.careerOf (Milestone 13) or null; actions(id) → [{ id, label, sub, disabled,
// accent, onTap }]; dateLabel(day) for "since".
export function createStaffDetailScreen({ layout, assets, world, topBar, founderInfo = () => null, history = () => null, career = () => null, actions = () => [], dateLabel = (d) => `day ${d}`, nameOf = (id) => id, advanced = () => false, legacy = () => false, itemsInfo = () => null }) {
  let buttons = []; // screen rects of this frame's action buttons
  let id = null;
  let scrollY = 0;
  let drag = null;
  let contentH = 0;
  let more = false; // Milestone 41i: the career's full list (big text)

  const areaRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 20;
    return { x: sr.x + 24, y, w: sr.w - 48, h: sr.y + sr.h - 24 - y };
  };
  const maxScroll = () => Math.max(0, contentH - areaRect().h);

  function bar(ctx, x, y, w, h, frac, color) {
    ctx.fillStyle = C.track;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    const f = Math.min(1, Math.max(0, frac));
    if (f > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(h, w * f), h, h / 2);
      ctx.fill();
    }
  }

  function heading(ctx, label, x, y) {
    text(ctx, label, x, y, { size: S.heading, bold: true });
    return y + L(64, S.heading, 1.25);
  }

  // Draws everything from the top of the content (y0) and returns the content height.
  function drawContent(ctx, r, y0, w) {
    const s = w.staff;
    const sys = world.staffSystem;
    const x = r.x + PAD;
    const cw = r.w - PAD * 2;
    let y = y0 + PAD;

    // Header: portrait left, facts right.
    const big = isBig();
    const pr = big ? { x, y, w: 230, h: 320 } : { x, y, w: 300, h: 420 };
    ctx.fillStyle = C.panelAlt;
    ctx.beginPath();
    ctx.roundRect(pr.x, pr.y, pr.w, pr.h, 24);
    ctx.fill();
    assets.drawContained(ctx, s.art, { x: pr.x + 12, y: pr.y + 12, w: pr.w - 24, h: pr.h - 24 }, 'bottom');
    const tx = pr.x + pr.w + 32;
    const tw = x + cw - tx;
    let ty = pr.y;
    const godTitle = staffDefById(s.id)?.title; // Milestone 40g: a Works God says what they are god of
    const roleLine = `${ROLES[s.role].name} · ${TIERS[s.tier].name}${godTitle ? ` · ${godTitle}` : ''}${legacy(s.id) ? ' · Legacy' : ''}`;
    const need = sys.xpNeeded(s.level);
    if (big) {
      // Name and role beside a smaller portrait; level, pay and what they are doing in full-width rows under it.
      ty += para(ctx, s.name, tx, ty, tw, { size: S.title, bold: true, maxLines: 2, lead: 1.1 }) + 8;
      ty += para(ctx, roleLine, tx, ty, tw, { color: legacy(s.id) ? C.good : C.textMuted, bold: legacy(s.id), maxLines: 3, lead: 1.2 });
      y = Math.max(pr.y + pr.h, ty) + 24;
      text(ctx, `Level ${s.level}`, x, y, { size: S.heading, bold: true });
      text(ctx, `XP ${s.xp} / ${need}`, x + cw, y + 6, { color: C.textMuted, align: 'right' });
      y += L(60, S.heading, 1.2);
      bar(ctx, x, y, cw, 22, s.xp / need, C.purple);
      y += 44;
      text(ctx, 'Pay a month', x, y, { color: C.textMuted });
      text(ctx, `${s.salary.toLocaleString('en-GB')} Cr`, x + cw, y, { bold: true, align: 'right' });
      y += L(60);
      y += para(ctx, `Now: ${world.stateLine(w, WORK_STATE[w.phase].line)}`, x, y, cw, { color: C.actionDark, bold: true, maxLines: 3 }) + 30;
    } else {
    text(ctx, s.name, tx, ty, { size: S.title, bold: true, maxWidth: tw });
    ty += 70;
    text(ctx, roleLine, tx, ty, { color: legacy(s.id) ? C.good : C.textMuted, bold: legacy(s.id), maxWidth: tw }); // Milestone 33: Legacy Staff
    ty += 60;
    text(ctx, `Level ${s.level}`, tx, ty, { bold: true });
    text(ctx, `XP ${s.xp} / ${need}`, tx + tw, ty + 4, { size: S.small, color: C.textMuted, align: 'right' });
    ty += 50;
    bar(ctx, tx, ty, tw, 18, s.xp / need, C.purple);
    ty += 50;
    text(ctx, `Salary ${s.salary.toLocaleString('en-GB')} Credits / month`, tx, ty, { maxWidth: tw });
    ty += 60;
    const now = `Now: ${world.stateLine(w, WORK_STATE[w.phase].line)}`;
    para(ctx, now, tx, ty, tw, { color: C.actionDark, bold: true, maxLines: 3 });
    y = pr.y + pr.h + 40;
    }

    // Condition.
    y = heading(ctx, 'Condition', x, y);
    for (const [label, value, low, icon, color] of [
      ['Energy', s.energy, w.tiredIcon, STATUS_ICONS.tired, C.progress],
      ['Morale', s.morale, s.status.stressed, STATUS_ICONS.stressed, C.good],
    ]) {
      if (big) {
        // Label and number on one row (the number bold and bigger), the bar under them at full width.
        text(ctx, label, x, y + 8, { bold: true });
        text(ctx, String(Math.round(value)), x + cw - (low ? 70 : 0), y, { size: S.heading, bold: true, align: 'right' });
        if (low) assets.draw(ctx, icon, x + cw - 56, y + 4, 56, 56);
        y += L(64, S.heading, 1.2);
        bar(ctx, x, y, cw, 24, value / 100, low ? C.warn : color);
        y += 48;
        continue;
      }
      text(ctx, label, x, y, { bold: true });
      bar(ctx, x + 180, y + 6, cw - 180 - 150, 28, value / 100, low ? C.warn : color);
      text(ctx, String(Math.round(value)), x + cw - 80, y, { bold: true, align: 'right' });
      if (low) assets.draw(ctx, icon, x + cw - 60, y - 6, 56, 56);
      y += 64;
    }
    y += 20;

    // Work stats against the tier cap; the role's main stat gets a star.
    const cap = sys.statCap(s);
    y = heading(ctx, 'Work stats', x, y);
    if (big) {
      text(ctx, `Cap ${cap} (${TIERS[s.tier].name})`, x, y, { size: S.small, color: C.textMuted, maxWidth: cw });
      y += L(44, S.small);
    } else text(ctx, `${TIERS[s.tier].name} cap ${cap}`, x + cw, y - 60, { size: S.small, color: C.textMuted, align: 'right' });
    const primary = ROLES[s.role].primaryStat;
    for (const st of STATS) {
      const v = s.stats[st.key];
      const main = st.key === primary;
      if (big) {
        // "★ CODE" and the number on one row, the bar under them: no long name (it is the same word).
        text(ctx, `${main ? '★ ' : ''}${st.label}`, x, y + 8, { bold: true, color: main ? C.actionDark : C.text });
        text(ctx, advanced() ? `${v}/${cap}` : String(v), x + cw, y, { size: S.heading, bold: true, align: 'right' });
        y += L(64, S.heading, 1.2);
        bar(ctx, x, y, cw, 22, v / cap, main ? C.action : C.progress);
        y += 44;
        continue;
      }
      text(ctx, `${main ? '★ ' : ''}${st.label}`, x, y, { bold: true, color: main ? C.actionDark : C.text });
      text(ctx, st.name, x + 150, y + 4, { size: S.small, color: C.textMuted });
      bar(ctx, x + 340, y + 6, cw - 340 - (advanced() ? 170 : 110), 28, v / cap, main ? C.action : C.progress);
      text(ctx, advanced() ? `${v}/${cap}` : String(v), x + cw, y, { size: advanced() ? S.body : S.heading, bold: true, align: 'right' }); // Milestone 34: Advanced stats
      y += 70;
    }
    y += 20;

    // Traits.
    y = heading(ctx, s.traits.length > 1 ? 'Traits' : 'Trait', x, y);
    for (const t of s.traits) {
      const def = TRAITS[t] ?? { name: t, text: '' };
      const label = def.signature ? `★ ${def.name}` : def.name; // Milestone 40g: a signature / blessing in gold
      ctx.font = font(S.body, true);
      const chipW = ctx.measureText(label).width + 40;
      ctx.fillStyle = C.panelInfo;
      ctx.beginPath();
      if (big) {
        const chipH = L(58, S.body, 1.45);
        ctx.roundRect(x, y, Math.min(cw, chipW), chipH, chipH / 2);
        ctx.fill();
        text(ctx, label, x + 20, y + (chipH - lineH(S.body, 1.15)) / 2 + 2, { bold: true, color: def.signature ? C.actionDark : C.purple, maxWidth: cw - 40 });
        y += chipH + 16;
        y += para(ctx, def.text, x, y, cw, { color: C.textMuted }) + 24;
        continue;
      }
      ctx.roundRect(x, y, chipW, 58, 29);
      ctx.fill();
      text(ctx, label, x + 20, y + 10, { bold: true, color: def.signature ? C.actionDark : C.purple });
      y += 74;
      const lines = wrapLines(def.text, cw, S.body);
      para(ctx, def.text, x, y, cw, { color: C.textMuted });
      y += lines.length * S.body * 1.3 + 24;
    }

    // Milestone 40e: what they love (items of those groups count ×1.5) and the items they were given.
    const inf = itemsInfo(s.id);
    if (inf) {
      y = heading(ctx, 'Likes and items', x, y);
      for (const line of inf) y += para(ctx, line.text ?? line, x, y, cw, { color: line.color ?? C.text }) + 10;
      y += 20;
    }

    // Career (Milestone 13).
    const cr = career(s.id);
    if (cr) {
      y = heading(ctx, 'Career', x, y);
      const top = (map) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => `${elementById(id)?.name ?? id}${n > 1 ? ` ×${n}` : ''}`).join(', ');
      const yrs = cr.daysEmployed / 336;
      const lines = [
        `${cr.continuous ? 'Here without a break' : `${cr.record.stints.length} spells here`} since ${dateLabel(cr.since)} · ${yrs.toFixed(1)} years`,
        `Games credited: ${cr.games.length}${cr.games.length ? ` (${cr.games.slice(-3).map((g) => g.title).join(', ')}${cr.games.length > 3 ? ', …' : ''})` : ''}`,
        ...(Object.keys(cr.genres).length ? [`Genres: ${top(cr.genres)}`] : []),
        ...(Object.keys(cr.themes).length ? [`Themes: ${top(cr.themes)}`] : []),
        ...(cr.franchises.length ? [`Franchises: ${cr.franchises.join(', ')}`] : []),
        `Awards: ${cr.awards.length}`,
        `Training courses: ${cr.trainings}`,
        `Crunch: ${cr.crunchDays ? `${cr.crunchDays} day${cr.crunchDays === 1 ? '' : 's'} over ${cr.crunches} crunch${cr.crunches === 1 ? '' : 'es'}` : 'none'}`,
        ...(cr.mentors.length ? [`Mentored by ${cr.mentors.map(nameOf).join(', ')}`] : []),
        ...(cr.mentees.length ? [`Mentor to ${cr.mentees.map(nameOf).join(', ')}`] : []),
      ];
      // Big text: the first two lines, the rest behind "More".
      const shown = big && !more ? lines.slice(0, 2) : lines;
      for (const line of shown) {
        y += para(ctx, line, x, y, cw, { color: C.text }) + 10;
      }
      if (big && lines.length > 2) {
        const r = { x, y: y + 6, w: cw, h: L(THEME.button.minH, S.body, 1.9) };
        drawButton(ctx, r, more ? 'Less ▴' : `More ▾ (${lines.length - 2} lines)`, { accent: C.progress, font: font(S.body, true) });
        buttons.push({ id: 'more', r, onTap: () => (more = !more) });
        y += r.h + 18;
      }
      y += 20;
    }

    // Actions (Milestone 13): Train, Mentor, Let go.
    const acts = actions(s.id);
    if (acts.length) {
      const bw = (cw - 20 * (acts.length - 1)) / acts.length;
      ctx.font = font(S.body, true);
      const stack = big && acts.some((a) => ctx.measureText(a.label).width > bw - 40); // Milestone 41i: one button per row
      const bh = big ? L(THEME.button.minH, S.body, 1.9) : THEME.button.minH;
      acts.forEach((a, i) => {
        const r = stack ? { x, y: y + i * (bh + 16), w: cw, h: bh } : { x: x + i * (bw + 20), y, w: bw, h: bh };
        drawButton(ctx, r, a.label, { disabled: a.disabled, accent: a.accent ?? C.progress, font: font(S.body, true) });
        buttons.push({ ...a, r });
      });
      y += (stack ? acts.length * (bh + 16) - 16 : bh) + 12;
      const subs = acts.filter((a) => a.sub).map((a) => a.sub);
      for (const t of subs) y += para(ctx, t, x, y, cw, { color: C.textMuted, size: S.small }) + 6;
      y += 30;
    }

    // Crunch exposure (Milestone 7): only shown once they have crunched (Milestone 13: in the career above).
    const h = cr ? null : history(s.id);
    if (h?.crunchDays) {
      y = heading(ctx, 'Crunch', x, y);
      text(ctx, `${h.crunchDays} crunch day${h.crunchDays === 1 ? '' : 's'} over ${h.crunches} crunch${h.crunches === 1 ? '' : 'es'}`, x, y, { color: C.bad, bold: true, maxWidth: cw });
      y += 64;
    }

    // The Founding Developer (Milestone 5b): the permanent flag, the perk and the history so far.
    const f = founderInfo();
    if (f && f.id === s.id) {
      y += 10;
      ctx.font = font(S.body, true);
      const chipW = ctx.measureText(`★ ${f.flag}`).width + 40;
      ctx.fillStyle = C.panelGold;
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const big = isBig();
      const fh = big ? L(58, S.body, 1.45) : 58;
      ctx.roundRect(x, y, big ? Math.min(cw, chipW) : chipW, fh, fh / 2);
      ctx.fill();
      ctx.stroke();
      text(ctx, `★ ${f.flag}`, x + 20, big ? y + (fh - lineH(S.body, 1.15)) / 2 + 2 : y + 10, { bold: true, color: C.gold, maxWidth: big ? cw - 40 : undefined });
      y += fh + 16;
      if (big) y += para(ctx, f.perk.name, x, y, cw, { bold: true }) + 8;
      else {
        text(ctx, f.perk.name, x, y, { bold: true });
        y += 48;
      }
      y += para(ctx, f.perk.text, x, y, cw, { color: C.textMuted }) + 12;
      const games = f.history.gamesCredited.length;
      const lines = [
        `${f.history.continuous ? 'With the studio since day one' : 'Left the studio'} · ${f.years.toFixed(1)} years`,
        `Games credited: ${games}`,
      ];
      for (const line of lines) {
        if (big) {
          y += para(ctx, line, x, y, cw, { color: C.actionDark, bold: true }) + 8;
          continue;
        }
        text(ctx, line, x, y, { color: C.actionDark, bold: true, maxWidth: cw });
        y += 50;
      }
    }
    return y + PAD - y0;
  }

  return {
    get id() {
      return id;
    },
    enter(params) {
      id = params.id;
      scrollY = 0;
      more = false;
    },
    onDragStart(p) {
      if (p.startY > areaRect().y) drag = { id: p.id, y: p.y, start: scrollY };
    },
    onDrag(p) {
      if (drag && p.id === drag.id) scrollY = Math.min(maxScroll(), Math.max(0, drag.start - (p.y - drag.y)));
    },
    onDragEnd() {
      drag = null;
    },
    onUp() {
      drag = null;
    },
    onTap(p) {
      if (topBar.handleTap(p)) return;
      const r = areaRect();
      if (p.y < r.y || p.y > r.y + r.h) return;
      const b = buttons.find((x) => hitRect(p, x.r));
      if (b && !b.disabled) b.onTap();
    },
    // Screen rect of an action button (tests): 'train', 'mentor', 'letGo'.
    buttonRect(bid) {
      return buttons.find((b) => b.id === bid)?.r ?? null;
    },
    scrollToEnd() {
      scrollY = maxScroll();
    },
    // Milestone 41i (tests): the career's "More" at big text.
    openMore() {
      more = true;
    },
    render(ctx) {
      const w = world.workerById(id);
      const r = areaRect();
      ctx.save();
      ctx.fillStyle = C.panel;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = THEME.panel.line;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, THEME.panel.radius);
      ctx.fill();
      ctx.stroke();
      ctx.clip();
      buttons = [];
      if (w) contentH = drawContent(ctx, r, r.y - scrollY, w);
      ctx.restore();
      topBar.render(ctx);
    },
  };
}
