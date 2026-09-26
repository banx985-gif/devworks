// Active project view (Milestone 3), from tapping the Starter Desks or Create → current project: the game's
// title and recipe, the five milestones with a bar each (done / now / to come), days so far, the live output
// stats and bug count, breakthroughs, cost so far (tracked only; nothing is charged until Milestone 4) and the
// team with what each lead is doing. Drag scrolls when it does not fit.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { text } from '../../../../core/ui/Kit.js';
import { WORK_STATE } from '../../data/studio.js';
import { ROLES } from '../../data/staff.js';
import { drawRecipeIcons, drawOutputs } from '../ui/gameCard.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;

export function createProjectScreen({ layout, assets, world, projects, topBar }) {
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

    // Output stats so far.
    text(ctx, 'Game so far', PAD, y, { size: S.heading, bold: true });
    text(ctx, `${v.breakthroughs} breakthrough${v.breakthroughs === 1 ? '' : 's'}`, PAD + cw, y + 8, { size: S.body, color: C.gold, align: 'right' });
    y += 62;
    y += drawOutputs(ctx, v.outputs, v.bugs, PAD, y, cw) + 20;
    text(ctx, `Cost so far: ${v.cost.toLocaleString('en-GB')} Credits (not charged yet)`, PAD, y, { size: S.body, color: C.textMuted, maxWidth: cw });
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
    enter() {
      scroll.scrollY = 0;
    },
    onTap(p) {
      topBar.handleTap(p);
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
      const v = projects.view();
      scroll.begin(ctx);
      if (v) scroll.contentHeight = drawContent(ctx, v, r.w);
      else text(ctx, 'No game in the works. Start one from Create → New Game.', PAD, PAD, { size: S.body, color: C.textMuted, maxWidth: r.w - PAD * 2 });
      scroll.end(ctx);
      topBar.render(ctx);
    },
  };
}
