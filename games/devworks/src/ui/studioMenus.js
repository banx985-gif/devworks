// Studio sheets (Milestone 1, header only: picture, name, what it's for, and Alex's live state). One registry, so
// every way in — tapping the desks, the bottom shortcut — opens exactly the same sheet.
// Built again every frame while open, so Alex's state stays live.
import { MenuRegistry } from '../../../../core/ui/BottomSheet.js';
import { THEME } from '../../../../core/Theme.js';
import { DESK, WORKER, WORKER_STATE } from '../../data/studio.js';

const C = THEME.color;

export function createStudioMenus({ studio }) {
  const menus = new MenuRegistry();
  menus.register(DESK.id, () => ({ title: DESK.name, subtitle: DESK.purpose, art: DESK.art }));
  menus.register('worker', () => ({
    title: WORKER.name,
    subtitle: WORKER.blurb,
    art: WORKER.art,
    accent: C.progress,
    sections: [{ lines: [{ text: `Now: ${WORKER_STATE[studio().worker.phase].line}`, color: C.actionDark }] }],
  }));
  return menus;
}
