// Achievements and the Hall of Fame (Milestone 32), card lists (src/ui/cardListScreen.js), from Compete, the Business
// (Studio) sheet or the Museum / Hall of Fame (F33).
//   Achievements: all 40 (they are visible by design, so "x of 40" counts only what the player can see), earned ones
//     first with the date and run, then the rest with their condition and a progress line where it counts.
//   Hall of Fame: every entry (games, engines, consoles) with its picture, the Hall of Fame Star (dev_reward_10), its
//     numbers and credited staff, and the run it came from; then the account records.
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { RECORD_DEFS } from '../../data/achievements.js';

const C = THEME.color;
const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const runLabel = (w) => `${w.ngPlus ? `NG+${w.ngPlus} · ` : ''}Year ${w.year}${w.month ? `, Month ${w.month}` : ''}`;

export function createAchievementsScreen({ layout, assets, topBar, achievements }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const list = achievements.list();
      const earned = list.filter((x) => x.earned).sort((a, b) => (b.earned.day ?? 0) - (a.earned.day ?? 0));
      const open = list.filter((x) => !x.earned);
      const card = (x) => ({
        id: x.def.id,
        logo: x.def.icon ?? 'dev_ui_04',
        title: `${x.def.n}. ${x.def.name}${x.earned ? ' ✓' : ''}`,
        highlight: !!x.earned,
        lines: [
          x.def.text,
          ...(x.earned ? [{ text: `Earned ${runLabel(x.earned)}`, color: C.good, bold: true }] : x.progress ? [{ text: `${fmt(x.progress.value)} / ${fmt(x.progress.target)}`, color: C.actionDark }] : []),
        ],
        buttons: [],
      });
      return {
        title: 'Achievements',
        icon: 'dev_ui_04',
        subtitle: `${earned.length} of ${list.length} earned. Kept by your account in every run and every save.`,
        sections: [
          ...(earned.length ? [{ heading: 'Earned', cards: earned.map(card) }] : []),
          { heading: 'Still to earn', cards: open.map(card), empty: 'Every achievement earned!' },
        ],
      };
    },
  });
}

export function createHallOfFameScreen({ layout, assets, topBar, achievements, museum = () => false }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const hall = [...achievements.hall].reverse();
      const counts = achievements.hallCounts();
      const recs = achievements.records;
      const entry = (e) => ({
        id: e.key,
        logo: e.art ?? 'dev_reward_10',
        title: `★ ${e.name}`,
        highlight: true,
        lines: [
          { text: `${e.kind === 'game' ? 'Game' : e.kind === 'engine' ? 'Engine' : 'Console'} · ${e.why.join(' · ')}`, color: C.purple, bold: true },
          e.kind === 'game' ? `Review ${e.numbers.review} · ${fmt(e.numbers.copies)} copies · ${fmt(e.numbers.revenue)} Credits` : e.kind === 'engine' ? `${e.numbers.customers} licence customers` : `${fmt(e.numbers.units)} sold · install base ${fmt(e.numbers.installBase)}`,
          ...(e.staff?.length ? [{ text: `Credits: ${e.staff.join(', ')}`, color: C.textMuted }] : []),
          { text: `Inducted ${runLabel(e)}`, color: C.textMuted },
        ],
        buttons: [],
      });
      const recCards = RECORD_DEFS.map((d) => {
        const r = recs.get(d.id);
        return { id: `rec-${d.id}`, logo: 'dev_reward_10', title: `${d.name}: ${r ? (d.id === 'highestRank' ? `Rank ${r.info.rank ?? r.value}` : fmt(r.value)) : '—'}`, lines: r ? [{ text: `${r.info.title ?? r.info.console ?? r.info.rank ?? ''}${r.info.title || r.info.console || r.info.rank ? ' · ' : ''}${runLabel(r.info)}`, color: C.textMuted }] : [{ text: 'Not set yet', color: C.textMuted }], buttons: [] };
      });
      return {
        title: 'Hall of Fame',
        icon: 'dev_reward_10',
        subtitle: `${counts.games} game${counts.games === 1 ? '' : 's'} · ${counts.engines} engine${counts.engines === 1 ? '' : 's'} · ${counts.consoles} console${counts.consoles === 1 ? '' : 's'}. Games reviewed 90+, sold 1,000,000+ or Game of the Year; engines licensed to 10+ customers; consoles with 1,000,000+ sold.${museum() ? ' On show in your Museum.' : ''}`,
        sections: [
          { heading: 'Inducted', cards: hall.map(entry), empty: 'Nothing here yet. Make something legendary.' },
          { heading: 'Account records', cards: recCards },
        ],
      };
    },
  });
}
