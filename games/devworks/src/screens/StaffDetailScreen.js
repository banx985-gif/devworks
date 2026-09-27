// Staff detail (Milestone 2), from a roster card or by tapping a worker in the studio: portrait, name, role, tier,
// level / XP, salary, what they are doing now, Energy / Morale, the five work stats (bar against the tier's cap;
// the role's main stat is marked) and traits with what they do. Drag scrolls when it does not fit.
// Milestone 5b: the Founding Developer gets their flag, founder perk and history (years, games credited) at the end.
import { THEME, font } from '../../../../core/Theme.js';
import { text, para, wrapLines } from '../../../../core/ui/Kit.js';
import { WORK_STATE } from '../../data/studio.js';
import { STATS, ROLES, TIERS, TRAITS } from '../../data/staff.js';
import { STATUS_ICONS } from '../../data/home.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 36;

export function createStaffDetailScreen({ layout, assets, world, topBar, founderInfo = () => null }) {
  let id = null;
  let scrollY = 0;
  let drag = null;
  let contentH = 0;

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
    return y + 64;
  }

  // Draws everything from the top of the content (y0) and returns the content height.
  function drawContent(ctx, r, y0, w) {
    const s = w.staff;
    const sys = world.staffSystem;
    const x = r.x + PAD;
    const cw = r.w - PAD * 2;
    let y = y0 + PAD;

    // Header: portrait left, facts right.
    const pr = { x, y, w: 300, h: 420 };
    ctx.fillStyle = C.panelAlt;
    ctx.beginPath();
    ctx.roundRect(pr.x, pr.y, pr.w, pr.h, 24);
    ctx.fill();
    assets.drawContained(ctx, s.art, { x: pr.x + 12, y: pr.y + 12, w: pr.w - 24, h: pr.h - 24 }, 'bottom');
    const tx = pr.x + pr.w + 32;
    const tw = x + cw - tx;
    let ty = pr.y;
    text(ctx, s.name, tx, ty, { size: S.title, bold: true, maxWidth: tw });
    ty += 70;
    text(ctx, `${ROLES[s.role].name} · ${TIERS[s.tier].name}`, tx, ty, { color: C.textMuted, maxWidth: tw });
    ty += 60;
    const need = sys.xpNeeded(s.level);
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

    // Condition.
    y = heading(ctx, 'Condition', x, y);
    for (const [label, value, low, icon, color] of [
      ['Energy', s.energy, w.tiredIcon, STATUS_ICONS.tired, C.progress],
      ['Morale', s.morale, s.status.stressed, STATUS_ICONS.stressed, C.good],
    ]) {
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
    text(ctx, `${TIERS[s.tier].name} cap ${cap}`, x + cw, y - 60, { size: S.small, color: C.textMuted, align: 'right' });
    const primary = ROLES[s.role].primaryStat;
    for (const st of STATS) {
      const v = s.stats[st.key];
      const main = st.key === primary;
      text(ctx, `${main ? '★ ' : ''}${st.label}`, x, y, { bold: true, color: main ? C.actionDark : C.text });
      text(ctx, st.name, x + 150, y + 4, { size: S.small, color: C.textMuted });
      bar(ctx, x + 340, y + 6, cw - 340 - 110, 28, v / cap, main ? C.action : C.progress);
      text(ctx, String(v), x + cw, y, { size: S.heading, bold: true, align: 'right' });
      y += 70;
    }
    y += 20;

    // Traits.
    y = heading(ctx, s.traits.length > 1 ? 'Traits' : 'Trait', x, y);
    for (const t of s.traits) {
      const def = TRAITS[t] ?? { name: t, text: '' };
      ctx.font = font(S.body, true);
      const chipW = ctx.measureText(def.name).width + 40;
      ctx.fillStyle = C.panelInfo;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 58, 29);
      ctx.fill();
      text(ctx, def.name, x + 20, y + 10, { bold: true, color: C.purple });
      y += 74;
      const lines = wrapLines(def.text, cw, S.body);
      para(ctx, def.text, x, y, cw, { color: C.textMuted });
      y += lines.length * S.body * 1.3 + 24;
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
      ctx.roundRect(x, y, chipW, 58, 29);
      ctx.fill();
      ctx.stroke();
      text(ctx, `★ ${f.flag}`, x + 20, y + 10, { bold: true, color: C.gold });
      y += 74;
      text(ctx, f.perk.name, x, y, { bold: true });
      y += 48;
      y += para(ctx, f.perk.text, x, y, cw, { color: C.textMuted }) + 12;
      const games = f.history.gamesCredited.length;
      const lines = [
        `${f.history.continuous ? 'With the studio since day one' : 'Left the studio'} · ${f.years.toFixed(1)} years`,
        `Games credited: ${games}`,
      ];
      for (const line of lines) {
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
      topBar.handleTap(p);
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
      if (w) contentH = drawContent(ctx, r, r.y - scrollY, w);
      ctx.restore();
      topBar.render(ctx);
    },
  };
}
