// DEVWORKS image list: key → path (relative to index.html), using the final art-list paths.
// Art not drawn yet shows its stand-in (src/ui/placeholders.js) until the file is filed here.
import { STATIONS, PROPS, DEV_POPS } from './studio.js';
import { STARTERS } from './staff.js';
import { BOTTOM_SLOTS } from './home.js';
import { ELEMENTS } from './elements.js';
import { COVER_BY_GENRE, DEFAULT_COVER } from './covers.js';
import { PLATFORMS } from './platforms.js';
import { TOP_ICONS } from './home.js';

const art = (folder, key) => [key, `assets/images/${folder}/${key}.png`];

export const ASSETS = {
  // Studio: the starting stations (with the Showcase Shelf, Milestone 5) and the starting team.
  ...Object.fromEntries(STATIONS.map((s) => art('facilities', s.art))),
  ...Object.fromEntries(STARTERS.map((d) => art('staff', d.art))),
  // Bottom bar icons, and Release (Create's "Current project").
  ...Object.fromEntries(BOTTOM_SLOTS.map((s) => art('ui', s.icon))),
  ...Object.fromEntries([art('ui', 'dev_ui_07')]),
  // Game projects (Milestone 3): all 50 element icons and the covers the stub resolver can pick.
  ...Object.fromEntries(ELEMENTS.map((e) => art('elements', e.art))),
  ...Object.fromEntries([...new Set([...Object.values(COVER_BY_GENRE), DEFAULT_COVER])].map((k) => art('covers', k))),
  // Money and release (Milestone 4): Credits / Studio Tokens, the review stars, the platforms that are open.
  ...Object.fromEntries([art('rewards', TOP_ICONS.credits), art('rewards', TOP_ICONS.tokens), art('vfx', 'dev_vfx_07')]),
  ...Object.fromEntries(PLATFORMS.map((p) => art('platforms', p.art))),
  // Milestone 5: the props that dress the studio, and the art pops (bug, idea, code, art, story, money burst, launch).
  ...Object.fromEntries(PROPS.map((p) => art('props', p.art))),
  ...Object.fromEntries([...['bug', 'breakthrough', 'code', 'art', 'story'].map((k) => DEV_POPS[k].art), 'dev_vfx_06', 'dev_vfx_08'].map((k) => art('vfx', k))),
  // Milestone 0 loader test (?screen=test): the placeholder PWA icon as the real image, and one deliberately missing file.
  m0Real: 'assets/branding/pwa/icon-192.png',
  m0Missing: 'assets/m0-missing-test.png',
};
