// New Game setup and founders (Milestone 5b, spec DEVWORKS_START_SCREEN_AND_SAVE_SLOTS v1.0 §1–§6). Plain data only.
// Names have no gameplay effect. The founder's perk (spec §2) and the starting team (spec §3) are here so both can be
// re-tuned without touching the setup screen.

// The Founder perks (spec §2): +6% of the founder's own stat, plus one small bonus. Applied for the whole run by
// src/systems/gameProject.js while the founder is on the project team:
//   statPct        the founder's `stat` counts this much more (progress and outputs)
//   bugPct         bugs made on the project, % (Alex)
//   outputBonus    points added to a finished game's outputs (Mina, Niko, Sam)
//   scheduleVariancePct   Tess: kept for the schedule-variance system (none yet: projects don't slip until it exists)
// team = the starting team (spec §3), founder first. Always 3.
export const FOUNDERS = [
  {
    id: 'PRG01',
    perk: { name: 'Founder Programmer', text: '+6% CODE contribution and −5% programming bugs', stat: 'code', statPct: 6, bugPct: -5 },
    team: ['PRG01', 'DSN01', 'PRO01'],
  },
  {
    id: 'DSN01',
    perk: { name: 'Founder Designer', text: '+6% DES contribution and +3 Gameplay on finished games', stat: 'des', statPct: 6, outputBonus: { gameplay: 3 } },
    team: ['DSN01', 'PRG01', 'PRO01'],
  },
  {
    id: 'ART01',
    perk: { name: 'Founder Artist', text: '+6% ART contribution and +3 Graphics on finished games', stat: 'art', statPct: 6, outputBonus: { graphics: 3 } },
    team: ['ART01', 'PRG01', 'PRO01'],
  },
  {
    id: 'WRT01',
    perk: { name: 'Founder Writer', text: '+6% WRT contribution and +3 Story on finished games', stat: 'wrt', statPct: 6, outputBonus: { story: 3 } },
    team: ['WRT01', 'PRG01', 'PRO01'],
  },
  {
    id: 'PRO01',
    perk: { name: 'Founder Producer', text: '+6% PROD contribution and −5% schedule variance', stat: 'prod', statPct: 6, scheduleVariancePct: -5 },
    team: ['PRO01', 'PRG01', 'DSN01'],
  },
];
export const founderById = (id) => FOUNDERS.find((f) => f.id === id) ?? null;

// The founder's permanent run-history flag (spec §2, §4).
export const FOUNDER_FLAG = 'Founding Developer';

// Studio colours (spec §1): six swatches from the DEVWORKS accent palette. The colour tints the studio sign only.
export const STUDIO_COLOURS = [
  { id: 'orange', name: 'Orange', hex: '#F2862B' },
  { id: 'cyan', name: 'Cyan', hex: '#1597BF' },
  { id: 'green', name: 'Green', hex: '#2E8B57' },
  { id: 'purple', name: 'Purple', hex: '#7650C4' },
  { id: 'red', name: 'Red', hex: '#C8402F' },
  { id: 'gold', name: 'Gold', hex: '#D9A400' },
];
export const colourById = (id) => STUDIO_COLOURS.find((c) => c.id === id) ?? STUDIO_COLOURS[0];

// Made-up studio names for Random (spec §1). None is a real studio.
export const STUDIO_NAMES = [
  'Pixel Kettle Games', 'Bright Byte Studio', 'Tiny Comet Interactive', 'Paper Rocket Games', 'Sunny Loop Studio',
  'Clockwork Otter', 'Brick & Bloom Games', 'Lucky Lantern Studio', 'Moonbeam Arcade', 'Hop Scotch Games',
  'Cosy Cactus Studio', 'Velvet Joystick', 'Maple Circuit Games', 'Little Lighthouse', 'Jolly Kraken Studio',
  'Sparkfox Interactive', 'Blue Teapot Games', 'Humble Hammer Studio', 'Nimbus Nook', 'Pocket Planet Games',
  'Copper Kite Studio', 'Snowy Owl Interactive', 'Tangerine Tower', 'Quiet Gecko Games', 'Wobble Works',
];

// First names for Random (spec §1). Shown as "Studio Director <name>".
export const DIRECTOR_NAMES = [
  'Aaron', 'Jess', 'Omar', 'Lena', 'Kai', 'Rosa', 'Ben', 'Ada', 'Felix', 'Iris', 'Marco', 'Yuki', 'Dev', 'Nell',
  'Ravi', 'Hugo', 'Zoe', 'Tom', 'Ama', 'Lucas', 'Ines', 'Sol', 'Ruth', 'Jonah',
];
export const NAME_MAX = { studio: 24, director: 16 };

// A save from before Milestone 5b goes into Slot 1 with these (card: "a default studio name and Alex Byte as Founder").
export const LEGACY_SETUP = { studio: 'Byte Garage Games', director: 'Aaron', colour: 'orange', founder: 'PRG01' };
