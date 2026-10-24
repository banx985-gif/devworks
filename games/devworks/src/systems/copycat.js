// The late twist (Milestone 40h, Kairosoft rule 5): from Year 15 rivals copy your best-selling genre + theme combo.
// Numbers and rules in data/rivals.js LATE_TWIST.
//
//   active        the copy running now: { genre, theme, rival, studio, day, until } | null
//   effectFor(recipe)  → { salesPct, expectPlus, studio } for a game launched now with the copied combo, else null
//                         (business.js reads it at launch: sales × (1 + salesPct / 100), Fan Expectation + expectPlus)
//   history       every copy this run (saved)
//
// When: the first check at the end of a chart week (7 days) in Year 15 or later copies the combo whose released games
// have sold the most copies in all. Once that copy is over (2 years), the next one comes at the end of a week your game
// topped (over the #1 chart week line) with a combo that wasn't the last one copied. One copy at a time. Nothing reads
// a game still being made.
// Events: 'copycat:start' { copy }, 'copycat:end' { copy }. The Inbox line goes through studioEvents.note().
import { LATE_TWIST as T, rivalById, RIVALS } from '../../data/rivals.js';
import { COUNTERS as K } from '../../data/secrets.js';
import { elementById } from '../../data/elements.js';

const keyOf = (genre, theme) => `${genre}|${theme}`;
const nameOf = (id) => elementById(id)?.name ?? id;

export function createCopycat({ bus, clock, projects, studioEvents = () => null, years = T.years }) {
  let active = null;
  let history = [];
  let week = { start: 0, copies: {} };
  const today = () => clock.totalDays;
  const span = () => years * clock.daysPerMonth * clock.monthsPerYear;
  const released = () => projects.catalogue.list().filter((r) => r.release);
  const copiesOf = (r) => (r.sales?.copies ?? 0) + (r.catalogue?.copies ?? 0);

  function bestSellingCombo() {
    const by = {};
    for (const r of released()) {
      const k = keyOf(r.result.recipe?.genre, r.result.recipe?.theme);
      by[k] = (by[k] ?? 0) + copiesOf(r);
    }
    const best = Object.entries(by).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    return best && best[1] > 0 ? best[0] : null;
  }
  function copier() {
    const year = clock.year;
    const id = T.copiers.find((x) => {
      const r = rivalById(x);
      return r && !r.hidden && year >= r.firstYear;
    });
    return rivalById(id) ?? RIVALS[0];
  }
  function start(key) {
    const [genre, theme] = key.split('|');
    const r = copier();
    active = { genre, theme, rival: r.id, studio: r.name, day: today(), until: today() + span() };
    history.push({ ...active });
    const combo = `${nameOf(genre)} ${nameOf(theme)}`;
    studioEvents()?.note?.({
      title: `${r.name} is making its own ${combo} game!`,
      body: `They are copying your best seller. For the next ${years} years your ${combo} games sell ${-T.salesPct}% less and reviewers expect more of them. A fresh combo isn't affected.`,
      level: 'major',
      icon: r.logo ?? null,
      toast: true,
    });
    bus.emit('copycat:start', { copy: { ...active } });
  }
  function weekEnd() {
    const entries = Object.entries(week.copies);
    const top = entries.reduce((b, e) => (e[1] > (b?.[1] ?? -1) ? e : b), null);
    week = { start: today(), copies: {} };
    if (clock.year < T.fromYear || active) return;
    if (!history.length) {
      const key = bestSellingCombo();
      if (key) start(key);
      return;
    }
    if (!top || top[1] < K.chartBase + K.chartPerYear * clock.year) return;
    const rec = projects.catalogue.get(Number(top[0]));
    const key = rec ? keyOf(rec.result.recipe?.genre, rec.result.recipe?.theme) : null;
    const last = history.at(-1);
    if (key && key !== keyOf(last.genre, last.theme)) start(key);
  }
  bus.on('sales:day', ({ record, copies }) => {
    week.copies[record.number] = (week.copies[record.number] ?? 0) + copies;
  });
  bus.on('clock:day', () => {
    if (active && today() >= active.until) {
      const copy = active;
      active = null;
      bus.emit('copycat:end', { copy: { ...copy } });
    }
    if (today() - week.start >= K.chartDays) weekEnd();
  });

  return {
    get active() {
      return active;
    },
    get history() {
      return history;
    },
    effectFor(recipe) {
      if (!active || !recipe || recipe.genre !== active.genre || recipe.theme !== active.theme) return null;
      return { salesPct: T.salesPct, expectPlus: T.expectPlus, studio: active.studio };
    },
    // ?debug=1 / tests: a copy of this combo now (whatever the year).
    copyNow(genre, theme) {
      active = null;
      start(keyOf(genre, theme));
    },
    newGame() {
      active = null;
      history = [];
      week = { start: today(), copies: {} };
    },
    serialize: () => JSON.parse(JSON.stringify({ active, history, week })),
    load(data) {
      active = data?.active ? { ...data.active } : null;
      history = JSON.parse(JSON.stringify(data?.history ?? []));
      week = data?.week ? JSON.parse(JSON.stringify(data.week)) : { start: today(), copies: {} };
    },
  };
}
