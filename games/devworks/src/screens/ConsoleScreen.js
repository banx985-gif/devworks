// Console Portfolio (Milestone 24, bible §32 / §34), from Create → Consoles (or a prototype card): before launch, the
// launch plan — prototype, form, price (against what players think it is worth), monthly manufacturing and its unit
// cost, dev-kit policy, royalty rate, launch marketing, launch titles (your games in development) — and Launch. After
// launch: the console's install base, sales, stock, third-party interest and library, money in and out, the verdict,
// the failure reasons that hold (plain words), price / production steps and the recovery actions. A card list.
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { CONSOLE as K } from '../../data/consoles.js';

const C = THEME.color;
const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const VERDICT = { hit: 'A hit!', steady: 'Steady', flop: 'A flop' };

export function createConsoleScreen({ layout, assets, topBar, consoles, projects, dateLabel, onLaunch, onRecover, showTip = () => {} }) {
  const cycle = (obj, cur) => {
    const keys = Object.keys(obj);
    return keys[(keys.indexOf(cur) + 1) % keys.length];
  };
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const c = consoles.own();
      const sections = [];
      if (c) {
        const f = K.forms[c.form];
        const r = consoles.ratingsNow(c);
        const last = c.history.at(-1);
        sections.push({
          heading: `${c.name} · ${f.name}`,
          cards: [
            {
              id: 'console',
              logo: f.art,
              title: `${c.name} · ${consoles.statusOf(c)}${c.verdict ? ` · ${VERDICT[c.verdict]}` : ''}`,
              highlight: true,
              lines: [
                { text: `Install base ${fmt(c.installBase)} · ${fmt(c.sold)} sold · ${fmt(c.stock)} in stock`, color: C.actionDark, bold: true },
                `Price ${c.price} Credits · making ${fmt(c.production)} a month · ${K.devKits[c.devKit].name} · royalty ${c.royalty}%`,
                `Your games on it: ${consoles.firstParty(c)} · third-party games: ${consoles.thirdPartyCount?.(c) ?? c.thirdParty.reduce((t, g) => t + g.count, 0) + c.exclusives} · third-party interest ${Math.round(c.interest)}`,
                `Reliability ${r.reliability} (${consoles.defectPct(c)}% defects) · Developer Friendliness ${r.devFriendly}`,
                { text: `Money: ${fmt(c.income)} in, ${fmt(c.costs)} out · profit ${fmt(c.income - c.costs)}`, color: c.income >= c.costs ? C.good : C.bad, bold: true },
                ...(last ? [{ text: `Last month: ${fmt(last.sold)} sold, ${fmt(last.income)} in, ${fmt(last.costs)} out`, color: C.textMuted }] : [{ text: `Launched ${dateLabel(c.launchDay)}: sales come at each month end`, color: C.textMuted }]),
              ],
              buttons: [
                { id: 'priceDown', label: 'Price −', accent: C.progress, onTap: () => consoles.adjust('price', -1) },
                { id: 'priceUp', label: 'Price +', accent: C.progress, onTap: () => consoles.adjust('price', 1) },
                { id: 'prodDown', label: 'Make −', accent: C.progress, onTap: () => consoles.adjust('production', -1) },
                { id: 'prodUp', label: 'Make +', accent: C.progress, onTap: () => consoles.adjust('production', 1) },
              ],
            },
            {
              id: 'reasons',
              logo: 'dev_ui_29',
              title: c.reasons.length ? 'What is holding it back' : 'No problems right now',
              lines: c.reasons.length ? c.reasons.map((x) => ({ text: x.text, color: C.bad })) : [{ text: 'Price, lineup, third-party support, defects and stock all look fine.', color: C.good }],
              buttons: [],
            },
          ],
        });
        sections.push({
          heading: 'Recovery',
          cards: K.recovery.map((R) => {
            const why = consoles.recoveryWhy(R.id);
            return { id: `rec-${R.id}`, logo: R.id === 'devKit' ? 'dev_ui_28' : 'dev_ui_29', title: `${R.name}${R.cost ? ` · ${fmt(R.cost)} Credits` : ''}`, lines: [R.line, ...(why ? [{ text: why, color: C.textMuted }] : [])], buttons: [{ id: 'go', label: R.name, accent: C.good, disabled: !!why, onTap: () => onRecover(R.id) }] };
          }),
        });
      } else {
        const why = consoles.launchWhy();
        const pv = why ? null : consoles.planPreview();
        if (pv) {
          const p = pv.plan;
          const jobs = projects.jobs;
          sections.push({
            heading: `Launch plan: ${pv.prototype.name}`,
            cards: [
              { id: 'proto', logo: K.forms[p.form].art, title: `${pv.prototype.family} · ${K.forms[p.form].name}`, lines: [`Prototype ${pv.prototype.name} · Launch Appeal ${pv.prototype.ratings.launchAppeal} · Performance ${pv.prototype.ratings.performance}`, `Defects about ${pv.defectPct}%`], buttons: [{ id: 'form', label: 'Home / Handheld', accent: C.progress, onTap: () => consoles.setPlan('form', cycle(K.forms, p.form)) }, ...(consoles.validPrototypes().length > 1 ? [{ id: 'proto', label: 'Other prototype', accent: C.progress, onTap: () => { const list = consoles.validPrototypes(); consoles.setPlan('prototypeId', list[(list.findIndex((x) => x.id === p.prototypeId) + 1) % list.length].id); } }] : [])] },
              { id: 'price', logo: 'dev_ui_29', title: `Price: ${p.price} Credits`, lines: [{ text: `Players think it is worth about ${pv.fairPrice} · value ${pv.value}`, color: p.price > pv.fairPrice * (1 + K.reasons.priceOverPct / 100) ? C.bad : C.actionDark }, `Costs ${pv.unitCost} to make · ${pv.margin >= 0 ? `${pv.margin} profit` : `${-pv.margin} loss`} a console`], buttons: [{ id: 'down', label: '−', accent: C.progress, onTap: () => consoles.setPlan('price', -1) }, { id: 'up', label: '+', accent: C.progress, onTap: () => consoles.setPlan('price', 1) }] },
              { id: 'production', logo: 'dev_ui_29', title: `Manufacturing: ${fmt(p.production)} a month`, lines: [`${pv.unitCost} Credits each · the first batch costs ${fmt(pv.firstBatchCost)}`, 'Unsold consoles cost storage every month.'], buttons: [{ id: 'down', label: '−', accent: C.progress, onTap: () => consoles.setPlan('production', -1) }, { id: 'up', label: '+', accent: C.progress, onTap: () => consoles.setPlan('production', 1) }] },
              { id: 'devKit', logo: 'dev_ui_28', title: `Dev kits: ${K.devKits[p.devKit].name}`, lines: [`Third-party interest ${K.devKits[p.devKit].interest >= 0 ? '+' : ''}${K.devKits[p.devKit].interest} · ${fmt(K.devKits[p.devKit].feePerGame)} Credits per new game`], buttons: [{ id: 'next', label: 'Change', accent: C.progress, onTap: () => consoles.setPlan('devKit', cycle(K.devKits, p.devKit)) }] },
              { id: 'royalty', logo: 'dev_ui_28', title: `Royalty: ${p.royalty}% of third-party sales`, lines: ['Higher royalties earn more per game but fewer studios come.'], buttons: [{ id: 'down', label: '−', accent: C.progress, onTap: () => consoles.setPlan('royalty', -1) }, { id: 'up', label: '+', accent: C.progress, onTap: () => consoles.setPlan('royalty', 1) }] },
              { id: 'marketing', logo: 'business_ui_05', title: `${K.marketing[p.marketing].name} · ${fmt(K.marketing[p.marketing].cost)} Credits`, lines: [`Adoption × ${K.marketing[p.marketing].mult}`], buttons: [{ id: 'next', label: 'Change', accent: C.progress, onTap: () => consoles.setPlan('marketing', cycle(K.marketing, p.marketing)) }] },
              ...jobs.map((j) => ({ id: `title-${j.id}`, logo: 'dev_ui_07', title: `${p.launchTitles.includes(j.id) ? '✓ Launch title: ' : ''}${j.name}`, lines: ['Release it on your console in its first 3 months: it counts twice for the lineup.'], buttons: [{ id: 'toggle', label: p.launchTitles.includes(j.id) ? 'Not a launch title' : 'Make it a launch title', accent: C.progress, onTap: () => consoles.setPlan('launchTitle', j.id) }] })),
              { id: 'launch', logo: K.forms[p.form].art, title: `Launch ${pv.prototype.family}`, highlight: true, lines: [`Now: ${fmt(pv.marketingCost + pv.firstBatchCost)} Credits (marketing and the first batch). It goes on sale today and joins the Platform Market.`], buttons: [{ id: 'go', label: 'Launch!', accent: C.good, onTap: () => onLaunch() }] },
            ],
          });
        }
        if (why) sections.push({ heading: 'Your console', cards: [], empty: why });
      }
      return {
        title: 'Console Portfolio',
        icon: 'dev_ui_29',
        subtitle: 'Launch a console from a prototype that passed validation, and run it as a platform: price, manufacturing, dev kits and royalties. A flop costs money, never the studio.',
        sections,
      };
    },
  });
}
