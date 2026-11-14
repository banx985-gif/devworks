// Marketing Planner (Milestone 9), from Business → Marketing Planner, Create, or the Marketing Wall (F13): the game
// being marketed (the one in the works, or a finished one not launched yet — tabs when there are several), its Hype
// with what fans will expect, the campaigns running, every marketing action (cost, Hype, when it can run, or why not
// yet; tap one to run it), word of mouth, and the release calendar: competitor releases this month and the next two,
// the ones in the same genre as this game in red. Drag scrolls.
import { THEME, lineH } from '../../../../core/Theme.js';
import { isBig, fitLine, grow } from '../ui/bigText.js'; // Milestone 41i: big text on the Fold cover
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text, para, tabRects, drawTabs, tabAt } from '../../../../core/ui/Kit.js';
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
    text(ctx, 'Marketing Planner', PAD, y, { size: S.title, bold: true, maxWidth: cw });
    y += grow(84, lineH(S.title, 1.15) + 10);
    assets.drawContained(ctx, 'dev_ui_19', { x: PAD, y: y - 6, w: 52, h: 52 });
    y += fitLine(ctx, `Fan Trust ${Math.round(business.state.fanTrust)} · Rank ${business.rank.id}`, PAD + 64, y, cw - 64, { size: S.body, color: C.textMuted }, 70);
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
      const msg = 'Start a game from Create → New Game, then build its Hype here before it launches.';
      const eh = grow(170, 30 + lineH(S.heading, 1.2) + fitLine(null, msg, 0, 0, cw - 40, { size: S.small }, 0, 0) + 24);
      ctx.roundRect(PAD - 8, y, cw + 16, eh, 24);
      ctx.fill();
      text(ctx, 'Nothing to market yet', PAD + 20, y + 30, { size: S.heading, bold: true, maxWidth: cw - 40 });
      fitLine(ctx, msg, PAD + 20, isBig() ? y + 30 + lineH(S.heading, 1.2) : y + 96, cw - 40, { size: S.small, color: C.textMuted }, 0);
      y += eh + 30;
    } else {
      // The game card: cover (or the project icon while it is made), stage, Hype meter and Fan Expectation.
      const hype = mk.hypeOf(t.key);
      const c = mk.campaign(t.key);
      // Milestone 41i (big text): the card's lines by their real heights.
      const big = isBig();
      const LB = big ? (() => {
        const twB = cw + 16 - 20 - 160 - 28 - 20;
        const l1 = lineH(S.heading, 1.15);
        const l2 = para(null, 'x', 0, 0, twB, { size: S.small }) * 2;
        return { tw: twB, h: 22 + l1 + l2 + 70 + 40 + 2 * para(null, 'x', 0, 0, twB, { size: S.small }) * 2 + 30 };
      })() : null;
      const card = { x: PAD - 8, y, w: cw + 16, h: big ? Math.max(330, LB.h) : 330 };
      ctx.fillStyle = C.sheet;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(card.x, card.y, card.w, card.h, 24);
      ctx.fill();
      ctx.stroke();
      const cov = big ? { x: card.x + 20, y: card.y + 20, w: 160, h: 230 } : { x: card.x + 20, y: card.y + 20, w: 200, h: 288 };
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
      const g = elementById(t.genre)?.name ?? '';
      const running = c?.running ?? [];
      const runLine = running.length ? running.map((r) => `${actionById(r.id)?.name}: +${Math.round(r.gain - r.given)} to come`).join(' · ') : 'Hype fades a little every day until launch.';
      if (big) {
        let ty = card.y + 22;
        text(ctx, t.title, tx, ty, { size: S.heading, bold: true, maxWidth: tw });
        ty += lineH(S.heading, 1.15);
        ty += para(ctx, `${stageLine(t)}${g ? ` · ${g}` : ''}`, tx, ty, tw, { size: S.small, color: C.textMuted, maxLines: 2 }) + 8;
        assets.drawContained(ctx, 'dev_ui_18', { x: tx, y: ty, w: 56, h: 56 });
        text(ctx, `Hype ${Math.round(hype)}`, tx + 68, ty + 28, { size: S.heading, bold: true, baseline: 'middle', color: C.actionDark, maxWidth: tw - 68 });
        ty += 70;
        meter(ctx, tx, ty, tw, hype, C.action);
        ty += 40;
        ty += para(ctx, `Fans will expect a review of about ${Math.round(fanExpectationFor(hype))}`, tx, ty, tw, { size: S.small, maxLines: 2 }) + 6;
        para(ctx, runLine, tx, ty, tw, { size: S.small, color: running.length ? C.good : C.textMuted, bold: running.length > 0, maxLines: 2 });
      } else {
      text(ctx, t.title, tx, card.y + 22, { size: S.heading, bold: true, maxWidth: tw });
      text(ctx, `${stageLine(t)}${g ? ` · ${g}` : ''}`, tx, card.y + 82, { size: S.small, color: C.textMuted, maxWidth: tw });
      assets.drawContained(ctx, 'dev_ui_18', { x: tx, y: card.y + 126, w: 56, h: 56 });
      text(ctx, `Hype ${Math.round(hype)}`, tx + 68, card.y + 154, { size: S.heading, bold: true, baseline: 'middle', color: C.actionDark, maxWidth: tw - 68 });
      meter(ctx, tx, card.y + 196, tw, hype, C.action);
      text(ctx, `Fans will expect a review of about ${Math.round(fanExpectationFor(hype))}`, tx, card.y + 238, { size: S.small, color: C.text, maxWidth: tw });
      text(ctx, runLine, tx, card.y + 280, { size: S.small, color: running.length ? C.good : C.textMuted, bold: running.length > 0, maxWidth: tw });
      }
      y += card.h + 36;

      // The actions.
      text(ctx, 'Marketing actions', PAD, y, { size: S.heading, bold: true });
      y += 70;
      for (const o of mk.options(t.key)) {
        const a = o.action;
        const conv = a.months ? ` (${CONVENTIONS[mk.monthOfYear()] ?? 'show months only'})` : '';
        const done = c?.done.includes(a.id);
        if (big) {
          // Milestone 41i: name, cost, line on their own rows (wrapping); Run under them.
          const ax = PAD + 150;
          const aw = cw + 16 - 150 - 24;
          const nameH = para(null, a.name + (o.ok ? conv : ''), 0, 0, aw, { size: S.heading, bold: true, maxLines: 2, lead: 1.15 });
          const costT = `${a.cost.toLocaleString('en-GB')} Cr · +${Math.round(o.gain)} Hype · ${a.days} days`;
          const costH = para(null, costT, 0, 0, aw, { size: S.small, bold: true, maxLines: 2 });
          const lineT = o.ok ? a.line : o.why;
          const lineHt = para(null, lineT, 0, 0, aw, { size: S.small, maxLines: 3 });
          const btnH = Math.max(110, lineH(S.button, 1.6));
          const h = 20 + nameH + costH + lineHt + 16 + (o.ok || done ? btnH + 16 : 0) + 10;
          const r = { x: PAD - 8, y, w: cw + 16, h };
          ctx.fillStyle = o.ok ? C.panelAlt : C.panelDim;
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(r.x, r.y, r.w, r.h, 24);
          ctx.fill();
          ctx.stroke();
          ctx.save();
          if (!o.ok && !done) ctx.globalAlpha = 0.55;
          assets.drawContained(ctx, a.art, { x: r.x + 12, y: r.y + 20, w: 120, h: 130 });
          ctx.restore();
          let ty = r.y + 20;
          ty += para(ctx, a.name + (o.ok ? conv : ''), ax, ty, aw, { size: S.heading, bold: true, maxLines: 2, lead: 1.15 });
          ty += para(ctx, costT, ax, ty, aw, { size: S.small, bold: true, color: C.actionDark, maxLines: 2 });
          ty += para(ctx, lineT, ax, ty, aw, { size: S.small, color: o.ok ? C.textMuted : done ? C.good : C.bad, maxLines: 3 }) + 16;
          const bx = { x: ax, y: ty, w: Math.min(aw, 360), h: btnH };
          if (o.ok) drawButton(ctx, bx, 'Run');
          else if (done) text(ctx, '✓ Done', bx.x, bx.y + bx.h / 2, { size: S.body, bold: true, color: C.good, baseline: 'middle' });
          hits.rows.push({ id: a.id, row: r, button: bx, ok: o.ok, key: t.key });
          y += h + 16;
          continue;
        }
        const r = { x: PAD - 8, y, w: cw + 16, h: ROW_H };
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
        text(ctx, a.name + (o.ok ? conv : ''), ax, r.y + 22, { size: S.heading, bold: true, maxWidth: aw });
        text(ctx, `${a.cost.toLocaleString('en-GB')} Credits · +${Math.round(o.gain)} Hype over ${a.days} days`, ax, r.y + 84, { size: S.small, bold: true, color: C.actionDark, maxWidth: aw });
        text(ctx, o.ok ? a.line : o.why, ax, r.y + 132, { size: S.small, color: o.ok ? C.textMuted : done ? C.good : C.bad, maxWidth: aw });
        if (o.ok) drawButton(ctx, bx, 'Run');
        else if (done) text(ctx, '✓ Done', bx.x + bx.w / 2, bx.y + bx.h / 2, { size: S.body, bold: true, color: C.good, align: 'center', baseline: 'middle' });
        hits.rows.push({ id: a.id, row: r, button: bx, ok: o.ok, key: t.key });
        y += ROW_H + 16;
      }
      // Word of mouth: what running none of them means.
      const womH = big ? 22 + lineH(S.heading, 1.15) + para(null, WORD_OF_MOUTH.line, 0, 0, cw + 16 - 206, { size: S.small, maxLines: 4 }) + 24 : 170;
      const r = { x: PAD - 8, y, w: cw + 16, h: Math.max(170, womH) };
      ctx.fillStyle = C.panelInfo;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      assets.drawContained(ctx, WORD_OF_MOUTH.art, { x: r.x + 26, y: r.y + 25, w: 120, h: 120 });
      text(ctx, WORD_OF_MOUTH.name, r.x + 186, r.y + 22, { size: S.heading, bold: true, maxWidth: r.w - 206 });
      if (big) para(ctx, WORD_OF_MOUTH.line, r.x + 186, r.y + 22 + lineH(S.heading, 1.15), r.w - 206, { size: S.small, color: C.textMuted, maxLines: 4 });
      else text(ctx, WORD_OF_MOUTH.line, r.x + 186, r.y + 84, { size: S.small, color: C.textMuted, maxWidth: r.w - 206 });
      y += r.h + 36;
    }

    // The release calendar: this month and the next ones.
    text(ctx, 'Release calendar', PAD, y, { size: S.heading, bold: true });
    y += grow(64, lineH(S.heading, 1.2)); // Milestone 41i: rows by their real heights at big text
    y += fitLine(ctx, 'A big release in your genre in your launch month cuts your launch week.', PAD, y, cw, { size: S.small, color: C.textMuted }, 56);
    const m0 = mk.monthOf();
    for (let k = 0; k < CAL_MONTHS; k++) {
      const m = m0 + k;
      const year = Math.floor(m / clock.monthsPerYear) + 1;
      const month = (m % clock.monthsPerYear) + 1;
      text(ctx, `Year ${year}, Month ${month}${k === 0 ? ' (this month)' : ''}`, PAD, y, { size: S.body, bold: true, color: C.progress, maxWidth: cw });
      y += grow(54, lineH(S.body, 1.25));
      const comps = mk.competitors(m);
      if (!comps.length) {
        y += fitLine(ctx, 'No competitor releases', PAD + 20, y, cw - 20, { size: S.small, color: C.textMuted }, 48, 8);
      }
      for (const cp of comps) {
        const same = t && cp.genre === t.genre;
        y += fitLine(ctx, `${cp.big ? 'BIG · ' : ''}${cp.title} — ${cp.studio} · ${elementById(cp.genre)?.name ?? cp.genre}${same ? ' · your genre!' : ''}`, PAD + 20, y, cw - 20, { size: S.small, bold: same || cp.big, color: same ? C.bad : C.text }, 48, 8);
      }
      y += isBig() ? 24 : 12;
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
