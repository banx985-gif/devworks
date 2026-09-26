// Platforms (bible §17). Milestone 4 opens OpenDesk PC (P01) only; the other eleven arrive with the platform market.
// Plain data only; audience numbers live in balance.js (SALES_BALANCE.platforms).
export const PLATFORMS = [
  { id: 'P01', name: 'OpenDesk PC', holder: 'OpenDesk Consortium', audienceLabel: 'Core / Hardcore', identity: 'Evergreen open platform', art: 'platform_device_01' },
];
export const platformById = (id) => PLATFORMS.find((p) => p.id === id) ?? null;

// How a game reaches players for now: self-published, digital only (one release model).
export const RELEASE_MODEL = { id: 'selfDigital', name: 'Self-publish · digital' };
