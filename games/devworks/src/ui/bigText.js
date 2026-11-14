// Milestone 41i (Larger = 1.8× on the Fold cover): small helpers for screens that draw one-line text at fixed spots.
//   isBig()                      the big-text layout is on (text size 1.6× or more: "Larger")
//   fitLine(ctx, str, x, y, w, opts, step)   draws one line and returns `step` (Normal / Large: exactly as before);
//                                at big text the line wraps instead and the return is its real height (+ gap), never
//                                less than `step`. ctx null: measure only.
//   grow(base, h)                a fixed box height at Normal, at least h at big text.
import { textScale } from '../../../../core/Theme.js';
import { text, para } from '../../../../core/ui/Kit.js';

export const BIG_TEXT = 1.6;
export const isBig = () => textScale() >= BIG_TEXT;

export function fitLine(ctx, str, x, y, w, opts = {}, step = 60, gap = 16) {
  if (!isBig()) {
    if (ctx) text(ctx, str, x, y, { ...opts, maxWidth: opts.maxWidth ?? w });
    return step;
  }
  const { maxWidth, baseline, ...rest } = opts;
  return Math.max(step, para(ctx, str, x, y, w, { maxLines: 4, ...rest }) + gap);
}

export const grow = (base, h) => (isBig() ? Math.max(base, h) : base);
