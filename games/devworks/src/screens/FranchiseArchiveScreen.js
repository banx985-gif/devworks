// Franchise Archive (Milestone 10, bible §6 / §18), from the Catalogue: every franchise, biggest first — its name (tap
// Rename to change it), status (New → Known → Popular → Major → Iconic → Legendary; Legendary shows the Franchise
// Crown), genre, games, copies and review average, the fanbase and fatigue meters, and its games' covers in release
// order. Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text } from '../../../../core/ui/Kit.js';
import { elementById } from '../../data/elements.js';
import { FRANCHISE_ART, projectTypeById } from '../../data/franchises.js';
import { drawCover } from '../ui/gameCard.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const CARD_H = 560;
const HEAD_H = 190;
const COVER = { w: 120, h: 172, gap: 16 };
const STATUS_COLOUR = { new: C.textMuted, known: C.progress, popular: C.good, major: C.purple, iconic: C.actionDark, legendary: C.gold };

export function createFranchiseArchiveScreen({ layout, assets, business, projects, topBar, textPrompt }) {
  const fr = business.franchises;
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  const rows = () =>
    fr
      .list()
      .map((ip) => ({ ip, st: fr.stats(ip) }))
      .sort((a, b) => b.st.points - a.st.points || a.ip.id.localeCompare(b.ip.id, 'en', { numeric: true }));
  const cardRect = (i, w) => ({ x: PAD - 8, y: HEAD_H + i * (CARD_H + 20), w: w - PAD * 2 + 16, h: CARD_H });
  const renameRect = (card) => ({ x: card.x + card.w - 220, y: card.y + 14, w: 200, h: 110 });
  const nameRect = (card) => ({ x: card.x + 20, y: card.y + 20, w: card.w - 260, h: 70 });

  function meter(ctx, x, y, w, label, value, colour, icon) {
    assets.drawContained(ctx, icon, { x, y: y - 6, w: 56, h: 56 });
    text(ctx, `${label} ${Math.round(value)}`, x + 66, y + 22, { size: S.small, bold: true, baseline: 'middle', maxWidth: 220 });
    const bx = x + 290;
    const bw = w - 290;
    ctx.fillStyle = C.track;
    ctx.beginPath();
    ctx.roundRect(bx, y + 9, bw, 26, 13);
    ctx.fill();
    if (value > 0) {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.roundRect(bx, y + 9, Math.max(26, (bw * Math.min(100, value)) / 100), 26, 13);
      ctx.fill();
    }
  }

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    const list = rows();
    text(ctx, 'Franchise Archive', PAD, PAD, { size: S.title, bold: true });
    text(ctx, list.length ? `${list.length} franchise${list.length === 1 ? '' : 's'} · every Original starts one` : 'No franchises yet: finish your first game.', PAD, PAD + 84, { size: S.body, color: C.textMuted, maxWidth: cw });
    list.forEach(({ ip, st }, i) => {
      const r = cardRect(i, w);
      const legendary = st.status.id === 'legendary';
      ctx.fillStyle = legendary ? C.panelGold : C.sheet;
      ctx.strokeStyle = legendary ? C.gold : C.line;
      ctx.lineWidth = legendary ? 6 : 3;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 24);
      ctx.fill();
      ctx.stroke();
      let nx = r.x + 20;
      if (legendary) {
        assets.drawContained(ctx, FRANCHISE_ART.crown, { x: nx, y: r.y + 14, w: 80, h: 80 });
        nx += 92;
      }
      text(ctx, ip.name, nx, r.y + 24, { size: S.heading, bold: true, maxWidth: r.w - 260 - (nx - r.x) });
      drawButton(ctx, renameRect(r), 'Rename', { accent: C.progress });
      // Status chip and the facts.
      ctx.font = `bold ${S.small}px ${THEME.family}`;
      const chipW = ctx.measureText(st.status.name).width + 36;
      ctx.fillStyle = STATUS_COLOUR[st.status.id] ?? C.progress;
      ctx.beginPath();
      ctx.roundRect(r.x + 20, r.y + 128, chipW, 48, 24);
      ctx.fill();
      text(ctx, st.status.name, r.x + 20 + chipW / 2, r.y + 152, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: C.textOnDark });
      const g = elementById(ip.genre)?.name ?? '';
      text(ctx, `${g} · ${st.released} game${st.released === 1 ? '' : 's'} out · ${st.copies.toLocaleString('en-GB')} copies${st.released ? ` · review avg ${Math.round(st.reviewAvg)}` : ''}`, r.x + 36 + chipW, r.y + 152, { size: S.small, color: C.textMuted, baseline: 'middle', maxWidth: r.w - chipW - 56 });
      meter(ctx, r.x + 20, r.y + 200, r.w - 40, 'Fans', st.fanbase, C.good, FRANCHISE_ART.archive);
      meter(ctx, r.x + 20, r.y + 262, r.w - 40, 'Fatigue', st.fatigue, st.fatigue >= 40 ? C.bad : C.warn, FRANCHISE_ART.fatigue);
      // The games, oldest first (as many as fit).
      const recs = ip.entries.map((n) => projects.catalogue.get(n)).filter(Boolean);
      const fit = Math.max(1, Math.floor((r.w - 40 + COVER.gap) / (COVER.w + COVER.gap)));
      const show = recs.length > fit ? recs.slice(recs.length - fit + 1) : recs;
      show.forEach((rec, k) => {
        const cr = { x: r.x + 20 + k * (COVER.w + COVER.gap), y: r.y + 330, w: COVER.w, h: COVER.h };
        drawCover(ctx, assets, rec.result.cover, '', cr);
        const t = projectTypeById(rec.result.type ?? 'original');
        text(ctx, rec.release ? `${t.name} · ${rec.release.score}` : t.name, cr.x + cr.w / 2, cr.y + cr.h + 12, { size: S.small, bold: true, color: C.textMuted, align: 'center', maxWidth: cr.w + COVER.gap - 4 });
      });
      if (recs.length > show.length) text(ctx, `+${recs.length - show.length} older`, r.x + r.w - 24, r.y + r.h - 20, { size: S.small, color: C.textMuted, align: 'right', baseline: 'bottom' });
    });
    return HEAD_H + list.length * (CARD_H + 20) + PAD;
  }

  function rename(ip, card) {
    const pr = panelRect();
    const nr = nameRect(card);
    textPrompt.open({ rect: { x: pr.x + nr.x, y: pr.y + nr.y - scroll.scrollY, w: nr.w, h: nr.h }, value: ip.name, maxLength: 28, placeholder: 'Franchise name', onDone: (v) => fr.rename(ip.id, v) });
  }

  return {
    rows,
    enter() {
      scroll.scrollY = 0;
    },
    exit() {
      textPrompt?.close();
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    // Screen rect of a franchise's Rename button (tests), or null.
    renameButton(id) {
      const i = rows().findIndex((x) => x.ip.id === id);
      if (i < 0) return null;
      const pr = panelRect();
      const b = renameRect(cardRect(i, pr.w));
      return { x: pr.x + b.x, y: pr.y + b.y - scroll.scrollY, w: b.w, h: b.h };
    },
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const q = scroll.toContent(p);
      const w = panelRect().w;
      rows().forEach(({ ip }, i) => {
        const card = cardRect(i, w);
        if (hitRect(q, renameRect(card))) rename(ip, card);
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
}
