// The Rumour Archive (Milestone 28), from Compete → Rumour Archive: every secret the studio has heard of — a rumour
// (clue stage 1), a hint (2), nearly explicit (3) — and the ones found, with their exact recipe (4). With ?debug=1
// each card also has "Why not?", the why-false inspector (every condition, its live value and what fails).
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';

const C = THEME.color;
const STAGES = ['', 'Rumour', 'Hint', 'Nearly there', 'Found'];

export function createRumourScreen({ layout, assets, topBar, secrets, onWhy = null }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const list = secrets.rumours();
      const card = (r) => ({
        id: r.id,
        logo: r.stage >= 4 ? 'dev_reward_03' : 'dev_ui_29',
        title: `${r.name} · ${STAGES[r.stage]}${r.found ? '' : r.stage >= 4 ? ' (in an earlier run)' : ''}`,
        highlight: r.stage >= 4,
        lines: r.stage >= 4 ? r.recipe.map((t) => ({ text: `• ${t}`, color: C.actionDark })) : [{ text: `“${r.text}”`, color: r.stage >= 3 ? C.actionDark : C.textMuted }, { text: `${'●'.repeat(r.stage)}${'○'.repeat(4 - r.stage)}`, color: C.purple }],
        buttons: onWhy ? [{ id: 'why', label: 'Why not? (debug)', accent: C.progress, onTap: () => onWhy(r.id) }] : [],
      });
      const found = list.filter((r) => r.stage >= 4);
      const open = list.filter((r) => r.stage < 4).sort((a, b) => b.stage - a.stage);
      return {
        title: 'Rumour Archive',
        icon: 'dev_ui_29',
        subtitle: `Whispers about the industry's secrets. A rumour becomes a hint, then nearly a recipe, as you get closer. ${found.length} found · ${open.length} heard of.`,
        sections: [
          { heading: 'Rumours', cards: open.map(card), empty: 'No rumours yet. Keep making games — people talk.' },
          ...(found.length ? [{ heading: 'Found', cards: found.map(card) }] : []),
        ],
      };
    },
  });
}
