// DEVWORKS image list: key → path (relative to index.html), using the final art-list paths.
// Art not drawn yet shows its stand-in (src/ui/placeholders.js) until the file is filed here.
import { STATIONS, PROPS, DEV_POPS } from './studio.js';
import { FACILITIES, STAGES } from './facilities.js';
import { START_STAFF } from './staff.js';
import { BOTTOM_SLOTS } from './home.js';
import { ELEMENTS } from './elements.js';
import { FILED_COVERS } from './covers.js';
import { PLATFORMS } from './platforms.js';
import { TOP_ICONS } from './home.js';

const art = (folder, key) => [key, `assets/images/${folder}/${key}.png`];

export const ASSETS = {
  // Studio: the starting stations (with the Showcase Shelf, Milestone 5) and the five start staff (Milestone 5b).
  ...Object.fromEntries(STATIONS.map((s) => art('facilities', s.art))),
  ...Object.fromEntries(START_STAFF.map((d) => art('staff', d.art))),
  // Bottom bar icons, and Release (Create's "Current project").
  ...Object.fromEntries(BOTTOM_SLOTS.map((s) => art('ui', s.icon))),
  ...Object.fromEntries([art('ui', 'dev_ui_07')]),
  // Game projects (Milestone 3): all 50 element icons; every filed cover family (Milestone 6; all 30 since 27 Sept — parked ones
  // are never asked for — they show a fallback family's picture).
  ...Object.fromEntries(ELEMENTS.map((e) => art('elements', e.art))),
  ...Object.fromEntries(FILED_COVERS.map((k) => art('covers', k))),
  // Money and release (Milestone 4): Credits / Studio Tokens, the review stars, the platforms that are open.
  ...Object.fromEntries([art('rewards', TOP_ICONS.credits), art('rewards', TOP_ICONS.tokens), art('vfx', 'dev_vfx_07')]),
  ...Object.fromEntries(PLATFORMS.map((p) => art('platforms', p.art))),
  // Milestone 5: the props that dress the studio, and the art pops (bug, idea, code, art, story, money burst, launch).
  ...Object.fromEntries(PROPS.map((p) => art('props', p.art))),
  ...Object.fromEntries([...['bug', 'breakthrough', 'code', 'art', 'story'].map((k) => DEV_POPS[k].art), 'dev_vfx_06', 'dev_vfx_08'].map((k) => art('vfx', k))),
  // Milestone 9: marketing (the actions, Hype, Fan Trust) and the Marketing Wall (in STATIONS above).
  ...Object.fromEntries(['business_ui_05', 'business_ui_06', 'business_ui_07', 'business_ui_08', 'business_ui_14'].map((k) => art('business', k))),
  ...Object.fromEntries(['dev_ui_18', 'dev_ui_19'].map((k) => art('ui', k))),
  // Milestone 10: franchises (Franchise, Sequel, Remake icons) and the Franchise Crown.
  ...Object.fromEntries(['dev_ui_12', 'dev_ui_13', 'dev_ui_14'].map((k) => art('ui', k))),
  ...Object.fromEntries([art('rewards', 'dev_reward_08')]),
  // Milestone 11: every facility (the shop and Build Mode) and the stage pictures.
  ...Object.fromEntries(FACILITIES.map((f) => art('facilities', f.art))),
  ...Object.fromEntries(STAGES.filter((s) => s.shell).map((s) => art('shells', s.shell))),
  // Milestone 12: the RP icon (Research Token).
  ...Object.fromEntries([art('rewards', 'dev_reward_03')]),
  // Milestone 0 loader test (?screen=test): the placeholder PWA icon as the real image, and one deliberately missing file.
  m0Real: 'assets/branding/pwa/icon-192.png',
  m0Missing: 'assets/m0-missing-test.png',
};
