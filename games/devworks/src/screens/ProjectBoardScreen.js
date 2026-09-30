// Project Board (Milestone 34, bible §6): every game in the works, every finished game waiting for release, and a way
// to start a new one — a card list (src/ui/cardListScreen.js), from Create → Project Board.
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';

const C = THEME.color;

export function createProjectBoardScreen({ layout, assets, topBar, projects, business, lanes, laneWhy = () => null, onOpen, onRelease, onNew }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const jobs = projects.jobs;
      const waiting = business.unreleased();
      const certifying = business.certifying();
      const why = jobs.length >= lanes() ? `Every game lane is busy (${jobs.length} of ${lanes()})` : laneWhy();
      return {
        title: 'Project Board',
        icon: 'dev_ui_07',
        subtitle: `${jobs.length} of ${lanes()} game lane${lanes() === 1 ? '' : 's'} in use.`,
        sections: [
          {
            heading: 'In the works',
            empty: 'No projects yet — tap New Game below to start one.',
            cards: jobs.map((job) => {
              const v = projects.view(job);
              return { id: `job-${job.id}`, logo: 'dev_ui_07', title: v.title, lines: [{ text: `${v.phaseName} · ${Math.floor(v.phaseFrac * 100)}%`, color: C.progress, bold: true }, ...(projects.decision && projects.decisionJob === job ? [{ text: 'A decision is waiting', color: C.actionDark, bold: true }] : [])], buttons: [{ id: 'open', label: 'Open', onTap: () => onOpen(job.id) }] };
            }),
          },
          {
            heading: 'Finished, waiting for release',
            empty: 'Nothing waiting. Finished games show up here.',
            cards: [
              ...waiting.map((r) => ({ id: `rel-${r.number}`, logo: r.result.cover, title: r.result.title, lines: [r.ea ? 'In Early Access' : 'Finished'], buttons: [{ id: 'release', label: r.ea ? 'Full launch…' : 'Release…', accent: C.action, onTap: () => onRelease(r.number) }] })),
              ...certifying.map((r) => ({ id: `cert-${r.number}`, logo: r.result.cover, title: r.result.title, lines: [{ text: 'In certification', color: C.textMuted }], buttons: [] })),
            ],
          },
          { heading: null, cards: [{ id: 'new', title: 'New Game', lines: [why ? { text: why, color: C.textMuted } : 'Pick a recipe, scope and team.'], buttons: [{ id: 'go', label: 'New Game', disabled: !!why, accent: C.action, onTap: () => onNew() }] }] },
        ],
      };
    },
  });
}
