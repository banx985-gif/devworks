// Compete (Milestone 19): the Awards, Rivals and Rankings screens — card lists (src/ui/cardListScreen.js).
//   Awards: the trophy cabinet (every award won), then C01–C10: when it's held next, whether the studio can enter
//     (unlock) and what counts (entry), the reward, and last year's result (winner and your place). C11 / C12 never show.
//   Rivals: every rival that has appeared (the rest: "arrives in Year N"; Ghostlight never), with its latest releases
//     and awards.
//   Rankings: the studios by award points (core Rankings), then trophies, copies sold and releases.
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { elementById } from '../../data/elements.js';

const C = THEME.color;
const ENTRY_TEXT = {
  C01: 'Any Tiny or Small game released this season',
  C02: 'A game reviewed 65+',
  C03: 'A game with Gameplay 70+',
  C04: 'Two successful releases (reviewed 70+) this season',
  C05: 'Graphics or Technology score 80+ (Technology = the average of Graphics and Polish)',
  C06: 'Story or Graphics 82+',
  C07: 'Any game reviewed 85+',
  C08: 'Three successful releases on one platform family',
  C09: 'A game reviewed 88+',
  C10: 'A top-tier release (90+) and a studio record (5 trophies)',
};

export function createAwardsScreen({ layout, assets, topBar, awards, dateLabel, monthLabel }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => ({
      title: 'Awards',
      icon: 'dev_ui_04',
      subtitle: 'Every award is held once a year. Your games released in the 12 months before it compete with the rivals’ releases. Results are final once announced.',
      sections: [
        {
          heading: `Awards Cabinet · ${awards.wins.length} trophies`,
          empty: 'No trophies yet. The Local Indie Showcase (Month 2) takes any Tiny or Small game.',
          cards: awards.wins
            .slice()
            .reverse()
            .map((w, i) => {
              const a = awards.award(w.award);
              return { id: `win${i}`, logo: a.trophy, title: `${a.name} · Year ${w.year}`, lines: [{ text: `Won with "${w.title}"`, color: C.good, bold: true }, a.rewardText], buttons: [] };
            }),
        },
        {
          heading: 'The awards',
          cards: awards.visible().map((a) => {
            const why = awards.lockWhy(a);
            const next = awards.nextOf(a);
            const last = awards.lastResult(a.id);
            const lastLine = last ? (last.winner ? `Year ${last.year}: ${last.entrants[0].name} won with "${last.entrants[0].title}"${last.playerPlace ? ` · you: #${last.playerPlace}` : last.playerWhy ? ` · you: ${last.playerWhy.toLowerCase()}` : ''}` : `Year ${last.year}: no entries`) : null;
            return {
              id: a.id,
              logo: a.trophy,
              title: `${a.id} ${a.name}`,
              highlight: !why,
              lines: [
                { text: why ?? 'Open to your studio', color: why ? C.bad : C.good, bold: true },
                `Entry: ${ENTRY_TEXT[a.id]}`,
                `Held: ${next ? `${monthLabel(next.month)} (end of the month)` : '—'} · +${a.fame.toLocaleString('en-GB')} Fame`,
                { text: `Reward: ${a.rewardText}`, color: C.actionDark },
                ...(lastLine ? [{ text: lastLine, color: last.winner === 'player' ? C.good : C.textMuted }] : []),
              ],
              buttons: [],
            };
          }),
        },
      ],
    }),
  });
}

export function createRivalsScreen({ layout, assets, topBar, rivals, clock, monthLabel }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const active = rivals.active();
      const later = rivals.visible().filter((r) => !active.includes(r));
      return {
        title: 'Rivals',
        icon: 'dev_ui_04',
        subtitle: 'Other studios release their own games, win awards and grow over the years. Their releases in your launch month can crowd your launch week.',
        sections: [
          {
            heading: `Active rivals · ${active.length}`,
            cards: active.map((r) => {
              const h = rivals.history(r.id);
              const recent = h.releases.slice(-3).reverse();
              return {
                id: r.id,
                logo: r.logo,
                title: `${r.name} — ${r.identity}`,
                lines: [
                  { text: r.strength, color: C.actionDark, bold: true },
                  `${h.releases.length} release${h.releases.length === 1 ? '' : 's'} · ${h.releases.reduce((t, x) => t + x.copies, 0).toLocaleString('en-GB')} copies · ${h.awards.length} award${h.awards.length === 1 ? '' : 's'}`,
                  ...recent.map((x) => ({ text: `"${x.title}" (${elementById(x.genre)?.name ?? ''}, ${monthLabel(x.month)}) · review ${x.review}${x.big ? ' · big' : ''}`, color: C.text })),
                  ...h.awards.slice(-2).map((w) => ({ text: `Won ${w.award} (Year ${w.year}) with "${w.title}"`, color: C.purple })),
                ],
                buttons: [],
              };
            }),
          },
          { heading: 'Still to come', empty: 'Everyone has arrived.', cards: later.map((r) => ({ id: r.id, logo: r.logo, title: r.name, lines: [r.identity, { text: `Arrives in Year ${r.firstYear}`, color: C.textMuted }], buttons: [] })) },
        ],
      };
    },
  });
}

export function createRankingsScreen({ layout, assets, topBar, awards, rivals }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => ({
      title: 'Rankings',
      icon: 'dev_ui_04',
      subtitle: 'Studios by award points (every placing counts, weighted by the award), then trophies and copies sold.',
      sections: [
        {
          cards: awards.table().map((r) => ({
            id: r.id,
            logo: r.id === 'player' ? null : rivals.rival(r.id)?.logo,
            title: `#${r.position} ${r.name}`,
            highlight: r.id === 'player',
            lines: [{ text: `${r.points} award points · ${r.trophies} trophies`, color: C.actionDark, bold: true }, `${r.copies.toLocaleString('en-GB')} copies · ${r.releases} releases`],
            buttons: [],
          })),
        },
      ],
    }),
  });
}
