// Research (Milestone 12), from the Research button: RP (and what comes in a day), the topic being researched with its
// progress and Stop, then the six branches as tabs; each topic shows its tier and RP, its state (Done / Researching /
// Open / Locked), what it needs or what it opens (elements, facilities), and Start when it can start. ?debug=1 adds
// "finish this branch". Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text, tabRects, drawTabs, tabAt } from '../../../../core/ui/Kit.js';
import { BRANCHES, RESEARCH, researchById } from '../../data/research.js';
import { elementById } from '../../data/elements.js';
import { facilityById } from '../../data/facilities.js';
import { unlocksOf } from '../systems/research.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const ROW_H = 230;
const STATE = { done: ['Done', C.good], active: ['Researching', C.progress], available: ['Open', C.action], locked: ['Locked', C.textMuted] };

export function createResearchScreen({ layout, assets, research, topBar, debugFinish = null }) {
  let branch = BRANCHES[0].id;
  let hits = { tabs: [], rows: [], stop: null, debug: null };
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  const opensLine = (id) => {
    const list = unlocksOf(id).map((a) => (a.type === 'element' ? elementById(a.id)?.name : facilityById(a.id)?.name)).filter(Boolean);
    return list.length ? `Opens: ${list.join(', ')}` : id.startsWith('HW') ? 'Leads to your own hardware (later)' : 'Improves the studio (later milestones build on it)';
  };

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    let y = PAD;
    hits = { tabs: [], rows: [], stop: null, debug: null };
    text(ctx, 'Research', PAD, y, { size: S.title, bold: true });
    y += 84;
    assets.drawContained(ctx, 'dev_reward_03', { x: PAD, y: y - 8, w: 56, h: 56 });
    text(ctx, `${research.rp.toLocaleString('en-GB')} RP · about +${research.dailyRp().toFixed(1)} a day, more from each release`, PAD + 68, y, { size: S.body, color: C.textMuted, maxWidth: cw - 68 });
    y += 72;
    // The queue.
    const card = { x: PAD - 8, y, w: cw + 16, h: 200 };
    ctx.fillStyle = C.panelInfo;
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.w, card.h, 24);
    ctx.fill();
    const act = research.active;
    if (act) {
      const n = researchById(act);
      text(ctx, `Researching: ${n.name}`, card.x + 24, card.y + 22, { size: S.heading, bold: true, maxWidth: card.w - 290 });
      const d = research.daysLeft();
      text(ctx, `${Math.round(research.fraction(act) * 100)}% · about ${d === Infinity ? '?' : d} day${d === 1 ? '' : 's'} left`, card.x + 24, card.y + 86, { size: S.small, color: C.textMuted, maxWidth: card.w - 290 });
      ctx.fillStyle = C.track;
      ctx.beginPath();
      ctx.roundRect(card.x + 24, card.y + 140, card.w - 300, 28, 14);
      ctx.fill();
      ctx.fillStyle = C.progress;
      ctx.beginPath();
      ctx.roundRect(card.x + 24, card.y + 140, Math.max(28, (card.w - 300) * research.fraction(act)), 28, 14);
      ctx.fill();
      hits.stop = { x: card.x + card.w - 240, y: card.y + 45, w: 216, h: 110 };
      drawButton(ctx, hits.stop, 'Stop', { accent: C.bad });
    } else {
      text(ctx, 'Nothing being researched', card.x + 24, card.y + 30, { size: S.heading, bold: true, maxWidth: card.w - 48 });
      text(ctx, 'Pick an open topic below. Stopping later keeps its progress.', card.x + 24, card.y + 100, { size: S.small, color: C.textMuted, maxWidth: card.w - 48 });
    }
    y += card.h + 30;
    // Branch tabs.
    const tabs = BRANCHES.map((b) => ({ id: b.id, label: b.id }));
    hits.tabs = tabRects({ x: PAD, y, w: cw }, tabs.length, 100, 10);
    hits.tabList = tabs;
    drawTabs(ctx, hits.tabs, tabs, branch);
    y += 124;
    const b = BRANCHES.find((x) => x.id === branch);
    text(ctx, `${b.name}: ${b.line}`, PAD, y, { size: S.body, bold: true, maxWidth: cw });
    y += 60;
    for (const n of RESEARCH.filter((r) => r.branch === branch)) {
      const st = research.status(n.id);
      const r = { x: PAD - 8, y, w: cw + 16, h: ROW_H };
      ctx.fillStyle = st === 'locked' ? C.panelDim : st === 'done' ? C.panelGood : C.panelAlt;
      ctx.strokeStyle = st === 'active' ? C.progress : C.line;
      ctx.lineWidth = st === 'active' ? 5 : 3;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      ctx.stroke();
      const bx = { x: r.x + r.w - 220, y: r.y + r.h - 130, w: 200, h: 110 };
      const tw = r.w - 48;
      text(ctx, n.name, r.x + 24, r.y + 20, { size: S.heading, bold: true, maxWidth: tw - 230 });
      const [label, colour] = STATE[st];
      ctx.font = `bold ${S.small}px ${THEME.family}`;
      const chipW = ctx.measureText(label).width + 36;
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.roundRect(r.x + r.w - 20 - chipW, r.y + 22, chipW, 48, 24);
      ctx.fill();
      text(ctx, label, r.x + r.w - 20 - chipW / 2, r.y + 46, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: C.textOnDark });
      text(ctx, `Tier ${n.tier} · ${n.rp} RP`, r.x + 24, r.y + 80, { size: S.small, bold: true, color: C.actionDark, maxWidth: tw });
      const why = st === 'locked' ? research.why(n.id) : null;
      text(ctx, why ?? opensLine(n.id), r.x + 24, r.y + 126, { size: S.small, color: why ? C.bad : C.textMuted, maxWidth: st === 'available' ? tw - 230 : tw });
      if (st === 'available') {
        const can = !research.why(n.id);
        drawButton(ctx, bx, can ? 'Start' : `${n.rp} RP`, { disabled: !can || !!research.active });
        hits.rows.push({ id: n.id, button: bx, ok: can && !research.active });
      }
      y += ROW_H + 16;
    }
    if (debugFinish) {
      hits.debug = { x: PAD, y: y + 10, w: cw, h: 110 };
      drawButton(ctx, hits.debug, `Debug: finish the ${b.name} branch`, { accent: C.purple });
      y += 140;
    }
    return y + PAD;
  }

  const toScreen = (b) => {
    const pr = panelRect();
    return b ? { x: pr.x + b.x, y: pr.y + b.y - scroll.scrollY, w: b.w, h: b.h } : null;
  };
  return {
    enter() {
      scroll.scrollY = 0;
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    get branch() {
      return branch;
    },
    // Test hooks: screen rects of a branch tab, a topic's Start button, Stop.
    tabRect: (id) => toScreen(hits.tabs[BRANCHES.findIndex((b) => b.id === id)]),
    startButton: (id) => toScreen(hits.rows.find((x) => x.id === id && x.ok)?.button),
    stopButton: () => toScreen(hits.stop),
    scrollTo(id) {
      const h = hits.rows.find((x) => x.id === id);
      if (h) {
        scroll.scrollY = h.button.y - 300;
        scroll.clamp();
      }
    },
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const q = scroll.toContent(p);
      const tab = tabAt(q, hits.tabs, hits.tabList ?? []);
      if (tab) {
        branch = tab.id;
        return;
      }
      if (hits.stop && hitRect(q, hits.stop)) return research.stop();
      if (hits.debug && hitRect(q, hits.debug)) return debugFinish(branch);
      const h = hits.rows.find((x) => x.ok && hitRect(q, x.button));
      if (h) research.start(h.id);
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
      scroll.contentHeight = drawContent(ctx, r.w);
      scroll.end(ctx);
      topBar.render(ctx);
    },
  };
}
