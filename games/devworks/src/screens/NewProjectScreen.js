// New Game Project (Milestone 3), from Create → New Game. Top to bottom: the title (typed, or a random
// suggestion), the six recipe slots (tap one to pick from its family; locked elements show greyed with a lock),
// scope (Tiny), audio package (None / Basic), budget focus (Balanced), and the core team — one lead slot per role,
// Tiny uses 2–3. The Start button stays at the bottom, greyed until everything is filled in.
// Milestone 6: a recipe must be legal — an element that needs another (a 3D look needs 3D technology) marks its slot
// red, and Start says what to fix.
// Milestone 7: six scopes (locked ones greyed, the reason under them), five budget focuses, and a line with how long
// this team should take, the deadline and the daily cost. Fewer leads than a scope usually has still works (slower).
// Milestone 10: the project type first — Original, Sequel, Spin-off, Remake, Remaster (locked ones greyed with why).
// A Sequel / Spin-off picks a franchise, a Remake / Remaster picks an old game; the slots they fix are locked (a
// Spin-off must change the genre; a Remaster keeps the scope too).
// Milestone 13: the core team lists everyone in the studio (by role); someone making another game or away on a course
// can't be picked (why under their name). A role the studio has nobody for gets a hint (spec §9): how many more days
// this game takes without one, and a button that puts that role's Start Candidate on the recruitment board.
// Milestone 15: a recipe one slot away from a combo nobody has found yet gets a gentle hint under the recipe (which
// slot to change — never the combo); a recipe that makes a known combo says so.
// Milestone 16: "Engine": Licensed technology or one of the studio's own engine versions (those without strength for the
// recipe's Technology greyed with why), with what it does to this game.
// Milestone 17: "Publisher": Self-publish or a signed deal (it sets the scope; its clauses must hold: the scope, the
// genres under a control clause; a publisher-owned franchise needs that publisher's deal).
// Drag scrolls. Layout and tapping share one pass (lay out → draw and/or hit-test), so they can never disagree.
import { THEME, font } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text } from '../../../../core/ui/Kit.js';
import { FAMILIES, elementById, needsProblem, recipeProblems } from '../../data/elements.js';
import { SCOPES, AUDIO_PACKAGES, BUDGET_FOCUS, LEAD_ROLES, TITLE_WORDS } from '../../data/projects.js';
import { ROLES, STATS } from '../../data/staff.js';
import { portraitOf } from '../../data/portraits.js'; // Milestone 14: the same head crop everywhere
import { PROJECT_TYPES, projectTypeById } from '../../data/franchises.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const TITLE_MAX = 28;
const HARD_MIN = 2; // a game needs at least two leads; below a scope's usual team it is just slower (spec §9)

export function createNewProjectScreen({ layout, assets, world, topBar, openPicker, textPrompt, onStart, scopeOpen = () => true, scopeReason = () => null, estimate = null, dateLabel = (d) => `day ${d}`, today = () => 0, costPerDay = () => 0, franchises = null, unavailable = () => null, hints = () => [], onFindRole = null, laneWhy = () => null, comboHints = () => [], combosIn = () => [], engineChoices = () => [], engineEffects = () => null, deals = () => [], dealWhy = () => null, ipWhy = () => null, audioCost = () => 0 }) {
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
  // Milestone 10: project types.
  const ptype = () => projectTypeById(setup.type);
  const ip = () => (setup.ipId ? franchises?.byId(setup.ipId) : null);
  const withReleased = () => (franchises?.list() ?? []).filter((x) => franchises.stats(x).released > 0);
  const typeWhy = (t) => {
    if (t.needs === 'ip' && !withReleased().length) return 'Needs a released game';
    if (t.needs === 'entry' && !(franchises?.eligible(t.id).length)) return `Needs a game out ${t.id === 'remake' ? '2 years' : '1 year'}`;
    return null;
  };
  const locked = (family) => setup.type !== 'original' && ptype().locks.includes(family) && (setup.ipId || setup.source != null);
  const trimTitle = (s) => s.slice(0, TITLE_MAX);
  function setType(id) {
    if (typeWhy(projectTypeById(id))) return;
    setup.type = id;
    setup.ipId = null;
    setup.source = null;
  }
  function pickIp(x) {
    setup.ipId = x.id;
    if (setup.type === 'sequel') {
      setup.recipe.genre = x.genre;
      setup.title = trimTitle(`${x.name} ${x.entries.length + 1}`);
    } else if (setup.type === 'spinoff') {
      setup.recipe.theme = x.theme;
      if (setup.recipe.genre === x.genre) delete setup.recipe.genre;
    }
  }
  function pickEntry({ ip: x, record }) {
    setup.ipId = x.id;
    setup.source = record.number;
    for (const f of ptype().locks) setup.recipe[f] = record.result.recipe[f];
    if (setup.type === 'remaster') setup.scope = record.result.scope;
    setup.title = trimTitle(`${record.result.title} ${setup.type === 'remaster' ? 'Remastered' : 'Reborn'}`);
  }
  const missing = () => {
    const out = [];
    if (ptype().needs === 'ip' && !setup.ipId) out.push('a franchise');
    if (ptype().needs === 'entry' && setup.source == null) out.push('a game to redo');
    if (setup.type === 'spinoff' && ip() && setup.recipe.genre === ip().genre) out.push('a new genre for the spin-off');
    const empty = FAMILIES.filter((f) => !setup.recipe[f.id]).length;
    if (empty) out.push(`${empty} recipe slot${empty > 1 ? 's' : ''}`);
    else if (recipeProblems(setup.recipe).length) out.push('a recipe fix (see the red slot)');
    if (!setup.title.trim()) out.push('a title');
    const n = setup.team.length;
    const { max } = scope().team;
    if (!scopeOpen(setup.scope)) out.push('an open scope');
    if (laneWhy()) out.push(laneWhy()); // Milestone 13: every game lane busy
    if (setup.deal && dealWhy(setup.deal, setup)) out.push(dealWhy(setup.deal, setup).replace(/ wants /, ' wanting ')); // Milestone 17
    if (ipWhy(setup)) out.push(ipWhy(setup));
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

    // Project type (Milestone 10).
    const third0 = (cw - 40) / 3;
    const grid0 = (i) => ({ x: PAD + (i % 3) * (third0 + 20), y: y + Math.floor(i / 3) * 130, w: third0, h: 110 });
    heading('Project type', ptype().name);
    PROJECT_TYPES.forEach((t, i) => chip(grid0(i), t.name, setup.type === t.id, () => setType(t.id), { id: `type:${t.id}`, locked: !!typeWhy(t) }));
    y += Math.ceil(PROJECT_TYPES.length / 3) * 130 + 10;
    const whyLine = PROJECT_TYPES.filter((t) => typeWhy(t)).map((t) => `${t.name}: ${typeWhy(t).toLowerCase()}`).join(' · ');
    if (ctx) text(ctx, ptype().line, PAD, y, { size: S.small, color: C.text, maxWidth: cw });
    y += 48;
    if (whyLine) {
      if (ctx) text(ctx, whyLine, PAD, y, { size: S.small, color: C.textMuted, maxWidth: cw });
      y += 48;
    }
    y += 16;
    const row = (label, sub, on, onTap, id) => {
      const r = { x: PAD, y, w: cw, h: 120 };
      if (ctx) {
        ctx.fillStyle = on ? C.panelInfo : C.panelAlt;
        ctx.strokeStyle = on ? C.progress : C.line;
        ctx.lineWidth = on ? 5 : 3;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 22);
        ctx.fill();
        ctx.stroke();
        text(ctx, (on ? '✓ ' : '') + label, r.x + 24, r.y + 18, { size: S.body, bold: true, maxWidth: r.w - 48 });
        text(ctx, sub, r.x + 24, r.y + 70, { size: S.small, color: C.textMuted, maxWidth: r.w - 48 });
      }
      box(r, onTap, id);
      y += 136;
    };
    if (ptype().needs === 'ip') {
      heading('Franchise', 'tap to choose');
      for (const x of withReleased()) {
        const st = franchises.stats(x);
        row(x.name, `${st.status.name} · ${st.released} game${st.released === 1 ? '' : 's'} · fans ${Math.round(st.fanbase)} · fatigue ${Math.round(st.fatigue)}`, setup.ipId === x.id, () => pickIp(x), `ip:${x.id}`);
      }
      y += 20;
    } else if (ptype().needs === 'entry') {
      heading(setup.type === 'remake' ? 'Game to remake' : 'Game to remaster', 'tap to choose');
      for (const e of franchises.eligible(setup.type)) row(e.record.result.title, `${e.ip.name} · review ${e.record.release.score} · ${SCOPES.find((s) => s.id === e.record.result.scope)?.name ?? ''}`, setup.source === e.record.number, () => pickEntry(e), `entry:${e.record.number}`);
      y += 20;
    }

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
        else if (locked(f.id)) text(ctx, `Fixed by the ${ptype().name.toLowerCase()}`, r.x + 150, r.y + 108, { size: S.small, color: C.textMuted, maxWidth: r.w - 166 });
      }
      if (!locked(f.id)) box(r, () => openPicker(f.id), f.id);
    });
    y += 3 * 170 + 30;
    // Milestone 15: combo hints (a slot to change for an undiscovered combo; known combos by name).
    const hintSlots = comboHints(setup.recipe).map((h) => FAMILIES.find((f) => f.id === h.slot)?.name).filter(Boolean);
    const knownHere = combosIn(setup.recipe);
    const hintLines = [
      ...(knownHere.length ? [{ t: `Combo: ${knownHere.join(', ')}`, c: C.good }] : []),
      ...(hintSlots.length ? [{ t: `✨ This recipe feels close to something special… try a different ${hintSlots.join(' or ')}.`, c: C.purple }] : []),
    ];
    for (const l of hintLines) {
      if (ctx) text(ctx, l.t, PAD, y, { size: S.small, bold: true, color: l.c, maxWidth: cw });
      if (rects) rects[l.c === C.purple ? 'comboHint' : 'comboKnown'] = { x: PAD, y, w: cw, h: 50 };
      y += 60;
    }
    if (hintLines.length) y += 10;

    // Publisher (Milestone 17): only while a deal is signed and waiting for its game.
    const ds = deals();
    if (setup.deal && !ds.some((d) => d.id === setup.deal)) setup.deal = null;
    if (ds.length) {
      heading('Publisher', setup.deal ? ds.find((d) => d.id === setup.deal)?.label : 'Self-publish');
      const opts = [{ id: null, label: 'Self-publish' }, ...ds.map((d) => ({ id: d.id, label: d.short, scope: d.scope }))];
      const half = (cw - 20) / 2;
      opts.forEach((o, i) =>
        chip({ x: PAD + (i % 2) * (half + 20), y: y + Math.floor(i / 2) * 130, w: half, h: 110 }, o.label, setup.deal === o.id, () => {
          setup.deal = o.id;
          if (o.scope && scopeOpen(o.scope)) setup.scope = o.scope;
        }, { id: `deal:${o.id ?? 'self'}` }),
      );
      y += Math.ceil(opts.length / 2) * 130 + 10;
      const d = ds.find((x) => x.id === setup.deal);
      const why = d ? dealWhy(d.id, setup) : null;
      if (ctx) text(ctx, d ? why ?? d.terms : 'You keep every sale. Pick a signed deal to publish with it.', PAD, y, { size: S.small, color: why ? C.bad : d ? C.actionDark : C.textMuted, maxWidth: cw });
      y += 70;
    }
    // Engine (Milestone 16): only once the studio has one.
    const engs = engineChoices(setup.recipe.technology);
    if (engs.length) {
      if (setup.engine && !engs.some((e) => e.version.id === setup.engine && e.ok)) setup.engine = null;
      heading('Engine', setup.engine ? engs.find((e) => e.version.id === setup.engine)?.label : 'Licensed technology');
      const opts = [{ id: null, label: 'Licensed', ok: true }, ...engs.map((e) => ({ id: e.version.id, label: `${e.engine.name} ${e.version.label}`, ok: e.ok, why: e.why }))];
      const half = (cw - 20) / 2;
      opts.forEach((o, i) => chip({ x: PAD + (i % 2) * (half + 20), y: y + Math.floor(i / 2) * 130, w: half, h: 110 }, o.label, setup.engine === o.id, () => (setup.engine = o.id), { id: `engine:${o.id ?? 'licensed'}`, locked: !o.ok }));
      y += Math.ceil(opts.length / 2) * 130 + 10;
      const fx = setup.engine ? engineEffects(setup.engine, setup.recipe.technology) : null;
      const line = fx ? `Graphics ${fx.output.graphics >= 0 ? '+' : ''}${fx.output.graphics}, Polish ${fx.output.polish >= 0 ? '+' : ''}${fx.output.polish}, Innovation +${fx.output.innovation}, bugs ${fx.bugPct}%, progress +${fx.progressPct}%` : engs.find((e) => !e.ok)?.why ? `Some versions can't make this Technology: ${engs.find((e) => !e.ok).why.toLowerCase()}` : 'Licensed technology: no own-engine effects, no upkeep.';
      if (ctx) text(ctx, line, PAD, y, { size: S.small, color: fx ? C.actionDark : C.textMuted, maxWidth: cw });
      y += 70;
    }

    // Scope, audio, budget.
    // Scope: three to a row; locked ones greyed, why under them. Then this team's estimate and deadline.
    const third = (cw - 40) / 3;
    const grid = (i) => ({ x: PAD + (i % 3) * (third + 20), y: y + Math.floor(i / 3) * 130, w: third, h: 110 });
    heading('Scope');
    SCOPES.forEach((sc, i) => chip(grid(i), sc.name, setup.scope === sc.id, () => (setup.scope = sc.id), { id: `scope:${sc.id}`, locked: !scopeOpen(sc.id) || (setup.type === 'remaster' && setup.source != null && setup.scope !== sc.id) }));
    y += Math.ceil(SCOPES.length / 3) * 130 + 10;
    const firstLocked = SCOPES.find((sc) => !scopeOpen(sc.id));
    const lines = [{ t: scope().line, c: C.text }];
    if (estimate && setup.team.length) {
      const e = estimate(setup.team, setup.scope, setup.type);
      lines.push({ t: `This team: about ${Math.round(e.days)} days · due ${dateLabel(today() + e.deadlineDays)} · ${costPerDay(setup.scope, setup.budget, setup.type)} Credits a day`, c: C.actionDark });
    }
    if (setup.team.length < scope().team.min) lines.push({ t: `Short-staffed: ${scope().name} usually has ${scope().team.min}–${scope().team.max} people. It still works, just slower.`, c: C.bad });
    if (firstLocked) lines.push({ t: `${firstLocked.name} and up: ${scopeReason(firstLocked.id)?.replace('Needs', 'need') ?? 'locked'} and later stages.`, c: C.textMuted });
    for (const l of lines) {
      if (ctx) text(ctx, l.t, PAD, y, { size: S.small, color: l.c, maxWidth: cw });
      y += 48;
    }
    y += 24;
    heading('Audio package', AUDIO_PACKAGES.find((a) => a.id === setup.audio).line);
    // Milestone 18: four packages, two to a row, with their price.
    const halfA = (cw - 20) / 2;
    AUDIO_PACKAGES.forEach((a, i) => chip({ x: PAD + (i % 2) * (halfA + 20), y: y + Math.floor(i / 2) * 130, w: halfA, h: 110 }, audioCost(a.id) ? `${a.name} · ${audioCost(a.id).toLocaleString('en-GB')}` : a.name, setup.audio === a.id, () => (setup.audio = a.id), { id: `audio:${a.id}` }));
    y += (Math.ceil(AUDIO_PACKAGES.length / 2) - 1) * 130;
    y += 150; // chips are button height (110)
    heading('Budget focus');
    BUDGET_FOCUS.forEach((b, i) => chip(grid(i), b.name, setup.budget === b.id, () => (setup.budget = b.id), { id: `budget:${b.id}` }));
    y += Math.ceil(BUDGET_FOCUS.length / 3) * 130 + 10;
    if (ctx) text(ctx, `${BUDGET_FOCUS.find((b) => b.id === setup.budget).line} Changes wait for the next milestone.`, PAD, y, { size: S.small, color: C.textMuted, maxWidth: cw });
    y += 72;

    // Core team (Milestone 13: everyone, by role; busy people greyed; a missing role gets its hint).
    const { min, max } = scope().team;
    heading('Core team', `${scope().name}: ${min}–${max} leads · ${setup.team.length} chosen`);
    const roleHints = hints(setup.team, setup.scope);
    for (const role of LEAD_ROLES) {
      const people = world.staffSystem.staff.filter((s) => s.role === role);
      if (!people.length) {
        const h = roleHints.find((x) => x.role === role);
        const r = { x: PAD, y, w: cw, h: h ? 200 : 130 };
        if (ctx) {
          ctx.fillStyle = C.panelDim;
          ctx.strokeStyle = h ? C.warn : C.line;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(r.x, r.y, r.w, r.h, 22);
          ctx.fill();
          ctx.stroke();
          text(ctx, `${ROLES[role].name} lead`, r.x + 24, r.y + 18, { size: S.small, color: C.textMuted });
          text(ctx, h?.extraDays ? `No ${ROLES[role].name} yet: about ${h.extraDays} more day${h.extraDays === 1 ? '' : 's'} without one` : `No ${ROLES[role].name} yet (it still works, just slower)`, r.x + 24, r.y + 62, { size: S.body, color: h ? C.bad : C.textFaint, maxWidth: r.w - 48 });
        }
        if (h?.candidate && onFindRole) {
          const b = { x: r.x + 24, y: r.y + 112, w: r.w - 48, h: 72 };
          if (ctx) drawButton(ctx, b, `Meet ${h.candidate.name} at the Recruitment Desk`, { accent: C.progress, font: font(S.small, true) });
          box(b, () => onFindRole(role), `find:${role}`);
        }
        y += r.h + 20;
        continue;
      }
      for (const person of people) {
      const r = { x: PAD, y, w: cw, h: 130 };
      const busy = setup.team.includes(person.id) ? null : unavailable(person.id);
      const on = setup.team.includes(person.id);
      if (ctx) {
        ctx.fillStyle = on ? C.panelInfo : busy ? C.panelDim : C.panel;
        ctx.strokeStyle = on ? C.progress : C.line;
        ctx.lineWidth = on ? 5 : 3;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 22);
        ctx.fill();
        ctx.stroke();
        text(ctx, `${ROLES[role].name} lead`, r.x + 24, r.y + 18, { size: S.small, color: C.textMuted });
        if (person) {
          assets.drawCrop(ctx, person.art, portraitOf(person.art), { x: r.x + r.w - 130, y: r.y + 10, w: 110, h: 110 });
          text(ctx, person.name, r.x + 24, r.y + 58, { size: S.body, bold: true });
          const main = STATS.find((st) => st.key === ROLES[role].primaryStat);
          text(ctx, `${main.label} ${person.stats[main.key]}`, r.x + 340, r.y + 62, { size: S.body, color: C.actionDark, bold: true });
          text(ctx, on ? '✓ In the team' : busy ?? 'Tap to add', r.x + r.w - 150, r.y + r.h / 2, { size: S.small, bold: true, color: on ? C.progress : busy ? C.bad : C.textMuted, align: 'right', baseline: 'middle', maxWidth: 300 });
        }
      }
      if (person && !busy) box(r, () => (setup.team = on ? setup.team.filter((id) => id !== person.id) : [...setup.team, person.id]), person.id);
      y += 150;
      }
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
    setType,
    pickIp,
    pickEntry,
    get ready() {
      return missing().length === 0;
    },
    startRect,
    enter() {
      setup = { type: 'original', ipId: null, source: null, title: '', recipe: {}, scope: SCOPES[0].id, audio: AUDIO_PACKAGES[0].id, budget: BUDGET_FOCUS[0].id, team: [] };
      // Milestone 13: the free people, one per role first (the Milestone 3–12 default), up to the scope's usual team.
      const free = world.staffSystem.staff.filter((s) => !unavailable(s.id));
      const firsts = LEAD_ROLES.map((r) => free.find((s) => s.role === r)).filter(Boolean);
      setup.team = [...firsts, ...free.filter((s) => !firsts.includes(s))].map((s) => s.id).slice(0, SCOPES[0].team.max);
      scroll.scrollY = 0;
    },
    exit() {
      textPrompt.close();
    },
    choose(family, id) {
      if (locked(family)) return;
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
