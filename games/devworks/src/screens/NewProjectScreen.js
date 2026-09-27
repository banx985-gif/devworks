// New Game Project (Milestone 3), from Create → New Game. Top to bottom: the title (typed, or a random
// suggestion), the six recipe slots (tap one to pick from its family; locked elements show greyed with a lock),
// scope (Tiny), audio package (None / Basic), budget focus (Balanced), and the core team — one lead slot per role,
// Tiny uses 2–3. The Start button stays at the bottom, greyed until everything is filled in.
// Milestone 6: a recipe must be legal — an element that needs another (a 3D look needs 3D technology) marks its slot
// red, and Start says what to fix.
// Milestone 7: six scopes (locked ones greyed, the reason under them), five budget focuses, and a line with how long
// this team should take, the deadline and the daily cost. Fewer leads than a scope usually has still works (slower).
// Drag scrolls. Layout and tapping share one pass (lay out → draw and/or hit-test), so they can never disagree.
import { THEME, font } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text } from '../../../../core/ui/Kit.js';
import { FAMILIES, elementById, needsProblem, recipeProblems } from '../../data/elements.js';
import { SCOPES, AUDIO_PACKAGES, BUDGET_FOCUS, LEAD_ROLES, TITLE_WORDS } from '../../data/projects.js';
import { ROLES, STATS } from '../../data/staff.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const TITLE_MAX = 28;
const HARD_MIN = 2; // a game needs at least two leads; below a scope's usual team it is just slower (spec §9)

export function createNewProjectScreen({ layout, assets, world, topBar, openPicker, textPrompt, onStart, scopeOpen = () => true, scopeReason = () => null, estimate = null, dateLabel = (d) => `day ${d}`, today = () => 0, costPerDay = () => 0 }) {
  let setup = null;
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: startRect().y - 16 - y };
  };
  const startRect = () => layout.anchor('bottom', layout.safeRect.w - 64, THEME.button.minH + 20, 24);
  const scroll = new ScrollPanel({ getRect: panelRect });

  const scope = () => SCOPES.find((s) => s.id === setup.scope);
  const missing = () => {
    const out = [];
    const empty = FAMILIES.filter((f) => !setup.recipe[f.id]).length;
    if (empty) out.push(`${empty} recipe slot${empty > 1 ? 's' : ''}`);
    else if (recipeProblems(setup.recipe).length) out.push('a recipe fix (see the red slot)');
    if (!setup.title.trim()) out.push('a title');
    const n = setup.team.length;
    const { max } = scope().team;
    if (!scopeOpen(setup.scope)) out.push('an open scope');
    if (n < HARD_MIN) out.push(`${HARD_MIN - n} more lead${HARD_MIN - n > 1 ? 's' : ''}`);
    if (n > max) out.push(`${n - max} fewer lead${n - max > 1 ? 's' : ''}`);
    return out;
  };
  const suggest = () => {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    let a;
    let b;
    do [a, b] = [pick(TITLE_WORDS.first), pick(TITLE_WORDS.second)];
    while (a === b); // never "Puzzle Puzzle"
    setup.title = `${a} ${b}`;
  };

  // One pass over the content: lays everything out in content coordinates; draws when ctx is given, returns the
  // action under `tap` (a content point) when one is given, and records every tappable rect by id in `rects`.
  function pass(ctx, tap, rects = null) {
    const w = panelRect().w;
    const cw = w - PAD * 2;
    let y = PAD;
    let hit = null;
    const box = (r, onTap, id) => {
      if (rects && id) rects[id] = r;
      if (tap && !hit && hitRect(tap, r)) hit = onTap;
    };
    const heading = (label, sub = null) => {
      if (ctx) {
        text(ctx, label, PAD, y, { size: S.heading, bold: true });
        if (sub) text(ctx, sub, PAD + cw, y + 8, { size: S.small, color: C.textMuted, align: 'right' });
      }
      y += 66;
    };
    const chip = (r, label, on, onTap, opts = {}) => {
      if (ctx) drawButton(ctx, r, on ? `✓ ${label}` : label, { selected: on, accent: opts.accent ?? C.progress, font: font(S.body, true), locked: opts.locked });
      if (!opts.locked) box(r, onTap, opts.id);
    };

    // Title.
    heading('Title');
    const field = { x: PAD, y, w: cw - 260, h: 110 };
    const sug = { x: PAD + cw - 240, y, w: 240, h: 110 };
    if (ctx) {
      ctx.fillStyle = C.sheet;
      ctx.strokeStyle = setup.title.trim() ? C.outline : C.action;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(field.x, field.y, field.w, field.h, 22);
      ctx.fill();
      ctx.stroke();
      text(ctx, setup.title || 'Tap to name your game', field.x + 28, field.y + field.h / 2, { size: S.heading, bold: !!setup.title, color: setup.title ? C.text : C.textFaint, baseline: 'middle', maxWidth: field.w - 56 });
      drawButton(ctx, sug, 'Suggest', { accent: C.progress });
    }
    box(field, () => editTitle(field), 'title');
    box(sug, suggest, 'suggest');
    y += field.h + 40;

    // Recipe: six slots, two columns.
    heading('Recipe', 'tap a slot to choose');
    const colW = (cw - 20) / 2;
    FAMILIES.forEach((f, i) => {
      const r = { x: PAD + (i % 2) * (colW + 20), y: y + Math.floor(i / 2) * 170, w: colW, h: 150 };
      const el = setup.recipe[f.id] ? elementById(setup.recipe[f.id]) : null;
      const clash = el ? needsProblem(el, setup.recipe) : null;
      if (rects && clash) rects[`clash:${f.id}`] = r;
      if (ctx) {
        ctx.fillStyle = el ? C.panel : C.panelAlt;
        ctx.strokeStyle = clash ? C.bad : el ? C.outline : C.action;
        ctx.lineWidth = clash ? 6 : el ? 3 : 4;
        ctx.setLineDash(el ? [] : [14, 10]);
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 22);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        const ir = { x: r.x + 16, y: r.y + 15, w: 120, h: 120 };
        if (el) assets.drawContained(ctx, el.art, ir);
        else text(ctx, '+', ir.x + ir.w / 2, ir.y + ir.h / 2, { size: 90, bold: true, color: C.action, align: 'center', baseline: 'middle' });
        text(ctx, f.name, r.x + 150, r.y + 26, { size: S.small, color: C.textMuted, maxWidth: r.w - 166 });
        text(ctx, el ? el.name : 'Choose…', r.x + 150, r.y + 66, { size: S.body, bold: true, color: el ? C.text : C.actionDark, maxWidth: r.w - 166 });
        if (clash) text(ctx, `Needs ${clash.split(' needs ')[1]}`, r.x + 150, r.y + 108, { size: S.small, bold: true, color: C.bad, maxWidth: r.w - 166 });
      }
      box(r, () => openPicker(f.id), f.id);
    });
    y += 3 * 170 + 30;

    // Scope, audio, budget.
    // Scope: three to a row; locked ones greyed, why under them. Then this team's estimate and deadline.
    const third = (cw - 40) / 3;
    const grid = (i) => ({ x: PAD + (i % 3) * (third + 20), y: y + Math.floor(i / 3) * 130, w: third, h: 110 });
    heading('Scope');
    SCOPES.forEach((sc, i) => chip(grid(i), sc.name, setup.scope === sc.id, () => (setup.scope = sc.id), { id: `scope:${sc.id}`, locked: !scopeOpen(sc.id) }));
    y += Math.ceil(SCOPES.length / 3) * 130 + 10;
    const firstLocked = SCOPES.find((sc) => !scopeOpen(sc.id));
    const lines = [{ t: scope().line, c: C.text }];
    if (estimate && setup.team.length) {
      const e = estimate(setup.team, setup.scope);
      lines.push({ t: `This team: about ${Math.round(e.days)} days · due ${dateLabel(today() + e.deadlineDays)} · ${costPerDay(setup.scope, setup.budget)} Credits a day`, c: C.actionDark });
    }
    if (setup.team.length < scope().team.min) lines.push({ t: `Short-staffed: ${scope().name} usually has ${scope().team.min}–${scope().team.max} people. It still works, just slower.`, c: C.bad });
    if (firstLocked) lines.push({ t: `${firstLocked.name} and up: ${scopeReason(firstLocked.id)?.replace('Needs', 'need') ?? 'locked'} and later stages.`, c: C.textMuted });
    for (const l of lines) {
      if (ctx) text(ctx, l.t, PAD, y, { size: S.small, color: l.c, maxWidth: cw });
      y += 48;
    }
    y += 24;
    heading('Audio package', AUDIO_PACKAGES.find((a) => a.id === setup.audio).line);
    AUDIO_PACKAGES.forEach((a, i) => chip({ x: PAD + i * 260, y, w: 240, h: 110 }, a.name, setup.audio === a.id, () => (setup.audio = a.id), { id: `audio:${a.id}` }));
    y += 150; // chips are button height (110)
    heading('Budget focus');
    BUDGET_FOCUS.forEach((b, i) => chip(grid(i), b.name, setup.budget === b.id, () => (setup.budget = b.id), { id: `budget:${b.id}` }));
    y += Math.ceil(BUDGET_FOCUS.length / 3) * 130 + 10;
    if (ctx) text(ctx, `${BUDGET_FOCUS.find((b) => b.id === setup.budget).line} Changes wait for the next milestone.`, PAD, y, { size: S.small, color: C.textMuted, maxWidth: cw });
    y += 72;

    // Core team: one lead slot per role.
    const { min, max } = scope().team;
    heading('Core team', `${scope().name}: ${min}–${max} leads · ${setup.team.length} chosen`);
    for (const role of LEAD_ROLES) {
      const r = { x: PAD, y, w: cw, h: 130 };
      const person = world.staffSystem.staff.find((s) => s.role === role);
      const on = !!person && setup.team.includes(person.id);
      if (ctx) {
        ctx.fillStyle = on ? C.panelInfo : person ? C.panel : C.panelDim;
        ctx.strokeStyle = on ? C.progress : C.line;
        ctx.lineWidth = on ? 5 : 3;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 22);
        ctx.fill();
        ctx.stroke();
        text(ctx, `${ROLES[role].name} lead`, r.x + 24, r.y + 18, { size: S.small, color: C.textMuted });
        if (person) {
          assets.drawCrop(ctx, person.art, { x: 0.15, y: 0, w: 0.7, h: 0.42 }, { x: r.x + r.w - 130, y: r.y + 10, w: 110, h: 110 });
          text(ctx, person.name, r.x + 24, r.y + 58, { size: S.body, bold: true });
          const main = STATS.find((st) => st.key === ROLES[role].primaryStat);
          text(ctx, `${main.label} ${person.stats[main.key]}`, r.x + 340, r.y + 62, { size: S.body, color: C.actionDark, bold: true });
          text(ctx, on ? '✓ In the team' : 'Tap to add', r.x + r.w - 150, r.y + r.h / 2, { size: S.small, bold: true, color: on ? C.progress : C.textMuted, align: 'right', baseline: 'middle' });
        } else text(ctx, 'No one yet (hiring comes later)', r.x + 24, r.y + 62, { size: S.body, color: C.textFaint });
      }
      if (person) box(r, () => (setup.team = on ? setup.team.filter((id) => id !== person.id) : [...setup.team, person.id]), person.id);
      y += 150;
    }
    return { height: y + PAD, hit };
  }

  function editTitle(fieldContent) {
    const pr = panelRect();
    const rect = { x: pr.x + fieldContent.x, y: pr.y + fieldContent.y - scroll.scrollY, w: fieldContent.w, h: fieldContent.h };
    textPrompt.open({ rect, value: setup.title, maxLength: TITLE_MAX, placeholder: 'Game title', onDone: (v) => (setup.title = v.trim().slice(0, TITLE_MAX)) });
  }

  const screen = {
    get setup() {
      return setup;
    },
    get ready() {
      return missing().length === 0;
    },
    startRect,
    enter() {
      setup = { title: '', recipe: {}, scope: SCOPES[0].id, audio: AUDIO_PACKAGES[0].id, budget: BUDGET_FOCUS[0].id, team: world.staffSystem.staff.map((s) => s.id).slice(0, SCOPES[0].team.max) };
      scroll.scrollY = 0;
    },
    exit() {
      textPrompt.close();
    },
    choose(family, id) {
      setup.recipe[family] = id;
    },
    onDragStart(p) {
      scroll.beginDrag(p);
    },
    onDrag(p) {
      scroll.drag(p);
    },
    onDragEnd(p) {
      scroll.endDrag(p);
    },
    onUp(p) {
      scroll.endDrag(p);
    },
    onTap(p) {
      if (topBar.handleTap(p)) return;
      if (hitRect(p, startRect())) {
        if (screen.ready) onStart({ ...setup, title: setup.title.trim(), recipe: { ...setup.recipe }, team: [...setup.team] });
        return;
      }
      if (!scroll.contains(p)) return;
      pass(null, scroll.toContent(p)).hit?.();
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
      scroll.begin(ctx);
      scroll.contentHeight = pass(ctx, null).height;
      scroll.end(ctx);
      const miss = missing();
      const sr = startRect();
      drawButton(ctx, sr, miss.length ? `Start — needs ${miss.join(', ')}` : `Start "${setup.title.trim()}"`, { disabled: miss.length > 0, font: font(miss.length ? S.body : S.button, true) });
      topBar.render(ctx);
    },
  };
  // Screen rect of a tappable thing (tests): 'title', 'suggest', a family id, 'audio:basic', a staff id…
  screen.rectOf = (what) => {
    const rects = {};
    pass(null, null, rects);
    const r = rects[what];
    const pr = panelRect();
    return r ? { x: pr.x + r.x, y: pr.y + r.y - scroll.scrollY, w: r.w, h: r.h } : null;
  };
  // Scroll so a thing is in view (tests / the guide).
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
