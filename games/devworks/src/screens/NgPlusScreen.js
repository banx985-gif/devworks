// New Game+ setup (Milestone 33, bible §43, setup spec §8), a card list (src/ui/cardListScreen.js) after the Year-20
// ceremony's "Start New Game+" (or Business → Year-20 ending in postgame).
//   Pick: what carries over and what starts again, the research conversion, Legacy Staff (people from this run: they
//   keep tier, level, stats and traits), Legacy Game Blueprints (a shipped game's recipe and franchise), from NG+2 one
//   discounted facility blueprint, and the Prestige Token shop (an extra Legacy pick, an extra blueprint, a starting
//   facility — paid when the new run starts). Then "Choose a save slot".
//   Slot: the four slots. The finished run's own slot can't be used (it stays exactly as it is); an empty slot is used
//   at once; a full one only after "Overwrite Slot n?" is confirmed. Then the New Studio setup (name, director, colour,
//   founder — filled in from this run) starts the NG+ run there.
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';
import { NGPLUS } from '../../data/ending.js';
import { elementById } from '../../data/elements.js';
import { TIERS } from '../../data/staff.js';
import { facilityById } from '../../data/facilities.js';

const C = THEME.color;
const fmt = (n) => Math.round(n).toLocaleString('en-GB');

// ngplus: src/systems/ngplus.js; slots(): the title screen's slot cards; parentSlot(): the finished run's slot;
// confirm(opts): the Dialog; onChoose(slotIndex, choices): go on to the setup.
export function createNgPlusScreen({ layout, assets, topBar, ngplus, slots, parentSlot, confirm, onChoose }) {
  let view = 'pick';
  let ch = null;
  const reset = () => (ch = { legacyStaff: [], blueprints: [], facilityBlueprint: null, shop: [], startFacility: null });
  reset();
  const toggle = (list, id) => (list.includes(id) ? list.splice(list.indexOf(id), 1) : list.push(id));

  function pickSections(o) {
    const p = ngplus.picks(ch.shop);
    const tokensLeft = o.tokens - ngplus.shopCost(ch.shop);
    const keep = NGPLUS.fields.always.map((f) => f.label).join(' · ');
    const resets = NGPLUS.fields.reset.slice(0, 12).map((f) => f.label).join(' · ');
    const probs = ngplus.problems(ch);
    const staffCard = (s) => {
      const on = ch.legacyStaff.includes(s.id);
      const full = !on && ch.legacyStaff.length >= p.legacy;
      return {
        id: `staff-${s.id}`,
        logo: s.art,
        title: `${s.name}${on ? ' ✓ Legacy' : ''}`,
        highlight: on,
        lines: [`${TIERS[s.tier]?.name ?? s.tier} · Level ${s.level} · ${Object.entries(s.stats).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' ')}`, ...(s.runs ? [{ text: `Carried through ${s.runs} run${s.runs === 1 ? '' : 's'} already`, color: C.good, bold: true }] : [])],
        buttons: [{ id: 'pick', label: on ? 'Leave behind' : 'Bring along', disabled: full, accent: on ? C.bad : C.good, onTap: () => toggle(ch.legacyStaff, s.id) }],
      };
    };
    const blueCard = (b) => {
      const on = ch.blueprints.includes(b.id);
      const full = !on && ch.blueprints.length >= p.blueprints;
      return {
        id: `bp-${b.id}`,
        logo: b.cover,
        title: `${b.title}${on ? ' ✓' : ''}`,
        highlight: on,
        lines: [`Franchise: ${b.franchise} · reviewed ${b.score}`, Object.values(b.recipe).map((id) => elementById(id)?.name ?? id).join(' + '), { text: `Starts with ${fmt(b.fans)} franchise fan points`, color: C.textMuted }],
        buttons: [{ id: 'pick', label: on ? 'Remove' : 'Carry this game', disabled: full, accent: on ? C.bad : C.good, onTap: () => toggle(ch.blueprints, b.id) }],
      };
    };
    const facCard = (f) => {
      const on = ch.facilityBlueprint === f.id;
      return { id: `fac-${f.id}`, logo: f.art, title: `${f.name}${on ? ' ✓' : ''}`, highlight: on, lines: [`First one costs ${NGPLUS.facilityDiscountPct}% less: ${fmt(f.cost * (1 - NGPLUS.facilityDiscountPct / 100))} Credits`], buttons: [{ id: 'pick', label: on ? 'Remove' : 'Take this blueprint', accent: on ? C.bad : C.good, onTap: () => (ch.facilityBlueprint = on ? null : f.id) }] };
    };
    const shopCard = (item) => {
      const on = ch.shop.includes(item.id);
      const lines = [item.line, { text: `${item.price} Prestige Tokens`, color: C.actionDark, bold: true }];
      const buttons = [{ id: 'buy', label: on ? 'Remove' : 'Buy', disabled: !on && tokensLeft < item.price, accent: on ? C.bad : C.action, onTap: () => { toggle(ch.shop, item.id); if (item.id === 'startFacility' && !ch.shop.includes('startFacility')) ch.startFacility = null; trim(); } }];
      if (on && item.effect.kind === 'startFacility') for (const id of item.effect.options) buttons.push({ id: `sf-${id}`, label: `${ch.startFacility === id ? '✓ ' : ''}${facilityById(id)?.name ?? id}`, accent: C.progress, onTap: () => (ch.startFacility = id) });
      return { id: `shop-${item.id}`, logo: 'dev_reward_04', title: `${item.name}${on ? ' ✓' : ''}`, highlight: on, lines, buttons };
    };
    const blueprints = [...o.options.blueprints].sort((a, b) => b.score - a.score || a.number - b.number);
    return [
      { heading: 'Carried over', cards: [{ id: 'keep', logo: 'dev_reward_10', title: 'Kept by your account', lines: [keep], buttons: [] }, { id: 'reset', logo: 'dev_ui_02', title: 'Starts again', lines: [`${resets} and more`], buttons: [] }, { id: 'research', logo: 'dev_reward_03', title: `Research: ${o.researchPct}% comes back`, lines: [`${fmt(o.researchRp)} RP to spend in the new studio`], buttons: [] }, ...(o.ultimate ? [{ id: 'ultimate', logo: 'dev_event_19', title: 'Ultimate paths open', lines: ['PROJECT ONE, PROJECT X and Studio Singularity can be reached in NG+3.'], buttons: [] }] : [])] },
      { heading: `Legacy Staff · ${ch.legacyStaff.length} of ${p.legacy}`, cards: o.options.legacy.map(staffCard), empty: 'Nobody to bring.' },
      { heading: `Legacy Game Blueprints · ${ch.blueprints.length} of ${p.blueprints}`, cards: blueprints.slice(0, 24).map(blueCard), empty: 'No released game to carry.' },
      ...(p.facility ? [{ heading: 'Discounted facility blueprint', cards: o.options.facilities.map(facCard), empty: 'No bought facility to take.' }] : []),
      { heading: `Prestige Token shop · ${tokensLeft} of ${o.tokens} left`, cards: o.shop.map(shopCard) },
      { heading: null, cards: [{ id: 'go', title: 'Ready?', lines: probs.length ? probs.map((x) => ({ text: x, color: C.bad })) : ['Next: choose the save slot for the new run.'], buttons: [{ id: 'slot', label: 'Choose a save slot', disabled: probs.length > 0, accent: C.action, onTap: () => (view = 'slot') }] }] },
    ];
  }
  // A token item removed: picks it paid for go too.
  function trim() {
    const p = ngplus.picks(ch.shop);
    ch.legacyStaff.length = Math.min(ch.legacyStaff.length, p.legacy);
    ch.blueprints.length = Math.min(ch.blueprints.length, p.blueprints);
  }

  function slotSections() {
    const par = parentSlot();
    const cards = slots().map((s) => {
      const m = s.summary;
      const isParent = s.index === par;
      const title = `Slot ${s.index + 1}: ${m ? m.studio : s.error ? 'damaged save' : 'empty'}`;
      const lines = m ? [`Year ${m.year} · Month ${m.month} · Rank ${m.rank}${m.ngPlus ? ` · NG+${m.ngPlus}` : ''}`] : [s.error ? 'This save can’t be read.' : 'NEW STUDIO'];
      if (isParent) lines.push({ text: 'Your finished run stays here, untouched.', color: C.good, bold: true });
      const label = isParent ? 'Kept' : m || s.error ? 'Overwrite' : 'Use this slot';
      return {
        id: `slot${s.index}`,
        title,
        highlight: !m && !s.error,
        lines,
        buttons: [{ id: 'use', label, disabled: isParent, accent: m || s.error ? C.bad : C.action, onTap: () => (m || s.error ? confirm({ title: `Overwrite Slot ${s.index + 1}?`, body: `${m ? `"${m.studio}"` : 'This save'} will be replaced by the New Game+ run. This can't be undone.`, yes: 'Overwrite', danger: true, onYes: () => onChoose(s.index, JSON.parse(JSON.stringify(ch))) }) : onChoose(s.index, JSON.parse(JSON.stringify(ch)))) }],
      };
    });
    const free = slots().some((s) => !s.summary && !s.error);
    return [{ heading: free ? 'Choose a slot' : 'All 4 slots are full: pick one to overwrite', cards }];
  }

  const base = createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const o = ngplus.offer();
      return view === 'pick'
        ? { title: `New Game+ ${o.level}`, icon: 'dev_brand_06', subtitle: `A new studio from Year 1, with what you pick from this run. NG+${o.level}: ${o.picks.legacy} Legacy Staff, ${o.picks.blueprints} blueprint${o.picks.blueprints === 1 ? '' : 's'}, ${o.researchPct}% research${o.picks.facility ? ', a facility blueprint' : ''}${o.ultimate ? ', ultimate paths' : ''}.`, sections: pickSections(o) }
        : { title: 'Save slot for NG+', icon: 'dev_brand_06', subtitle: 'The run you just finished is never overwritten.', sections: slotSections() };
    },
  });
  return {
    ...base,
    get view() {
      return view;
    },
    get choices() {
      return ch;
    },
    enter(params = {}) {
      base.enter();
      if (!params.keep) reset();
      view = params.view ?? 'pick';
    },
    onBack() {
      if (view === 'slot') {
        view = 'pick';
        return true;
      }
      return false;
    },
  };
}
