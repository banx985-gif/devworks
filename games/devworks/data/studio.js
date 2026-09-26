// The studio (Milestones 1–2): S1 Rented Office (bible §35) — room size, view, look, the four starting stations and
// how the staff walk between them. Plain data only.
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

// The starting stations (bible §36: all "Start" facilities). fp = footprint on the grid (blocked for walking).
// seats = where a worker stands to use it, relative to the footprint, so they move with it. Any station can be
// moved in Build Mode. draw: art width as a share of the footprint's drawn width; drop = how far below the
// footprint's bottom corner the art's base sits, in cell heights. effects are the bible's numbers, as data.
export const STATIONS = [
  {
    id: 'F01',
    name: 'Starter Desks',
    role: 'Maker',
    art: 'facility_f01',
    purpose: 'Where the team makes its games. Needed for one active game project.',
    fp: { col: 1, row: 1, w: 3, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
    draw: { width: 1, drop: 0 },
  },
  {
    id: 'F03',
    name: 'Design Board',
    role: 'Specialist',
    art: 'facility_f03',
    purpose: 'Plan the game on the board. Design milestones go 8% faster.',
    fp: { col: 6, row: 1, w: 2, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
    draw: { width: 1.05, drop: 0.2 },
  },
  {
    id: 'F06',
    name: 'Producer Desk',
    role: 'Thinker',
    art: 'facility_f06',
    purpose: 'Keep the schedule on track: 5% less schedule slip.',
    fp: { col: 6, row: 5, w: 2, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
    draw: { width: 1.05, drop: 0.2 },
  },
  {
    id: 'F08',
    name: 'Break Area',
    role: 'Rest',
    art: 'facility_f08',
    purpose: 'Where the team rests. Energy comes back 20% faster.',
    fp: { col: 5, row: 9, w: 3, h: 3 },
    seats: [{ dc: 0, dr: 3 }, { dc: 1, dr: 3 }, { dc: 2, dr: 3 }],
    draw: { width: 1.05, drop: 0.2 },
    rest: true,
    effects: { restEnergyPct: 20 },
  },
];

// The floor inside the door: the way in must stay clear, so nothing can be built here. New staff walk in from it.
export const DOORWAY = { col: 0, row: 9, w: 2, h: 3 };

// How the staff move (bible §11 art sizes are in the files). Drawn height and walking speed at 1×.
export const WALKER = { height: 210, speed: 240 };

// Each state as the name tag and the cards say it. {station} = the station's name.
export const WORK_STATE = {
  toWork: { label: 'Walking', line: 'Walking to the {station}' },
  working: { label: 'Working', line: 'Working at the {station}' },
  toBreak: { label: 'Walking', line: 'Going to the Break Area' },
  resting: { label: 'Resting', line: 'Resting in the Break Area' },
};

// Why a spot is refused in Build Mode.
export const BUILD_TEXT = {
  hint: 'Drag a station to move it.',
  offGrid: 'Off the floor',
  overlap: 'Overlaps another station',
  noSeat: 'No room in front to use it',
  seatBlocked: "Blocks another station's spot",
  walkway: 'Blocks the walkway',
};
