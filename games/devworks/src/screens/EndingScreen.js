// The Year-20 ceremony (Milestone 33, bible §56): a full-screen sequence that always plays when the campaign ends.
//   1. recap      the studio, the years, games shipped, the best game (its cover), awards, staff, consoles
//   2. scores     the nine categories fill in one by one (their bars and points)
//   3. grade      the letter, the total out of 1000 and the run's title
//   4. singularity  only if Studio Singularity (Milestone 31) was reached in this run: its scene (dev_event_19)
//   5. credits    the studio's people, then the end card with the Banx Gamex logo
//   6. offer      Keep playing (postgame: the years keep counting, no second ending) or Start New Game+ (dev_brand_06)
// A tap skips to the next step; Back does nothing until the offer (the ceremony can't be backed out of).
// Layout and tapping share one pass (lay out → draw and/or hit-test), so they never disagree.
import { THEME, font } from '../../../../core/Theme.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';
import { card, text, para } from '../../../../core/ui/Kit.js';
import { ENDING } from '../../data/ending.js';

const C = THEME.color;
const S = THEME.size;
const STEPS = ['recap', 'scores', 'grade', 'singularity', 'credits', 'offer'];
const BAND_COLOUR = { S: '#B8860B', A: '#2E7D32', B: '#1565C0', C: '#6A1B9A', D: '#8D6E63' };

// ending(): src/systems/ending.js; credits(): [{ heading, names: [] }]; onOffer(): the ceremony reached the offer (save);
// onContinue(): keep playing; onNgPlus(): open the NG+ setup.
export function createEndingScreen({ layout, assets, ending, credits = () => [], onOffer = () => {}, onContinue, onNgPlus, ngLevel = () => 1 }) {
  let step = 'recap';
  let t = 0;
  const P = ENDING.ceremony;
  const res = () => ending.result;
  const has = (s) => s !== 'singularity' || !!res()?.recap?.singularity;
  const duration = (s) => (s === 'recap' ? P.recapSec : s === 'scores' ? P.perCategorySec * ENDING.categories.length + 1 : s === 'grade' ? P.gradeSec : s === 'singularity' ? P.singularitySec : s === 'credits' ? P.creditsSec : Infinity);
  function go(s) {
    step = s;
    t = 0;
    if (s === 'offer') onOffer();
  }
  function next() {
    let i = STEPS.indexOf(step) + 1;
    while (i < STEPS.length && !has(STEPS[i])) i++;
    if (i < STEPS.length) go(STEPS[i]);
  }

  function pass(ctx, tap) {
    const sr = layout.safeRect;
    const cx = sr.x + sr.w / 2;
    const r = res();
    let hit = null;
    const box = (rect, fn, id) => {
      rects[id] = rect;
      if (tap && !hit && hitRect(tap, rect)) hit = fn;
    };
    if (ctx) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, sr.x * 2 + sr.w, sr.y * 2 + sr.h);
    }
    if (!r) return hit;
    const g = r.grade;
    const rc = r.recap;
    let y = sr.y + 60;
    if (ctx && step !== 'credits') {
      text(ctx, rc.ngPlus ? `YEAR 20 · NG+${rc.ngPlus}` : 'YEAR 20', cx, y, { size: S.small, bold: true, color: C.textMuted, align: 'center' });
      text(ctx, rc.studio, cx, y + 44, { size: S.title, bold: true, align: 'center', maxWidth: sr.w - 60 });
    }
    y += 140;
    const pad = 48;
    const w = sr.w - pad * 2;
    if (step === 'recap') {
      if (ctx) {
        text(ctx, 'Twenty years of games', cx, y, { size: S.heading, bold: true, color: C.actionDark, align: 'center' });
        const cover = rc.best?.cover;
        const cs = Math.min(420, sr.h * 0.25);
        if (cover && assets.has?.(cover)) assets.drawContained(ctx, cover, { x: cx - cs / 2, y: y + 80, w: cs, h: cs });
        let ly = y + 100 + (cover ? cs : 0);
        const k = Math.min(1, t / 0.4);
        ctx.save();
        ctx.globalAlpha = k;
        const lines = [
          `${rc.shipped} game${rc.shipped === 1 ? '' : 's'} shipped`,
          rc.best ? `Best: "${rc.best.title}" · reviewed ${rc.best.score}` : 'No game released',
          `${rc.awards} award${rc.awards === 1 ? '' : 's'} won · Rank ${rc.rank}`,
          `${rc.staff} people in the studio`,
          rc.consoles ? `${rc.consoles} console${rc.consoles === 1 ? '' : 's'} of your own` : 'No console of your own (and that is fine)',
        ];
        for (const l of lines) {
          text(ctx, l, cx, ly, { size: S.body, bold: true, align: 'center', maxWidth: w });
          ly += 64;
        }
        ctx.restore();
      }
    } else if (step === 'scores' || step === 'grade') {
      const rowH = Math.min(118, (sr.h - 620) / ENDING.categories.length);
      const shown = step === 'grade' ? ENDING.categories.length : Math.min(ENDING.categories.length, Math.floor(t / P.perCategorySec) + 1);
      g.categories.forEach((c, i) => {
        if (!ctx || i >= shown) return;
        const ry = y + i * rowH;
        const fill = step === 'grade' ? 1 : Math.min(1, (t - i * P.perCategorySec) / P.perCategorySec);
        text(ctx, c.name, sr.x + pad, ry, { size: S.small, bold: true, maxWidth: w - 200 });
        text(ctx, `${Math.round(c.score * fill)} / ${c.max}`, sr.x + pad + w, ry, { size: S.small, bold: true, align: 'right', color: C.actionDark });
        const by = ry + S.small * 1.4;
        ctx.fillStyle = C.track;
        ctx.fillRect(sr.x + pad, by, w, 18);
        ctx.fillStyle = C.progress;
        ctx.fillRect(sr.x + pad, by, (w * c.score * fill) / c.max, 18);
      });
      if (step === 'grade' && ctx) {
        const gy = y + ENDING.categories.length * rowH + 30;
        const k = Math.min(1, t / 0.5);
        ctx.save();
        ctx.globalAlpha = k;
        text(ctx, g.band, cx, gy, { size: 220 * (0.7 + 0.3 * k), bold: true, align: 'center', color: BAND_COLOUR[g.band] ?? C.text });
        text(ctx, `${g.total} / ${g.max}`, cx, gy + 240, { size: S.heading, bold: true, align: 'center' });
        text(ctx, r.title, cx, gy + 310, { size: S.heading, bold: true, align: 'center', color: C.actionDark, maxWidth: w });
        ctx.restore();
      }
    } else if (step === 'singularity') {
      if (ctx) {
        const s = Math.min(sr.w - 80, sr.h * 0.45);
        assets.drawContained(ctx, 'dev_event_19', { x: cx - s / 2, y, w: s, h: s });
        text(ctx, 'Studio Singularity', cx, y + s + 40, { size: S.title, bold: true, align: 'center', color: C.purple ?? C.actionDark });
        para(ctx, 'PROJECT ONE and PROJECT X in one run. The studio became something new.', sr.x + pad, y + s + 130, w, { align: 'center' });
      }
    } else if (step === 'credits') {
      if (ctx) {
        // The studio's people roll up; the end card (logo) settles in the middle.
        const list = credits();
        const lineH = 64;
        let total = 0;
        for (const b of list) total += 90 + b.names.length * lineH + 50;
        total += Math.min(150, (sr.w - 80) / 5); // the mascots
        // Rolls up so the end card (the logo) settles in the middle at 80% of the step, then holds there.
        const k = Math.min(1, t / (P.creditsSec * 0.8));
        const logoS = Math.min(sr.w - 160, 560);
        let cy2 = sr.y + sr.h - k * (total + 40 + sr.h / 2 + logoS / 2);
        for (const b of list) {
          if (cy2 > sr.y - 100 && cy2 < sr.y + sr.h) text(ctx, b.heading, cx, cy2, { size: S.small, bold: true, color: C.textMuted, align: 'center' });
          cy2 += 90;
          for (const n of b.names) {
            if (cy2 > sr.y - 100 && cy2 < sr.y + sr.h) text(ctx, n, cx, cy2, { size: S.body, bold: true, align: 'center', maxWidth: w });
            cy2 += lineH;
          }
          cy2 += 50;
        }
        // Milestone 37: the five mascots (Pixel Ghost, Code Fox, Bug Blob, and the BOTWORKS / RACEWORKS cameos) above the logo.
        const ms = Math.min(150, (sr.w - 80) / 5);
        ENDING.mascots.forEach((k, i) => assets.drawContained(ctx, k, { x: cx - (ms * 5) / 2 + i * ms, y: cy2 - 10, w: ms, h: ms }));
        cy2 += ms;
        const ly = cy2 + 40;
        if (assets.has?.(ENDING.logo)) assets.drawContained(ctx, ENDING.logo, { x: cx - logoS / 2, y: ly, w: logoS, h: logoS });
        else text(ctx, 'BANX GAMEX', cx, ly + logoS / 2, { size: S.title, bold: true, align: 'center' });
        text(ctx, 'Thanks for playing DEVWORKS', cx, ly + logoS + 30, { size: S.body, bold: true, align: 'center', color: C.textMuted });
        assets.drawContained(ctx, ENDING.seriesMark, { x: cx - 90, y: ly + logoS + 90, w: 180, h: 110 }); // the series end-card mark
      }
    } else if (step === 'offer') {
      const artS = Math.min(sr.w - 120, sr.h * 0.3);
      if (ctx) {
        text(ctx, `Grade ${g.band} · ${g.total} / ${g.max}`, cx, y, { size: S.heading, bold: true, align: 'center', color: BAND_COLOUR[g.band] ?? C.text });
        text(ctx, r.title, cx, y + 64, { size: S.body, bold: true, align: 'center', color: C.actionDark, maxWidth: w });
        assets.drawContained(ctx, ENDING.ngArt, { x: cx - artS / 2, y: y + 130, w: artS, h: artS });
      }
      let by = y + 160 + artS;
      const bw = sr.w - 120;
      const ng = { x: cx - bw / 2, y: by, w: bw, h: 150 };
      const cont = { x: cx - bw / 2, y: by + 180, w: bw, h: 150 };
      box(ng, () => onNgPlus(), 'ngplus');
      box(cont, () => onContinue(), 'continue');
      if (ctx) {
        drawButton(ctx, ng, `Start New Game+ (NG+${ngLevel()})`, { accent: C.action, font: font(S.button, true) });
        drawButton(ctx, cont, 'Keep playing this studio', { accent: C.progress, font: font(S.button, true) });
        text(ctx, 'New Game+ starts in another save slot: this run stays exactly as it is.', cx, cont.y + cont.h + 30, { size: S.small, color: C.textMuted, align: 'center', maxWidth: w });
      }
      return hit;
    }
    // Every step before the offer: a tap goes on (and a small "tap to continue").
    const skip = { x: sr.x, y: sr.y, w: sr.w, h: sr.h };
    box(skip, () => next(), 'skip');
    if (ctx && step !== 'credits') text(ctx, 'tap to continue', cx, sr.y + sr.h - 70, { size: S.small, color: C.textMuted, align: 'center' });
    return hit;
  }

  const rects = {};
  return {
    get step() {
      return step;
    },
    enter(params = {}) {
      // Back from the NG+ setup, or a reloaded save whose ceremony was already seen: straight to the offer.
      go(params.step ?? (ending.stage === 'offer' ? 'offer' : 'recap'));
    },
    update(dt) {
      t += dt;
      if (step !== 'offer' && t >= duration(step)) next();
    },
    onBack() {
      return true; // the ceremony can't be backed out of; the offer's two buttons are the way on
    },
    onTap(p) {
      pass(null, p)?.();
    },
    render(ctx) {
      pass(ctx, null);
    },
    skipTo: (s) => go(s),
    rectOf(id) {
      for (const k of Object.keys(rects)) delete rects[k];
      pass(null, null);
      return rects[id] ?? null;
    },
  };
}
