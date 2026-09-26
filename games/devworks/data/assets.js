// DEVWORKS image list: key → path (relative to index.html), using the final art-list paths.
// Art not drawn yet shows its stand-in (src/ui/placeholders.js) until the file is filed here.
import { STATIONS } from './studio.js';
import { STARTERS } from './staff.js';
import { BOTTOM_SLOTS } from './home.js';

const art = (folder, key) => [key, `assets/images/${folder}/${key}.png`];

export const ASSETS = {
  // Studio: the starting stations and the starting team.
  ...Object.fromEntries(STATIONS.map((s) => art('facilities', s.art))),
  ...Object.fromEntries(STARTERS.map((d) => art('staff', d.art))),
  // Bottom bar icons.
  ...Object.fromEntries(BOTTOM_SLOTS.map((s) => art('ui', s.icon))),
  // Milestone 0 loader test (?screen=test): the placeholder PWA icon as the real image, and one deliberately missing file.
  m0Real: 'assets/branding/pwa/icon-192.png',
  m0Missing: 'assets/m0-missing-test.png',
};
