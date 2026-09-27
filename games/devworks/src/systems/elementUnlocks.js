// Which recipe elements are open (Milestone 6). The rules are data (data/elements.js: unlock = start / rank / year /
// research); opening is core UnlockRunner's 'element' actions, so each element opens once and stays open for the run.
// Checked when a studio starts or loads, at every month end and on a rank-up. Research is Milestone 12: until then
// nothing is researched, so research-locked elements stay locked (the picker shows why) unless ?debug=1's
// "Unlock all" opens everything.
//
// Milestone 7: project scopes too. A scope opens with its studio stage (data/projects.js SCOPES.stage; stages come in
// Milestones 11 / 22, so the studio is stage 1 until then) or with the debug unlock-all (a 'scope' action, saved).
//
// Events: 'elements:unlocked' { ids } (the ones that opened now, in catalogue order).
import { UnlockRunner } from '../../../../core/UnlockActions.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';
import { ELEMENTS, STARTING_UNLOCKED, elementById } from '../../data/elements.js';
import { researchById } from '../../data/research.js';
import { FAME } from '../../data/balance.js';
import { SCOPES, STAGE_NAMES, scopeById } from '../../data/projects.js';

// Is one unlock rule met? state: { rankIndex, year, researched: Set }.
export function ruleMet(unlock, { rankIndex = 0, year = 1, researched = new Set() }) {
  if (unlock.start) return true;
  if (unlock.rank && rankIndex < rankIndexOf(FAME.ranks, unlock.rank)) return false;
  if (unlock.year && year < unlock.year) return false;
  if (unlock.research && !researched.has(unlock.research)) return false;
  return true;
}

// What is still missing, in plain words ("Reach Rank D", "Year 2", "Research 3D Rendering").
export function lockReason(unlock, state = {}) {
  const { rankIndex = 0, year = 1, researched = new Set() } = state;
  const out = [];
  if (unlock.research && !researched.has(unlock.research)) out.push(`Research ${researchById(unlock.research)?.name ?? unlock.research}`);
  if (unlock.rank && rankIndex < rankIndexOf(FAME.ranks, unlock.rank)) out.push(`Rank ${unlock.rank}`);
  if (unlock.year && year < unlock.year) out.push(`Year ${unlock.year}`);
  return out.length ? `Needs ${out.join(' + ')}` : null;
}

export function createElementUnlocks({ bus = null, state }) {
  // state() → { rankIndex, year, researched } now.
  const runner = new UnlockRunner({ bus });
  const openStart = () => runner.run(STARTING_UNLOCKED.map((id) => ({ type: 'element', id })), 'start');

  const api = {
    runner,
    isOpen: (id) => runner.has('element', id),
    open: () => runner.list('element'),
    reason: (id) => {
      const el = elementById(id);
      return el && !api.isOpen(id) ? lockReason(el.unlock, state()) ?? 'Opens soon' : null;
    },
    // Open every element whose rule is now met. Returns the ids that opened now.
    check(source = 'rule') {
      const s = state();
      const fired = runner.run(
        ELEMENTS.filter((e) => ruleMet(e.unlock, s)).map((e) => ({ type: 'element', id: e.id })),
        source,
      );
      const ids = fired.map((a) => a.id);
      if (ids.length && source !== 'start') bus?.emit('elements:unlocked', { ids });
      return ids;
    },
    // Scopes (Milestone 7): open by studio stage, or by the debug unlock-all.
    scopeOpen: (id) => {
      const sc = scopeById(id);
      return !!sc && ((state().stage ?? 1) >= sc.stage || runner.has('scope', id));
    },
    scopeReason: (id) => {
      const sc = scopeById(id);
      return sc && !api.scopeOpen(id) ? `Needs the ${STAGE_NAMES[sc.stage]} (studio stage ${sc.stage})` : null;
    },
    // ?debug=1: open all 50 elements and every scope.
    unlockAll() {
      runner.run(SCOPES.map((sc) => ({ type: 'scope', id: sc.id })), 'debug');
      const fired = runner.run(ELEMENTS.map((e) => ({ type: 'element', id: e.id })), 'debug');
      if (fired.length) bus?.emit('elements:unlocked', { ids: fired.map((a) => a.id) });
      return fired.length;
    },
    newGame() {
      runner.reset();
      openStart();
      api.check('start');
    },
    serialize: () => runner.serialize(),
    // saved: the runner's state (Milestone 6), or the old list of open ids (Milestones 3–5b), or nothing.
    load(saved) {
      runner.reset();
      openStart();
      if (Array.isArray(saved)) runner.run(saved.filter((id) => elementById(id)).map((id) => ({ type: 'element', id })), 'save');
      else if (saved) runner.load(saved);
      openStart(); // an old save never loses the new starting set
      api.check('start'); // anything the studio already qualifies for opens quietly
    },
  };
  openStart();
  return api;
}
