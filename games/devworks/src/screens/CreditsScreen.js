// Credits (Milestone 40e, series common feature §2): Settings → Credits rolls the core CreditsRoll with the studio logo.
// Hold to speed it up; Back (or the phone's) leaves; it starts again when it reaches the end.
import { THEME, font } from '../../../../core/Theme.js';
import { CreditsRoll } from '../../../../core/ui/CreditsRoll.js';
import { drawButton, hitRect } from '../../../../core/ui/Button.js';

const C = THEME.color;
export const CREDITS_BLOCKS = [
  { gap: 80 },
  { image: 'studio_logo_banx_gamex', h: 260 },
  { gap: 40 },
  { image: 'dev_brand_01', h: 220 },
  { heading: 'DEVWORKS' },
  { line: 'A Banx Gamex game' },
  { line: 'Canvas Management Series' },
  { gap: 60 },
  { heading: 'Game design and art direction' },
  { line: 'Aaron' },
  { heading: 'Built with' },
  { line: 'Claude Code' },
  { heading: 'Friends from the series' },
  { line: 'BOTWORKS · RACEWORKS · GOALWORKS · CAREWORKS' },
  { gap: 60 },
  { line: 'Thank you for playing!', bold: true },
  { gap: 200 },
];

export function createCreditsScreen({ layout, assets, renderer, onBack }) {
  const roll = new CreditsRoll({ blocks: CREDITS_BLOCKS, speed: 110 });
  let held = false;
  const backRect = () => ({ x: layout.safeRect.x + 24, y: layout.safeRect.y + 24, w: 200, h: 110 });
  const area = () => {
    const s = layout.safeRect;
    return { x: s.x + 24, y: s.y + 160, w: s.w - 48, h: s.h - 200 };
  };
  return {
    roll,
    backRect,
    enter() {
      roll.restart();
      roll.offset = area().h * 0.55; // start with the logo already on its way up
    },
    update(dt) {
      roll.update(dt, { fast: held, viewHeight: area().h });
      if (roll.done) roll.restart();
    },
    onDown: () => (held = true),
    onUp: () => (held = false),
    onTap(p) {
      held = false;
      if (hitRect(p, backRect())) onBack();
    },
    render(ctx) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, renderer.width, renderer.height);
      roll.render(ctx, assets, area());
      drawButton(ctx, backRect(), '‹ Back', { accent: C.progress, font: font(THEME.size.button, true) });
    },
  };
}
