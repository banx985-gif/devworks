// Active project view (Milestone 3), from tapping the Starter Desks or Create → current project: the game's
// title and recipe, the five milestones with a bar each (done / now / to come), days so far, the live output
// stats and bug count, breakthroughs, cost so far (tracked only; nothing is charged until Milestone 4) and the
// team with what each lead is doing. Drag scrolls when it does not fit.
// Milestone 7: the schedule (due date, on track / behind / late, crunch days left), the budget focus (a change waits
// for the next milestone) and, when the game waits at Beta or Gold, a button for the decision.
import { THEME, font } from '../../../../core/Theme.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { BUDGET_FOCUS, DECISION_POINTS, scopeById } from '../../data/projects.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text } from '../../../../core/ui/Kit.js';
import { WORK_STATE } from '../../data/studio.js';
import { ROLES } from '../../data/staff.js';
import { drawRecipeIcons, drawOutputs } from '../ui/gameCard.js';
import { PROJECT_BALANCE } from '../../data/balance.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;

export function createProjectScreen({ layout, assets, world, projects, topBar, dateLabel = (d) => `day ${d}`, openDecision = () => {} }) {
  let jobId = null;
  const job = () => (jobId && projects.jobById(jobId)) || projects.active;
  let rects = {}; // content-space tappable rects from the last drawn frame: id → { r, onTap }
  const STATUS = { onTrack: ['On track', C.good], behind: ['Running behind', C.bad], late: ['Late', C.bad], none: ['No deadline (an older project)', C.textMuted] };
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });

  function drawContent(ctx, v, w) {
    const cw = w - PAD * 2;
    let y = PAD;
    text(ctx, v.title, PAD, y, { size: S.title, bold: true, maxWidth: cw });
    y += 76;
    text(ctx, `${scopeById(v.scope)?.name ?? ''} game`, PAD, y, { size: S.small, color: C.textMuted });
    y += 50;
    if (v.decision) {
      const r = { x: PAD, y, w: cw, h: 110 };
      drawButton(ctx, r, `${DECISION_POINTS[v.decision.point]} decision: choose now`, { accent: C.action, font: font(S.body, true) });
      rects.decide = { r, onTap: openDecision };
      y += 140;
    }
    drawRecipeIcons(ctx, assets, v.recipe, PAD, y, 100, 14);
    y += 130;

    // Milestones (phases in code).
    text(ctx, 'Milestones', PAD, y, { size: S.heading, bold: true });
    text(ctx, `Day ${v.days} · ${v.phaseIndex + 1} of 5`, PAD + cw, y + 8, { size: S.body, color: C.textMuted, align: 'right' });
    y += 66;
    projects.phases.forEach((ph, i) => {
      const f = v.phaseFracs[i];
      const now = i === v.phaseIndex;
      text(ctx, ph.name, PAD, y + 22, { size: S.body, bold: now, baseline: 'middle', color: now ? C.text : f >= 1 ? C.good : C.textMuted });
      const bx = PAD + 300;
      const bw = cw - 300 - 90;
      ctx.fillStyle = C.track;
      ctx.beginPath();
      ctx.roundRect(bx, y + 8, bw, 28, 14);
      ctx.fill();
      if (f > 0) {
        ctx.fillStyle = f >= 1 ? C.good : C.action;
        ctx.beginPath();
        ctx.roundRect(bx, y + 8, Math.max(28, bw * f), 28, 14);
        ctx.fill();
      }
      text(ctx, f >= 1 ? '✓' : `${Math.floor(f * 100)}%`, PAD + cw, y + 22, { size: S.body, bold: true, align: 'right', baseline: 'middle', color: f >= 1 ? C.good : C.text });
      y += 60;
    });
    y += 24;

    // Schedule (Milestone 7).
    text(ctx, 'Schedule', PAD, y, { size: S.heading, bold: true });
    const [label, colour] = STATUS[v.status];
    text(ctx, label, PAD + cw, y + 8, { size: S.body, bold: true, color: colour, align: 'right' });
    y += 62;
    if (v.deadlineDay != null) {
      text(ctx, `Due ${dateLabel(v.deadlineDay)} · at this pace done ${dateLabel(Math.max(v.projectedDay, 0))}`, PAD, y, { size: S.small, color: C.textMuted, maxWidth: cw });
      y += 50;
    }
    if (v.crunchLeft > 0) {
      text(ctx, `Crunching: ${v.crunchLeft} more day${v.crunchLeft === 1 ? '' : 's'} (tiring, more bugs)`, PAD, y, { size: S.small, bold: true, color: C.bad, maxWidth: cw });
      y += 50;
    }
    const notes = [v.cut && 'feature package cut', v.outsourced && 'QA outsourced'].filter(Boolean);
    if (notes.length) {
      text(ctx, notes.join(' · '), PAD, y, { size: S.small, color: C.textMuted, maxWidth: cw });
      y += 50;
    }
    y += 14;

    // Budget focus: a change waits for the next milestone (bible §12).
    text(ctx, 'Budget focus', PAD, y, { size: S.heading, bold: true });
    y += 62;
    const third = (cw - 40) / 3;
    BUDGET_FOCUS.forEach((b, i) => {
      const r = { x: PAD + (i % 3) * (third + 20), y: y + Math.floor(i / 3) * 130, w: third, h: 110 };
      const now = v.focus === b.id;
      const next = v.pendingFocus === b.id;
      // Milestone 40b: the name and what it does to the daily cost.
      drawButton(ctx, r, '', { selected: now || next, accent: next ? C.action : C.progress });
      const pct = PROJECT_BALANCE.budgetFocus[b.id]?.costPct ?? 0;
      const fg = now || next ? '#FFF8EC' : C.textOnAction;
      text(ctx, now ? `✓ ${b.name}` : next ? `→ ${b.name}` : b.name, r.x + r.w / 2, r.y + r.h * 0.34, { size: S.body, bold: true, align: 'center', baseline: 'middle', color: fg, maxWidth: r.w - 24 });
      text(ctx, !pct ? 'Normal cost' : `${pct > 0 ? '+' : '−'}${Math.abs(pct)}% cost`, r.x + r.w / 2, r.y + r.h * 0.7, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: fg, maxWidth: r.w - 24 });
      rects[`focus:${b.id}`] = { r, onTap: () => projects.setFocus(b.id, job()) };
    });
    y += Math.ceil(BUDGET_FOCUS.length / 3) * 130 + 10;
    const nowF = BUDGET_FOCUS.find((b) => b.id === v.focus);
    const nextF = BUDGET_FOCUS.find((b) => b.id === v.pendingFocus);
    text(ctx, nextF ? `${nextF.name} starts at the next milestone. Now: ${nowF.line}` : nowF.line, PAD, y, { size: S.small, color: nextF ? C.actionDark : C.textMuted, maxWidth: cw });
    y += 70;

    // Output stats so far.
    text(ctx, 'Game so far', PAD, y, { size: S.heading, bold: true });
    text(ctx, `${v.breakthroughs} breakthrough${v.breakthroughs === 1 ? '' : 's'}`, PAD + cw, y + 8, { size: S.body, color: C.gold, align: 'right' });
    y += 62;
    y += drawOutputs(ctx, v.outputs, v.bugs, PAD, y, cw) + 20;
    text(ctx, `Cost so far: ${v.cost.toLocaleString('en-GB')} Credits`, PAD, y, { size: S.body, color: C.textMuted, maxWidth: cw });
    y += 70;

    // Team.
    text(ctx, 'Core team', PAD, y, { size: S.heading, bold: true });
    y += 62;
    for (const id of v.team) {
      const wk = world.workerById(id);
      if (!wk) continue;
      text(ctx, `${wk.staff.name} (${ROLES[wk.staff.role].name})`, PAD, y, { size: S.body, bold: true, maxWidth: cw * 0.55 });
      text(ctx, world.stateLine(wk, WORK_STATE[wk.phase].line), PAD + cw, y + 2, { size: S.small, color: C.actionDark, align: 'right', maxWidth: cw * 0.44 });
      y += 54;
    }
    return y + PAD;
  }

  return {
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    // Milestone 13: which game (two lanes); none given = the first one in the works.
    enter(params) {
      jobId = params?.id ?? null;
      scroll.scrollY = 0;
    },
    get jobId() {
      return job()?.id ?? null;
    },
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const c = scroll.toContent(p);
      Object.values(rects).find((x) => hitRect(c, x.r))?.onTap();
    },
    // Screen rect of a tappable thing (tests): 'decide', 'focus:lean'…
    rectOf(id) {
      const x = rects[id];
      const pr = panelRect();
      return x ? { x: pr.x + x.r.x, y: pr.y + x.r.y - scroll.scrollY, w: x.r.w, h: x.r.h } : null;
    },
    scrollTo(id) {
      const x = rects[id];
      if (x) {
        scroll.scrollY = x.r.y - 40;
        scroll.clamp();
      }
    },
    render(ctx) {
      const r = panelRect();
      ctx.fillStyle = C.panel;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = THEME.panel.line;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, THEME.panel.radius);
      ctx.fill();
      ctx.stroke();
      const v = job() ? projects.view(job()) : null;
      scroll.begin(ctx);
      rects = {};
      if (v) scroll.contentHeight = drawContent(ctx, v, r.w);
      else text(ctx, 'No game in the works. Start one from Create → New Game.', PAD, PAD, { size: S.body, color: C.textMuted, maxWidth: r.w - PAD * 2 });
      scroll.end(ctx);
      topBar.render(ctx);
    },
  };
}
