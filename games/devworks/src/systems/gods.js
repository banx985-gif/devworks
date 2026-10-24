// The Works Gods (Milestone 40g, SERIES_WORKS_GODS.md): the studio-wide part of a blessing. A trait's effects.studio
// ({ key: n }) counts in the studio's effect query (world.effect, the same one the facilities and sponsors feed) while
// its owner is on the roster — Kaching's sponsor payouts and publisher advances. Read from traits, never by id.
//   world.addEffectSource(rosterEffect(world.staffSystem))
export function rosterEffect(staff) {
  return (key) => {
    let t = 0;
    const seen = new Set(); // each trait once, like a team's traits
    for (const s of staff.staff) {
      for (const id of s.traits ?? []) {
        if (seen.has(id)) continue;
        seen.add(id);
        const v = staff.traits[id]?.effects?.studio?.[key];
        if (typeof v === 'number') t += v;
      }
    }
    return t;
  };
}
