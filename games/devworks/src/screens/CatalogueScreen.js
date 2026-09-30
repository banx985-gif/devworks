// Catalogue (Milestone 4), from Business → Catalogue: every finished game, newest first — its cover (title drawn in
// code), review score, copies sold, revenue to date and status (Selling / Long tail, or Not released with a Release
// button). The studio's Fame, rank and Fan Trust sit at the top. Milestone 10: the Franchise Archive button (top right),
// each game's project type, and copies / Credits including the back catalogue. Drag scrolls; tap an unreleased game to release it.
import { THEME, font } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text } from '../../../../core/ui/Kit.js';
import { scopeById } from '../../data/projects.js';
import { projectTypeById } from '../../data/franchises.js';
import { drawCover } from '../ui/gameCard.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const ROW_H = 440; // Milestone 20: room for the post-launch line and the Support button (Milestone 34: a full-size button)
const HEAD_H = 190;

// Milestone 15: "Discoveries" under Franchises opens the Discovery Archive.
// Milestone 20: released games show their player score (after patches; the review never changes), what support did
// (Fan Trust, a longer tail, add-ons, ports) and a Support button.
export function createCatalogueScreen({ dateLabel = (d) => `day ${d}`, layout, assets, business, projects, topBar, openRelease, openArchive = null, openDiscoveries = null, openSupport = null }) {
  const supportRect = (row) => ({ x: row.x + 20, y: row.y + 314, w: 200, h: 110 });
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  const games = () => [...projects.catalogue.list()].reverse();
  // Content rect of a game's row, and of its Release button (unreleased only).
  const rowRect = (i, w) => ({ x: PAD - 8, y: HEAD_H + i * (ROW_H + 20), w: w - PAD * 2 + 16, h: ROW_H });
  const releaseRect = (row) => ({ x: row.x + row.w - 260, y: row.y + row.h - 130, w: 240, h: 110 });
  const archiveRect = (w) => ({ x: w - PAD - 290, y: PAD - 11, w: 290, h: 110 });
  const discoveriesRect = (w) => ({ x: w - PAD - 290 - 16 - 290, y: PAD - 11, w: 290, h: 110 });

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    text(ctx, 'Catalogue', PAD, PAD, { size: S.title, bold: true });
    if (openArchive) drawButton(ctx, archiveRect(w), 'Franchises', { accent: C.progress });
    if (openDiscoveries) drawButton(ctx, discoveriesRect(w), 'Discoveries', { accent: C.purple });
    text(ctx, `Rank ${business.rank.id} · ${business.fame.toLocaleString('en-GB')} Fame · Fan Trust ${Math.round(business.state.fanTrust)}`, PAD, PAD + 84, { size: S.body, color: C.textMuted, maxWidth: (openDiscoveries ? discoveriesRect(w).x : openArchive ? archiveRect(w).x : w) - PAD - 16 }); // (clear of the buttons)
    const list = games();
    if (!list.length) text(ctx, 'No games yet. Make one from Create → New Game.', PAD, HEAD_H, { size: S.body, color: C.textMuted, maxWidth: cw });
    list.forEach((rec, i) => {
      const r = rowRect(i, w);
      const g = rec.result;
      ctx.fillStyle = C.sheet;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      ctx.stroke();
      const cover = { x: r.x + 20, y: r.y + 20, w: 200, h: 288 };
      drawCover(ctx, assets, g.cover, g.title, cover);
      const tx = cover.x + cover.w + 30;
      const tw = r.x + r.w - 20 - tx;
      text(ctx, g.title, tx, r.y + 24, { size: S.heading, bold: true, maxWidth: tw });
      const status = business.statusOf(rec);
      const chip = { Selling: C.good, 'Long tail': C.progress, 'Not released': C.warn, Certifying: C.purple, 'Early Access': C.purple }[status];
      ctx.font = `bold ${S.small}px ${THEME.family}`;
      const chipW = ctx.measureText(status).width + 36;
      ctx.fillStyle = chip;
      ctx.beginPath();
      ctx.roundRect(tx, r.y + 88, chipW, 48, 24);
      ctx.fill();
      text(ctx, status, tx + chipW / 2, r.y + 112, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: C.textOnDark });
      // Milestone 7: scope and schedule (games from before it have no deadline).
      const sched = g.deadlineDay == null ? '' : g.lateDays ? ` · ${g.lateDays} days late` : ' · on time';
      const typeName = (g.type ?? 'original') === 'original' ? '' : `${projectTypeById(g.type).name} · `;
      text(ctx, `${typeName}${scopeById(g.scope)?.name ?? ''}${sched}`, tx + chipW + 16, r.y + 112, { size: S.small, bold: !!g.lateDays, color: g.lateDays ? C.bad : C.textMuted, baseline: 'middle', maxWidth: tw - chipW - 16 });
      if (rec.release) {
        assets.drawContained(ctx, 'dev_vfx_07', { x: tx, y: r.y + 150, w: 90, h: 52 });
        text(ctx, `Review ${rec.release.score}`, tx + 100, r.y + 176, { size: S.heading, bold: true, baseline: 'middle' });
        text(ctx, `${(rec.sales.copies + (rec.catalogue?.copies ?? 0)).toLocaleString('en-GB')} copies sold`, tx, r.y + 222, { size: S.body, maxWidth: tw });
        text(ctx, `${(rec.sales.revenue + (rec.catalogue?.revenue ?? 0)).toLocaleString('en-GB')} Credits earned`, tx, r.y + 266, { size: S.body, color: C.good, bold: true, maxWidth: tw });
        const sp = rec.support;
        const bits = sp ? [`Player score ${sp.playerScore}`, sp.trust ? `Fan Trust +${Math.round(sp.trust)}` : null, sp.tailPct ? `tail +${Math.round(sp.tailPct)}%` : null, sp.addons.length ? `${sp.addons.length} add-on${sp.addons.length === 1 ? '' : 's'}` : null, (rec.release.platforms?.length ?? 1) > 1 ? `on ${rec.release.platforms.length} platforms` : null, sp.ended ? 'support ended' : null].filter(Boolean) : ['No post-launch support yet'];
        text(ctx, bits.join(' · '), tx, r.y + 322, { size: S.small, color: sp ? C.purple : C.textMuted, bold: !!sp, maxWidth: tw });
        if (openSupport && !sp?.ended) drawButton(ctx, supportRect(r), 'Support', { accent: C.purple, font: font(S.small, true) });
      } else if (rec.cert) {
        // Milestone 8: in certification until its launch day.
        text(ctx, `In certification: launches ${dateLabel(rec.cert.launchDay)}`, tx, r.y + 160, { size: S.body, color: C.textMuted, maxWidth: tw });
        text(ctx, `${rec.cert.plan.platforms.map((x) => x.name).join(', ')}`, tx, r.y + 204, { size: S.small, color: C.textMuted, maxWidth: tw });
      } else if (rec.ea) {
        // Milestone 26: in Early Access until its full launch.
        text(ctx, `Early Access · month ${rec.ea.months} · ${g.bugs} bug${g.bugs === 1 ? '' : 's'} left`, tx, r.y + 160, { size: S.body, color: C.textMuted, maxWidth: tw });
        text(ctx, `${rec.ea.sales.copies.toLocaleString('en-GB')} early copies · ${rec.ea.sales.revenue.toLocaleString('en-GB')} Credits`, tx, r.y + 204, { size: S.small, color: C.textMuted, maxWidth: tw });
        drawButton(ctx, releaseRect(r), 'Launch');
      } else {
        text(ctx, `Finished, ${g.bugs} bug${g.bugs === 1 ? '' : 's'} left`, tx, r.y + 160, { size: S.body, color: C.textMuted, maxWidth: tw });
        drawButton(ctx, releaseRect(r), 'Release');
      }
    });
    return HEAD_H + list.length * (ROW_H + 20) + PAD;
  }

  const screen = {
    enter() {
      scroll.scrollY = 0;
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    // Screen rect of a game's Release button (tests), or null.
    releaseButton(number) {
      const i = games().findIndex((r) => r.number === number);
      if (i < 0) return null;
      const pr = panelRect();
      const b = releaseRect(rowRect(i, pr.w));
      return { x: pr.x + b.x, y: pr.y + b.y - scroll.scrollY, w: b.w, h: b.h };
    },
    // Screen rect of a released game's Support button (tests), or null.
    supportButton(number) {
      const i = games().findIndex((r) => r.number === number);
      if (i < 0) return null;
      const pr = panelRect();
      const b = supportRect(rowRect(i, pr.w));
      return { x: pr.x + b.x, y: pr.y + b.y - scroll.scrollY, w: b.w, h: b.h };
    },
    scrollToGame(number) {
      const i = games().findIndex((r) => r.number === number);
      if (i >= 0) {
        scroll.scrollY = rowRect(i, panelRect().w).y - 40;
        scroll.clamp();
      }
    },
    // Screen rect of the Franchises button (tests).
    archiveButton() {
      const pr = panelRect();
      const b = archiveRect(pr.w);
      return { x: pr.x + b.x, y: pr.y + b.y - scroll.scrollY, w: b.w, h: b.h };
    },
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const q = scroll.toContent(p);
      const w = panelRect().w;
      if (openArchive && hitRect(q, archiveRect(w))) return openArchive();
      if (openDiscoveries && hitRect(q, discoveriesRect(w))) return openDiscoveries();
      games().forEach((rec, i) => {
        const row = rowRect(i, w);
        if (!rec.release && !rec.cert && hitRect(q, row)) openRelease(rec.number);
        else if (rec.release && openSupport && !rec.support?.ended && hitRect(q, supportRect(row))) openSupport(rec.number);
      });
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
  return screen;
}
