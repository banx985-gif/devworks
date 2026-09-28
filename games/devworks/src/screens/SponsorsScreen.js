// Sponsors (Milestone 18, bible §24), from Business: the slots in use, each active deal (perk, stipend, days left, the
// obligation's live counter — "Conventions attended 1 / 2"), the offers (Sign), and every sponsor with its relationship
// tier (Partner → Preferred → Major → Strategic) and the ones that wait for a later system. A card list
// (src/ui/cardListScreen.js).
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { SPONSORS, sponsorById, SPONSOR_BALANCE } from '../../data/sponsors.js';

const C = THEME.color;

export function createSponsorsScreen({ layout, assets, topBar, sponsors, dateLabel, onSign }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => ({
      title: 'Sponsors',
      icon: 'dev_ui_25',
      subtitle: `${sponsors.deals.length} of ${sponsors.slots()} sponsor slots in use (1 at Rank E–D, 2 at C–B, 3 at A–S). Deals last ${SPONSOR_BALANCE.dealMonths} months, pay a stipend every month and a bonus when the obligation is met. A missed obligation only loses the bonus.`,
      sections: [
        {
          heading: 'Active deals',
          empty: 'No sponsor yet.',
          cards: sponsors.deals.map((d) => {
            const def = sponsorById(d.id);
            const c = sponsors.counter(d);
            return {
              id: d.id,
              logo: def.logo,
              title: `${def.name} · ${sponsors.tierName(d.id)}`,
              highlight: true,
              lines: [
                { text: def.perkText, color: C.actionDark, bold: true },
                `${sponsors.stipendOf(d.id, d.tier).toLocaleString('en-GB')} Credits a month · ends ${dateLabel(d.endDay)}`,
                { text: def.obligationText, color: C.text },
                { text: `${c.met ? '✓ ' : c.lost ? '✗ ' : ''}${c.text}`, color: c.met ? C.good : c.lost ? C.bad : C.purple, bold: true },
              ],
              buttons: [],
            };
          }),
        },
        {
          heading: 'Offers',
          empty: 'No offers right now.',
          cards: sponsors.offers.map((o) => {
            const def = sponsorById(o.id);
            const why = sponsors.signWhy(o.id);
            return {
              id: o.id,
              logo: def.logo,
              title: `${def.name}${o.renewal ? ' (renewal)' : ''} · ${def.theme}`,
              lines: [
                { text: def.perkText, color: C.actionDark, bold: true },
                `${sponsors.stipendOf(o.id).toLocaleString('en-GB')} Credits a month for ${SPONSOR_BALANCE.dealMonths} months`,
                `Obligation: ${def.obligationText}`,
                ...(why ? [{ text: why, color: C.bad }] : [{ text: `Offer open until ${dateLabel(o.untilDay)}`, color: C.textMuted }]),
              ],
              buttons: [{ id: 'sign', label: 'Sign', accent: C.good, disabled: !!why, onTap: () => onSign(o.id) }],
            };
          }),
        },
        {
          heading: 'All sponsors',
          cards: SPONSORS.map((def) => ({
            id: `all-${def.id}`,
            logo: def.logo,
            title: `${def.name} · ${sponsors.tierName(def.id)}`,
            lines: [def.perkText, { text: def.obligationText, color: C.textMuted }, ...(def.later ? [{ text: `Offers once ${def.later} exists.`, color: C.bad }] : [])],
            buttons: [],
          })),
        },
      ],
    }),
  });
}
