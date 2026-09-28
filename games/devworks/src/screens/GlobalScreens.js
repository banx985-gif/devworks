// Global business screens (Milestone 21), from Business: Engine Licensing (licences running, offers, the cap, the
// version's licence value), Publishing Office (pitch cards: Reject / Fund / Fund + Engine / Fund + Marketing; funded
// projects and their results) and Acquisitions (the open opportunity, what each purchase gave). Each shows this year's
// passive income against its cap. Card lists (src/ui/cardListScreen.js).
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { EXTERNAL, ACQUISITIONS, LICENSING, PASSIVE, acquisitionById } from '../../data/global.js';

const C = THEME.color;
const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const GRANTS = { ip: 'A franchise', staff: 'A staff candidate', catalogue: 'A back catalogue', tools: 'Engine tools', relationship: 'A publishing relationship' };

// This year's passive income against its cap, one line.
export function passiveLine(g) {
  const row = g.yearRow();
  return `Passive income this year: ${fmt(row.passive)} of ${fmt(row.income)} Credits earned (cap ${PASSIVE.sharePct}%)${row.held ? ` · ${fmt(row.held)} held back` : ''}.`;
}

export function createLicensingScreen({ layout, assets, topBar, global, dateLabel, onSign, onDecline }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const why = global.licensingWhy();
      const best = global.bestVersion();
      return {
        title: 'Engine Licensing',
        icon: 'business_ui_10',
        subtitle: `${why ? `${why}. ` : ''}Other studios pay to use your engine: an upfront fee, then a monthly fee for ${LICENSING.termMonths} months that falls as the version ages; each licence costs support every month. ${global.licences.length} of ${global.maxLicences()} licences · ${global.customers} customer${global.customers === 1 ? '' : 's'} so far. ${passiveLine(global)}`,
        sections: [
          {
            heading: 'Licences',
            empty: 'No licences running.',
            cards: global.licences.map((l) => ({
              id: l.id,
              logo: 'business_ui_10',
              title: `${l.customer} · ${l.label}`,
              highlight: true,
              lines: [
                { text: `Next fee: ${fmt(global.nextFee(l))} Credits · support ${fmt(l.support)} a month`, color: C.actionDark, bold: true },
                `Paid so far: ${fmt(l.paid)} Credits${l.held ? ` (${fmt(l.held)} held back)` : ''} · ends ${dateLabel(l.endDay)}`,
              ],
              buttons: [],
            })),
          },
          {
            heading: 'Offers',
            empty: why ? 'Offers come once licensing is open.' : 'No offers right now (one comes each month).',
            cards: global.licenceOffers.map((o) => {
              const w = global.signWhy(o.id);
              return {
                id: o.id,
                logo: 'business_ui_10',
                title: `${o.customer} wants ${o.label}`,
                lines: [
                  `Licence value now: ${Math.round(best?.version.id === o.versionId ? best.value : 0) || '—'} · ${LICENSING.upfrontMonths} months’ fee up front`,
                  ...(w ? [{ text: w, color: C.bad }] : [{ text: `Offer open until ${dateLabel(o.untilDay)}`, color: C.textMuted }]),
                ],
                buttons: [
                  { id: 'sign', label: 'License', accent: C.good, disabled: !!w, onTap: () => onSign(o.id) },
                  { id: 'decline', label: 'Decline', accent: C.bad, onTap: () => onDecline(o.id) },
                ],
              };
            }),
          },
        ],
      };
    },
  });
}

export function createPublishingOfficeScreen({ layout, assets, topBar, global, dateLabel, onChoose }) {
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  const tagNames = (ids) => ids.map((id) => EXTERNAL.riskTags.find((t) => t.id === id)?.name ?? id);
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const why = global.externalWhy();
      return {
        title: 'Publishing Office',
        icon: 'business_ui_11',
        subtitle: `${why ? `${why}. ` : ''}Publish other studios’ games: fund them, and a share of their sales comes back over ${EXTERNAL.payMonths} months. At most ${EXTERNAL.maxActive} at once (${global.activeExternal().length} now). ${passiveLine(global)}`,
        sections: [
          {
            heading: 'Pitches',
            empty: why ? 'Pitches come once the Publishing Office is open.' : 'No pitches right now (new ones come each month).',
            cards: global.pitches.map((p) => ({
              id: p.id,
              logo: 'business_ui_11',
              title: `${p.studio} · ${p.concept}`,
              lines: [
                { text: `Team reputation ${stars(p.reputation)} · budget ${fmt(p.budget)} Credits · ${p.months} months`, color: C.actionDark, bold: true },
                `Forecast: review ${p.forecast.reviewLo}–${p.forecast.reviewHi}, about ${fmt(p.forecast.copies)} copies`,
                { text: p.riskTags.length ? `Risks: ${tagNames(p.riskTags).join(', ')}` : 'No risk flags', color: p.riskTags.length ? C.bad : C.good },
                p.wantsEngine ? 'They ask for your engine and support.' : 'They have their own engine.',
                ...(global.fundWhy(p.id, 'fund') ? [{ text: global.fundWhy(p.id, 'fund'), color: C.bad }] : [{ text: `Open until ${dateLabel(p.untilDay)} · + Marketing ${fmt(global.costOf(p, 'fundMarketing'))}`, color: C.textMuted }]),
              ],
              buttons: EXTERNAL.choices.map((c) => ({ id: c.id, label: c.id === 'fundEngine' ? '+ Engine' : c.id === 'fundMarketing' ? '+ Marketing' : c.name, accent: c.id === 'reject' ? C.bad : C.good, disabled: !!global.fundWhy(p.id, c.id), onTap: () => onChoose(p.id, c.id) })),
            })),
          },
          {
            heading: 'Funded games',
            empty: 'Nothing funded yet.',
            cards: [...global.external].reverse().map((p) => ({
              id: `ext-${p.id}`,
              logo: 'business_ui_11',
              title: `${p.studio} · ${p.concept}`,
              highlight: p.status !== 'settled',
              lines: [
                `${EXTERNAL.choices.find((c) => c.id === p.choice)?.name}: ${fmt(p.cost)} Credits`,
                p.status === 'dev'
                  ? { text: `In development · out ${dateLabel(p.dueDay)}`, color: C.purple, bold: true }
                  : { text: `Review ${p.result.review}${p.result.hit ? ' · a hit!' : ''} · ${fmt(p.result.copies)} copies · your share ${fmt(p.result.share)}`, color: p.result.hit ? C.good : C.actionDark, bold: true },
                ...(p.status === 'dev' ? [] : [p.status === 'settled' ? `Settled: ${fmt(p.paid)} paid${p.held ? `, ${fmt(p.held)} held back` : ''}` : `Paying back: ${fmt(p.paid)} so far, ${p.schedule.length} month${p.schedule.length === 1 ? '' : 's'} to go`]),
              ],
              buttons: [],
            })),
          },
        ],
      };
    },
  });
}

export function createAcquisitionsScreen({ layout, assets, topBar, global, dateLabel, onBuy, onDecline, nameOf = (x) => x }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const o = global.acqOffer;
      const t = o ? acquisitionById(o.targetId) : null;
      const w = global.acquireWhy();
      return {
        title: 'Acquisitions',
        icon: 'business_ui_12',
        subtitle: `${global.acquisitionsOpen() ? '' : `Opportunities start at Rank ${ACQUISITIONS.rank} or in Year ${ACQUISITIONS.year}. `}Now and then a small studio is for sale. Buying one brings one thing into your studio — no second office to run. At most ${ACQUISITIONS.max} (${global.acquired.length} so far).`,
        sections: [
          {
            heading: 'Opportunity',
            empty: 'Nothing for sale right now. They are rare.',
            cards: t
              ? [
                  {
                    id: t.id,
                    logo: 'business_ui_12',
                    title: `${t.studio} · ${fmt(t.price)} Credits`,
                    highlight: true,
                    lines: [{ text: `${GRANTS[t.grant]}: ${t.line}`, color: C.actionDark, bold: true }, ...(w ? [{ text: w, color: C.bad }] : [{ text: `Open until ${dateLabel(o.untilDay)}`, color: C.textMuted }])],
                    buttons: [
                      { id: 'buy', label: 'Buy', accent: C.good, disabled: !!w, onTap: () => onBuy() },
                      { id: 'decline', label: 'Pass', accent: C.bad, onTap: () => onDecline() },
                    ],
                  },
                ]
              : [],
          },
          {
            heading: 'Bought',
            empty: 'No acquisitions yet.',
            cards: global.acquired.map((a) => {
              const def = acquisitionById(a.id);
              return { id: `got-${a.id}`, logo: 'business_ui_12', title: `${def.studio} (${dateLabel(a.day)})`, lines: [`${GRANTS[a.grant]}: ${nameOf(a) ?? def.line}`], buttons: [] };
            }),
          },
        ],
      };
    },
  });
}
