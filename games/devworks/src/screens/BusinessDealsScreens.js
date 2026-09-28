// The Publishers and Contract Board screens (Milestone 17), from Business. Both are card lists (src/ui/cardListScreen.js).
//   Publishers: this month's offers (every term, Sign / Decline), the signed deals (waiting for a game, or on one — with
//     its milestones: met / missed / due), and the publishers themselves. Self-publishing is always possible.
//   Contract Board: this month's jobs (Accept → pick the team), the active ones with progress and days left.
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { PUBLISHERS, publisherById, DEALS, contractKindById, CONTRACTS } from '../../data/publishers.js';
import { STATS } from '../../data/staff.js';

const C = THEME.color;

export function createPublishersScreen({ layout, assets, topBar, publishers, dealTerms, dateLabel, onSign }) {
  const card = (d, kind) => {
    const pub = publisherById(d.publisher);
    const lines = [
      { text: `Advance ${d.advance.toLocaleString('en-GB')} Credits${d.recovery ? ' (a studio short of cash gets more)' : ''} · they take ${d.sharePct}% of sales`, color: C.actionDark, bold: true },
      dealTerms(d),
      `Marketing: +${d.hype} Hype at the start${d.salesPct ? ` · reach: +${d.salesPct}% launch sales${pub.pcOnly ? ' on OpenDesk PC' : ''}` : ''}`,
      ...(d.exactScope ? [{ text: `Creative control: exactly this scope${d.genres ? ', and one of their genres' : ''}.`, color: C.purple }] : []),
      ...(d.ipOwned ? [{ text: 'IP clause: they own the franchise — no sequel without them.', color: C.purple }] : []),
    ];
    if (kind === 'offer') lines.push(`Milestones (from the day the game starts): ${d.milestones.map((m) => `${m.name} in ${m.dueIn} days`).join(', ')}; each missed one costs ${DEALS.missPct}% of the advance.`);
    else if (!d.jobId) lines.push({ text: `Signed. Put it on a New Game by ${dateLabel(d.dueDay)}, or it lapses and the advance goes back.`, color: C.bad });
    else lines.push(...d.milestones.map((m) => ({ text: `${m.name}: ${m.state === 'met' ? '✓ met' : m.state === 'missed' ? '✗ missed' : `due ${dateLabel(m.dueDay)}`}`, color: m.state === 'missed' ? C.bad : m.state === 'met' ? C.good : C.text })));
    return {
      id: d.id,
      logo: pub.logo,
      title: `${pub.name} — ${pub.style}`,
      lines,
      highlight: kind !== 'offer',
      buttons:
        kind === 'offer'
          ? [
              { id: 'sign', label: 'Sign', accent: C.good, disabled: !publishers.deals.canAccept, onTap: () => onSign(d.id) },
              { id: 'decline', label: 'Decline', accent: C.bad, onTap: () => publishers.decline(d.id) },
            ]
          : [],
    };
  };
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => ({
      title: 'Publishers',
      icon: 'dev_ui_24',
      subtitle: `New offers every month; up to ${DEALS.maxSigned} signed deals at once. You can always self-publish instead.`,
      sections: [
        { heading: 'Offers this month', empty: 'No offers right now — more come next month.', cards: publishers.offers.map((d) => card(d, 'offer')) },
        { heading: 'Signed deals', empty: 'None signed.', cards: publishers.active.map((d) => card(d, 'signed')) },
        {
          heading: 'The publishers',
          cards: PUBLISHERS.map((p) => ({ id: p.id, logo: p.logo, title: p.name, lines: [p.identity, { text: p.style, color: C.textMuted }, ...(p.rank ? [{ text: `Offers from Rank ${p.rank}`, color: C.textMuted }] : [])], buttons: [] })),
        },
      ],
    }),
  });
}

export function createContractsScreen({ layout, assets, topBar, contracts, dateLabel, openAccept }) {
  const statLabel = (k) => STATS.find((s) => s.key === k)?.label ?? k;
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => ({
      title: 'Contract Board',
      icon: 'business_ui_03',
      subtitle: `Jobs for other studios: your team's time for Credits. New jobs every month; ${CONTRACTS.maxActive} at once. A missed deadline just pays nothing.`,
      sections: [
        {
          heading: 'Active',
          empty: 'No contract running.',
          cards: contracts.active.map((c) => ({
            id: c.id,
            title: `${contractKindById(c.kind).name} for ${c.client}`,
            highlight: true,
            lines: [
              { text: `${Math.floor((c.progress / c.work) * 100)}% done · due ${dateLabel(c.dueDay)} · pays ${c.pay.toLocaleString('en-GB')} Credits`, color: C.actionDark, bold: true },
              `Team: ${c.team.length} (${statLabel(c.stat)} counts)`,
            ],
            buttons: [{ id: 'drop', label: 'Drop it', accent: C.bad, onTap: () => contracts.cancel(c.id) }],
          })),
        },
        {
          heading: 'Jobs this month',
          empty: 'No jobs right now — more next month.',
          cards: contracts.offers.map((c) => ({
            id: c.id,
            title: `${contractKindById(c.kind).name} for ${c.client}`,
            lines: [
              { text: `Pays ${c.pay.toLocaleString('en-GB')} Credits · ${c.work} work · ${c.deadlineDays} days once accepted`, color: C.actionDark, bold: true },
              contractKindById(c.kind).line,
              { text: `${statLabel(c.stat)} counts`, color: C.textMuted },
            ],
            buttons: [
              { id: 'accept', label: 'Accept…', accent: C.good, disabled: !contracts.board.canAccept, onTap: () => openAccept(c.id) },
              { id: 'decline', label: 'Decline', accent: C.bad, onTap: () => contracts.decline(c.id) },
            ],
          })),
        },
      ],
    }),
  });
}
