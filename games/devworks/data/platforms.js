// Platforms (bible §17; Milestone 8): the 12 third-party platforms, exactly as the bible table. Plain data only;
// every number (install bases, curve shape, certification, porting, audience fit) lives in balance.js
// (PLATFORM_BALANCE), the curves in src/systems/platformMarket.js. No real manufacturer names.
//   era: { from, to } calendar years (to: null = "Y1+" — it never goes away)
//   audience: the bible's audience label; group: which audience-fit column it uses (balance.js)
//   friendliness: the bible's Dev Friendliness (Very High / High / Medium): certification and porting read it
//   open: an open platform (OpenDesk PC): no certification step
export const PLATFORMS = [
  { id: 'P01', name: 'OpenDesk PC', holder: 'OpenDesk Consortium', era: { from: 1, to: null }, audienceLabel: 'Core / Hardcore', group: 'coreHardcore', friendliness: 'High', identity: 'Evergreen open platform', art: 'platform_device_01', open: true },
  { id: 'P02', name: 'PocketBox', holder: 'PocketForge', era: { from: 1, to: 5 }, audienceLabel: 'Kids / Casual', group: 'kidsCasual', friendliness: 'Medium', identity: 'Cheap handheld', art: 'platform_device_02' },
  { id: 'P03', name: 'Nova-8', holder: 'NovaPlay', era: { from: 1, to: 6 }, audienceLabel: 'All-Ages', group: 'allAges', friendliness: 'High', identity: 'Balanced home console', art: 'platform_device_03' },
  { id: 'P04', name: 'TitanHome', holder: 'TitanCore', era: { from: 2, to: 7 }, audienceLabel: 'Core', group: 'core', friendliness: 'Medium', identity: 'Power-focused console', art: 'platform_device_04' },
  { id: 'P05', name: 'PocketBox Color', holder: 'PocketForge', era: { from: 5, to: 10 }, audienceLabel: 'Kids / Casual', group: 'kidsCasual', friendliness: 'High', identity: 'Colour handheld', art: 'platform_device_05' },
  { id: 'P06', name: 'NovaSphere', holder: 'NovaPlay', era: { from: 6, to: 12 }, audienceLabel: 'All-Ages', group: 'allAges', friendliness: 'High', identity: 'Mass-market successor', art: 'platform_device_06' },
  { id: 'P07', name: 'TitanCore X', holder: 'TitanCore', era: { from: 7, to: 13 }, audienceLabel: 'Core / Hardcore', group: 'coreHardcore', friendliness: 'Medium', identity: 'High-spec machine', art: 'platform_device_07' },
  { id: 'P08', name: 'PocketBox Advance', holder: 'PocketForge', era: { from: 10, to: 15 }, audienceLabel: 'All-Ages', group: 'allAges', friendliness: 'High', identity: 'Premium handheld', art: 'platform_device_08' },
  { id: 'P09', name: 'NovaSphere X', holder: 'NovaPlay', era: { from: 12, to: 18 }, audienceLabel: 'All-Ages', group: 'allAges', friendliness: 'High', identity: 'Online-capable home system', art: 'platform_device_09' },
  { id: 'P10', name: 'TitanCore Pro', holder: 'TitanCore', era: { from: 13, to: 19 }, audienceLabel: 'Core', group: 'core', friendliness: 'Medium', identity: 'Technical powerhouse', art: 'platform_device_10' },
  { id: 'P11', name: 'PocketBox Fusion', holder: 'PocketForge', era: { from: 15, to: null }, audienceLabel: 'All-Ages', group: 'allAges', friendliness: 'High', identity: 'Hybrid handheld / home', art: 'platform_device_11' },
  { id: 'P12', name: 'NovaCloud', holder: 'NovaPlay', era: { from: 18, to: null }, audienceLabel: 'Casual / Core', group: 'casualCore', friendliness: 'Very High', identity: 'Late cloud-assisted platform', art: 'platform_device_12' },
];
export const platformById = (id) => PLATFORMS.find((p) => p.id === id) ?? null;

// The five states a platform's install-base curve goes through (bible §17: launch → growth → peak → decline).
export const PLATFORM_STATUS = ['Upcoming', 'Growing', 'Peak', 'Declining', 'Dead'];

// How a game reaches players for now: self-published, digital only (one release model).
export const RELEASE_MODEL = { id: 'selfDigital', name: 'Self-publish · digital' };
