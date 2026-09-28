// Engine Catalogue (Milestone 16, bible §19), from Create → Engines: the engine being built (phase, progress, team),
// then the studio's engine — its name (Rename), every version (newest first) with its tier, age and the eight
// attributes as bars (aged), and what a game gets from it — and one button per engine project (each opens its sheet
// to pick the team and start). Drag scrolls.
import { THEME } from '../../../../core/Theme.js';
import { ScrollPanel } from '../../../../core/ui/ScrollPanel.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text } from '../../../../core/ui/Kit.js';
import { ENGINE_ATTRS, ENGINE_TIERS, ENGINE_PROJECTS, ENGINE_BALANCE } from '../../data/engines.js';

const C = THEME.color;
const S = THEME.size;
const PAD = 32;
const ICON = 'dev_ui_11';

export function createEngineScreen({ layout, assets, engines, topBar, textPrompt, openProject, dateLabel = (d) => `day ${d}` }) {
  const panelRect = () => {
    const t = topBar.rect();
    const sr = layout.safeRect;
    const y = t.y + t.h + 16;
    return { x: sr.x + 16, y, w: sr.w - 32, h: sr.y + sr.h - 16 - y };
  };
  const scroll = new ScrollPanel({ getRect: panelRect });
  let hits = {};

  function bar(ctx, x, y, w, label, value) {
    text(ctx, label, x, y + 18, { size: S.small, baseline: 'middle', maxWidth: 300 });
    const bx = x + 310;
    const bw = w - 310 - 80;
    ctx.fillStyle = C.track;
    ctx.beginPath();
    ctx.roundRect(bx, y + 6, bw, 26, 13);
    ctx.fill();
    if (value > 0) {
      ctx.fillStyle = value >= 60 ? C.good : value >= 30 ? C.progress : C.warn;
      ctx.beginPath();
      ctx.roundRect(bx, y + 6, Math.max(26, (bw * value) / 100), 26, 13);
      ctx.fill();
    }
    text(ctx, String(value), x + w, y + 18, { size: S.small, bold: true, align: 'right', baseline: 'middle' });
  }

  function drawContent(ctx, w) {
    const cw = w - PAD * 2;
    hits = { projects: [], rename: null };
    let y = PAD;
    assets.drawContained(ctx, ICON, { x: PAD, y: y - 6, w: 90, h: 90 });
    text(ctx, 'Engines', PAD + 110, y, { size: S.title, bold: true });
    y += 110;
    const list = engines.engines;
    const act = engines.view();
    // Being built.
    if (act) {
      const card = { x: PAD - 8, y, w: cw + 16, h: 190 };
      ctx.fillStyle = C.panelInfo;
      ctx.beginPath();
      ctx.roundRect(card.x, card.y, card.w, card.h, 24);
      ctx.fill();
      text(ctx, `Building: ${act.name}`, card.x + 24, card.y + 22, { size: S.heading, bold: true, maxWidth: card.w - 48 });
      text(ctx, `${act.phase} · ${Math.floor(act.totalFrac * 100)}% · ${act.team.length} on it · ${act.cost.toLocaleString('en-GB')} Credits so far`, card.x + 24, card.y + 86, { size: S.small, color: C.textMuted, maxWidth: card.w - 48 });
      ctx.fillStyle = C.track;
      ctx.beginPath();
      ctx.roundRect(card.x + 24, card.y + 134, card.w - 48, 28, 14);
      ctx.fill();
      ctx.fillStyle = C.progress;
      ctx.beginPath();
      ctx.roundRect(card.x + 24, card.y + 134, Math.max(28, (card.w - 48) * act.totalFrac), 28, 14);
      ctx.fill();
      y += card.h + 24;
    } else if (!list.length) {
      text(ctx, 'No engine yet. Games use licensed technology. Build your own with the Programmers (at a Code Station, or the Engine Lab after 3D Rendering).', PAD, y, { size: S.body, color: C.textMuted, maxWidth: cw });
      y += 150;
    }
    // Engine projects.
    text(ctx, 'Engine projects', PAD, y, { size: S.heading, bold: true });
    y += 66;
    const half = (cw - 20) / 2;
    ENGINE_PROJECTS.forEach((p, i) => {
      const r = { x: PAD + (i % 2) * (half + 20), y: y + Math.floor(i / 2) * 130, w: half, h: 110 };
      const why = engines.startWhy(p.id);
      drawButton(ctx, r, p.name, { disabled: !!why && !/Credits$/.test(why), accent: C.progress });
      hits.projects.push({ id: p.id, r });
    });
    y += Math.ceil(ENGINE_PROJECTS.length / 2) * 130 + 20;
    // The engine and its versions.
    for (const e of list) {
      text(ctx, e.name, PAD, y, { size: S.heading, bold: true, maxWidth: cw - 260 });
      hits.rename = { id: e.id, r: { x: PAD + cw - 220, y: y - 16, w: 220, h: 90 }, nameR: { x: PAD, y: y - 10, w: cw - 260, h: 80 } };
      drawButton(ctx, hits.rename.r, 'Rename', { accent: C.progress });
      y += 90;
      for (const v of [...e.versions].reverse()) {
        const attrs = engines.aged(v);
        const newest = v === e.versions.at(-1);
        const h = 150 + ENGINE_ATTRS.length * 46;
        const card = { x: PAD - 8, y, w: cw + 16, h };
        ctx.fillStyle = newest ? C.panelGood : C.sheet;
        ctx.strokeStyle = newest ? C.good : C.line;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.w, card.h, 24);
        ctx.fill();
        ctx.stroke();
        const tier = ENGINE_TIERS.find((t) => t.tier === v.tier);
        text(ctx, `${v.label} · Tier ${v.tier}: ${tier.name}`, card.x + 24, card.y + 20, { size: S.body, bold: true, maxWidth: card.w - 48 });
        const worn = Object.keys(attrs).some((k) => attrs[k] < v.attrs[k]);
        text(ctx, `Built ${dateLabel(v.builtDay)}${worn ? ' · ageing' : ''}${newest ? ' · newest' : ' · still usable'} · upkeep ${(ENGINE_BALANCE.upkeep.base + ENGINE_BALANCE.upkeep.perTier * v.tier).toLocaleString('en-GB')} a month while in use`, card.x + 24, card.y + 76, { size: S.small, color: C.textMuted, maxWidth: card.w - 48 });
        ENGINE_ATTRS.forEach((a, k) => bar(ctx, card.x + 24, card.y + 130 + k * 46, card.w - 48, a.name, attrs[a.key]));
        y += h + 20;
      }
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
    exit() {
      textPrompt?.close();
    },
    onDragStart: (p) => scroll.beginDrag(p),
    onDrag: (p) => scroll.drag(p),
    onDragEnd: (p) => scroll.endDrag(p),
    onUp: (p) => scroll.endDrag(p),
    // Test hooks.
    projectButton: (id) => toScreen(hits.projects?.find((x) => x.id === id)?.r),
    renameButton: () => toScreen(hits.rename?.r),
    onTap(p) {
      if (topBar.handleTap(p) || !scroll.contains(p)) return;
      const q = scroll.toContent(p);
      const b = hits.projects.find((x) => hitRect(q, x.r));
      if (b) return openProject(b.id);
      if (hits.rename && hitRect(q, hits.rename.r)) {
        const nr = toScreen(hits.rename.nameR);
        const e = engines.engineById(hits.rename.id);
        textPrompt?.open({ rect: nr, value: e.name, maxLength: 24, placeholder: 'Engine name', onDone: (v) => engines.rename(e.id, v) });
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
      scroll.begin(ctx);
      scroll.contentHeight = drawContent(ctx, r.w);
      scroll.end(ctx);
      topBar.render(ctx);
    },
  };
}
