// Portrait crops (Milestone 14): one head-and-shoulders square per staff picture, as fractions of the image
// (x, y, w, h). Worked out from each picture's opaque pixels (the top of the figure; the head's centre), so every
// card crops the same way. Made by a one-off script; re-run it if a picture is redrawn. Plain data only.
export const PORTRAITS = {
  staff_art01: { x: 0.1703, y: 0, w: 0.5095, h: 0.3536 },
  staff_art02: { x: 0.0652, y: 0, w: 0.5673, h: 0.3536 },
  staff_art03: { x: 0.1996, y: 0, w: 0.509, h: 0.3537 },
  staff_art04: { x: 0.2463, y: 0, w: 0.5076, h: 0.3537 },
  staff_art05: { x: 0.1976, y: 0, w: 0.4946, h: 0.3539 },
  staff_art06: { x: 0.1873, y: 0, w: 0.4694, h: 0.3537 },
  staff_art07: { x: 0.1711, y: 0, w: 0.499, h: 0.3538 },
  staff_art08: { x: 0.2769, y: 0, w: 0.4819, h: 0.3536 },
  staff_art09: { x: 0.1723, y: 0, w: 0.5046, h: 0.3565 },
  staff_art10: { x: 0.2538, y: 0, w: 0.4806, h: 0.3536 },
  staff_dsn01: { x: 0.1957, y: 0, w: 0.6115, h: 0.3536 },
  staff_dsn02: { x: 0.2428, y: 0, w: 0.5574, h: 0.3536 },
  staff_dsn03: { x: 0.2406, y: 0, w: 0.5046, h: 0.3535 },
  staff_dsn04: { x: 0.2734, y: 0, w: 0.5052, h: 0.3536 },
  staff_dsn05: { x: 0.1334, y: 0, w: 0.5177, h: 0.3593 },
  staff_dsn06: { x: 0.2443, y: 0, w: 0.4905, h: 0.3536 },
  staff_dsn07: { x: 0.134, y: 0, w: 0.5137, h: 0.3537 },
  staff_dsn08: { x: 0.3079, y: 0, w: 0.4239, h: 0.3537 },
  staff_dsn09: { x: 0.2312, y: 0, w: 0.4702, h: 0.3536 },
  staff_dsn10: { x: 0.2304, y: 0, w: 0.5101, h: 0.3537 },
  staff_prg01: { x: 0.2447, y: 0, w: 0.6514, h: 0.3537 },
  staff_prg02: { x: 0.2771, y: 0, w: 0.6563, h: 0.3537 },
  staff_prg03: { x: 0.2413, y: 0, w: 0.6135, h: 0.3536 },
  staff_prg04: { x: 0.3214, y: 0, w: 0.5813, h: 0.3537 },
  staff_prg05: { x: 0.1968, y: 0, w: 0.5186, h: 0.3538 },
  staff_prg06: { x: 0.2043, y: 0, w: 0.4765, h: 0.3536 },
  staff_prg07: { x: 0.1665, y: 0, w: 0.5211, h: 0.3536 },
  staff_prg08: { x: 0.2442, y: 0, w: 0.57, h: 0.3536 },
  staff_prg09: { x: 0.1167, y: 0, w: 0.5541, h: 0.3538 },
  staff_prg10: { x: 0.2161, y: 0, w: 0.5368, h: 0.3593 },
  staff_pro01: { x: 0.0813, y: 0, w: 0.6612, h: 0.3542 },
  staff_pro02: { x: 0.0945, y: 0, w: 0.5208, h: 0.3593 },
  staff_pro03: { x: 0.0907, y: 0, w: 0.5863, h: 0.3538 },
  staff_pro04: { x: 0.224, y: 0, w: 0.5115, h: 0.3535 },
  staff_pro05: { x: 0.1555, y: 0, w: 0.5472, h: 0.3536 },
  staff_pro06: { x: 0.2064, y: 0, w: 0.5599, h: 0.3535 },
  staff_pro07: { x: 0.2627, y: 0, w: 0.5224, h: 0.3537 },
  staff_pro08: { x: 0.2359, y: 0, w: 0.5617, h: 0.3537 },
  staff_pro09: { x: 0.1563, y: 0, w: 0.5411, h: 0.3537 },
  staff_pro10: { x: 0.2796, y: 0, w: 0.5274, h: 0.3536 },
  staff_wrt01: { x: 0.1873, y: 0, w: 0.5976, h: 0.3593 },
  staff_wrt02: { x: 0.0294, y: 0, w: 0.775, h: 0.3593 },
  staff_wrt03: { x: 0.1876, y: 0, w: 0.5574, h: 0.3536 },
  staff_wrt04: { x: 0.2095, y: 0, w: 0.5956, h: 0.3536 },
  staff_wrt05: { x: 0.2564, y: 0, w: 0.5262, h: 0.3536 },
  staff_wrt06: { x: 0.2506, y: 0, w: 0.5528, h: 0.3536 },
  staff_wrt07: { x: 0.2026, y: 0, w: 0.6346, h: 0.3538 },
  staff_wrt08: { x: 0.2275, y: 0, w: 0.5776, h: 0.3537 },
  staff_wrt09: { x: 0.1555, y: 0, w: 0.5844, h: 0.3536 },
  staff_wrt10: { x: 0.2583, y: 0, w: 0.4589, h: 0.3538 },
};
// The crop for an art key (the old fixed crop when a picture has none).
export const portraitOf = (art) => PORTRAITS[art] ?? { x: 0.15, y: 0, w: 0.7, h: 0.42 };
// The same crop reshaped to a box of this width ÷ height (the square keeps its height and centre; a wider box shows
// more shoulders), kept inside the picture.
export function portraitFit(art, aspect = 1) {
  const c = portraitOf(art);
  const w = Math.min(1, c.w * aspect);
  const x = Math.max(0, Math.min(1 - w, c.x + c.w / 2 - w / 2));
  return { x, y: c.y, w, h: c.h };
}
