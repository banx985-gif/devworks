// Studio sheets (Milestones 1–3). One registry, so every way in — tapping a station, a bottom-bar button, Create's
// "Starter Desks" button — opens exactly the same sheet. Sheets never stack: opening one replaces the open one.
// Built again every frame while open, so who is where stays live.
//   station sheets: header (picture, name, what it's for) + who uses it now
//   bar sheets (Create, Research, Compete, Business) and Inbox / Help: one line on what will live there;
//     Create: "New Game" (or "Current project" while one is running) and the Starter Desks
//   pick:<family>: the element list for one recipe slot (open ones pick; locked ones greyed with a padlock)
import { MenuRegistry } from '../../../../core/ui/BottomSheet.js';
import { THEME } from '../../../../core/Theme.js';
import { STATIONS, WORK_STATE } from '../../data/studio.js';
import { BOTTOM_SLOTS, TOP_SHEETS } from '../../data/home.js';
import { ROLES } from '../../data/staff.js';
import { FAMILIES, elementsOf } from '../../data/elements.js';

const C = THEME.color;

export function createStudioMenus({ world, open, projects, newGame, openProject, isUnlocked, onPick, picked }) {
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
        const v = def.role === 'Maker' ? projects().view() : null;
        if (v) lines.push({ text: `Making: ${v.title} · ${v.phaseName} ${Math.floor(v.phaseFrac * 100)}%`, color: C.progress });
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
      sections:
        slot.id === 'create'
          ? [
              {
                columns: 1,
                buttons: [
                  projects().active
                    ? { id: 'current', label: 'Current project', sub: projectLine(), icon: 'dev_ui_07', onTap: openProject }
                    : { id: 'newGame', label: 'New Game', sub: 'Tiny · about 2 months', icon: slot.icon, onTap: newGame },
                  { id: 'desks', label: desks.name, icon: desks.art, accent: C.progress, onTap: () => open(desks.id) },
                ],
              },
            ]
          : [],
    }));
  }
  // One picker per recipe slot.
  for (const f of FAMILIES) {
    menus.register(`pick:${f.id}`, () => ({
      title: f.name,
      subtitle: 'Pick one for this game. More open up with research.',
      accent: C.progress,
      sections: [
        {
          columns: 2,
          buttons: elementsOf(f.id).map((e) => {
            const unlocked = isUnlocked(e.id);
            return { id: e.id, label: e.name, icon: e.art, locked: !unlocked, sub: unlocked ? (picked(f.id) === e.id ? '✓ Chosen' : 'Open') : 'Locked', onTap: () => onPick(f.id, e.id) };
          }),
        },
      ],
    }));
  }
  const projectLine = () => {
    const v = projects().view();
    return v ? `${v.title} · ${v.phaseName} ${Math.floor(v.phaseFrac * 100)}%` : '';
  };

  for (const [id, t] of Object.entries(TOP_SHEETS)) {
    menus.register(id, () => ({ title: t.title, subtitle: t.line, accent: C.progress }));
  }
  return menus;
}
