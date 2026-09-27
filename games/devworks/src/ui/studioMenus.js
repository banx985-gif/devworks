// Studio sheets (Milestones 1–4). One registry, so every way in — tapping a station, a bottom-bar button, Create's
// "Starter Desks" button — opens exactly the same sheet. Sheets never stack: opening one replaces the open one.
// Built again every frame while open, so who is where stays live.
//   station sheets: header (picture, name, what it's for) + who uses it now
//   bar sheets (Create, Research, Compete, Business) and Inbox / Help: one line on what will live there;
//     Create: "New Game" (or "Current project" while one is running) and the Starter Desks
//   pick:<family>: the element list for one recipe slot (open ones pick; locked ones greyed with a padlock and the
//     reason, Milestone 6; an open one that clashes with the recipe so far says what it needs)
//   release (target = catalogue number): platform (OpenDesk PC only), price, release model, the Release button
//   decision (Milestone 7): the Beta / Gold choice for the game in the works — Ship / Delay / Cut Feature /
//     Outsource QA / Crunch, each with what it does; the ones not open now greyed with why
//   business: Ledger and Catalogue, with the balance, Fame, rank and Fan Trust; Main Menu (saves first, Milestone 5b)
import { MenuRegistry } from '../../../../core/ui/BottomSheet.js';
import { THEME } from '../../../../core/Theme.js';
import { STATIONS, WORK_STATE } from '../../data/studio.js';
import { BOTTOM_SLOTS, TOP_SHEETS } from '../../data/home.js';
import { ROLES } from '../../data/staff.js';
import { FAMILIES, elementsOf, needsProblem } from '../../data/elements.js';
import { PLATFORMS, RELEASE_MODEL } from '../../data/platforms.js';
import { RELEASE, ECONOMY, PROJECT_BALANCE } from '../../data/balance.js';
import { DECISIONS, DECISION_POINTS, scopeById } from '../../data/projects.js';

const C = THEME.color;

export function createStudioMenus({ decide = null, dateOf = (d) => `day ${d}`, world, open, projects, business, newGame, openProject, isUnlocked, lockReason = () => 'Locked', recipe = () => ({}), debugUnlockAll = null, onPick, picked, doRelease, openScreen, toTitle = null }) {
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
    if (slot.id === 'staff' || slot.id === 'business') continue;
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
                  ...business()
                    .unreleased()
                    .map((r) => ({ id: `release${r.number}`, label: `Release "${r.result.title}"`, sub: 'Finished and waiting', icon: r.result.cover, onTap: () => open('release', r.number) })),
                  ...(projects().decision ? [{ id: 'decision', label: `${DECISION_POINTS[projects().decision.point]} decision needed`, sub: 'Your game waits for you', icon: 'dev_ui_07', accent: C.action, onTap: () => open('decision') }] : []),
                  projects().active
                    ? { id: 'current', label: 'Current project', sub: projectLine(), icon: 'dev_ui_07', onTap: openProject }
                    : { id: 'newGame', label: 'New Game', sub: 'Pick a recipe, scope and team', icon: slot.icon, onTap: newGame },
                  { id: 'desks', label: desks.name, icon: desks.art, accent: C.progress, onTap: () => open(desks.id) },
                  ...(debugUnlockAll ? [{ id: 'unlockAll', label: 'Debug: unlock all elements', sub: 'Opens all 50 recipe elements', icon: slot.icon, accent: C.progress, onTap: () => debugUnlockAll() }] : []),
                ],
              },
            ]
          : [],
    }));
  }
  // Business: the money screens.
  const biz = BOTTOM_SLOTS.find((x) => x.id === 'business');
  menus.register('business', () => {
    const b = business();
    const lines = [
      { text: `${b.credits.toLocaleString('en-GB')} Credits · Rank ${b.rank.id} · ${b.fame.toLocaleString('en-GB')} Fame · Fan Trust ${Math.round(b.state.fanTrust)}`, color: b.inDebt ? C.bad : C.text },
    ];
    if (b.inDebt) lines.push({ text: `Emergency Credit: ${ECONOMY.monthlyInterestPct}% interest a month on what you owe.`, color: C.bad });
    return {
      title: biz.label,
      subtitle: biz.line,
      art: biz.icon,
      sections: [
        { lines },
        {
          columns: 2,
          buttons: [
            { id: 'ledger', label: 'Ledger', sub: 'Money in and out', icon: 'dev_reward_01', onTap: () => openScreen('ledger') },
            { id: 'catalogue', label: 'Catalogue', sub: `${projects().catalogue.list().length} game${projects().catalogue.list().length === 1 ? '' : 's'}`, icon: 'dev_vfx_07', accent: C.progress, onTap: () => openScreen('catalogue') },
          ],
        },
        ...(toTitle ? [{ columns: 1, buttons: [{ id: 'mainMenu', label: 'Main Menu', sub: 'Saves your studio, then back to the title screen', icon: biz.icon, accent: C.progress, onTap: toTitle }] }] : []),
      ],
    };
  });

  // Release a finished game: one platform, one price, one release model for now.
  menus.register('release', (number) => {
    const rec = projects().catalogue.get(number);
    if (!rec || rec.release) return null;
    const p = PLATFORMS.find((x) => x.id === RELEASE.platform);
    const price = PROJECT_BALANCE.scopes[rec.result.scope]?.price ?? RELEASE.price; // Milestone 7: by scope
    const keep = (price * (100 - RELEASE.storeCutPct)) / 100;
    return {
      title: `Release "${rec.result.title}"`,
      subtitle: `${RELEASE_MODEL.name}. The four outlets review it straight away.`,
      art: rec.result.cover,
      sections: [
        { title: 'Platform', columns: 1, buttons: [{ id: p.id, label: p.name, sub: `${p.audienceLabel} · ✓ Chosen`, icon: p.art, accent: C.progress, onTap: () => {} }] },
        { lines: [`${scopeById(rec.result.scope)?.name ?? ''} game. Price: ${price} Credits a copy. You keep ${keep.toFixed(2)} (the store takes ${RELEASE.storeCutPct}%).`] },
        { columns: 1, buttons: [{ id: 'release', label: 'Release', sub: 'Reviews come in, then sales start', onTap: () => doRelease(number) }] },
      ],
    };
  });

  // The Beta / Gold decision (Milestone 7).
  menus.register('decision', () => {
    const p = projects();
    const job = p.active;
    const dec = p.decision;
    if (!job || !dec) return null;
    const v = p.view();
    const late = v.deadlineDay == null ? '' : v.status === 'onTrack' ? 'On schedule' : `Due ${dateOf(v.deadlineDay)}: ${v.status === 'late' ? 'already late' : 'running behind'}`;
    const D = PROJECT_BALANCE.decisions;
    const extra = { outsource: ` Costs ${(PROJECT_BALANCE.scopes[v.scope].baseCostPerDay * D.outsource.costDays).toLocaleString('en-GB')} Credits.` };
    const opts = p.options();
    return {
      title: `${DECISION_POINTS[dec.point]}: ${v.title}`,
      subtitle: dec.point === 'beta' ? 'Alpha / Beta is done. How do you want to finish?' : 'Gold Master is done. Ship it, or keep working?',
      accent: C.action,
      sections: [
        { lines: [{ text: `${v.bugs} bug${v.bugs === 1 ? '' : 's'} left · ${late}`, color: v.status === 'onTrack' ? C.text : C.bad }] },
        {
          columns: 1,
          buttons: DECISIONS.map((d) => {
            const o = opts.find((x) => x.id === d.id);
            return { id: `decide:${d.id}`, label: d.name, sub: o.ok ? d[dec.point] + (extra[d.id] && o.ok ? extra[d.id] : '') : o.why, disabled: !o.ok, accent: d.id === 'ship' ? C.good : d.id === 'crunch' ? C.bad : C.progress, onTap: () => decide?.(d.id) };
          }),
        },
      ],
    };
  });

  // One picker per recipe slot.
  for (const f of FAMILIES) {
    menus.register(`pick:${f.id}`, () => ({
      title: f.name,
      subtitle: `Pick one for this game. ${elementsOf(f.id).filter((e) => isUnlocked(e.id)).length} of ${elementsOf(f.id).length} open; rank, years and research open more.`,
      accent: C.progress,
      sections: [
        {
          columns: 2,
          buttons: [...elementsOf(f.id)].sort((a, b) => isUnlocked(b.id) - isUnlocked(a.id)).map((e) => {
            const unlocked = isUnlocked(e.id);
            const clash = unlocked ? needsProblem(e, { ...recipe(), [f.id]: e.id }) : null;
            const sub = !unlocked ? lockReason(e.id) : picked(f.id) === e.id ? '✓ Chosen' : clash ? `Needs ${clash.split(' needs ')[1]}` : 'Open';
            return { id: e.id, label: e.name, icon: e.art, locked: !unlocked, sub, onTap: () => onPick(f.id, e.id) };
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
