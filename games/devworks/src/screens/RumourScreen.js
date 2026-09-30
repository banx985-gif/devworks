// The Rumour Archive (Milestone 28; Milestone 29: all 50 secrets), from Compete → Rumour Archive: every secret the
// studio has heard of — a rumour (clue stage 1), a hint (2), nearly explicit (3) — shown as "???" with its stage, and
// the ones found, with their group, recipe and reward (4). With ?debug=1 each card also has "Why not?", the why-false
// inspector (every condition, its live value and what fails). Milestone 31: the prestige records (PROJECT ONE, PROJECT X,
// Studio Singularity — the run and date each was first reached), once any exists.
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
        title: r.stage >= 4 ? `${r.name}${r.found ? '' : ' (found in an earlier run)'}` : `??? · ${STAGES[r.stage]}`,
        highlight: r.stage >= 4,
        lines:
          r.stage >= 4
            ? [{ text: r.group, color: C.purple, bold: true }, ...r.recipe.map((t) => ({ text: `• ${t}`, color: C.actionDark })), ...(r.reward ? [{ text: `Reward: ${r.reward}`, color: C.good }] : [])]
            : [{ text: r.group, color: C.purple }, { text: `“${r.text}”`, color: r.stage >= 3 ? C.actionDark : C.textMuted }, { text: `${'●'.repeat(r.stage)}${'○'.repeat(4 - r.stage)}`, color: C.purple }],
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
          ...(() => {
            const rec = secrets.prestigeRecords?.() ?? {};
            const rows = [['projectOne', 'PROJECT ONE', 'cover_27'], ['projectX', 'PROJECT X', 'console_visual_08'], ['singularity', 'Studio Singularity', 'award_trophy_08']].filter(([id]) => rec[id]);
            return rows.length ? [{ heading: 'Prestige records', cards: rows.map(([id, name, logo]) => ({ id: `rec-${id}`, logo, title: name, highlight: true, lines: [{ text: `First reached in NG+${rec[id].value} · Year ${rec[id].info.year}, Month ${rec[id].info.month}`, color: C.good, bold: true }, { text: `Run ${rec[id].runId ?? rec[id].info.runId}`, color: C.textMuted }], buttons: [] })) }] : [];
          })(),
        ],
      };
    },
  });
}
