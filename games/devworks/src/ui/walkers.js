// The walking chibis (Milestone 40t, SERIES_STAFF_CHIBIS.md): the people walking, sitting and working in the studio
// are drawn from their sprite sheets (assets/images/walkers/<art>_sheet.png, made phone-sized by
// tools/devworks-walkers.mjs; walkers.json says the rows and each sheet's frame size and feet point). The flat art stays
// for every card, pop-up and list. A sheet loads the first time its person is in the studio; until it is in (or if it
// is missing) the studio keeps today's walker (the flat full-body picture with its hop).
//
//   const walkers = createWalkers({ assets, fetchJson })     walkers.ready → Promise (walkers.json read)
//   walkers.frameFor(art, { state, back, mirror, stride, t, seed }) → { key, sx, sy, sw, sh, dx, dy, dw, dh, flip } | null
//       state 'walking' | 'working' | 'idle' | 'cheering' (a visitor, Milestone 40v); back: facing away (up the screen); mirror: facing the other way;
//       stride: distance walked (plan units) for the walk frames; t: seconds for idle / work; dx, dy, dw, dh are
//       relative to the feet (draw at feet.x + dx, feet.y + dy)
//   walkers.has(art) → the sheet is in · walkers.want(art) asks for it
export const WALKERS_DIR = 'assets/images/walkers/';
// Same size for everyone: a 256 px source frame shows a figure about 230 px tall. The chibis' big heads and bodies look
// much heavier than the flat walkers at the same height, so they are drawn at heightScale of it (checked by eye
// against the desks and chairs).
export const WALKER_LOOK = { figurePx: 230, heightScale: 0.8, strideFrames: 4 }; // 4 walk frames per stride (8 frames = two steps)

export function createWalkers({ assets, fetchJson = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)), height = 210 }) {
  let meta = null;
  const asked = new Set();
  const key = (art) => `walk_${art}`;
  const ready = fetchJson(`${WALKERS_DIR}walkers.json`)
    .then((m) => (meta = m))
    .catch(() => null);
  // Milestone 40v: a visitor's sheet has its own rows (idle, walk, cheer); the staff's use the shared list.
  const rowOf = (anim, back, s) => (s?.rows ?? meta?.rows)?.find((r) => r.anim === anim && r.facing === (back ? 'back' : 'front')) ?? null;
  function want(art) {
    if (!meta?.sheets?.[art] || asked.has(art)) return;
    asked.add(art);
    assets.loadOptional(key(art), `${WALKERS_DIR}${art}_sheet.png`);
  }
  const has = (art) => !!meta?.sheets?.[art] && assets.has(key(art));
  function frameFor(art, { state = 'idle', back = false, mirror = false, stride = 0, t = 0, seed = 0, strideLen = 80 } = {}) {
    want(art);
    if (!has(art)) return null;
    const s = meta.sheets[art];
    const anim = state === 'walking' ? 'walk' : state === 'working' ? 'work' : state === 'cheering' ? 'cheer' : 'idle';
    // A cheer faces you (Milestone 40v: there is no back cheer row); anything a sheet lacks falls back to idle.
    const row = rowOf(anim, anim === 'cheer' ? false : back, s) ?? rowOf('idle', back, s);
    if (!row) return null;
    const n = row.frames;
    const f = anim === 'walk' ? Math.floor((stride / strideLen) * WALKER_LOOK.strideFrames) % n : Math.floor(t * row.fps + seed * 7) % n;
    // logical px per copy px: the flat walkers' height over the figure's height in source px, back through the copy scale
    const k = (height * WALKER_LOOK.heightScale) / WALKER_LOOK.figurePx / meta.scale;
    return {
      key: key(art),
      sx: f * s.frameW,
      sy: row.row * s.frameH,
      sw: s.frameW,
      sh: s.frameH,
      dx: -s.feet.x * k,
      dy: -s.feet.y * k,
      dw: s.frameW * k,
      dh: s.frameH * k,
      flip: mirror,
    };
  }
  return {
    ready,
    want,
    has,
    frameFor,
    get meta() {
      return meta;
    },
  };
}
