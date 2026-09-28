// Research topics (bible §37): 36 visible nodes in six branches (ENG, GAM, ART, PRO, BUS, HW), tiers 1–6 costing
// 120 / 220 / 420 / 700 / 1050 / 1500 RP. Milestone 6 used the ids for element unlocks; Milestone 11 for facility
// unlocks; Milestone 12 adds the tree (src/systems/research.js on core ResearchSystem).
//   requires: each branch in order (tier n needs tier n−1), plus a few cross-links (CROSS_LINKS below).
//   line: what it is for, shown on the Research screen. What it opens (elements, facilities) is worked out from the
//   element and facility data (research.js unlocksOf), so the two can never disagree.
//   HW nodes lead to hardware (Milestone 23): they open nothing yet beyond the facilities that wait on them.
export const BRANCHES = [
  { id: 'ENG', name: 'Engine', line: 'Technology your games are built on.' },
  { id: 'GAM', name: 'Gameplay', line: 'Systems and design tools.' },
  { id: 'ART', name: 'Art & Audio', line: 'Pipelines for how games look and sound.' },
  { id: 'PRO', name: 'Production', line: 'Running bigger projects.' },
  { id: 'BUS', name: 'Business', line: 'Marketing, publishing and selling.' },
  { id: 'HW', name: 'Hardware', line: 'The road to your own console (later).' },
];
export const TIER_RP = [120, 220, 420, 700, 1050, 1500];

const NAMES = {
  ENG: ['Engine Basics', 'Custom Toolchain', '3D Rendering', 'Online Architecture', 'Streaming Worlds', 'Neural Production'],
  GAM: ['Gameplay Prototyping', 'UX & Controls', 'Systemic Design', 'Economy & Progression', 'Open World Design', 'Creator Systems'],
  ART: ['2D Pipeline', '3D Pipeline', 'Animation & Audio', 'Advanced Lighting', 'Cinematic Tools', 'Mixed-Media Pipeline'],
  PRO: ['Production Basics', 'QA Automation', 'Localisation', 'Large-Team Production', 'Blockbuster Scheduling', 'Mega Project Control'],
  BUS: ['Marketing Fundamentals', 'Publishing Deals', 'Franchise Management', 'Global Distribution', 'Engine Licensing', 'Digital Storefront'],
  HW: ['Hardware Fundamentals', 'Chip Architecture', 'Dev Kits', 'Reliability & Certification', 'Manufacturing Strategy', 'Hybrid / Prestige Hardware'],
};

// Cross-links (plan review B: the bible gives none): 3D Rendering needs the 3D Pipeline; Open World Design needs
// 3D Rendering; Engine Licensing needs Online Architecture; Dev Kits need the Custom Toolchain; QA Automation needs
// Engine Basics; Large-Team Production needs UX & Controls.
export const CROSS_LINKS = { ENG3: ['ART2'], GAM5: ['ENG3'], BUS5: ['ENG4'], HW3: ['ENG2'], PRO2: ['ENG1'], PRO4: ['GAM2'] };

export const RESEARCH = BRANCHES.flatMap((b) =>
  NAMES[b.id].map((name, i) => {
    const id = `${b.id}${i + 1}`;
    return { id, name, rp: TIER_RP[i], branch: b.id, tier: i + 1, requires: [...(i ? [`${b.id}${i}`] : []), ...(CROSS_LINKS[id] ?? [])] };
  }),
);
export const researchById = (id) => RESEARCH.find((r) => r.id === id) ?? null;

// Where RP comes from (Milestone 12; plan review B: the bible doesn't say). All placeholders.
//   release: review × perReview × the scope's mult, when a game launches
//   daily: base RP every day, + each on-duty worker at a research station (the Thinker stations and the labs,
//          researchStations) adds their best stat ÷ statDiv
//   firsts: the first release in a genre, and each recipe element released for the first time
//   work: a started topic needs its RP in work too; the queue does workPerDay a day (+ the facilities' progressPct —
//         Server Rack, Engine Build Farm — and researchPct), so ENG1 takes about 3 weeks. Queue 1 only; a second
//         queue is the later / VIP hook (queues[1], closed).
export const RP_BALANCE = {
  release: { perReview: 1, scopeMult: { tiny: 1, small: 1.5, standard: 2.2, large: 3, blockbuster: 4, mega: 5 } },
  daily: { base: 1, statDiv: 120 },
  researchStations: ['F06', 'F10', 'F11', 'F18', 'F21', 'F27'],
  firsts: { genre: 30, element: 10 },
  workPerDay: 6,
};
