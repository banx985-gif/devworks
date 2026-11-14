// Smooth art, no jaggy look (Aaron's 8 Nov series rule; built for BOTWORKS Milestone 38, any series game).
// Canvas 2D's default smoothing quality is 'low' (a cheap filter that steps when a big picture is drawn small), and
// resizing a canvas resets it. A game that opts in (enableSmoothArt) gets 'high' everywhere core draws pictures into a
// canvas of its own (core/CachedLayer, core/ArtRecolor); the game calls smoothContext on its main context every frame
// (cheap: two property writes). Games that don't opt in are unchanged.
//   enableSmoothArt()      switch it on for this game (once, at start-up)
//   smoothContext(ctx)     imageSmoothingEnabled = true, imageSmoothingQuality = 'high' (returns ctx)
//   SMOOTH_ART.on          whether the game opted in (core parts check it)
export const SMOOTH_ART = { on: false, quality: 'high' };

export function enableSmoothArt({ quality = 'high' } = {}) {
  SMOOTH_ART.on = true;
  SMOOTH_ART.quality = quality;
}

export function smoothContext(ctx, quality = SMOOTH_ART.quality) {
  if (!ctx) return ctx;
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx || ctx.imageSmoothingQuality === undefined) ctx.imageSmoothingQuality = quality;
  return ctx;
}
