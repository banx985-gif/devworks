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
//   Milestone 11: shop (Build Mode → Shop: every facility, open ones first, locked ones with why), facility (Build Mode
//   → tap a station: what it does, Sell for 50%), studio (Business → Studio: the stage, staff cap, game lanes, the
//   next stage's needs and Upgrade; ?debug=1 adds an award); Business → Build Mode
//   Milestone 13: recruit (the Recruitment Desk / Staff → Hire: channels, the 3 cards, refresh), candidate (one card:
//   stats, trait, salary, where they'd work, Hire), train (courses for one worker), mentor (an Elite's mentee); Create
//   lists every game in the works (two lanes at S2+) and New Game while a lane is free
//   Milestone 14: staff buttons show the head crop (data/portraits.js); ?debug=1 adds the Staff book (all 50: preview any
//   card; spawn Standard / Rare / Elite — Legendary / Secret stay gated)
//   Milestone 16: Create → Engines (the Engine Catalogue); engineStart (kind): what it does, the team (Programmers
//   first), Start
//   Milestone 17: Business → Publishers and Contract Board (screens); contractTeam (id): pick the team, Accept; the
//   release sheet keeps a publisher's platform in (and says so)
//   Milestone 19: Compete → Awards / Rivals / Rankings (screens); the debug award is gone (awards are real)
//   Milestone 20: support (catalogue number): Patch / Free Update / Expansion / DLC / Port / Move On with what each
//   does, costs and why not; Remaster / Remake lead to New Game; supportTeam ({ number, option, platform }): the team
//   Milestone 21: Business → Engine Licensing, Publishing Office and Acquisitions (screens)
//   Milestone 23: Create → Hardware (screen); hwPick (slot): the six parts of a slot (open ones pick; locked ones with
//   why); hwBuild: the prototype's team (Programmers and Producers first), Start
import { MenuRegistry } from '../../../../core/ui/BottomSheet.js';
import { THEME } from '../../../../core/Theme.js';
import { STATIONS, WORK_STATE } from '../../data/studio.js';
import { BOTTOM_SLOTS, TOP_SHEETS } from '../../data/home.js';
import { ROLES, STATS, TIERS, TRAITS, ROSTER, staffDefById } from '../../data/staff.js';
import { portraitOf } from '../../data/portraits.js';
import { MENTORING } from '../../data/recruitment.js';
import { SUPPORT_OPTIONS } from '../../data/support.js';
import { FAMILIES, elementsOf, needsProblem } from '../../data/elements.js';
import { PLATFORMS, RELEASE_MODEL } from '../../data/platforms.js';
import { RELEASE, ECONOMY, PROJECT_BALANCE, PLATFORM_BALANCE } from '../../data/balance.js';
import { DECISIONS, DECISION_POINTS, scopeById } from '../../data/projects.js';
import { actionById, CONVENTIONS } from '../../data/marketing.js';
import { elementById } from '../../data/elements.js';
import { fanExpectationFor } from '../systems/marketing.js';
import { facilityById, stageById } from '../../data/facilities.js';
import { HW_SLOTS, componentsOf } from '../../data/hardware.js';
import { DISTRIBUTION } from '../../data/distribution.js';

const C = THEME.color;

export function createStudioMenus({ today = () => 0, debugSkipYear = null, decide = null, dateOf = (d) => `day ${d}`, world, open, projects, business, newGame, openProject, isUnlocked, lockReason = () => 'Locked', recipe = () => ({}), debugUnlockAll = null, onPick, picked, doRelease, openScreen, toTitle = null, runMarketing = null, shop = null, buyFacility = null, sellFacility = null, upgradeStudio = null, buildMode = null, debugAward = null, recruitment = null, training = null, hireCard = null, startCourse = null, lanes = () => 1, openProjectById = null, debugHire = null, debugSpawn = null, engines = null, startEngine = null, publishers = null, contracts = null, acceptContract = null, sponsors = null, support = null, startSupport = null, newGameAs = null, global = null, hardware = null, pickPart = null, startHardware = null, consoles = null, distribution = null, fullLaunch = null, setStorefront = null }) {
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
        for (const job of def.role === 'Maker' ? projects().jobs : []) {
          const v = projects().view(job);
          lines.push({ text: `Making: ${v.title} · ${v.phaseName} ${Math.floor(v.phaseFrac * 100)}%`, color: C.progress });
        }
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
    if (slot.id === 'compete') {
      // Milestone 19: the three Compete screens.
      menus.register('compete', () => ({
        title: slot.label,
        subtitle: slot.line,
        art: slot.icon,
        sections: [{ columns: 1, buttons: [
          { id: 'awards', label: 'Awards', sub: 'C01–C10, your trophies and last year’s results', icon: 'award_trophy_01', onTap: () => openScreen('awards') },
          { id: 'rivals', label: 'Rivals', sub: 'The other studios and their games', icon: 'rival_logo_r01', accent: C.progress, onTap: () => openScreen('rivals') },
          { id: 'rankings', label: 'Rankings', sub: 'Studios by awards and sales', icon: 'dev_ui_04', accent: C.purple, onTap: () => openScreen('rankings') },
        ] }],
      }));
      continue;
    }
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
                    .map((r) => ({ id: `release${r.number}`, label: r.ea ? `Early Access: "${r.result.title}"` : `Release "${r.result.title}"`, sub: r.ea ? `Month ${r.ea.months} · ${r.result.bugs} bugs left · full launch when ready` : 'Finished and waiting', icon: r.result.cover, onTap: () => open('release', r.number) })),
                  ...(projects().decision ? [{ id: 'decision', label: `${DECISION_POINTS[projects().decision.point]} decision needed`, sub: 'Your game waits for you', icon: 'dev_ui_07', accent: C.action, onTap: () => open('decision') }] : []),
                  ...projects().jobs.map((job, i) => ({ id: i ? `current${i + 1}` : 'current', label: projects().jobs.length > 1 ? `Game in the works: ${job.name}` : 'Current project', sub: projectLine(job), icon: 'dev_ui_07', onTap: () => (openProjectById ? openProjectById(job.id) : openProject()) })),
                  ...(projects().jobs.length < lanes() ? [{ id: 'newGame', label: projects().jobs.length ? `New Game (lane ${projects().jobs.length + 1})` : 'New Game', sub: projects().jobs.length ? `Your studio can make ${lanes()} games at once` : 'Pick a recipe, scope and team', icon: slot.icon, onTap: newGame }] : []),
                  ...(business().marketing.targets().length ? [{ id: 'marketing', label: 'Marketing', sub: marketingLine(), icon: 'business_ui_05', accent: C.progress, onTap: () => openScreen('marketing') }] : []),
                  ...(engines ? [{ id: 'engines', label: 'Engines', sub: engineLine(), icon: 'dev_ui_11', accent: C.purple, onTap: () => openScreen('engines') }] : []),
                  ...(hardware ? [{ id: 'hardware', label: 'Hardware', sub: hardware().view() ? `Building: ${hardware().view().name}` : hardware().hardwareWhy() ? 'Needs a Hardware Prototype Lab' : `${hardware().prototypes.length} prototype${hardware().prototypes.length === 1 ? '' : 's'}`, icon: 'dev_ui_26', accent: C.purple, onTap: () => openScreen('hardware') }] : []), // Milestone 23
                  ...(consoles && (consoles().own() || consoles().validPrototypes().length) ? [{ id: 'consoles', label: 'Consoles', sub: consoles().own() ? `${consoles().own().name}: ${consoles().own().installBase.toLocaleString('en-GB')} players` : 'Plan a console launch', icon: 'dev_ui_29', accent: C.purple, onTap: () => openScreen('consoles') }] : []), // Milestone 24
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
            ...(shop ? [{ id: 'studio', label: 'Studio', sub: `${shop().stage().name} · stage ${shop().stage().id}`, icon: 'facility_f01', accent: C.progress, onTap: () => open('studio') }] : []),
            ...(buildMode ? [{ id: 'buildMode', label: 'Build Mode', sub: 'Buy, move and sell facilities', icon: 'facility_f02', accent: C.progress, onTap: () => buildMode() }] : []),
            { id: 'marketing', label: 'Marketing Planner', sub: marketingLine() || 'Hype and the release calendar', icon: 'business_ui_05', onTap: () => openScreen('marketing') },
            ...(publishers ? [{ id: 'publishers', label: 'Publishers', sub: `${publishers().offers.length} offer${publishers().offers.length === 1 ? '' : 's'} · ${publishers().active.length} signed`, icon: 'business_ui_01', accent: C.purple, onTap: () => openScreen('publishers') }] : []),
            ...(sponsors ? [{ id: 'sponsors', label: 'Sponsors', sub: `${sponsors().deals.length} of ${sponsors().slots()} slots · ${sponsors().offers.length} offer${sponsors().offers.length === 1 ? '' : 's'}`, icon: 'business_ui_02', accent: C.purple, onTap: () => openScreen('sponsors') }] : []),
            ...(contracts ? [{ id: 'contracts', label: 'Contract Board', sub: `${contracts().offers.length} jobs · ${contracts().active.length} of 2 active`, icon: 'business_ui_03', accent: C.purple, onTap: () => openScreen('contracts') }] : []),
            ...(global
              ? [
                  { id: 'licensing', label: 'Engine Licensing', sub: global().licensingWhy() ?? `${global().licences.length} of ${global().maxLicences()} · ${global().licenceOffers.length} offer${global().licenceOffers.length === 1 ? '' : 's'}`, icon: 'business_ui_10', accent: C.purple, onTap: () => openScreen('licensing') },
                  { id: 'publishingOffice', label: 'Publishing Office', sub: global().externalWhy() ?? `${global().activeExternal().length} of 3 · ${global().pitches.length} pitch${global().pitches.length === 1 ? '' : 'es'}`, icon: 'business_ui_11', accent: C.purple, onTap: () => openScreen('publishingOffice') },
                  { id: 'acquisitions', label: 'Acquisitions', sub: global().acqOffer ? 'A studio is for sale!' : `${global().acquired.length} of 2 bought`, icon: 'business_ui_12', accent: C.purple, onTap: () => openScreen('acquisitions') },
                ]
              : []),
            { id: 'platforms', label: 'Platform Market', sub: `${b.platforms.active(today()).length} platforms out now`, icon: 'platform_device_03', accent: C.progress, onTap: () => openScreen('platforms') },
            ...(distribution?.() && !distribution().storefrontWhy() ? [{ id: 'storefront', label: 'Storefront', sub: distribution().storefront.open ? `Open · ${Math.round(distribution().shareNow())}% of downloads` : 'Closed', icon: DISTRIBUTION.icon, accent: C.purple, onTap: () => open('storefront') }] : []), // Milestone 26
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
  const modes = new Map(); // Milestone 26: catalogue number → distribution mode
  const fmt = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n.toLocaleString('en-GB'));
  menus.register('release', (number) => {
    const b = business();
    const rec = projects().catalogue.get(number);
    if (!rec || rec.release || rec.cert) return null;
    if (rec.ea) return earlyAccessSheet(rec); // Milestone 26
    const day = today();
    const dist = distribution?.();
    const mode = modes.get(number) ?? 'balanced';
    const active = b.platforms.active(day);
    let chosen = (picks.get(number) ?? [RELEASE.platform]).filter((id) => active.some((x) => x.id === id));
    if (!chosen.length && active.length) chosen = [active[0].id];
    picks.set(number, chosen);
    const plan = b.releasePlan(number, chosen, day, dist ? mode : 'balanced');
    const price = PROJECT_BALANCE.scopes[rec.result.scope]?.price ?? RELEASE.price; // Milestone 7: by scope
    const keep = (price * (100 - RELEASE.storeCutPct)) / 100;
    const needs = publishers?.()?.requiredPlatform(rec, day); // Milestone 17
    if (needs && !chosen.includes(needs)) chosen = [...chosen, needs];
    const toggle = (id) => {
      if (id === needs) return; // the publisher's platform stays in
      const now = picks.get(number) ?? [];
      picks.set(number, now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
    };
    const lines = [...(needs ? [{ text: `${rec.result.deal.name} publishes it: it must come out on ${publishers().platformName(needs)}, and they take ${rec.result.deal.sharePct}% of sales.`, color: C.purple }] : []), `${scopeById(rec.result.scope)?.name ?? ''} game. ${price} Credits a copy; you keep ${keep.toFixed(2)} (the store takes ${RELEASE.storeCutPct}%).`];
    if (plan.ok) {
      if (plan.cost) lines.push({ text: `Porting ${plan.portCost.toLocaleString('en-GB')} + certification ${plan.certFees.toLocaleString('en-GB')} = ${plan.cost.toLocaleString('en-GB')} Credits now`, color: C.actionDark });
      if (plan.extraBugs) lines.push({ text: `Extra QA for ${chosen.length} platforms: +${plan.extraBugs} bug${plan.extraBugs === 1 ? '' : 's'} the reviews will see`, color: C.bad });
      lines.push({ text: plan.certDays ? `Certification takes ${plan.certDays} days: it launches ${dateOf(plan.launchDay)}` : 'No certification needed: it launches today', color: C.text });
    } else lines.push({ text: plan.why, color: C.bad });
    // Milestone 26: the distribution mode — this year's box / download split and what the mode does to it.
    if (dist) {
      const fx = dist.effectsNow(mode);
      lines.push({ text: `${DISTRIBUTION.modes[mode].name} · this year ${Math.round(fx.physicalPct)}% of players buy boxes: sales × ${fx.salesMult.toFixed(2)}${fx.netMult !== 1 ? ` · keeps ${Math.round(fx.netMult * 100)}% per copy` : ''}${plan.pressing ? ` · pressing ${plan.pressing.toLocaleString('en-GB')} Credits now` : ''}`, color: C.purple });
      lines.push({ text: DISTRIBUTION.modes[mode].line, color: C.textMuted });
    }
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
      subtitle: distribution?.() ? 'Self-publish. Pick the platforms and how it is sold.' : `${RELEASE_MODEL.name}. Pick one or more platforms.`,
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
        ...(dist
          ? [
              {
                title: 'Distribution',
                columns: 2,
                buttons: Object.entries(DISTRIBUTION.modes).map(([id, m]) => {
                  const why = id === 'earlyAccess' ? dist.eaWhy(rec, chosen) : null;
                  return { id: `mode-${id}`, label: mode === id ? `✓ ${m.short}` : m.short, sub: why ?? `sales × ${dist.effectsNow(id).salesMult.toFixed(2)} this year`, icon: DISTRIBUTION.icon, accent: mode === id ? C.good : C.progress, disabled: !!why, onTap: () => modes.set(number, id) };
                }),
              },
            ]
          : []),
        { columns: 1, buttons: [{ id: 'release', label: mode === 'earlyAccess' && dist ? 'Start Early Access' : plan.certDays ? 'Send to certification' : 'Release', sub: plan.certDays ? 'Reviews and sales start at launch' : 'Reviews come in, then sales start', disabled: !plan.ok, onTap: () => doRelease(number, chosen, dist ? mode : 'balanced') }] },
      ],
    };
  });

  // Milestone 26: a game in Early Access — how it is doing, and Full launch.
  function earlyAccessSheet(rec) {
    const dist = distribution?.();
    const ea = rec.ea;
    const E = DISTRIBUTION.earlyAccess;
    const left = E.maxMonths - ea.months;
    const lines = [
      { text: `Month ${ea.months} of Early Access · ${ea.sales.copies.toLocaleString('en-GB')} early copies · ${ea.sales.revenue.toLocaleString('en-GB')} Credits`, color: C.actionDark },
      { text: `Players reported bugs: ${ea.fixed} fixed, ${rec.result.bugs} left (${ea.bugsAtStart} at the start). ${E.bugFixPct}% of what is left is fixed each month.`, color: C.text },
      ea.months >= E.okMonths ? { text: `Fans are getting impatient: every month now costs ${E.trustPerMonth} Fan Trust. It launches by itself in ${left} month${left === 1 ? '' : 's'}.`, color: C.bad } : { text: `Fans are happy to wait ${E.okMonths - ea.months} more month${E.okMonths - ea.months === 1 ? '' : 's'}.`, color: C.good },
      rec.result.bugs > E.buggyBugs ? { text: `Launching with more than ${E.buggyBugs} bugs costs ${E.buggyTrust} Fan Trust.`, color: C.bad } : { text: 'Few bugs left: a clean launch.', color: C.good },
      `Full launch: reviews come in and it sells like a digital release (${E.fullLaunchPct}% — early players already have it).`,
    ];
    return {
      title: `Early Access: "${rec.result.title}"`,
      subtitle: `On ${ea.plan.platforms.map((x) => x.name).join(', ')}`,
      art: rec.result.cover,
      sections: [{ lines }, { columns: 1, buttons: [{ id: 'fullLaunch', label: 'Full launch', sub: 'Reviews come in, then full sales', disabled: !dist, onTap: () => fullLaunch?.(rec.number) }] }],
    };
  }
  // Milestone 26: the studio's own storefront (Business → Storefront).
  menus.register('storefront', () => {
    const dist = distribution?.();
    if (!dist) return null;
    const st = dist.storefront;
    const why = dist.storefrontWhy();
    const S = DISTRIBUTION.storefront;
    const last = st.history.at(-1);
    const lines = [
      { text: `${st.open ? 'Open' : 'Closed'} · ${Math.round(dist.shareNow())}% of your games' downloads sell through it this year (at most ${S.capPct}%)`, color: st.open ? C.good : C.actionDark },
      `On those you keep the store's ${RELEASE.storeCutPct}% cut too; your console's third-party games pay a little through it. It costs ${S.opCost.toLocaleString('en-GB')} Credits a month while open.`,
      { text: 'It adds margin only: every game still reaches players through the platforms.', color: C.textMuted },
      ...(last ? [{ text: `Last month: +${last.margin.toLocaleString('en-GB')} games, +${last.thirdParty.toLocaleString('en-GB')} third-party, −${last.opCost.toLocaleString('en-GB')} running = ${last.net >= 0 ? '+' : ''}${last.net.toLocaleString('en-GB')}`, color: last.net >= 0 ? C.good : C.bad }] : []),
      ...(st.totals.opCost ? [{ text: `So far: ${(st.totals.margin + st.totals.thirdParty - st.totals.opCost).toLocaleString('en-GB')} Credits net`, color: C.actionDark }] : []),
      ...(why ? [{ text: why, color: C.bad }] : []),
    ];
    return {
      title: 'Your Storefront',
      subtitle: 'Sell your games (and your console\'s third-party games) directly.',
      art: DISTRIBUTION.icon,
      sections: [{ lines }, { columns: 1, buttons: [{ id: 'toggle', label: st.open ? 'Close the storefront' : 'Open the storefront', sub: why ?? (st.open ? 'No more running costs' : `${S.opCost.toLocaleString('en-GB')} Credits a month`), disabled: !!why, accent: st.open ? C.bad : C.good, onTap: () => setStorefront?.(!st.open) }] }],
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

  // Milestone 11: the facility shop (from Build Mode).
  menus.register('shop', () => {
    const s = shop?.();
    if (!s) return null;
    const list = s.list().filter((x) => !x.owned);
    return {
      title: 'Facility Shop',
      subtitle: `${business().credits.toLocaleString('en-GB')} Credits. A new facility goes on the first free spot; drag it where you want it.`,
      art: 'facility_f02',
      accent: C.progress,
      sections: [
        {
          columns: 1,
          buttons: list.map((x) => ({ id: x.def.id, label: `${x.def.name} · ${x.def.cost.toLocaleString('en-GB')}`, sub: x.ok ? x.def.line + (x.def.later ? ` (with ${x.def.later})` : '') : x.why, icon: x.def.art, locked: !x.ok && !/Credits$/.test(x.why ?? ''), disabled: !x.ok, onTap: () => buyFacility?.(x.def.id) })),
        },
      ],
    };
  });
  // One facility in Build Mode: what it does, and Sell.
  menus.register('facility', (id) => {
    const s = shop?.();
    const def = facilityById(id);
    const st = world().stationById(id);
    if (!s || !def || !st) return null;
    const why = s.sellWhy(id);
    return {
      title: def.name,
      subtitle: `${def.role} · ${def.line}${def.later ? ` (with ${def.later})` : ''}`,
      art: def.art,
      sections: [{ columns: 1, buttons: [{ id: 'sell', label: `Sell for ${s.refundOf(id).toLocaleString('en-GB')} Credits`, sub: why ?? `Half of its ${def.cost.toLocaleString('en-GB')} back`, disabled: !!why, accent: C.bad, onTap: () => sellFacility?.(id) }] }],
    };
  });
  // The studio stage (Business → Studio).
  menus.register('studio', () => {
    const s = shop?.();
    if (!s) return null;
    const st = s.stage();
    const w = world();
    const n = s.next();
    const lines = [
      { text: `${st.line}`, color: C.text },
      { text: `Staff ${w.staffSystem.staff.length} of ${st.staffCap} · game lanes ${st.lanes} · floor ${w.cols} × ${w.rows}`, color: C.actionDark },
      { text: 'Hire at the Recruitment Desk or Staff → Hire. The cap is how many this studio can hold.', color: C.textMuted },
    ];
    const sections = [{ lines }];
    if (n) {
      sections.push({ title: `Next: ${n.stage.name}`, lines: [...n.reqs.map((r) => ({ text: `${r.ok ? '✓' : '✗'} ${r.label}`, color: r.ok ? C.good : C.bad })), { text: `Staff cap ${n.stage.staffCap} · game lanes ${n.stage.lanes} · floor ${n.stage.cols} × ${n.stage.rows}`, color: C.textMuted }] });
      sections.push({ columns: 1, buttons: [{ id: 'upgrade', label: `Move to the ${n.stage.name}`, sub: n.ok ? `${n.stage.cost.toLocaleString('en-GB')} Credits. Everything stays where it is.` : n.why, disabled: !n.ok, icon: n.stage.shell, onTap: () => upgradeStudio?.() }] });
    } else sections.push({ lines: [{ text: 'The Global Campus is the biggest studio. Secret R&D spaces come later.', color: C.textMuted }] });
    return { title: `Studio: ${st.name}`, subtitle: `Stage ${st.id} of 5`, art: st.shell ?? 'facility_f01', sections };
  });

  // The Beta / Gold decision (Milestone 7).
  menus.register('decision', () => {
    const p = projects();
    const job = p.decisionJob;
    const dec = p.decision;
    if (!job || !dec) return null;
    const v = p.view(job);
    const late = v.deadlineDay == null ? '' : v.status === 'onTrack' ? 'On schedule' : `Due ${dateOf(v.deadlineDay)}: ${v.status === 'late' ? 'already late' : 'running behind'}`;
    const D = PROJECT_BALANCE.decisions;
    const extra = { outsource: ` Costs ${(PROJECT_BALANCE.scopes[v.scope].baseCostPerDay * D.outsource.costDays).toLocaleString('en-GB')} Credits.` };
    const opts = p.options(job);
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

  // --- Milestone 13: recruitment, one candidate, training, mentoring ------------------------------------------------
  const statLine = (st) => STATS.map((x) => `${x.label} ${st[x.key]}`).join(' · ');
  const mainStat = (d) => {
    const k = ROLES[d.role].primaryStat;
    return `${STATS.find((x) => x.key === k).label} ${d.stats[k]}`;
  };
  menus.register('recruit', () => {
    const r = recruitment?.();
    if (!r) return null;
    const w = world();
    const b = business();
    const ch = r.channels.find((c) => c.id === r.state.channel);
    const free = r.freeInDays();
    const cards = r.cards;
    const cost = r.refreshCost();
    return {
      title: 'Recruitment',
      subtitle: `Staff ${w.staffSystem.staff.length} of ${w.staffCap} · the board refreshes itself for free in ${free} day${free === 1 ? '' : 's'}.`,
      art: 'facility_f09',
      accent: C.progress,
      sections: [
        {
          title: 'Channel',
          columns: 2,
          buttons: r.channels.map((c) => {
            const why = r.channelWhy(c.id);
            return { id: `channel:${c.id}`, label: c.id === ch.id ? `✓ ${c.name}` : c.name, sub: why ?? c.line, locked: !!why, accent: c.id === ch.id ? C.good : C.progress, onTap: () => r.setChannel(c.id) };
          }),
        },
        cards.length
          ? {
              title: 'Candidates',
              columns: 1,
              buttons: cards.map((c) => {
                const d = r.cardDef(c);
                return { id: `card:${c.id}`, label: `${d.name}${c.special ? ' ★' : ''}`, sub: `${ROLES[d.role].name} · ${TIERS[d.tier].name} · ${mainStat(d)} · ${d.salary.toLocaleString('en-GB')} a month${c.special?.note ? ` · ${c.special.note}` : c.returning ? ' · worked here before' : ''}`, icon: d.art, iconCrop: portraitOf(d.art), accent: c.special ? C.gold : C.progress, onTap: () => open('candidate', c.id) };
              }),
            }
          : { lines: [{ text: 'Nobody new on this board. Refresh, or try another channel when it opens.', color: C.textMuted }] },
        {
          columns: 1,
          buttons: [
            { id: 'refresh', label: `Refresh now: ${ch.name}`, sub: b.credits >= cost ? `${cost.toLocaleString('en-GB')} Credits (the price doubles for each refresh this month)` : `Needs ${cost.toLocaleString('en-GB')} Credits`, disabled: b.credits < cost, onTap: () => r.refresh() },
            ...(debugHire ? [{ id: 'debugElite', label: 'Debug: an Elite joins', sub: 'Adds an Elite (for mentoring checks)', accent: C.purple, onTap: () => debugHire() }] : []),
            ...(debugSpawn ? [{ id: 'staffBook', label: 'Debug: Staff book', sub: 'All 50: preview any card, spawn Standard / Rare / Elite', accent: C.purple, onTap: () => open('staffBook') }] : []),
          ],
        },
      ],
    };
  });
  menus.register('candidate', (cardId) => {
    const r = recruitment?.();
    const c = r?.board.get(cardId);
    const d = c && r.cardDef(c);
    if (!d) return null;
    const chk = r.hireCheck(cardId);
    const seat = chk.seat;
    const where = seat?.station ? `Works at the ${seat.name}` : seat?.build ? `A ${seat.name} is built for them: ${seat.cost.toLocaleString('en-GB')} Credits` : null;
    const lines = [
      { text: statLine(d.stats), color: C.actionDark },
      `Salary ${d.salary.toLocaleString('en-GB')} Credits a month · Level ${d.startLevel}`,
      ...d.traits.map((t) => ({ text: `${TRAITS[t]?.name ?? t}: ${TRAITS[t]?.text ?? ''}`, color: C.purple })),
    ];
    if (where) lines.push({ text: where, color: C.text });
    if (c.special?.note) lines.push({ text: `${c.special.note}. On the board until ${dateOf(c.special.until)}.`, color: C.gold });
    if (!chk.ok) lines.push({ text: chk.why, color: C.bad });
    return {
      title: d.name,
      subtitle: `${ROLES[d.role].name} · ${TIERS[d.tier].name}`,
      art: d.art,
      sections: [
        { lines },
        {
          columns: 2,
          buttons: [
            { id: 'hire', label: `Hire ${d.name.split(' ')[0]}`, sub: chk.ok ? (seat.build ? `${seat.cost.toLocaleString('en-GB')} Credits now, then the salary` : 'Salary paid each month') : chk.why, disabled: !chk.ok, accent: C.good, onTap: () => hireCard?.(cardId) },
            { id: 'back', label: 'Back', sub: 'To the board', accent: C.progress, onTap: () => open('recruit') },
          ],
        },
      ],
    };
  });
  menus.register('train', (staffId) => {
    const t = training?.();
    const s = world().staffSystem.get(staffId);
    if (!t || !s) return null;
    const now = t.trainingOf(staffId);
    const opts = t.options(staffId);
    const gainText = (p) => p.map((x) => `${STATS.find((st) => st.key === x.key).label} +${x.min === x.max ? x.min : `${x.min}–${x.max}`}`).join(', ');
    return {
      title: `Training: ${s.name}`,
      subtitle: now ? `On ${t.courses.course(now.courseId).name}: back in ${t.daysLeft(staffId)} days.` : 'Away from work for the course, then better stats (never past the tier cap). Each course once a year.',
      art: s.art,
      accent: C.progress,
      sections: [
        {
          columns: 1,
          buttons: opts.map((o) => ({ id: `course:${o.course.id}`, label: `${o.course.name} · ${o.course.cost.toLocaleString('en-GB')}`, sub: o.ok ? `${gainText(o.preview)} · ${o.course.days} days away` : o.why, locked: !o.ok && /^Needs Research|^Needs a franchise/.test(o.why ?? ''), disabled: !o.ok, icon: o.course.art, onTap: () => startCourse?.(o.course.id, staffId) })),
        },
      ],
    };
  });
  menus.register('mentor', (mentorId) => {
    const t = training?.();
    const s = world().staffSystem.get(mentorId);
    if (!t || !s) return null;
    const p = t.pairOfMentor(mentorId);
    if (p) {
      const e = world().staffSystem.get(p.mentee);
      const trait = p.tag ? TRAITS[p.tag]?.name : null;
      const next = t.tagFor(p);
      return {
        title: `${s.name} mentors ${e?.name ?? ''}`,
        subtitle: 'Each day both work on the same game, the mentee gains XP; after enough shared days they learn one of the mentor’s traits.',
        art: s.art,
        sections: [
          { lines: [{ text: `${p.sharedDays} shared day${p.sharedDays === 1 ? '' : 's'} · +${MENTORING.xpPerDay} XP each`, color: C.actionDark }, { text: trait ? `Learned: ${trait}` : `A specialty tag after ${MENTORING.tagDays} shared days${next ? ` (${TRAITS[next]?.name})` : ' (they already have a specialty, or nothing new to learn)'}`, color: trait ? C.good : C.textMuted }] },
          { columns: 1, buttons: [{ id: 'stopMentor', label: 'Stop mentoring', sub: 'They keep what they learned', accent: C.bad, onTap: () => t.stopMentoring(mentorId) }] },
        ],
      };
    }
    return {
      title: `Mentor: ${s.name}`,
      subtitle: `${TIERS[s.tier].name} staff can mentor one person of a lower tier.`,
      art: s.art,
      accent: C.progress,
      sections: [{ columns: 1, buttons: t.menteeOptions(mentorId).map((o) => ({ id: `mentee:${o.staff.id}`, label: o.staff.name, sub: o.ok ? `${ROLES[o.staff.role].name} · ${TIERS[o.staff.tier].name} · Level ${o.staff.level}` : o.why, icon: o.staff.art, iconCrop: portraitOf(o.staff.art), disabled: !o.ok, onTap: () => t.startMentoring(mentorId, o.staff.id) })) }],
    };
  });

  // Milestone 14 (?debug=1): every one of the 50, and one card.
  menus.register('staffBook', () => {
    if (!debugSpawn) return null;
    const w = world();
    return {
      title: 'Staff book',
      subtitle: 'All 50 staff (bible §10). Legendary and Secret staff arrive only through their secrets, later.',
      accent: C.purple,
      sections: Object.keys(ROLES).map((role) => ({
        title: ROLES[role].name,
        columns: 2,
        buttons: ROSTER.filter((d) => d.role === role).map((d) => ({ id: `book:${d.id}`, label: d.name, sub: `${TIERS[d.tier].name}${w.staffSystem.get(d.id) ? ' · here' : ''}`, icon: d.art, iconCrop: portraitOf(d.art), accent: ['legendary', 'secret'].includes(d.tier) ? C.gold : C.progress, onTap: () => open('staffPreview', d.id) })),
      })),
    };
  });
  menus.register('staffPreview', (id) => {
    const d = staffDefById(id);
    const r = recruitment?.();
    if (!d || !debugSpawn || !r) return null;
    const here = !!world().staffSystem.get(id);
    const can = r.spawnable(d);
    const lines = [
      { text: statLine(d.stats), color: C.actionDark },
      `Level ${d.startLevel} · salary ${d.salary.toLocaleString('en-GB')} Credits a month`,
      ...d.traits.map((t) => ({ text: `${TRAITS[t]?.signature ? '★ ' : ''}${TRAITS[t]?.name ?? t}: ${TRAITS[t]?.text ?? ''}`, color: TRAITS[t]?.signature ? C.gold : C.purple })),
      { text: `Found by: ${r.eligibilityWhy(d) ?? 'eligible now'}`, color: C.textMuted },
    ];
    return {
      title: d.name,
      subtitle: `${ROLES[d.role].name} · ${TIERS[d.tier].name} (cap ${TIERS[d.tier].statCap}, ${TIERS[d.tier].traitSlots} trait slot${TIERS[d.tier].traitSlots > 1 ? 's' : ''}${TIERS[d.tier].signature ? ' + signature' : ''})`,
      art: d.art,
      sections: [
        { lines },
        { columns: 2, buttons: [
          { id: 'spawn', label: 'Debug: spawn', sub: here ? 'Already in the studio' : can ? 'Joins now (skips the rules)' : 'Gated: arrives through a secret', disabled: here || !can, accent: C.purple, onTap: () => debugSpawn(id) },
          { id: 'back', label: 'Back', sub: 'To the Staff book', accent: C.progress, onTap: () => open('staffBook') },
        ] },
      ],
    };
  });

  // Milestone 16: one engine project — what it does, the team, Start.
  const engineLine = () => {
    const en = engines?.();
    const v = en?.view();
    if (v) return `Building: ${v.name} · ${Math.floor(v.totalFrac * 100)}%`;
    const e = en?.engines[0];
    return e ? `${e.name} ${en.current(e).label}` : 'Build your own engine';
  };
  const engineTeams = new Map(); // kind → [staff ids] while the sheet is open
  menus.register('engineStart', (kind) => {
    const en = engines?.();
    const p = en?.projectTypes.find((x) => x.id === kind);
    if (!p) return null;
    const w = world();
    const free = w.staffSystem.staff.filter((s) => !projects().jobs.some((j) => j.slots.includes(s.id)) && !w.workerById(s.id)?.away);
    if (!engineTeams.has(kind)) engineTeams.set(kind, free.filter((s) => s.role === 'PRG').map((s) => s.id).slice(0, 2).concat(free.some((s) => s.role === 'PRG') ? [] : free.slice(0, 1).map((s) => s.id)));
    const team = engineTeams.get(kind).filter((id) => free.some((s) => s.id === id));
    engineTeams.set(kind, team);
    const why = en.startWhy(kind, team) ?? (team.length ? null : 'Pick at least one person');
    const toggle = (id) => engineTeams.set(kind, team.includes(id) ? team.filter((x) => x !== id) : [...team, id]);
    return {
      title: p.name,
      subtitle: p.line,
      art: 'dev_ui_11',
      accent: C.purple,
      sections: [
        { lines: [{ text: `${p.costPerDay} Credits a day · mostly CODE (Programmers) · tier now: ${en.tierNow()}`, color: C.actionDark }, ...(why ? [{ text: why, color: C.bad }] : [])] },
        { title: 'Team', columns: 2, buttons: free.map((s) => ({ id: `eteam:${s.id}`, label: team.includes(s.id) ? `✓ ${s.name}` : s.name, sub: `${ROLES[s.role].name} · CODE ${s.stats.code}`, icon: s.art, iconCrop: portraitOf(s.art), accent: team.includes(s.id) ? C.good : C.progress, onTap: () => toggle(s.id) })) },
        { columns: 1, buttons: [{ id: 'engineGo', label: `Start: ${p.name}`, sub: why ?? `${team.length} on it`, disabled: !!why, accent: C.good, onTap: () => { engineTeams.delete(kind); startEngine?.(kind, team); } }] },
      ],
    };
  });

  // Milestone 23: pick a part for one hardware slot.
  menus.register('hwPick', (slot) => {
    const hw = hardware?.();
    const s = HW_SLOTS.find((x) => x.id === slot);
    if (!hw || !s) return null;
    const now = hw.draft.parts[slot];
    return {
      title: `${s.name}`,
      subtitle: 'Pick the part for this slot. Higher tiers need more hardware research.',
      art: 'dev_ui_27',
      accent: C.purple,
      sections: [
        {
          columns: 1,
          buttons: componentsOf(slot).map((c) => {
            const why = hw.partWhy(c.id);
            return { id: `part:${c.id}`, label: `${now === c.id ? '✓ ' : ''}${c.name} · ${c.cost} a unit`, sub: why ?? c.line, icon: c.art, locked: !!why, disabled: !!why, accent: now === c.id ? C.good : C.progress, onTap: () => pickPart?.(slot, c.id) };
          }),
        },
      ],
    };
  });
  // Milestone 23: build a prototype — pick who works on it.
  const hwTeam = { ids: null };
  menus.register('hwBuild', () => {
    const hw = hardware?.();
    if (!hw) return null;
    const w = world();
    const free = w.staffSystem.staff.filter((s) => !projects().jobs.some((j) => j.slots.includes(s.id)) && !w.workerById(s.id)?.away);
    if (!hwTeam.ids) hwTeam.ids = free.filter((s) => s.role === 'PRG' || s.role === 'PRO').map((s) => s.id).slice(0, 3);
    const team = hwTeam.ids.filter((id) => free.some((s) => s.id === id));
    hwTeam.ids = team;
    const why = hw.startWhy(team) ?? (team.length ? null : 'Pick at least one person');
    const pv = hw.preview();
    const toggle = (id) => (hwTeam.ids = team.includes(id) ? team.filter((x) => x !== id) : [...team, id]);
    return {
      title: `Build: ${pv.family} prototype`,
      subtitle: 'At the Hardware Prototype Lab: Board Design, Prototype Build, Validation. Mostly Programmers and Producers.',
      art: 'dev_ui_26',
      accent: C.purple,
      sections: [
        { lines: [{ text: `${pv.costPerDay} Credits a day · ${pv.work} work`, color: C.actionDark }, ...(why ? [{ text: why, color: C.bad }] : [])] },
        { title: 'Team', columns: 2, buttons: free.map((s) => ({ id: `hwteam:${s.id}`, label: team.includes(s.id) ? `✓ ${s.name}` : s.name, sub: `${ROLES[s.role].name} · CODE ${s.stats.code} · PROD ${s.stats.prod ?? 0}`, icon: s.art, iconCrop: portraitOf(s.art), accent: team.includes(s.id) ? C.good : C.progress, onTap: () => toggle(s.id) })) },
        { columns: 1, buttons: [{ id: 'hwGo', label: 'Start the prototype', sub: why ?? `${team.length} on it`, disabled: !!why, accent: C.good, onTap: () => { hwTeam.ids = null; startHardware?.(team); } }] },
      ],
    };
  });

  // Milestone 17: accept a contract — pick who works on it.
  const contractTeams = new Map();
  const w0 = () => world();
  menus.register('contractTeam', (id) => {
    const k = contracts?.();
    const c = k?.offers.find((x) => x.id === id);
    if (!c) return null;
    const opts = k.teamOptions();
    const free = opts.filter((o) => !o.why);
    if (!contractTeams.has(id)) contractTeams.set(id, free.sort((a, b) => (b.staff.stats[c.stat] ?? 0) - (a.staff.stats[c.stat] ?? 0)).slice(0, 2).map((o) => o.staff.id)); // the best two (the deadline is set for them)
    const team = contractTeams.get(id).filter((x) => free.some((o) => o.staff.id === x));
    contractTeams.set(id, team);
    const stat = STATS.find((s) => s.key === c.stat);
    const why = !k.board.canAccept ? 'Only 2 contracts at once' : team.length ? null : 'Pick at least one person';
    // This team's pace (on duty about 3 days in 4, with breaks) against the deadline.
    const pace = team.reduce((t, id) => t + (w0().staffSystem.get(id)?.stats[c.stat] ?? 0), 0) / k.divisor;
    const days = pace > 0 ? Math.ceil(c.work / pace / 0.75) : Infinity;
    const paceLine = Number.isFinite(days) ? { text: `This team: about ${days} days${days > c.deadlineDays ? ' — too slow for the deadline, add someone' : ''}`, color: days > c.deadlineDays ? C.bad : C.good } : null;
    return {
      title: `Contract: ${c.client}`,
      subtitle: `${c.work} work in ${c.deadlineDays} days · pays ${c.pay.toLocaleString('en-GB')} Credits · ${stat.label} counts`,
      art: 'business_ui_03',
      accent: C.purple,
      sections: [
        ...(paceLine ? [{ lines: [paceLine] }] : []),
        { title: 'Team', columns: 2, buttons: opts.map((o) => ({ id: `cteam:${o.staff.id}`, label: team.includes(o.staff.id) ? `✓ ${o.staff.name}` : o.staff.name, sub: o.why ?? `${stat.label} ${o.staff.stats[c.stat]}`, icon: o.staff.art, iconCrop: portraitOf(o.staff.art), disabled: !!o.why, accent: team.includes(o.staff.id) ? C.good : C.progress, onTap: () => contractTeams.set(id, team.includes(o.staff.id) ? team.filter((x) => x !== o.staff.id) : [...team, o.staff.id]) })) },
        { columns: 1, buttons: [{ id: 'contractGo', label: 'Accept the contract', sub: why ?? `${team.length} on it`, disabled: !!why, accent: C.good, onTap: () => { contractTeams.delete(id); acceptContract?.(id, team); } }] },
      ],
    };
  });

  // Milestone 20: post-launch support for a released game.
  menus.register('support', (number) => {
    const sp = support?.();
    const rec = projects().catalogue.get(number);
    if (!sp || !rec?.release) return null;
    const s = rec.support;
    const opts = sp.options(number);
    return {
      title: `Support: ${rec.result.title}`,
      subtitle: `Review ${rec.release.score} (it never changes) · player score ${sp.playerScore(number)}${s ? ` · ${s.bugsLeft} bugs left` : ''}`,
      art: rec.result.cover,
      accent: C.purple,
      sections: [
        { lines: [{ text: 'Support takes a game lane and staff time while it runs.', color: C.textMuted }] },
        { columns: 1, buttons: opts.flatMap((o) => {
          const cost = o.option.instant ? 'Free' : `${o.option.costPerDay} Credits a day · ${o.option.work} work`;
          if (o.option.port && o.ok) return o.targets.map((pid) => ({ id: `support:port:${pid}`, label: `Port to ${PLATFORMS.find((p) => p.id === pid)?.name ?? pid}`, sub: `${o.option.line} ${cost}`, icon: PLATFORMS.find((p) => p.id === pid)?.art ?? o.option.icon, onTap: () => open('supportTeam', { number, option: 'port', platform: pid }) }));
          return [{ id: `support:${o.option.id}`, label: o.option.name, sub: o.ok ? `${o.option.line} ${cost}` : o.why, icon: o.option.icon, disabled: !o.ok, accent: o.option.id === 'moveOn' ? C.bad : C.purple, onTap: () => (o.option.instant ? startSupport?.(o.option.id, number, []) : open('supportTeam', { number, option: o.option.id })) }];
        }) },
        { columns: 2, buttons: [
          { id: 'support:remaster', label: 'Remaster', sub: 'A new project (New Game)', icon: 'dev_ui_14', accent: C.progress, onTap: () => newGameAs?.('remaster') },
          { id: 'support:remake', label: 'Remake', sub: 'A new project (New Game)', icon: 'dev_ui_14', accent: C.progress, onTap: () => newGameAs?.('remake') },
        ] },
      ],
    };
  });
  const supportTeams = new Map();
  menus.register('supportTeam', (t) => {
    const sp = support?.();
    const o = SUPPORT_OPTIONS.find((x) => x.id === t?.option);
    const rec = projects().catalogue.get(t?.number);
    if (!sp || !o || !rec) return null;
    const key = `${t.number}:${t.option}:${t.platform ?? ''}`;
    const staffList = world().staffSystem.staff;
    const busy = (id) => (projects().jobs.some((j) => j.slots.includes(id)) ? 'Making a game' : world().workerById(id)?.away ? 'Away on a course' : sp.jobOf(id) ? 'On other support' : null);
    const free = staffList.filter((s) => !busy(s.id));
    if (!supportTeams.has(key)) supportTeams.set(key, [...free].sort((a, b) => (b.stats[o.stat] ?? 0) - (a.stats[o.stat] ?? 0)).slice(0, 2).map((s) => s.id));
    const team = supportTeams.get(key).filter((id) => free.some((s) => s.id === id));
    supportTeams.set(key, team);
    const stat = STATS.find((x) => x.key === o.stat);
    return {
      title: `${o.name}: ${rec.result.title}`,
      subtitle: `${o.work} work · ${o.costPerDay} Credits a day · ${stat.label} counts`,
      art: o.icon,
      accent: C.purple,
      sections: [
        { title: 'Team', columns: 2, buttons: staffList.map((s) => ({ id: `steam:${s.id}`, label: team.includes(s.id) ? `✓ ${s.name}` : s.name, sub: busy(s.id) ?? `${stat.label} ${s.stats[o.stat]}`, icon: s.art, iconCrop: portraitOf(s.art), disabled: !!busy(s.id), accent: team.includes(s.id) ? C.good : C.progress, onTap: () => supportTeams.set(key, team.includes(s.id) ? team.filter((x) => x !== s.id) : [...team, s.id]) })) },
        { columns: 1, buttons: [{ id: 'supportGo', label: `Start: ${o.name}`, sub: team.length ? `${team.length} on it` : 'Pick at least one person', disabled: !team.length, accent: C.good, onTap: () => { supportTeams.delete(key); startSupport?.(o.id, t.number, team, t.platform ?? null); } }] },
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
  const projectLine = (job) => {
    const v = projects().view(job);
    return v ? `${v.title} · ${v.phaseName} ${Math.floor(v.phaseFrac * 100)}%` : '';
  };

  for (const [id, t] of Object.entries(TOP_SHEETS)) {
    menus.register(id, () => ({ title: t.title, subtitle: t.line, accent: C.progress }));
  }
  return menus;
}
