// Hardware (Milestone 23, bible §32 / §33): the six console slots, the 36 components and the prototype project. Plain
// data only; the rules are src/systems/hardware.js. The bible gives the slots, the component names and the seven
// ratings; every number is a placeholder (plan review B), listed in the build log.

export const HW_SLOTS = [
  { id: 'CPU', name: 'CPU' },
  { id: 'GPU', name: 'Graphics' },
  { id: 'MEM', name: 'Memory' },
  { id: 'STO', name: 'Storage / Media' },
  { id: 'CTL', name: 'Controller' },
  { id: 'SYS', name: 'System Features' },
];

// A component: its slot, tier (1–6; the part needs HW research of that tier — HW1…HW5; tier 6 is Prestige, locked for
// the secrets), unit cost (Credits to make one console's part; manufacturing is Milestone 24) and what it brings, each
// 0–100: perf (speed), rel (reliability), dev (how easy games are to make for it), online, use (usability /
// portability), appeal (what players think of it on the box).
const P = (id, name, tier, cost, perf, rel, dev, online, use, appeal, line) => ({ id, slot: id.slice(0, 3), name, tier, cost, perf, rel, dev, online, use, appeal, line, art: `hardware_${id.toLowerCase()}`, ...(IRONPEAK.includes(id) ? { ironPeak: true } : {}) });
// Milestone 27: the parts made by the sponsor IronPeak Hardware (SPN06: use one in a hardware project during its deal).
export const IRONPEAK = ['CPU03', 'GPU03', 'MEM03', 'STO03'];
export const COMPONENTS = [
  P('CPU01', 'Budget Core', 1, 30, 25, 85, 70, 0, 50, 20, 'Cheap and dependable; slow.'),
  P('CPU02', 'Balanced Core', 2, 55, 45, 80, 75, 0, 50, 40, 'A sensible all-rounder.'),
  P('CPU03', 'High-Clock Core', 3, 85, 65, 55, 60, 0, 45, 55, 'Fast, but runs hot.'),
  P('CPU04', 'Multi-Core Pro', 4, 120, 80, 70, 55, 0, 50, 70, 'Lots of cores; games must be written for them.'),
  P('CPU05', 'Custom Vector CPU', 5, 170, 92, 50, 40, 0, 50, 80, 'Blazing, exotic and hard to program.'),
  P('CPU06', 'Prestige Neural CPU', 6, 260, 100, 85, 80, 0, 60, 100, 'A secret masterpiece.'),
  P('GPU01', 'Basic Graphics', 1, 30, 20, 85, 75, 0, 50, 15, 'Simple 2D drawing.'),
  P('GPU02', 'Sprite Accelerator', 2, 50, 40, 80, 80, 0, 50, 40, 'Smooth, colourful 2D.'),
  P('GPU03', '3D GPU', 3, 90, 60, 70, 60, 0, 50, 60, 'Real 3D worlds.'),
  P('GPU04', 'Unified Shader GPU', 4, 130, 78, 70, 70, 0, 50, 75, 'Modern, flexible shading.'),
  P('GPU05', 'Ray/Light Engine', 5, 190, 92, 40, 50, 0, 50, 90, 'Stunning light; costly and hot.'),
  P('GPU06', 'Prestige Render Core', 6, 280, 100, 85, 80, 0, 60, 100, 'A secret masterpiece.'),
  P('MEM01', 'Basic Memory', 1, 20, 25, 85, 70, 0, 50, 15, 'Just enough.'),
  P('MEM02', 'Fast RAM', 2, 40, 45, 80, 70, 0, 50, 35, 'Quick loading, small worlds.'),
  P('MEM03', 'Unified Memory', 3, 65, 60, 80, 80, 0, 50, 50, 'One shared pool: easy to use, big worlds.'),
  P('MEM04', 'High-Bandwidth Memory', 4, 100, 80, 70, 65, 0, 50, 65, 'Feeds a hungry GPU.'),
  P('MEM05', 'Shared System Pool', 5, 140, 90, 75, 75, 0, 50, 75, 'Huge and fast; streaming worlds love it.'),
  P('MEM06', 'Prestige Memory Fabric', 6, 220, 100, 90, 85, 0, 60, 100, 'A secret masterpiece.'),
  P('STO01', 'Cartridge', 1, 25, 40, 90, 70, 0, 70, 30, 'Instant loading, tough, small.'),
  P('STO02', 'Optical Disc', 2, 15, 30, 70, 70, 10, 45, 45, 'Cheap and roomy; slow to load.'),
  P('STO03', 'Flash Storage', 3, 45, 55, 80, 75, 20, 70, 55, 'Fast and small: good for portables.'),
  P('STO04', 'Fast Solid State', 4, 80, 80, 80, 80, 30, 60, 70, 'Near-instant loading.'),
  P('STO05', 'Hybrid Physical/Digital', 5, 70, 70, 80, 80, 50, 65, 80, 'Discs and downloads: everyone is happy.'),
  P('STO06', 'Prestige Crystal Storage', 6, 150, 100, 95, 85, 60, 80, 100, 'A secret masterpiece.'),
  P('CTL01', 'Classic Pad', 1, 10, 0, 90, 80, 0, 50, 25, 'The pad everyone knows.'),
  P('CTL02', 'Dual-Stick Pad', 2, 18, 0, 85, 80, 0, 65, 45, 'Two sticks for 3D worlds.'),
  P('CTL03', 'Motion Pad', 3, 28, 0, 70, 60, 0, 70, 65, 'Wave it about: families love it.'),
  P('CTL04', 'Touch Hybrid', 4, 40, 0, 70, 65, 0, 85, 70, 'Buttons and a touch screen; plays on the go.'),
  P('CTL05', 'Adaptive Controller', 5, 55, 0, 80, 70, 0, 90, 80, 'Feels every surface; built for everyone.'),
  P('CTL06', 'Prestige Haptic Deck', 6, 90, 0, 90, 85, 0, 100, 100, 'A secret masterpiece.'),
  P('SYS01', 'Offline OS', 1, 5, 0, 90, 60, 0, 50, 15, 'Games only; no network.'),
  P('SYS02', 'Online Services', 2, 20, 0, 75, 70, 60, 55, 45, 'Online play and friends lists.'),
  P('SYS03', 'Store & Patching', 3, 30, 0, 80, 80, 75, 60, 60, 'A digital store; games can be patched.'),
  P('SYS04', 'Cloud Saves', 4, 40, 0, 80, 80, 85, 70, 70, 'Saves follow the player anywhere.'),
  P('SYS05', 'Creator Platform', 5, 55, 0, 75, 90, 95, 70, 85, 'Players make and share content.'),
  P('SYS06', 'Prestige Adaptive OS', 6, 90, 0, 95, 100, 100, 80, 100, 'A secret masterpiece.'),
];
export const componentById = (id) => COMPONENTS.find((c) => c.id === id) ?? null;
export const componentsOf = (slot) => COMPONENTS.filter((c) => c.slot === slot);

// The seven ratings (bible §32), 0–100, worked out from the six parts (src/systems/hardware.js ratingsFor):
//   performance    CPU 40% + GPU 40% + Memory 20% of their perf (+ Storage perf × 10%, less 10% of the average)
//   costEfficiency 100 − (unit cost − costPivot) ÷ costPerPoint + (performance − 50) ÷ 2
//   reliability    the average rel of all six, pulled down by the weakest part (weakestPct of the gap)
//   devFriendly    CPU 30% + GPU 25% + Memory 25% + System 20% of their dev
//   online         System 80% + Storage 20% of online
//   usability      Controller 60% + Storage 40% of use
//   launchAppeal   performance 30% + the parts' average appeal 30% + usability 15% + online 10% + costEfficiency 15%
export const HW_RATINGS = [
  { key: 'performance', name: 'Performance' },
  { key: 'costEfficiency', name: 'Cost Efficiency' },
  { key: 'reliability', name: 'Reliability' },
  { key: 'devFriendly', name: 'Developer Friendliness' },
  { key: 'online', name: 'Online / Services' },
  { key: 'usability', name: 'Portability / Usability' },
  { key: 'launchAppeal', name: 'Launch Appeal' },
];

export const HARDWARE = {
  lab: 'F28', // the Hardware Prototype Lab (Year 11 + HW2)
  costPivot: 200,
  costPerPoint: 6,
  weakestPct: 40,
  // The prototype project (core ProjectSystem, like an engine): work = base + perTier × the parts' tiers added up;
  // Credits a day likewise. Mostly Programmers and Producers.
  work: { base: 150, perTier: 10 },
  costPerDay: { base: 120, perTier: 8 },
  progressDivisor: 75,
  phases: [
    { id: 'design', name: 'Board Design', share: 0.3, weights: { code: 0.5, prod: 0.3, des: 0.2 } },
    { id: 'prototype', name: 'Prototype Build', share: 0.45, weights: { code: 0.6, prod: 0.4 } },
    { id: 'validation', name: 'Validation', share: 0.25, weights: { code: 0.4, prod: 0.6 } },
  ],
  // Validation (plain reasons). required: a prototype that fails one fails validation (it can be rebuilt with other
  // parts). The capability checks say which games it can run; they never fail the prototype.
  checks: {
    minReliability: 60,
    minDevFriendly: 55,
    maxUnitCost: 600,
    maxTierGap: 2, // CPU and GPU tiers this far apart: one holds the other back
  },
  capabilities: [
    { id: '3d', name: '3D games', slot: 'GPU', tier: 3, why: '3D games need a 3D GPU (GPU03 or better)' },
    { id: 'online', name: 'Online features', slot: 'SYS', tier: 2, why: 'Online features need Online Services (SYS02 or better)' },
    { id: 'streaming', name: 'Streaming worlds', slot: 'MEM', tier: 3, why: 'Streaming-world games need Unified Memory (MEM03 or better)' },
    { id: 'store', name: 'A digital store', slot: 'SYS', tier: 3, why: 'Selling games digitally needs Store & Patching (SYS03 or better)' },
  ],
  prototypeArt: 'console_visual_07',
  firstPrototypeEvent: 'dev_event_10',
};
