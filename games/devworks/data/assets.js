// DEVWORKS image list: key → path (relative to index.html), using the final art-list paths.
// Art not drawn yet shows its stand-in (src/ui/placeholders.js) until the file is filed here.
import { DESK, WORKER } from './studio.js';

const art = (folder, key) => [key, `assets/images/${folder}/${key}.png`];

export const ASSETS = {
  // Studio (Milestone 1): the Starter Desks and Alex.
  ...Object.fromEntries([art('facilities', DESK.art), art('staff', WORKER.art)]),
  // Milestone 0 loader test (?screen=test): the placeholder PWA icon as the real image, and one deliberately missing file.
  m0Real: 'assets/branding/pwa/icon-192.png',
  m0Missing: 'assets/m0-missing-test.png',
};
