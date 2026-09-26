// Studio sheets (Milestones 1–2). One registry, so every way in — tapping a station, a bottom-bar button, Create's
// "Starter Desks" button — opens exactly the same sheet. Sheets never stack: opening one replaces the open one.
// Built again every frame while open, so who is where stays live.
//   station sheets: header (picture, name, what it's for) + who uses it now
//   bar sheets (Create, Research, Compete, Business) and Inbox / Help: one line on what will live there
import { MenuRegistry } from '../../../../core/ui/BottomSheet.js';
import { THEME } from '../../../../core/Theme.js';
import { STATIONS, WORK_STATE } from '../../data/studio.js';
import { BOTTOM_SLOTS, TOP_SHEETS } from '../../data/home.js';
import { ROLES } from '../../data/staff.js';

const C = THEME.color;

export function createStudioMenus({ world, open }) {
  const menus = new MenuRegistry();
  for (const def of STATIONS) {
    menus.register(def.id, () => {
      const w = world();
      const st = w.stationById(def.id);
      const lines = [];
      if (def.rest) {
        const here = w.workers.filter((x) => x.phase === 'resting' || x.phase === 'toBreak');
        lines.push(here.length ? `Resting now: ${here.map((x) => x.staff.name.split(' ')[0]).join(', ')}` : 'Nobody is resting right now.');
      } else {
        for (const x of w.workers.filter((x) => x.station === st)) {
          lines.push({ text: `${x.staff.name} (${ROLES[x.staff.role].name}): ${w.stateLine(x, WORK_STATE[x.phase].line)}`, color: C.actionDark });
        }
      }
      return { title: def.name, subtitle: def.purpose, art: def.art, sections: lines.length ? [{ lines }] : [] };
    });
  }

  // Bottom bar sheets (Staff opens the Roster screen instead). Create leads to the Starter Desks, the Maker station.
  const desks = STATIONS.find((s) => s.role === 'Maker');
  for (const slot of BOTTOM_SLOTS) {
    if (slot.id === 'staff') continue;
    menus.register(slot.id, () => ({
      title: slot.label,
      subtitle: slot.line,
      art: slot.icon,
      sections: slot.id === 'create' ? [{ columns: 1, buttons: [{ id: 'desks', label: desks.name, icon: desks.art, onTap: () => open(desks.id) }] }] : [],
    }));
  }
  for (const [id, t] of Object.entries(TOP_SHEETS)) {
    menus.register(id, () => ({ title: t.title, subtitle: t.line, accent: C.progress }));
  }
  return menus;
}
