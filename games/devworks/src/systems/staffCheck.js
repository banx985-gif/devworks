// Career validation (Milestone 14): every staff row checked against bible §9–§10 on core DataValidator. Called by
// checkGameData (so it runs in the tests and at boot with ?debug=1); never throws.
//   - 50 rows, 10 per role (01–10: 2 Standard, 4 Rare, 2 Elite, 1 Legendary, 1 Secret), ids matching their role
//   - core staffRoster: stats whole numbers within the tier cap, traits real, normal traits within the tier's slots,
//     exactly one signature on Legendary / Secret (none below), the picture exists
//   - salary and starting level sane; the portrait crop inside the picture
//   - eligibility: known rule keys only; ranks real; the role facility real; Legendary / Secret gated by a real
//     SEC-STAFF secret, and nobody else gated by one; the five start staff and Start Candidates are Standard
import { ROSTER, ROLES, TIERS, TRAITS, STAT_KEYS, PRESTIGE_TIERS, STAFF_SECRETS, START_STAFF } from '../../data/staff.js';
import { RECRUIT } from '../../data/recruitment.js';
import { FACILITIES } from '../../data/facilities.js';
import { FAME } from '../../data/balance.js';
import { PORTRAITS } from '../../data/portraits.js';

const TIER_BY_NUMBER = ['standard', 'standard', 'rare', 'rare', 'rare', 'rare', 'elite', 'elite', 'legendary', 'secret'];
const RULE_KEYS = ['start', 'rank', 'roleGames', 'roleFacility', 'major', 'secret'];

export function checkStaff(v) {
  const rankIds = new Set(FAME.ranks.map((r) => r.id));
  const facIds = new Set(FACILITIES.map((f) => f.id));
  v.staffRoster('staff', ROSTER, { roles: ROLES, tiers: TIERS, traits: TRAITS, statKeys: STAT_KEYS, artPath: (p) => `assets/images/staff/${p.art}.png` });
  v.check(ROSTER.length === 50, `staff: ${ROSTER.length} rows, the bible has 50`);
  for (const role of Object.keys(ROLES)) v.check(ROSTER.filter((p) => p.role === role).length === 10, `staff: ${role} does not have 10 people`);
  for (const [id, t] of Object.entries(TRAITS)) {
    v.check(typeof t.name === 'string' && typeof t.text === 'string' && t.text.length > 0, `trait ${id}: no name or text`);
    v.check(t.effects && Object.keys(t.effects).length > 0, `trait ${id}: no effect`);
    v.check(ROSTER.some((p) => p.traits.includes(id)), `trait ${id}: nobody has it`);
  }
  for (const p of ROSTER) {
    const o = `staff ${p.id}`;
    const m = /^([A-Z]{3})(\d\d)$/.exec(p.id);
    if (!v.check(!!m && m[1] === p.role, `${o}: id does not match role ${p.role}`)) continue;
    const n = Number(m[2]);
    v.check(n >= 1 && n <= 10 && TIER_BY_NUMBER[n - 1] === p.tier, `${o}: tier ${p.tier}, bible §10 has ${TIER_BY_NUMBER[n - 1]}`);
    v.check(p.art === `staff_${p.id.toLowerCase()}`, `${o}: art key ${p.art}`);
    v.check(Number.isInteger(p.salary) && p.salary > 0, `${o}: salary`);
    v.check(Number.isInteger(p.startLevel) && p.startLevel >= 1 && p.startLevel <= 30, `${o}: starting level`);
    const c = PORTRAITS[p.art];
    if (v.check(!!c, `${o}: no portrait crop`)) v.check(c.x >= 0 && c.y >= 0 && c.w > 0 && c.h > 0 && c.x + c.w <= 1.0001 && c.y + c.h <= 1.0001, `${o}: portrait crop outside the picture`);
    const e = p.eligibility ?? {};
    const keys = Object.keys(e);
    if (!v.check(keys.length > 0 && keys.every((k) => RULE_KEYS.includes(k)), `${o}: eligibility ${JSON.stringify(e)}`)) continue;
    if (e.rank !== undefined) v.ref(o, 'rank', e.rank, rankIds);
    if (e.roleGames !== undefined) v.check(Number.isInteger(e.roleGames) && e.roleGames > 0, `${o}: roleGames`);
    if (e.roleFacility) v.ref(o, 'role facility', RECRUIT.roleFacilities[p.role], facIds);
    const prestige = PRESTIGE_TIERS.includes(p.tier);
    v.check(prestige === !!e.secret, `${o}: ${prestige ? 'Legendary / Secret must be gated by a secret' : 'only Legendary / Secret staff are gated by a secret'}`);
    if (e.secret) {
      v.ref(o, 'secret', e.secret, new Set(STAFF_SECRETS));
      v.check(keys.length === 1, `${o}: a secret arrival has no other rule`);
    }
    if (e.start || p.startCandidate) v.check(p.tier === 'standard', `${o}: a start person must be Standard`);
  }
  for (const d of START_STAFF) v.check(ROSTER.includes(ROSTER.find((p) => p.id === d.id)), `staff: start staff ${d.id} missing from the roster`);
  v.check(new Set(ROSTER.filter((p) => p.eligibility.secret).map((p) => p.eligibility.secret)).size === STAFF_SECRETS.length, 'staff: each SEC-STAFF secret should bring exactly one person');
}
