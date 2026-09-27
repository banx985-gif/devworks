// Marketing Planner (Milestone 9), from Business → Marketing Planner, Create, or the Marketing Wall (F13): the game
// being marketed (the one in the works, or a finished one not launched yet — tabs when there are several), its Hype
// with what fans will expect, the campaigns running, every marketing action (cost, Hype, when it can run, or why not
// yet; tap one to run it), word of mouth, and the release calendar: competitor releases this month and the next two,
// the ones in the same genre as this game in red. Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text, tabRects, drawTabs, tabAt } from '../../../../core/ui/Kit.js';
import { WORD_OF_MOUTH, CONVENTIONS, MARKETING_STAGES, actionById } from '../../data/marketing.js';
import { elementById } from '../../data/elements.js';
import { fanExpectationFor } from '../systems/marketing.js';
import { drawCover } from '../ui/gameCard.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const ROW_H = 200;
const CAL_MONTHS = 3;

export function createMarketingScreen({ layout, assets, business, clock, topBar, openRun, dateLabel = (d) => `day ${d}` }) {
  const mk = business.marketing;
  let selected = null; // campaign key being shown
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  const target = () => {
    const list = mk.targets();
    return list.find((t) => t.key === selected) ?? list[0] ?? null;
  };
  // Content layout, worked out once per frame and kept for taps: tabs, action rows (with their Run buttons).
  let hits = { tabs: [], tabList: [], rows: [] };

  function stageLine(t) {
    if (t.record?.cert) return `In certification: launches ${dateLabel(t.record.cert.launchDay)}`;
    if (t.record) return 'Finished: waiting to be released';
    return `In the works: ${MARKETING_STAGES[t.stage]}`;
  }

  function meter(ctx, x, y, w, value, colour) {
    ctx.fillStyle = C.track;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 26, 13);
    ctx.fill();
    if (value > 0) {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(26, (w * Math.min(100, value)) / 100), 26, 13);
      ctx.fill();
    }
  }

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    let y = PAD;
    hits = { tabs: [], tabList: [], rows: [] };
    text(ctx, 'Marketing Planner', PAD, y, { size: S.title, bold: true });
    y += 84;
    assets.drawContained(ctx, 'dev_ui_19', { x: PAD, y: y - 6, w: 52, h: 52 });
    text(ctx, `Fan Trust ${Math.round(business.state.fanTrust)} · Rank ${business.rank.id}`, PAD + 64, y, { size: S.body, color: C.textMuted, maxWidth: cw - 64 });
    y += 70;
    const list = mk.targets();
    const t = target();
    if (list.length > 1) {
      const tabs = list.map((x) => ({ id: x.key, label: x.title }));
      const rects = tabRects({ x: PAD, y, w: cw }, tabs.length, 100);
      drawTabs(ctx, rects, tabs, t.key);
      hits.tabs = rects;
      hits.tabList = tabs;
      y += 120;
    }
    if (!t) {
      ctx.fillStyle = C.panelAlt;
      ctx.beginPath();
      ctx.roundRect(PAD - 8, y, cw + 16, 170, 24);
      ctx.fill();
      text(ctx, 'Nothing to market yet', PAD + 20, y + 30, { size: S.heading, bold: true, maxWidth: cw - 40 });
      text(ctx, 'Start a game from Create → New Game, then build its Hype here before it launches.', PAD + 20, y + 96, { size: S.small, color: C.textMuted, maxWidth: cw - 40 });
      y += 200;
    } else {
      // The game card: cover (or the project icon while it is made), stage, Hype meter and Fan Expectation.
      const hype = mk.hypeOf(t.key);
      const c = mk.campaign(t.key);
      const card = { x: PAD - 8, y, w: cw + 16, h: 330 };
      ctx.fillStyle = C.sheet;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(card.x, card.y, card.w, card.h, 24);
      ctx.fill();
      ctx.stroke();
      const cov = { x: card.x + 20, y: card.y + 20, w: 200, h: 288 };
      if (t.record) drawCover(ctx, assets, t.record.result.cover, t.title, cov);
      else {
        ctx.fillStyle = C.panelAlt;
        ctx.beginPath();
        ctx.roundRect(cov.x, cov.y, cov.w, cov.h, 20);
        ctx.fill();
        assets.drawContained(ctx, 'dev_ui_07', { x: cov.x + 20, y: cov.y + 50, w: cov.w - 40, h: cov.w - 40 });
      }
      const tx = cov.x + cov.w + 28;
      const tw = card.x + card.w - 20 - tx;
      text(ctx, t.title, tx, card.y + 22, { size: S.heading, bold: true, maxWidth: tw });
      const g = elementById(t.genre)?.name ?? '';
      text(ctx, `${stageLine(t)}${g ? ` · ${g}` : ''}`, tx, card.y + 82, { size: S.small, color: C.textMuted, maxWidth: tw });
      assets.drawContained(ctx, 'dev_ui_18', { x: tx, y: card.y + 126, w: 56, h: 56 });
      text(ctx, `Hype ${Math.round(hype)}`, tx + 68, card.y + 154, { size: S.heading, bold: true, baseline: 'middle', color: C.actionDark, maxWidth: tw - 68 });
      meter(ctx, tx, card.y + 196, tw, hype, C.action);
      text(ctx, `Fans will expect a review of about ${Math.round(fanExpectationFor(hype))}`, tx, card.y + 238, { size: S.small, color: C.text, maxWidth: tw });
      const running = c?.running ?? [];
      const runLine = running.length ? running.map((r) => `${actionById(r.id)?.name}: +${Math.round(r.gain - r.given)} to come`).join(' · ') : 'Hype fades a little every day until launch.';
      text(ctx, runLine, tx, card.y + 280, { size: S.small, color: running.length ? C.good : C.textMuted, bold: running.length > 0, maxWidth: tw });
      y += card.h + 36;

      // The actions.
      text(ctx, 'Marketing actions', PAD, y, { size: S.heading, bold: true });
      y += 70;
      for (const o of mk.options(t.key)) {
        const a = o.action;
        const r = { x: PAD - 8, y, w: cw + 16, h: ROW_H };
        const done = c?.done.includes(a.id);
        ctx.fillStyle = o.ok ? C.panelAlt : C.panelDim;
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 24);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        if (!o.ok && !done) ctx.globalAlpha = 0.55;
        assets.drawContained(ctx, a.art, { x: r.x + 16, y: r.y + 20, w: 150, h: 160 });
        ctx.restore();
        const bx = { x: r.x + r.w - 220, y: r.y + (r.h - 110) / 2, w: 200, h: 110 };
        const ax = r.x + 186;
        const aw = bx.x - 16 - ax;
        const conv = a.months ? ` (${CONVENTIONS[mk.monthOfYear()] ?? 'show months only'})` : '';
        text(ctx, a.name + (o.ok ? conv : ''), ax, r.y + 22, { size: S.heading, bold: true, maxWidth: aw });
        text(ctx, `${a.cost.toLocaleString('en-GB')} Credits · +${Math.round(o.gain)} Hype over ${a.days} days`, ax, r.y + 84, { size: S.small, bold: true, color: C.actionDark, maxWidth: aw });
        text(ctx, o.ok ? a.line : o.why, ax, r.y + 132, { size: S.small, color: o.ok ? C.textMuted : done ? C.good : C.bad, maxWidth: aw });
        if (o.ok) drawButton(ctx, bx, 'Run');
        else if (done) text(ctx, '✓ Done', bx.x + bx.w / 2, bx.y + bx.h / 2, { size: S.body, bold: true, color: C.good, align: 'center', baseline: 'middle' });
        hits.rows.push({ id: a.id, row: r, button: bx, ok: o.ok, key: t.key });
        y += ROW_H + 16;
      }
      // Word of mouth: what running none of them means.
      const r = { x: PAD - 8, y, w: cw + 16, h: 170 };
      ctx.fillStyle = C.panelInfo;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      assets.drawContained(ctx, WORD_OF_MOUTH.art, { x: r.x + 26, y: r.y + 25, w: 120, h: 120 });
      text(ctx, WORD_OF_MOUTH.name, r.x + 186, r.y + 22, { size: S.heading, bold: true, maxWidth: r.w - 206 });
      text(ctx, WORD_OF_MOUTH.line, r.x + 186, r.y + 84, { size: S.small, color: C.textMuted, maxWidth: r.w - 206 });
      y += r.h + 36;
    }

    // The release calendar: this month and the next ones.
    text(ctx, 'Release calendar', PAD, y, { size: S.heading, bold: true });
    y += 64;
    text(ctx, 'A big release in your genre in your launch month cuts your launch week.', PAD, y, { size: S.small, color: C.textMuted, maxWidth: cw });
    y += 56;
    const m0 = mk.monthOf();
    for (let k = 0; k < CAL_MONTHS; k++) {
      const m = m0 + k;
      const year = Math.floor(m / clock.monthsPerYear) + 1;
      const month = (m % clock.monthsPerYear) + 1;
      text(ctx, `Year ${year}, Month ${month}${k === 0 ? ' (this month)' : ''}`, PAD, y, { size: S.body, bold: true, color: C.progress, maxWidth: cw });
      y += 54;
      const comps = mk.competitors(m);
      if (!comps.length) {
        text(ctx, 'No competitor releases', PAD + 20, y, { size: S.small, color: C.textMuted, maxWidth: cw - 20 });
        y += 48;
      }
      for (const cp of comps) {
        const same = t && cp.genre === t.genre;
        text(ctx, `${cp.big ? 'BIG · ' : ''}${cp.title} — ${cp.studio} · ${elementById(cp.genre)?.name ?? cp.genre}${same ? ' · your genre!' : ''}`, PAD + 20, y, { size: S.small, bold: same || cp.big, color: same ? C.bad : C.text, maxWidth: cw - 20 });
        y += 48;
      }
      y += 12;
    }
    return y + PAD;
  }

  return {
    enter(params) {
      scroll.scrollY = 0;
      if (params?.key) selected = params.key;
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    get selected() {
      return target()?.key ?? null;
    },
    select(key) {
      selected = key;
    },
    // Screen rect of an action's Run button (tests), or null when it can't run now.
    runButton(id) {
      const h = hits.rows.find((x) => x.id === id && x.ok);
      if (!h) return null;
      const pr = panelRect();
      return { x: pr.x + h.button.x, y: pr.y + h.button.y - scroll.scrollY, w: h.button.w, h: h.button.h };
    },
    // Scroll so an action's row is in view (tests).
    scrollTo(id) {
      const h = hits.rows.find((x) => x.id === id);
      if (h) {
        scroll.scrollY = h.row.y - 40;
        scroll.clamp();
      }
    },
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const q = scroll.toContent(p);
      const tab = tabAt(q, hits.tabs, hits.tabList);
      if (tab) {
        selected = tab.id;
        return;
      }
      const h = hits.rows.find((x) => x.ok && hitRect(q, x.row));
      if (h) openRun(h.key, h.id);
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
