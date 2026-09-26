// The studio (Milestone 1): S1 Rented Office (bible §35) — room size, view, the Starter Desks, the rest spot and
// Alex Byte's loop. Plain data only.
// Grid cells are in "plan" space (col → right-down, row → left-down on screen); the back walls run along row 0 and col 0.

export const STUDIO = {
  cols: 10,
  rows: 14,
  cellSize: 100, // plan units per cell (pathing, walking speed)
  view: { halfW: 72, halfH: 36 }, // one cell draws as a 144 × 72 diamond (2:1, the series art angle)
  wallH: 250, // back-wall height, drawn px
  margin: 80, // empty world around the room (the camera stops at the room edges plus this)
  zoom: { min: 0.8, max: 1.6, start: 1.2 }, // S1 is small: start close in (style guide §2: bright, zoomed in)
};

// S1 is drawn by code for good (plan review A8): warm cream walls, a honey wood floor, a window and a door.
export const STUDIO_LOOK = {
  floorA: '#D9B88A',
  floorB: '#D1AE7F',
  grout: '#BF9A68',
  wallFace: '#F6ECD6', // right wall
  wallSide: '#EADCBE', // left wall (a touch darker: it faces away from the light)
  wallLine: '#B59D7C',
  wallCap: '#3B332C',
  skirting: '#9A6A44',
  rail: '#E2CFA9',
  windowFrame: '#FFFFFF',
  windowGlass: '#BFE3F0',
  windowShine: 'rgba(255,255,255,0.65)',
  door: '#B07A4C',
  doorFrame: '#7E5434',
  board: '#FFFFFF', // a little whiteboard
  boardInk: ['#1597BF', '#F2862B', '#2E8B57'],
  rug: '#C85A3C',
  rugEdge: '#F2C66D',
  gridLine: 'rgba(21,151,191,0.55)', // Build Mode shows the hidden grid
  valid: 'rgba(46,139,87,0.45)',
  validEdge: '#2E8B57',
  invalid: 'rgba(200,64,47,0.5)',
  invalidEdge: '#C8402F',
};

// Wall extras, in cells along a wall (t) and drawn px above the floor (h).
export const STUDIO_WALLS = {
  window: { side: 'right', t0: 5.6, t1: 8.4, h0: 95, h1: 205 },
  board: { side: 'right', t0: 1.4, t1: 3.6, h0: 110, h1: 200 },
  door: { side: 'left', t0: 9.4, t1: 11.2, h0: 0, h1: 190 },
};

// The one station (bible §36 F01). fp = footprint on the grid (blocked for walking); the worker sits at `spot`,
// given relative to the footprint so it moves with the desk. Build Mode can move it (Milestone 1).
// draw: art width as a share of the footprint's drawn width; drop = how far below the footprint's bottom corner
// the art's base sits, in cell heights.
export const DESK = {
  id: 'F01',
  name: 'Starter Desks',
  role: 'Maker',
  art: 'facility_f01',
  purpose: 'Where the team makes its games. Needed for one active game project.',
  fp: { col: 3, row: 2, w: 3, h: 2 },
  spot: { dc: 1, dr: 2 }, // the cell in front of the desk's middle
  draw: { width: 1, drop: 0 },
};

// The rest spot: a code-drawn rug (no Break Area facility yet). Walkable, but nothing can be built on it.
export const REST_SPOT = {
  name: 'Rest spot',
  area: { col: 5, row: 9, w: 2, h: 2 },
  spot: { col: 5, row: 9 },
};

// The floor inside the door: the way in must stay clear, so nothing can be built here.
export const DOORWAY = { col: 0, row: 9, w: 2, h: 3 };

// The one worker (bible §11 PRG01). Loop: desk → work → rest spot → rest → desk.
export const WORKER = {
  id: 'PRG01',
  name: 'Alex Byte',
  role: 'Programmer',
  art: 'staff_prg01',
  blurb: 'Programmer. Writes the code that makes a game run.',
  height: 210, // drawn px at zoom 1
  speed: 240, // plan units per second
  workSec: 5,
  restSec: 3,
};

// His state, as the world chip and the sheet show it.
export const WORKER_STATE = {
  toDesk: { label: 'Walking', line: 'Walking to the desks' },
  working: { label: 'Working', line: 'Working at the desks' },
  toRest: { label: 'Walking', line: 'Walking to the rest spot' },
  resting: { label: 'Resting', line: 'Resting at the rest spot' },
};

// Why a desk spot is refused in Build Mode.
export const BUILD_TEXT = {
  hint: 'Drag the desks to move them.',
  offGrid: 'Off the floor',
  overlap: 'Overlaps the rest spot',
  noSeat: 'No room in front to sit',
  walkway: 'Blocks the walkway',
};
