// Hardware (Milestone 23, bible §32 / §33), from Create → Hardware: the prototype being built, the design (the console
// family's name with Rename; one card per slot with its part and Change, which opens the part picker sheet), the seven
// ratings and the validation of the design as it stands, Build Prototype (opens the team sheet), and every prototype
// built with its ratings and checks. A card list (src/ui/cardListScreen.js).
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { HW_SLOTS, HW_RATINGS, componentById, HARDWARE } from '../../data/hardware.js';

const C = THEME.color;
const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const ratingLines = (r) => [HW_RATINGS.slice(0, 4), HW_RATINGS.slice(4)].map((row) => row.map((x) => `${x.name} ${r[x.key]}`).join(' · '));
const checkLines = (v) => [
  ...v.required.map((c) => (c.ok ? { text: `✓ ${c.name}`, color: C.good } : { text: `✗ ${c.why}`, color: C.bad })),
  { text: `Can run: ${v.capabilities.filter((c) => c.ok).map((c) => c.name).join(', ') || 'simple 2D offline games'}`, color: C.actionDark },
  ...v.capabilities.filter((c) => !c.ok).map((c) => ({ text: `– ${c.why}`, color: C.textMuted })),
];

export function createHardwareScreen({ layout, assets, topBar, hardware, dateLabel, openPick, openBuild, onRename }) {
  return createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const why = hardware.hardwareWhy();
      const act = hardware.view();
      const pv = why ? null : hardware.preview();
      const sections = [];
      if (act) sections.push({ heading: 'Being built', cards: [{ id: 'active', logo: 'dev_ui_26', title: act.name, highlight: true, lines: [{ text: `${act.phase} · ${Math.floor(act.totalFrac * 100)}%`, color: C.purple, bold: true }, `${act.team.length} on it · ${fmt(act.cost)} Credits so far`], buttons: [] }] });
      if (pv) {
        sections.push({
          heading: `Design: ${pv.family}`,
          cards: [
            { id: 'design', logo: 'dev_ui_26', title: `Console family: ${pv.family}`, lines: ['Name the family; its consoles and generations carry it.'], buttons: [{ id: 'rename', label: 'Rename', accent: C.progress, onTap: () => onRename() }] },
            ...HW_SLOTS.map((s) => {
              const c = componentById(pv.parts[s.id]);
              return {
                id: `slot-${s.id}`,
                logo: c?.art ?? 'dev_ui_27',
                title: `${s.name}: ${c?.name ?? '—'}`,
                lines: c ? [c.line, { text: `Tier ${c.tier} · ${fmt(c.cost)} Credits a unit`, color: C.textMuted }] : [{ text: 'No part open yet', color: C.bad }],
                buttons: [{ id: 'change', label: 'Change', accent: C.progress, onTap: () => openPick(s.id) }],
              };
            }),
            ...(pv.ratings
              ? [
                  {
                    id: 'preview',
                    logo: 'dev_ui_27',
                    title: `Ratings · ${fmt(pv.ratings.unitCost)} Credits a console to make`,
                    highlight: true,
                    lines: [...ratingLines(pv.ratings), ...checkLines(pv.validation), { text: `Prototype: ${fmt(pv.work)} work, ${fmt(pv.costPerDay)} Credits a day`, color: C.textMuted }],
                    buttons: [{ id: 'build', label: act ? 'Building one already' : 'Build Prototype', accent: C.good, disabled: !!act, onTap: () => openBuild() }],
                  },
                ]
              : []),
          ],
        });
      }
      sections.push({
        heading: 'Prototypes',
        empty: 'No prototypes yet.',
        cards: [...hardware.prototypes].reverse().map((p) => ({
          id: p.id,
          logo: HARDWARE.prototypeArt,
          title: `${p.name} · ${p.validation.passed ? 'passed validation' : 'failed validation'}`,
          highlight: p.validation.passed,
          lines: [HW_SLOTS.map((s) => componentById(p.parts[s.id])?.name).join(' · '), ...ratingLines(p.ratings), ...checkLines(p.validation), { text: `Built ${dateLabel(p.builtDay)} · ${fmt(p.cost)} Credits · ${fmt(p.ratings.unitCost)} a unit`, color: C.textMuted }],
          buttons: [],
        })),
      });
      return {
        title: 'Hardware',
        icon: 'dev_ui_26',
        subtitle: `${why ? `${why}. ` : ''}Design your own console: one part for each of the six slots, then build a prototype at the Hardware Prototype Lab and see how it validates. Optional — a studio never has to make hardware. Selling consoles comes later.`,
        sections,
      };
    },
  });
}
