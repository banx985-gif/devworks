// DEVWORKS image list: key → path (relative to index.html), using the final art-list paths.
// Art not drawn yet shows its stand-in (src/ui/placeholders.js) until the file is filed here.
import { STATIONS, PROPS, DEV_POPS } from './studio.js';
import { FACILITIES, STAGES } from './facilities.js';
import { ROSTER } from './staff.js';
import { PUBLISHERS } from './publishers.js';
import { SPONSORS } from './sponsors.js';
import { RIVALS } from './rivals.js';
import { AWARDS } from './awards.js';
import { BOTTOM_SLOTS } from './home.js';
import { ELEMENTS } from './elements.js';
import { FILED_COVERS } from './covers.js';
import { PLATFORMS } from './platforms.js';
import { TOP_ICONS } from './home.js';
import { COMPONENTS, HARDWARE } from './hardware.js';

const art = (folder, key) => [key, `assets/images/${folder}/${key}.png`];

export const ASSETS = {
  // Studio: the starting stations (with the Showcase Shelf, Milestone 5) and the five start staff (Milestone 5b).
  ...Object.fromEntries(STATIONS.map((s) => art('facilities', s.art))),
  ...Object.fromEntries(ROSTER.map((d) => art('staff', d.art))), // Milestone 13: everyone recruitment can find
  ...Object.fromEntries([art('vfx', 'dev_vfx_02')]), // Milestone 13: training courses
  ...Object.fromEntries([art('ui', 'dev_ui_11')]), // Milestone 16: the Engine icon
  // Milestone 17: the publishers' logos, the Publishers / Contract Board icons.
  ...Object.fromEntries(PUBLISHERS.map((p) => art('logos', p.logo))),
  ...Object.fromEntries(['business_ui_01', 'business_ui_03'].map((k) => art('business', k))),
  ...Object.fromEntries([art('ui', 'dev_ui_24')]),
  // Milestone 18: the sponsors' logos and icons.
  ...Object.fromEntries(SPONSORS.map((s) => art('logos', s.logo))),
  ...Object.fromEntries([art('business', 'business_ui_02'), art('ui', 'dev_ui_25')]),
  // Milestone 19: the rivals' logos (Ghostlight's too: it only shows once found) and the trophies.
  ...Object.fromEntries(RIVALS.map((r) => art('logos', r.logo))),
  ...Object.fromEntries([...new Set(AWARDS.map((a) => a.trophy))].map((k) => art('trophies', k))),
  ...Object.fromEntries([art('ui', 'dev_ui_04')]),
  ...Object.fromEntries(['dev_ui_15', 'dev_ui_16', 'dev_ui_17'].map((k) => art('ui', k))), // Milestone 20: support icons
  ...Object.fromEntries(['business_ui_10', 'business_ui_11', 'business_ui_12'].map((k) => art('business', k))), // Milestone 21: licensing, publishing, acquisitions
  ...Object.fromEntries([art('brand', 'dev_brand_03')]), // the title logo (redrawn 28 Sept)
  // Milestone 37: the last 26 art-list pictures, each now used — UI icons (decisions, achievements, menus, Help), the
  // award burst, the plaques, the five mascots (the guide's Code Fox, Help pages, the credits), the brand pictures (Help
  // "About", the Store, the end card).
  ...Object.fromEntries(['dev_ui_06', 'dev_ui_08', 'dev_ui_09', 'dev_ui_10', 'dev_ui_20', 'dev_ui_21', 'dev_ui_22', 'dev_ui_23', 'dev_ui_30'].map((k) => art('ui', k))),
  ...Object.fromEntries([art('vfx', 'dev_vfx_09'), art('business', 'business_ui_04'), art('business', 'business_ui_09')]),
  ...Object.fromEntries(['dev_reward_05', 'dev_reward_06', 'dev_reward_07', 'dev_reward_09'].map((k) => art('rewards', k))),
  ...Object.fromEntries(['dev_mascot_01', 'dev_mascot_02', 'dev_mascot_03', 'dev_mascot_04', 'dev_mascot_05'].map((k) => art('mascots', k))),
  ...Object.fromEntries(['dev_brand_01', 'dev_brand_02', 'dev_brand_04', 'dev_brand_05', 'dev_brand_07'].map((k) => art('brand', k))),
  ...Object.fromEntries([art('brand', 'dev_brand_06'), art('brand', 'studio_logo_banx_gamex'), ['studio_logo_banx_gamex_dark', 'assets/images/brand/studio_logo_banx_gamex_dark.jpg']]), // Milestone 33 (Milestone 34: the splash's dark logo, a small JPEG so it shows at once): the NG+ key art, the ceremony's end card
  ...Object.fromEntries(STAGES.filter((s) => s.event).map((s) => art('events', s.event))), // Milestone 22: the stage moments
  // Milestone 23: the 36 hardware parts, the Hardware / parts icons, the prototype and its moment.
  ...Object.fromEntries(COMPONENTS.map((c) => art('hardware', c.art))),
  ...Object.fromEntries([art('ui', 'dev_ui_26'), art('ui', 'dev_ui_27'), art('consoles', HARDWARE.prototypeArt), art('events', HARDWARE.firstPrototypeEvent)]),
  // Milestone 24: the console pictures, dev kit / manufacturing icons, the launch moment and the defect smoke.
  ...Object.fromEntries([art('consoles', 'console_visual_01'), art('consoles', 'console_visual_02'), art('ui', 'dev_ui_28'), art('ui', 'dev_ui_29'), art('events', 'dev_event_11'), art('vfx', 'dev_vfx_10'), art('vfx', 'dev_vfx_11')]),
  // Milestone 32: the Hall of Fame Star and the achievement icons.
  ...Object.fromEntries([art('rewards', 'dev_reward_10'), art('rewards', 'dev_reward_08'), art('ui', 'dev_ui_04'), art('ui', 'dev_ui_11'), art('ui', 'dev_ui_12'), art('ui', 'dev_ui_13'), art('business', 'business_ui_10'), art('business', 'business_ui_11'), ...['01', '02', '03', '04', '05', '06', '07'].map((n) => art('trophies', `award_trophy_${n}`))]),
  // Milestone 31: the two peaks and the true ending (reveals, the PROJECT X console, the Prestige Aura, the crown).
  ...Object.fromEntries([art('events', 'dev_event_17'), art('events', 'dev_event_18'), art('events', 'dev_event_19'), art('consoles', 'console_visual_08'), art('vfx', 'dev_vfx_12'), art('trophies', 'award_trophy_08')]),
  // Milestone 30: the Ghostlight reveal, the C11 / C12 moments and the Prestige Token icon.
  ...Object.fromEntries([art('events', 'dev_event_14'), art('events', 'dev_event_15'), art('events', 'dev_event_16'), art('rewards', 'dev_reward_04')]),
  // Milestone 29: the Legendary / Prestige arrival moment.
  ...Object.fromEntries([art('events', 'dev_event_13')]),
  // Milestone 27: the 12 milestone moments' pictures and the event icons.
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => art('events', `dev_event_${String(i + 1).padStart(2, '0')}`))),
  ...Object.fromEntries([art('ui', 'dev_ui_02'), art('ui', 'dev_ui_05'), art('ui', 'dev_ui_07'), art('ui', 'dev_ui_26'), art('ui', 'dev_ui_29'), art('business', 'business_ui_05'), art('platforms', 'platform_device_03')]),
  // Milestone 26: the distribution icon.
  ...Object.fromEntries([art('business', 'business_ui_13')]),
  // Milestone 25: the later generations and revisions (the PROJECT X picture stays a secret).
  ...Object.fromEntries(['console_visual_03', 'console_visual_04', 'console_visual_05', 'console_visual_06'].map((id) => art('consoles', id))),
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
