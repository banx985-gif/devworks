// The studio (Milestones 1–2, 5): S1 Rented Office (bible §35) — room size, view, look, the starting stations, the
// props that dress the room, how the staff walk and move, and the little art pops that show a game being made.
// Plain data only.
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
  rug: '#E9A15A', // Milestone 5: a warm rug under the work area, and soft light from the window on the floor
  rugEdge: '#C97E3C',
  rugStripe: 'rgba(255,245,226,0.5)',
  sunlight: 'rgba(255,248,214,0.35)',
  shadow: 'rgba(59,51,44,0.18)', // the soft shadow under every station, prop and worker
  gridLine: 'rgba(21,151,191,0.55)', // Build Mode shows the hidden grid
  valid: 'rgba(46,139,87,0.45)',
  validEdge: '#2E8B57',
  invalid: 'rgba(200,64,47,0.5)',
  invalidEdge: '#C8402F',
};

// Wall extras, in cells along a wall (t) and drawn px above the floor (h). The whiteboard is a prop now (Milestone 5).
export const STUDIO_WALLS = {
  window: { side: 'right', t0: 6.2, t1: 8.7, h0: 105, h1: 215 },
  door: { side: 'left', t0: 9.4, t1: 11.2, h0: 0, h1: 190 },
  sign: { side: 'right', t0: 3.4, t1: 5.8, h0: 150, h1: 222 }, // Milestone 5b: the studio's name, in the studio colour
};
// The rug and the patch of window light on the floor, in cells.
export const STUDIO_FLOOR = {
  rug: { col: 1.5, row: 3.4, w: 6, h: 4.2 },
  sun: { col: 6.2, row: 0, w: 2.5, h: 3.2 },
};

// Every facility is drawn at one scale (Milestone 5): art width = the footprint's drawn width × width; its base sits
// drop cell heights below the footprint's front corner.
export const FACILITY_DRAW = { width: 1.05, drop: 0.2 };

// The starting stations (bible §36: all "Start" facilities). always = in every studio (the Starter Desks, the Break
// Area, the Showcase Shelf); the others are placed only when a starter works there (Milestone 5b: Mina → Design Board,
// Niko → Art Station, Sam → Writer Corner, Tess → Producer Desk). The three role stations share one home spot; if two
// are ever needed at once the second settles on the first free spot. fp = footprint on the grid (blocked for walking).
// seats = where a worker stands to use it, relative to the footprint, so they move with it. Any station can be
// moved in Build Mode. Drawn at FACILITY_DRAW. effects are the bible's numbers, as data.
export const STATIONS = [
  {
    id: 'F01',
    name: 'Starter Desks',
    role: 'Maker',
    art: 'facility_f01',
    purpose: 'Where the team makes its games. Needed for one active game project.',
    always: true,
    fp: { col: 1, row: 1, w: 3, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
  },
  {
    id: 'F03',
    name: 'Design Board',
    role: 'Specialist',
    art: 'facility_f03',
    purpose: 'Plan the game on the board. Design milestones go 8% faster.',
    fp: { col: 6, row: 1, w: 2, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
  },
  {
    id: 'F04',
    name: 'Art Station',
    role: 'Specialist',
    art: 'facility_f04',
    purpose: 'Draw the game here. Art milestones go 8% faster.',
    fp: { col: 6, row: 1, w: 2, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
  },
  {
    id: 'F05',
    name: 'Writer Corner',
    role: 'Specialist',
    art: 'facility_f05',
    purpose: 'Write the story here. Writing milestones go 8% faster.',
    fp: { col: 6, row: 1, w: 2, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
  },
  {
    id: 'F06',
    name: 'Producer Desk',
    role: 'Thinker',
    art: 'facility_f06',
    purpose: 'Keep the schedule on track: 5% less schedule slip.',
    fp: { col: 6, row: 5, w: 2, h: 2 },
    seats: [{ dc: 1, dr: 2 }],
    effects: { scheduleVariancePct: -5 }, // Milestone 7: while it stands in the studio
  },
  {
    id: 'F08',
    name: 'Break Area',
    role: 'Rest',
    art: 'facility_f08',
    purpose: 'Where the team rests. Energy comes back 20% faster.',
    always: true,
    fp: { col: 5, row: 9, w: 3, h: 3 },
    seats: [{ dc: 0, dr: 3 }, { dc: 1, dr: 3 }, { dc: 2, dr: 3 }],
    rest: true,
    effects: { restEnergyPct: 20 },
  },
  {
    id: 'F14',
    name: 'Showcase Shelf',
    role: 'Showcase',
    art: 'facility_f14',
    purpose: 'Your released games on display. Tap it for the Catalogue.',
    always: true,
    fp: { col: 0, row: 4, w: 1, h: 2 },
    seats: [], // nobody works here
    showcase: true,
  },
  // Milestone 9: the Marketing Wall (bible §36 F13, Rank D). Placed by itself when the studio reaches Rank D (on the
  // first free spot from its home one; Build Mode moves it like any station). Tap it for the Marketing Planner. Nobody
  // works here yet (marketing staff come later). effects: campaign Hype +10% while it stands (MARKETING_BALANCE.wallPct).
  {
    id: 'F13',
    name: 'Marketing Wall',
    role: 'Marketing',
    art: 'facility_f13',
    purpose: 'Plan your game marketing here. Campaigns bring 10% more Hype.',
    unlock: { rank: 'D' },
    fp: { col: 3, row: 5, w: 2, h: 2 },
    seats: [],
    planner: true,
  },
];

// Props dress the room (Milestone 5): decoration only — never tapped, never moved. Each stands on its cells, which
// the staff walk round and Build Mode keeps clear; they sit against the walls and in the corners, off the walkway.
// size: art width in cells' drawn widths (a chair is smaller than a desk); flip: mirrored to face into the room.
export const PROPS = [
  { id: 'P1', art: 'studio_prop_01', name: 'Desk PC Set', fp: { col: 9, row: 3, w: 1, h: 2 }, size: 2.2 },
  { id: 'P2', art: 'studio_prop_02', name: 'Rolling Chair', fp: { col: 9, row: 5, w: 1, h: 1 }, size: 0.95 },
  { id: 'P3', art: 'studio_prop_03', name: 'Whiteboard', fp: { col: 0, row: 3, w: 1, h: 1 }, size: 1.55 },
  { id: 'P4', art: 'studio_prop_04', name: 'Snack Table', fp: { col: 0, row: 6, w: 1, h: 2 }, size: 1.7, flip: true },
  { id: 'P5', art: 'studio_prop_05', name: 'Server Cart', fp: { col: 8, row: 0, w: 1, h: 1 }, size: 1.3 },
  { id: 'P6', art: 'studio_prop_06', name: 'Game Poster Frame', fp: { col: 9, row: 0, w: 1, h: 1 }, size: 1.3 },
  { id: 'P7', art: 'studio_prop_07', name: 'Cable Crate', fp: { col: 0, row: 13, w: 1, h: 1 }, size: 1.2 },
  { id: 'P8', art: 'studio_prop_08', name: 'Small Awards Shelf', fp: { col: 9, row: 1, w: 1, h: 1 }, size: 1.3 },
];

// The Showcase Shelf (Milestone 5): the latest released games' covers stand on it, small (at most `max`, newest
// first); the tag over it shows each title in turn, drawn by code. slots: where the covers stand, as fractions of the
// shelf art (x, y = the cover's centre; h = its height).
export const SHOWCASE = {
  max: 4,
  slots: [
    { x: 0.44, y: 0.46, h: 0.19 },
    { x: 0.73, y: 0.46, h: 0.19 },
    { x: 0.44, y: 0.685, h: 0.19 },
    { x: 0.73, y: 0.685, h: 0.19 },
  ],
  cycleSec: 3, // each title shows this long on the tag
};

// The floor inside the door: the way in must stay clear, so nothing can be built here. New staff walk in from it.
export const DOORWAY = { col: 0, row: 9, w: 2, h: 3 };

// How the staff move (bible §11 art sizes are in the files). Drawn height and walking speed at 1×.
// motion (Milestone 5, core/CharacterMotion): a hop and a small tilt while walking — the hops run on walked distance
// (one per stride), so the feet never slide at any speed —, a quick typing bounce while working, a slow breathe while
// resting.
export const WALKER = {
  height: 210,
  speed: 240,
  stride: 80, // plan units walked per hop
  motion: {
    walkBobPx: 7,
    walkStepsPerSec: 1, // the walking clock counts strides (see StudioScreen), so one hop per stride
    walkTiltRad: 0.06,
    workTiltRad: 0.02,
    workTiltPerSec: 3.2, // typing: a quick small bounce
    workBobPx: 3,
    idleBreathPx: 4, // resting: a slow, visible breathe
    idleBreathPerSec: 0.3,
  },
};

// Development made visible (Milestone 5, style guide §5): short art pops at the right station while a game is made.
// Pooled (core/VfxSystem), never stacked: one pop per spot at a time, and a gap between pops of the same kind (real
// seconds, so 4× speed does not flood the room). size = drawn width (world px); life in seconds.
export const DEV_POPS = {
  bug: { art: 'dev_vfx_01', size: 130, life: 1.2, gap: 1.6, shakeSec: 0.45, shakePx: 5 },
  breakthrough: { art: 'dev_vfx_02', size: 110, life: 1.6, gap: 1.2 },
  code: { art: 'dev_vfx_03', size: 140, life: 1.3 },
  art: { art: 'dev_vfx_04', size: 130, life: 1.3 },
  story: { art: 'dev_vfx_05', size: 130, life: 1.3 },
  progressGap: [5, 8], // real seconds between progress pops (random in this range), only while someone works
  // Which output a progress pop stands for (this milestone's emphasis on it weights the pick), and the stat that picks
  // the worker it pops over (the best on duty). Code pops at the Starter Desks (S1 has no Code Station yet).
  progress: {
    code: { output: 'polish', stat: 'code', atMaker: true },
    art: { output: 'graphics', stat: 'art' },
    story: { output: 'story', stat: 'wrt' },
  },
  // A breakthrough in an output pops over the on-duty lead strongest in its stat.
  breakthroughStat: { gameplay: 'des', graphics: 'art', story: 'wrt', innovation: 'des', polish: 'code', audienceFit: 'prod' },
  phaseBannerSec: 2.8, // the medium beat when a milestone is done
};

// Money burst (dev_vfx_06) over the Starter Desks on big sales days only: at least minCredits, and at least
// shareOfBest of that game's best day so far. Other days keep the small floating +Credits.
export const BIG_SALES = { minCredits: 250, shareOfBest: 0.6, size: 200, life: 1.5, gap: 2.5 };

// Each state as the name tag and the cards say it. {station} = the station's name.
export const WORK_STATE = {
  toWork: { label: 'Walking', line: 'Walking to the {station}' },
  working: { label: 'Working', line: 'Working at the {station}' },
  toBreak: { label: 'Walking', line: 'Going to the Break Area' },
  resting: { label: 'Resting', line: 'Resting in the Break Area' },
};

// Why a spot is refused in Build Mode.
export const BUILD_TEXT = {
  hint: 'Drag to move. Tap to sell.',
  offGrid: 'Off the floor',
  overlap: 'Overlaps another station',
  prop: 'Something is already there',
  noSeat: 'No room in front to use it',
  seatBlocked: "Blocks another station's spot",
  walkway: 'Blocks the walkway',
};
