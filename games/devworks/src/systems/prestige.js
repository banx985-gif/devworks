// PROJECT ONE, PROJECT X and Studio Singularity (Milestone 31, bible §42). The two peaks and the true ending sit on the
// Milestone 29 secrets (SEC-X-02, SEC-HW-06, SEC-X-03) — this file only offers the two templates when their exact
// conditions hold and starts them; the secrets fire from what actually happens.
//
// PROJECT ONE (software peak): offered in NG+3 once SEC-COMBO-08 (The One Combination) has been found, C12 won this run,
//   a prestige engine technology known (SEC-TECH-01's Prestige Build System), 3 Prestige people free, the Mega scope
//   open and a lane free. Its recipe is locked to bible §42 (RPG + Science Fiction + Management + Neural Tools + Mixed
//   Media + User Creation), Mega scope, the 3 Prestige people on the team; the finished game is marked projectOne and
//   its cover is cover_29 (the PROJECT ONE family; Milestone 37 — it used cover_27 before). Released with launch bugs ≤ 3 → SEC-X-02.
// PROJECT X (hardware peak): offered in NG+3 once SEC-HW-05 and the four other hardware secrets are found, at the
//   Global Campus, with 3 Legendary / Prestige people, HW6 and the six Prestige parts. A console design made of the six
//   parts (hardware.designProjectX); built at the lab and launched from the Console Portfolio (it may launch after
//   the three generations) → SEC-HW-06.
// Studio Singularity: both in the same NG+3 run, Year 20+, Fan Trust 85+, solvent → SEC-X-03 (the true hidden ending).
// Nothing a purchase can change is read here (bible §2.8).
import { PRESTIGE_TIERS, staffDefById } from '../../data/staff.js';
import { COMPONENTS } from '../../data/hardware.js';

export const PROJECT_ONE = {
  title: 'PROJECT ONE',
  recipe: { genre: 'GEN02', theme: 'THM02', gameplay: 'PLY03', technology: 'TEC08', artDirection: 'ADR07', feature: 'FEA06' },
  scope: 'mega',
  prestigeStaff: 3,
  cover: 'cover_29',
  maxBugs: 3,
};
export const PROJECT_X = { family: 'PROJECT X', parts: Object.fromEntries(COMPONENTS.filter((c) => c.tier === 6).map((c) => [c.slot, c.id])), art: 'console_visual_08', contributors: 3 };

export function createPrestige({ clock, world, projects, secrets, awards, hardware = () => null, profile = () => null, lanes = () => 1 }) {
  const staff = world.staffSystem;
  const ng = () => profile()?.ngPlus ?? 0;
  const ever = (id) => secrets.engine.everUnlocked(id);
  const tier = (id) => staffDefById(id)?.tier;
  const busy = (id) => projects.jobs.some((j) => j.slots.includes(id)) || !!world.workerById?.(id)?.away;
  const prestigeFree = () => staff.staff.filter((s) => tier(s.id) === 'secret' && !busy(s.id)).map((s) => s.id);
  const legendaryAll = () => staff.staff.filter((s) => PRESTIGE_TIERS.includes(tier(s.id))).length;

  function projectOneWhy() {
    const why = [];
    if (ng() < 3) why.push('NG+3');
    if (!ever('SEC-COMBO-08')) why.push('The One Combination (a secret)');
    if (!(awards()?.wins ?? []).some((w) => w.award === 'C12')) why.push('the Perfect Game Circle (C12) won this run');
    if (!secrets.opened('tech', 'prestigeBuildSystem')) why.push('a prestige engine technology');
    if (prestigeFree().length < PROJECT_ONE.prestigeStaff) why.push(`${PROJECT_ONE.prestigeStaff} free Prestige people (${prestigeFree().length} now)`);
    if ((world.stage ?? 1) < 5) why.push('the Global Campus (Mega scope)');
    if (projects.jobs.length >= lanes()) why.push('a free game lane');
    return why.length ? `Needs ${why.join(' + ')}` : null;
  }
  // Shown at all only once its secret chain has begun (NG+3 and the recipe found): otherwise PROJECT ONE stays hidden.
  const projectOneShown = () => ng() >= 3 && ever('SEC-COMBO-08');
  function startProjectOne(rng, { audio = 'premium', budget = 'balanced' } = {}) {
    const why = projectOneWhy();
    if (why) return { ok: false, why };
    const team = [...new Set([...prestigeFree(), ...staff.staff.map((s) => s.id).filter((id) => !busy(id))])];
    const job = projects.start({ title: PROJECT_ONE.title, recipe: { ...PROJECT_ONE.recipe }, scope: PROJECT_ONE.scope, audio, budget, team, projectOne: true }, rng);
    return { ok: true, job };
  }

  function projectXWhy() {
    const why = [];
    if (ng() < 3) why.push('NG+3');
    if (!ever('SEC-HW-05')) why.push('three profitable console generations (Generation Master)');
    const chain = ['SEC-HW-01', 'SEC-HW-02', 'SEC-HW-03', 'SEC-HW-04', 'SEC-HW-05'].filter((id) => !ever(id)).length;
    if (chain) why.push(`the hardware prestige chain (${5 - chain} of 5)`);
    if ((world.stage ?? 1) < 5) why.push('the Global Campus');
    if (legendaryAll() < PROJECT_X.contributors) why.push(`${PROJECT_X.contributors} Legendary / Prestige people (${legendaryAll()} now)`);
    const missing = Object.values(PROJECT_X.parts).filter((id) => hardware()?.partWhy(id));
    if (missing.length) why.push(`the six Prestige parts and HW6 (${missing.length} still locked)`);
    if (hardware()?.hardwareWhy?.()) why.push('a Hardware Prototype Lab');
    return why.length ? `Needs ${why.join(' + ')}` : null;
  }
  const projectXShown = () => ng() >= 3 && ever('SEC-HW-05');
  function designProjectX() {
    const why = projectXWhy();
    if (why) return { ok: false, why };
    hardware().designNext(PROJECT_X.family, PROJECT_X.parts);
    hardware().draft.projectX = true;
    return { ok: true };
  }

  return { projectOneWhy, projectOneShown, startProjectOne, projectXWhy, projectXShown, designProjectX, prestigeFree };
}
