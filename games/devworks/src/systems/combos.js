// Normal combos (Milestone 15, bible §15) on core SynergyEvaluator (the rules) and core DiscoveryArchive (what has
// been found). The combo data is data/combos.js.
//
// A combo applies when a project's recipe matches its rule: its effects are fixed when the game starts (the recipe
// can't change after), so src/systems/gameProject.js calls combosFor / comboEffects there — output points at the end,
// production cost, QA load and the cover nudge — and business.js reads the finished game's comboFx at launch (casual /
// core audience, long tail, Fan Trust); franchises.js reads franchisePct. Hype is added here when the game starts.
//
// Discovery: when a game with a combo is finished the combo is discovered. The archive keeps it twice (core
// DiscoveryArchive): for this run (saved with the campaign) and for the account (its own save record, SAVE.accountKey,
// so every slot and every new studio sees it). The first discovery in a run grants COMBO_RP research points, once;
// later games with the combo still get its reward.
//
// Near-miss hints (New Game): a recipe one filled slot away from a combo not discovered yet (in any run) gets a hint
// naming only the slot to change, never the combo.
//
// Events: core's 'discovery:new' ({ id, firstEver, info }), plus 'combo:found' { combo, record, firstInRun, firstEver,
// rp }.
import { evaluateRules } from '../../../../core/SynergyEvaluator.js';
import { DiscoveryArchive } from '../../../../core/DiscoveryArchive.js';
import { COMBOS, comboById, COMBO_RP } from '../../data/combos.js';

// The data as core rules: one 'part' condition per family ("any of these element ids in the recipe").
export const COMBO_RULES = COMBOS.map((c) => ({ id: c.id, conditions: Object.entries(c.need).map(([slot, ids]) => ({ kind: 'part', slot, any: ids })) }));
const ctxOf = (recipe = {}) => ({ parts: Object.entries(recipe).filter(([, id]) => id).map(([slot, id]) => ({ id, slot })) });
// A 'part' condition is met only by the element in its own slot (ids are unique per family anyway).
const hooks = {};
function evaluate(recipe) {
  const r = evaluateRules(COMBO_RULES, ctxOf(recipe), hooks);
  return r;
}

// The combos this recipe makes (ids, in table order).
export const combosFor = (recipe) => evaluate(recipe).active.map((r) => r.id);

// Combos one condition short where that slot is filled with something else: [{ id, slot }].
export function nearMisses(recipe = {}) {
  return evaluate(recipe).near.filter((n) => recipe[n.missing.slot]).map((n) => ({ id: n.rule.id, slot: n.missing.slot }));
}

// Everything the combos add up to. output: { key: points }; the rest are plain numbers (see data/combos.js); cover:
// the first combo's cover nudge.
export function comboEffects(ids = []) {
  const fx = { output: {}, costPct: 0, hype: 0, casualPct: 0, corePct: 0, tailPct: 0, trust: 0, franchisePct: 0, bugPct: 0, artAwardScore: 0, hardwareDemandPct: 0, cover: null };
  for (const id of ids) {
    const c = comboById(id);
    if (!c) continue;
    for (const [k, v] of Object.entries(c.reward)) {
      if (k === 'output') for (const [o, p] of Object.entries(v)) fx.output[o] = (fx.output[o] ?? 0) + p;
      else fx[k] += v;
    }
    fx.cover ??= c.cover ?? null;
  }
  return fx;
}

// The run's side: the archive, discovery on finished games, Hype on start, and the account record.
// saveAccount(data) → persists the account part (the game's storage); research: for the RP.
export function createCombos({ bus, research, business, saveAccount = null }) {
  const archive = new DiscoveryArchive({ bus });
  // Hype when a combo game starts (the rest is fixed in the project itself).
  bus.on('project:start', ({ job }) => {
    const h = comboEffects(job?.data?.combos ?? []).hype;
    if (h) business.marketing.addHype(job.id, h);
  });
  // A finished game discovers its combos.
  bus.on('project:complete', ({ record }) => {
    for (const id of record.result?.combos ?? []) {
      const c = comboById(id);
      const { firstInRun, firstEver } = archive.discover(id, { recipe: { ...record.result.recipe }, title: record.result.title, number: record.number });
      let rp = 0;
      if (firstInRun) {
        rp = COMBO_RP;
        research?.system.addRp(rp, `Combo discovered: ${c.name}`);
      }
      if (firstEver) saveAccount?.(archive.serializeAccount());
      bus.emit('combo:found', { combo: c, record, firstInRun, firstEver, rp });
    }
  });

  return {
    archive,
    known: (id) => archive.known(id),
    state: (id) => archive.state(id),
    // For the Archive screen: every combo found in any run, with the recipe it was found with.
    found() {
      return COMBOS.filter((c) => archive.known(c.id)).map((c) => ({ combo: c, inRun: archive.inRun(c.id), info: archive.run.found[c.id] ?? archive.account.found[c.id]?.first ?? {}, runs: archive.account.found[c.id]?.runs ?? 1 }));
    },
    // New Game: hints for combos not known anywhere yet. [{ slot }] — one per slot, never the combo.
    hints(recipe) {
      const slots = [...new Set(nearMisses(recipe).filter((n) => !archive.known(n.id)).map((n) => n.slot))];
      return slots.map((slot) => ({ slot }));
    },
    newRun: () => archive.resetRun(),
    serialize: () => archive.serializeRun(),
    load: (data) => archive.loadRun(data ?? null),
    loadAccount: (data) => archive.loadAccount(data ?? null),
    serializeAccount: () => archive.serializeAccount(),
  };
}
