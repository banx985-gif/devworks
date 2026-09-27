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
//   business: Ledger, Catalogue and Platform Market (Milestone 8; ?debug=1 adds skip-a-year)
//     with the balance, Fame, rank and Fan Trust; Main Menu (saves first, Milestone 5b)
//   release (Milestone 8): one or more platforms, porting / certification / QA overhead, launch day
//   Milestone 9: Business and Create lead to the Marketing Planner; market ({ key, id }) confirms one marketing action;
//   the release sheet shows the game's Hype, what fans expect, and the competitor releases in its launch month
import { MenuRegistry } from '../../../../core/ui/BottomSheet.js';
import { THEME } from '../../../../core/Theme.js';
import { STATIONS, WORK_STATE } from '../../data/studio.js';
import { BOTTOM_SLOTS, TOP_SHEETS } from '../../data/home.js';
import { ROLES } from '../../data/staff.js';
import { FAMILIES, elementsOf, needsProblem } from '../../data/elements.js';
import { PLATFORMS, RELEASE_MODEL } from '../../data/platforms.js';
import { RELEASE, ECONOMY, PROJECT_BALANCE, PLATFORM_BALANCE } from '../../data/balance.js';
import { DECISIONS, DECISION_POINTS, scopeById } from '../../data/projects.js';
import { actionById, CONVENTIONS } from '../../data/marketing.js';
import { elementById } from '../../data/elements.js';
import { fanExpectationFor } from '../systems/marketing.js';

const C = THEME.color;

export function createStudioMenus({ today = () => 0, debugSkipYear = null, decide = null, dateOf = (d) => `day ${d}`, world, open, projects, business, newGame, openProject, isUnlocked, lockReason = () => 'Locked', recipe = () => ({}), debugUnlockAll = null, onPick, picked, doRelease, openScreen, toTitle = null, runMarketing = null }) {
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
                  ...(business().marketing.targets().length ? [{ id: 'marketing', label: 'Marketing', sub: marketingLine(), icon: 'business_ui_05', accent: C.progress, onTap: () => openScreen('marketing') }] : []),
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
            { id: 'marketing', label: 'Marketing Planner', sub: marketingLine() || 'Hype and the release calendar', icon: 'business_ui_05', onTap: () => openScreen('marketing') },
            { id: 'platforms', label: 'Platform Market', sub: `${b.platforms.active(today()).length} platforms out now`, icon: 'platform_device_03', accent: C.progress, onTap: () => openScreen('platforms') },
            ...(debugSkipYear ? [{ id: 'skipYear', label: 'Debug: skip a year', sub: 'Runs the next 336 days', icon: biz.icon, accent: C.progress, onTap: () => debugSkipYear() }] : []),
          ],
        },
        ...(toTitle ? [{ columns: 1, buttons: [{ id: 'mainMenu', label: 'Main Menu', sub: 'Saves your studio, then back to the title screen', icon: biz.icon, accent: C.progress, onTap: toTitle }] }] : []),
      ],
    };
  });

  // Release a finished game: one platform, one price, one release model for now.
  // Release a finished game (Milestone 8): pick one or more platforms that are out now; the sheet shows each one's
  // state, players, audience fit and certification, then the porting / certification cost, the QA overhead and when
  // it launches. The picks are kept per game while the sheet is open.
  const picks = new Map(); // catalogue number → [platform ids]
  const fmt = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n.toLocaleString('en-GB'));
  menus.register('release', (number) => {
    const b = business();
    const rec = projects().catalogue.get(number);
    if (!rec || rec.release || rec.cert) return null;
    const day = today();
    const active = b.platforms.active(day);
    let chosen = (picks.get(number) ?? [RELEASE.platform]).filter((id) => active.some((x) => x.id === id));
    if (!chosen.length && active.length) chosen = [active[0].id];
    picks.set(number, chosen);
    const plan = b.releasePlan(number, chosen, day);
    const price = PROJECT_BALANCE.scopes[rec.result.scope]?.price ?? RELEASE.price; // Milestone 7: by scope
    const keep = (price * (100 - RELEASE.storeCutPct)) / 100;
    const toggle = (id) => {
      const now = picks.get(number) ?? [];
      picks.set(number, now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
    };
    const lines = [`${scopeById(rec.result.scope)?.name ?? ''} game. ${price} Credits a copy; you keep ${keep.toFixed(2)} (the store takes ${RELEASE.storeCutPct}%).`];
    if (plan.ok) {
      if (plan.cost) lines.push({ text: `Porting ${plan.portCost.toLocaleString('en-GB')} + certification ${plan.certFees.toLocaleString('en-GB')} = ${plan.cost.toLocaleString('en-GB')} Credits now`, color: C.actionDark });
      if (plan.extraBugs) lines.push({ text: `Extra QA for ${chosen.length} platforms: +${plan.extraBugs} bug${plan.extraBugs === 1 ? '' : 's'} the reviews will see`, color: C.bad });
      lines.push({ text: plan.certDays ? `Certification takes ${plan.certDays} days: it launches ${dateOf(plan.launchDay)}` : 'No certification needed: it launches today', color: C.text });
    } else lines.push({ text: plan.why, color: C.bad });
    // Milestone 9: Hype, what fans expect, and the competition in the launch month.
    const mk = b.marketing;
    const hype = mk.hypeOf(rec.jobId);
    lines.push({ text: `Hype ${Math.round(hype)}: fans expect a review of about ${Math.round(fanExpectationFor(hype))}`, color: C.actionDark });
    const launchDay = plan.ok ? plan.launchDay : day;
    const comps = mk.competitors(mk.monthOf(launchDay));
    const clash = mk.clashFor(rec.result.recipe?.genre, launchDay);
    if (clash) lines.push({ text: `${clash.competitor.big ? 'Big' : 'Small'} ${elementById(clash.competitor.genre)?.name ?? ''} release that month: "${clash.competitor.title}" (${clash.competitor.studio}) cuts your launch week by ${clash.pct}%`, color: C.bad });
    else lines.push({ text: comps.length ? `Launch month: ${comps.map((x) => `"${x.title}" (${elementById(x.genre)?.name ?? ''}${x.big ? ', big' : ''})`).join(', ')}, none in your genre` : 'No competitor releases in the launch month', color: C.textMuted });
    return {
      title: `Release "${rec.result.title}"`,
      subtitle: `${RELEASE_MODEL.name}. Pick one or more platforms.`,
      art: rec.result.cover,
      sections: [
        {
          title: 'Platforms out now',
          columns: 1,
          buttons: active.map((pl) => {
            const on = chosen.includes(pl.id);
            const x = plan.platforms?.find((q) => q.id === pl.id) ?? b.releasePlan(number, [pl.id], day).platforms[0];
            const fit = x.fit > 1.05 ? ' · good fit' : x.fit < 0.95 ? ' · weak fit' : '';
            const cert = pl.open ? ' · no certification' : ` · certification ${PLATFORM_BALANCE.friendliness[pl.friendliness].certDays} days`;
            return { id: pl.id, label: on ? `✓ ${pl.name}` : pl.name, sub: `${x.status}${x.niche > 1 ? ' (niche bonus)' : ''} · ${fmt(x.base)} players${fit}${cert}`, icon: pl.art, accent: on ? C.good : C.progress, onTap: () => toggle(pl.id) };
          }),
        },
        { lines },
        { columns: 1, buttons: [{ id: 'release', label: plan.certDays ? 'Send to certification' : 'Release', sub: plan.certDays ? 'Reviews and sales start at launch' : 'Reviews come in, then sales start', disabled: !plan.ok, onTap: () => doRelease(number, chosen) }] },
      ],
    };
  });

  // Run one marketing action (Milestone 9): what it costs and brings, then Run.
  menus.register('market', (t) => {
    const mk = business().marketing;
    const game = mk.targetByKey(t?.key);
    const o = mk.options(t?.key).find((x) => x.action.id === t?.id);
    if (!game || !o) return null;
    const a = o.action;
    const lines = [
      { text: `${a.cost.toLocaleString('en-GB')} Credits now · +${Math.round(o.gain)} Hype over ${a.days} days`, color: C.actionDark },
      `Hype now ${Math.round(mk.hypeOf(game.key))}. More Hype sells more at launch, but fans expect more too.`,
    ];
    if (a.months) lines.push(`${CONVENTIONS[mk.monthOfYear()] ?? 'A show'} is on this month.`);
    if (!o.ok) lines.push({ text: o.why, color: C.bad });
    return {
      title: `${a.name}: ${game.title}`,
      subtitle: a.line,
      art: a.art,
      sections: [{ lines }, { columns: 1, buttons: [{ id: 'run', label: `Run ${a.name}`, sub: `${a.cost.toLocaleString('en-GB')} Credits`, disabled: !o.ok, onTap: () => runMarketing?.(game.key, a.id) }] }],
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
  // The Hype of the game being marketed (the one in the works first).
  const marketingLine = () => {
    const t = business().marketing.targets()[0];
    return t ? `Hype ${Math.round(business().marketing.hypeOf(t.key))} · ${t.title}` : '';
  };
  const projectLine = () => {
    const v = projects().view();
    return v ? `${v.title} · ${v.phaseName} ${Math.floor(v.phaseFrac * 100)}%` : '';
  };

  for (const [id, t] of Object.entries(TOP_SHEETS)) {
    menus.register(id, () => ({ title: t.title, subtitle: t.line, accent: C.progress }));
  }
  return menus;
}
