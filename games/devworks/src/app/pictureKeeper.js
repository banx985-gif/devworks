// Milestone 41i (phone memory on Graphics High: 409 MB of pictures → about 200): pictures load per screen and are let go
// when nothing has drawn them for a while, instead of every picture loading at start (M41f measured that at 409 MB).
//   - A picture loads the first time anything asks for it (draw, drawContained, drawCrop, sprite, get, has, aspect): it
//     pops in a moment later (core AssetManager draws nothing while a registered picture is on its way).
//   - Every sweep (main.js: every 2 s), a picture nobody has asked for in releaseMs is let go (the image and its
//     display-size copies in the sprite cache). The studio's pictures are drawn every frame, so they stay while you are
//     in the studio; a screen's pictures go about 10 s after you leave it, and come back when you return.
//   - Kept: tiny pictures (icons; under keepBytes decoded), pictures made in code (canvases), and the walking sheets
//     (src/ui/walkers.js lets those go itself).
//   - Pictures loaded with loadOptional (art that may not exist yet) are remembered, so they can come back too.
// The game's own wrapper around core AssetManager (core is unchanged; other games are not affected).
export function createPictureKeeper({ assets, now = () => performance.now(), releaseMs = 10000, keepBytes = 192 * 192 * 4, skip = (k) => k.startsWith('walk_') }) {
  const lastUsed = new Map();
  const optionalSrc = new Map(); // key → src of a picture loaded with loadOptional
  const optionalLoading = new Set();
  const absent = new Set(); // optional pictures whose file is not there (never asked for again)
  const stats = { loads: 0, freed: 0, freedBytes: 0 };
  const loadOptional = assets.loadOptional.bind(assets);
  assets.loadOptional = (key, src) => {
    if (skip(key)) return loadOptional(key, src);
    optionalSrc.set(key, src);
    return loadOptional(key, src).then((img) => {
      if (!img) absent.add(key);
      return img;
    });
  };
  function touch(key) {
    if (typeof key !== 'string') return;
    lastUsed.set(key, now());
    if (assets.images.has(key) || assets.loading.has(key) || assets.missing.has(key) || optionalLoading.has(key) || absent.has(key)) return;
    const src = assets.manifest[key];
    if (src) {
      stats.loads++;
      assets.loadImage(key, src);
      return;
    }
    const opt = optionalSrc.get(key);
    if (opt) {
      stats.loads++;
      optionalLoading.add(key);
      loadOptional(key, opt).then((img) => {
        optionalLoading.delete(key);
        if (!img) absent.add(key);
      });
    }
  }
  // draw / drawContained / drawCrop take (ctx, key, …); sprite / get / has / aspect take (key, …).
  for (const [name, at] of [['draw', 1], ['drawContained', 1], ['drawCrop', 1], ['sprite', 0], ['get', 0], ['has', 0], ['aspect', 0]]) {
    const own = assets[name].bind(assets);
    assets[name] = (...args) => {
      touch(args[at]);
      return own(...args);
    };
  }
  const isMade = (img) => typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement;
  const bytesOf = (img) => (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0) * 4;
  function dropCopies(key) {
    const sc = assets.sprites;
    const sizes = sc?.byKey?.get(key);
    if (!sizes) return;
    for (const c of sizes.values()) sc.totalPixels -= (c.width || 0) * (c.height || 0);
    sc.byKey.delete(key);
    sc.used?.delete(key);
  }
  // Let go of every picture not asked for in releaseMs (or older than `at`). Returns how many went.
  function sweep(at = now(), wait = releaseMs) {
    let n = 0;
    for (const [key, img] of [...assets.images]) {
      if (skip(key) || isMade(img)) continue;
      if (at - (lastUsed.get(key) ?? 0) < wait) continue;
      const b = bytesOf(img);
      if (b <= keepBytes) continue;
      assets.images.delete(key);
      assets.sources.delete(key);
      dropCopies(key);
      n++;
      stats.freed++;
      stats.freedBytes += b;
    }
    return n;
  }
  // Decoded picture memory now (the measure used since M41f), in bytes.
  function loadedBytes() {
    let b = 0;
    for (const img of assets.images.values()) b += bytesOf(img);
    return b;
  }
  // Remember a picture that may not exist yet without loading it: it loads the first time something asks for it.
  function remember(key, src) {
    optionalSrc.set(key, src);
  }
  return { touch, sweep, remember, loadedBytes, stats, lastUsed, releaseMs };
}
