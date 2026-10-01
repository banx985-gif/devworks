// The live build panel (Milestone 40b, Aaron's play-feel notes §3): while a game is made, a panel docked above the
// bottom bar so you watch it being built while you watch the studio.
//   expanded: the genre icon, the title, a 1–5 star row (the review it would get now), the seven outputs as big numbers
//     that count up (each gain floats a "+N"), the bug counter (up as bugs are found, down as they are fixed) and a
//     progress bar with the five milestone markers; ‹ › switch games when several lanes are running
//   collapsed: one slim bar (title, progress, bugs, stars)
//   points fly from a worker on the team to the stat they raised (pooled: at most LIVE_BUILD.maxFlies at once)
//   banners over the panel: "Bugs found!", "Breakthrough!", and a big "Finished!" (milestones keep their beat)
//   speech bubbles over the team (data/banter.js): at most two, never over the panel
// Tapping the panel opens the Project screen; ▾ / ▴ collapses / expands it. Only on the studio screen.
import { THEME, font } from '../../../../core/Theme.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { text } from '../../../../core/ui/Kit.js';
import { BANTER, LIVE_BUILD as L } from '../../data/banter.js';
import { PROJECT_BALANCE } from '../../data/balance.js';
import { elementById } from '../../data/elements.js';
import { reviewGame } from '../systems/reviews.js';

const C = THEME.color;
const S = THEME.size;
export const STAT_TILES = [
  { key: 'gameplay', short: 'Gameplay' },
  { key: 'graphics', short: 'Graphics' },
  { key: 'story', short: 'Story' },
  { key: 'audio', short: 'Audio' },
  { key: 'innovation', short: 'Innov.' },
  { key: 'polish', short: 'Polish' },
  { key: 'audienceFit', short: 'Fit' },
];
// The five milestone markers: where each phase ends along the whole game (by its share of the work).
export const MARKERS = (() => {
  let t = 0;
  return PROJECT_BALANCE.phases.map((p) => (t += p.share));
})();
export const starsFor = (score) => Math.max(1, Math.min(5, Math.round(score / 20)));

export function createLiveBuildPanel({ bus, layout, assets, projects, bottomBar, studio, fanExpectation = () => 10, reducedMotion = () => false, onOpen = () => {}, random = Math.random }) {
  const state = { collapsed: false, lane: 0 };
  const shown = new Map(); // job id → { outputs (counting), bugs, target outputs }
  const pluses = []; // { key, n, t }
  const flies = []; // { x0, y0, key, n, t }
  const bubbles = []; // { id, line, t }
  let banner = null; // { title, big, t }
  let sinceBug = 99;
  let sinceBubble = 99;
  let review = { key: '', score: 0 };
  const log = { banners: [], bubbles: 0, flies: 0 }; // tests

  const jobs = () => projects.jobs;
  const job = () => jobs()[Math.min(state.lane, jobs().length - 1)] ?? null;
  const visible = () => !!job();
  const rect = () => {
    const sr = layout.safeRect;
    const b = bottomBar.rect();
    const h = state.collapsed ? 104 : 392;
    return { x: sr.x + 16, y: b.y - 14 - h, w: sr.w - 32, h };
  };
  const toggleRect = () => {
    const r = rect();
    return { x: r.x + r.w - 104, y: r.y + 12, w: 88, h: 80 };
  };
  const laneRects = () => {
    const r = rect();
    return { prev: { x: r.x + r.w - 300, y: r.y + 12, w: 88, h: 80 }, next: { x: r.x + r.w - 200, y: r.y + 12, w: 88, h: 80 } };
  };
  const tileRect = (i) => {
    const r = rect();
    const w = (r.w - 32 - 6 * 10) / 7;
    return { x: r.x + 16 + i * (w + 10), y: r.y + 112, w, h: 132 };
  };
  const barRect = () => {
    const r = rect();
    return state.collapsed ? { x: r.x + 24, y: r.y + r.h - 34, w: r.w - 48 - 300, h: 18 } : { x: r.x + 24, y: r.y + 290, w: r.w - 48 - 200, h: 26 };
  };

  function say(kind, member = null) {
    if (sinceBubble < L.bubbleGap || !studio) return false;
    const j = job();
    if (!j) return false;
    const ids = member ? [member] : [...j.slots].sort(() => random() - 0.5);
    for (const id of ids) {
      const at = studio.headOnScreen(id);
      if (!at || at.y > rect().y - 80) continue; // never over the panel
      if (bubbles.some((b) => b.id === id)) continue;
      if (bubbles.length >= L.maxBubbles) bubbles.shift();
      const lines = BANTER[kind];
      bubbles.push({ id, line: lines[Math.floor(random() * lines.length)], t: 0 });
      sinceBubble = 0;
      log.bubbles++;
      return true;
    }
    return false;
  }
  function showBanner(title, big = false) {
    banner = { title, big, t: 0 };
    log.banners.push(title);
    if (log.banners.length > 20) log.banners.shift();
  }

  bus.on('project:start', ({ job: j } = {}) => {
    state.lane = Math.max(0, jobs().indexOf(j));
    say('start');
  });
  bus.on('project:bug', ({ job: j }) => {
    if (j !== job()) return;
    if (sinceBug >= L.bugBannerGap) {
      showBanner('Bugs found!');
      sinceBug = 0;
    }
    say('bug');
  });
  bus.on('project:breakthrough', ({ job: j }) => {
    if (j !== job()) return;
    showBanner('Breakthrough!');
    say('breakthrough');
  });
  bus.on('project:phase', ({ job: j }) => j === job() && say('phase'));
  bus.on('project:complete', () => showBanner('Finished!', true));

  // The predicted review for the stars: the review contract on the outputs so far (cached by its inputs).
  function predicted(v) {
    const key = `${v.title}|${JSON.stringify(v.outputs)}|${v.bugs}`;
    if (review.key !== key) review = { key, score: reviewGame({ title: v.title, outputs: v.outputs, bugs: v.bugs, scope: v.scope, recipe: v.recipe, reviewSeed: 1 }, { fanExpectation: fanExpectation() }).score };
    return review.score;
  }

  function update(dt) {
    sinceBug += dt;
    sinceBubble += dt;
    if (banner && (banner.t += dt) > L.bannerSec * (banner.big ? 1.4 : 1)) banner = null;
    for (const b of bubbles) b.t += dt;
    while (bubbles.length && bubbles[0].t > L.bubbleSec) bubbles.shift();
    for (const p of pluses) p.t += dt;
    while (pluses.length && pluses[0].t > L.plusSec) pluses.shift();
    for (const f of flies) f.t += dt;
    for (let i = flies.length - 1; i >= 0; i--) {
      if (flies[i].t >= L.flySec) {
        pluses.push({ key: flies[i].key, n: flies[i].n, t: 0 });
        flies.splice(i, 1);
      }
    }
    const j = job();
    if (!j) return;
    const v = projects.view(j);
    let s = shown.get(j.id);
    if (!s) shown.set(j.id, (s = { outputs: { ...v.outputs }, bugs: v.bugs, target: { ...v.outputs }, nearly: false }));
    // Gains: the target moves at once; the shown number counts up to it; a point flies from a worker on the team.
    for (const { key } of STAT_TILES) {
      const gain = (v.outputs[key] ?? 0) - (s.target[key] ?? 0);
      if (gain > 0) {
        const from = !reducedMotion() && studio ? j.slots.map((id) => studio.headOnScreen(id)).find(Boolean) : null;
        if (from && flies.length < L.maxFlies) {
          flies.push({ x0: from.x, y0: from.y, key, n: gain, t: 0 });
          log.flies++;
        } else pluses.push({ key, n: gain, t: 0 });
      }
      s.target[key] = v.outputs[key] ?? 0;
      const d = s.target[key] - s.outputs[key];
      s.outputs[key] = Math.abs(d) < 0.5 ? s.target[key] : s.outputs[key] + d * Math.min(1, dt * 6);
    }
    s.bugs = v.bugs;
    if (!s.nearly && v.totalFrac >= L.nearlyAt) {
      s.nearly = true;
      say('nearly');
    }
    for (const id of [...shown.keys()]) if (!jobs().some((x) => x.id === id)) shown.delete(id);
  }

  function drawStars(ctx, x, y, n, size) {
    for (let i = 0; i < 5; i++) {
      const cx = x + i * (size + 6) + size / 2;
      const cy = y + size / 2;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 ? size * 0.22 : size * 0.5;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = i < n ? C.gold : 'rgba(0,0,0,0.12)';
      ctx.fill();
    }
  }
  function drawBar(ctx, br, frac) {
    ctx.fillStyle = C.track;
    ctx.beginPath();
    ctx.roundRect(br.x, br.y, br.w, br.h, br.h / 2);
    ctx.fill();
    ctx.fillStyle = C.action;
    ctx.beginPath();
    ctx.roundRect(br.x, br.y, Math.max(br.h, br.w * Math.min(1, frac)), br.h, br.h / 2);
    ctx.fill();
    // The five milestone markers.
    MARKERS.forEach((m, i) => {
      const mx = br.x + br.w * Math.min(1, m);
      ctx.fillStyle = frac >= m - 1e-6 ? C.good : C.outline;
      ctx.beginPath();
      ctx.arc(Math.min(mx, br.x + br.w - br.h / 2), br.y + br.h / 2, br.h * 0.62, 0, Math.PI * 2);
      ctx.fill();
      if (frac >= m - 1e-6) text(ctx, '✓', Math.min(mx, br.x + br.w - br.h / 2), br.y + br.h / 2, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: '#FFFFFF' });
      void i;
    });
  }
  function drawBugs(ctx, x, y, n, size) {
    assets.drawContained(ctx, 'dev_vfx_01', { x, y: y - size / 2, w: size, h: size });
    text(ctx, String(n), x + size + 8, y, { size: S.heading, bold: true, baseline: 'middle', color: n ? C.bad : C.good });
  }

  function render(ctx) {
    const j = job();
    if (!j) return;
    const v = projects.view(j);
    const s = shown.get(j.id) ?? { outputs: v.outputs, bugs: v.bugs };
    const r = rect();
    const score = predicted(v);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 249, 236, 0.97)';
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = THEME.panel.line;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, THEME.panel.radius);
    ctx.fill();
    ctx.stroke();
    const genre = elementById(v.recipe?.genre);
    if (state.collapsed) {
      if (genre) assets.drawContained(ctx, genre.art, { x: r.x + 18, y: r.y + 12, w: 56, h: 56 });
      text(ctx, v.title, r.x + 88, r.y + 18, { size: S.body, bold: true, maxWidth: r.w - 88 - 420 });
      drawStars(ctx, r.x + r.w - 410, r.y + 22, starsFor(score), 34);
      drawBugs(ctx, r.x + r.w - 220, r.y + 40, s.bugs, 40);
      drawBar(ctx, barRect(), v.totalFrac);
    } else {
      if (genre) assets.drawContained(ctx, genre.art, { x: r.x + 18, y: r.y + 14, w: 80, h: 80 });
      const multi = jobs().length > 1;
      text(ctx, v.title, r.x + 112, r.y + 16, { size: S.heading, bold: true, maxWidth: r.w - 112 - (multi ? 330 : 130) });
      text(ctx, `${v.phaseName} · ${Math.floor(v.totalFrac * 100)}%`, r.x + 112, r.y + 66, { size: S.small, bold: true, color: C.actionDark, maxWidth: r.w - 112 - (multi ? 330 : 130) - 230 });
      drawStars(ctx, r.x + r.w - (multi ? 330 : 130) - 230, r.y + 60, starsFor(score), 38);
      if (multi) {
        const lr = laneRects();
        drawButton(ctx, lr.prev, '‹', { accent: C.progress, font: font(S.heading, true) });
        drawButton(ctx, lr.next, '›', { accent: C.progress, font: font(S.heading, true) });
      }
      STAT_TILES.forEach((t, i) => {
        const tr = tileRect(i);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(58, 42, 30, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(tr.x, tr.y, tr.w, tr.h, 18);
        ctx.fill();
        ctx.stroke();
        text(ctx, t.short, tr.x + tr.w / 2, tr.y + 12, { size: S.small, bold: true, align: 'center', color: C.textMuted, maxWidth: tr.w - 8 });
        text(ctx, String(Math.round(s.outputs[t.key] ?? 0)), tr.x + tr.w / 2, tr.y + 54, { size: S.title, bold: true, align: 'center', color: C.text, maxWidth: tr.w - 8 });
      });
      drawBar(ctx, barRect(), v.totalFrac);
      const br = barRect();
      drawBugs(ctx, br.x + br.w + 40, br.y + br.h / 2, s.bugs, 52);
    }
    drawButton(ctx, toggleRect(), state.collapsed ? '▴' : '▾', { accent: C.outline, font: font(S.heading, true) });
    // "+N" next to the stats.
    if (!state.collapsed) {
      for (const p of pluses) {
        const i = STAT_TILES.findIndex((t) => t.key === p.key);
        const tr = tileRect(i);
        ctx.globalAlpha = Math.max(0, 1 - p.t / L.plusSec);
        text(ctx, `+${p.n}`, tr.x + tr.w - 10, tr.y + 92 - p.t * 36, { size: S.small, bold: true, align: 'right', color: C.good });
        ctx.globalAlpha = 1;
      }
    }
    // Points flying from a worker to their stat.
    for (const f of flies) {
      const i = STAT_TILES.findIndex((t) => t.key === f.key);
      const tr = state.collapsed ? barRect() : tileRect(i);
      const k = Math.min(1, f.t / L.flySec);
      const e = k * k * (3 - 2 * k);
      const x = f.x0 + (tr.x + tr.w / 2 - f.x0) * e;
      const y = f.y0 + (tr.y + 20 - f.y0) * e - Math.sin(Math.PI * k) * 120;
      ctx.fillStyle = C.gold;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Speech bubbles over the team.
    for (const b of bubbles) {
      const at = studio?.headOnScreen(b.id);
      if (!at || at.y > r.y - 80) continue;
      const a = Math.min(1, b.t / 0.2, (L.bubbleSec - b.t) / 0.3);
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = font(S.small, true);
      const w = Math.min(ctx.measureText(b.line).width + 36, 520);
      const bx = Math.max(layout.safeRect.x + 8, Math.min(at.x - w / 2, layout.safeRect.x + layout.safeRect.w - w - 8));
      const by = at.y - 120;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bx, by, w, 64, 26);
      ctx.moveTo(at.x - 14, by + 62);
      ctx.lineTo(at.x, by + 84);
      ctx.lineTo(at.x + 14, by + 62);
      ctx.fill();
      ctx.stroke();
      text(ctx, b.line, bx + w / 2, by + 32, { size: S.small, bold: true, align: 'center', baseline: 'middle', color: C.text, maxWidth: w - 24 });
      ctx.globalAlpha = 1;
    }
    // The banner over the panel.
    if (banner) {
      const k = banner.t;
      const life = L.bannerSec * (banner.big ? 1.4 : 1);
      const pop = Math.min(1, k / 0.18);
      ctx.globalAlpha = Math.min(1, (life - k) / 0.3);
      const size = banner.big ? S.major : S.heading;
      ctx.font = font(size, true);
      const w = ctx.measureText(banner.title).width + 64;
      const bx = r.x + r.w / 2 - w / 2;
      const by = r.y - (banner.big ? 150 : 110);
      ctx.translate(r.x + r.w / 2, by + 40);
      ctx.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop);
      ctx.translate(-(r.x + r.w / 2), -(by + 40));
      ctx.fillStyle = banner.big ? C.good : banner.title.startsWith('Bugs') ? C.bad : C.purple;
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(bx, by, w, banner.big ? 108 : 84, 30);
      ctx.fill();
      ctx.stroke();
      text(ctx, banner.title, r.x + r.w / 2, by + (banner.big ? 54 : 42), { size, bold: true, align: 'center', baseline: 'middle', color: '#FFFFFF' });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function onTap(p) {
    if (!visible() || !hitRect(p, rect())) return false;
    if (hitRect(p, toggleRect())) state.collapsed = !state.collapsed;
    else if (!state.collapsed && jobs().length > 1 && hitRect(p, laneRects().prev)) state.lane = (state.lane + jobs().length - 1) % jobs().length;
    else if (!state.collapsed && jobs().length > 1 && hitRect(p, laneRects().next)) state.lane = (state.lane + 1) % jobs().length;
    else onOpen(job().id);
    return true;
  }

  return {
    state,
    log,
    rect,
    toggleRect,
    laneRects,
    tileRect,
    get visible() {
      return visible();
    },
    get bubbles() {
      return bubbles;
    },
    get flies() {
      return flies;
    },
    get banner() {
      return banner;
    },
    shownOf: (id) => shown.get(id) ?? null,
    predicted: () => (job() ? predicted(projects.view(job())) : null),
    contains: (p) => visible() && hitRect(p, rect()),
    say,
    update,
    render,
    onTap,
  };
}
