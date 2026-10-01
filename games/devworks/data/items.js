// Items for staff (Milestone 40e, series common feature §4; core/ItemSystem). Given to one person, an item permanently
// raises one of the five work stats training raises, then is used up. Ids, names, groups and stats exactly as
// docs/DEVWORKS_ITEM_ART_LIST.md (Aaron draws from it). Until a picture exists the game draws a placeholder (the group's
// colour and the rarity frame); drop items/dev_item_NN.png in and it shows. All numbers are placeholders (M40e Log).
// Items never come from a shop, Studio Tokens or real money: only the sources below.
export const ITEM_GROUPS = [
  { id: 'gear', name: 'Gear', color: '#3A7CA5', line: 'Keyboards, tablets, headsets' },
  { id: 'books', name: 'Books & courses', color: '#7650C4', line: 'Handbooks, guides, courses' },
  { id: 'snacks', name: 'Snacks & coffee', color: '#C8702F', line: 'Coffee, snacks, pizza, tea' },
  { id: 'toys', name: 'Desk toys & plushies', color: '#2E8B57', line: 'Ducks, fidgets, plushies, plants' },
  { id: 'inspiration', name: 'Inspiration', color: '#C8402F', line: 'Art books, records, posters' },
  { id: 'trophies', name: 'Trophies & keepsakes', color: '#B87A00', line: 'Letters, trophies, photos, mascots' },
];
export const itemGroupById = (id) => ITEM_GROUPS.find((g) => g.id === id) ?? null;

const it = (n, name, group, stat) => ({ id: `dev_item_${String(n).padStart(2, '0')}`, name, group, stat });
export const ITEM_TYPES = [
  it(1, 'Mechanical Keyboard', 'gear', 'code'),
  it(2, 'Drawing Tablet + Pen', 'gear', 'art'),
  it(3, 'Studio Headset', 'gear', 'des'),
  it(4, 'Wide Monitor', 'gear', 'prod'),
  it(5, 'Coding Handbook', 'books', 'code'),
  it(6, 'Game Design Book', 'books', 'des'),
  it(7, 'Screenwriting Guide', 'books', 'wrt'),
  it(8, 'Project Planner Course', 'books', 'prod'),
  it(9, 'Bag of Fancy Coffee Beans', 'snacks', 'code'),
  it(10, 'Box of Energy Snacks', 'snacks', 'prod'),
  it(11, 'Team Pizza Box', 'snacks', 'des'),
  it(12, 'Teapot + Herbal Tea', 'snacks', 'wrt'),
  it(13, 'Rubber Duck', 'toys', 'code'),
  it(14, 'Fidget Cube', 'toys', 'des'),
  it(15, 'Pixel-Ghost Plushie', 'toys', 'art'),
  it(16, 'Little Desk Plant', 'toys', 'wrt'),
  it(17, 'Art Book', 'inspiration', 'art'),
  it(18, 'Vinyl Record', 'inspiration', 'wrt'),
  it(19, 'Retro Game Cartridge', 'inspiration', 'des'),
  it(20, 'Rolled Concept Poster', 'inspiration', 'art'),
  it(21, 'Fan Letter', 'trophies', 'wrt'),
  it(22, 'Golden Bug Trophy', 'trophies', 'code'),
  it(23, 'Framed Launch-Party Photo', 'trophies', 'prod'),
  it(24, 'Lucky Mascot Figurine', 'trophies', 'art'),
];
export const itemTypeById = (id) => ITEM_TYPES.find((t) => t.id === id) ?? null;

// Rarity: the same picture in a different code-drawn frame. gain = stat points (before likes); sell = Credits back.
export const ITEM_RARITIES = {
  common: { name: 'Common', gain: 3, sell: 150, weight: 60, color: '#8A8F98' },
  rare: { name: 'Rare', gain: 6, sell: 400, weight: 28, color: '#2F7FD0' },
  elite: { name: 'Elite', gain: 10, sell: 900, weight: 10, color: '#7650C4' },
  legendary: { name: 'Legendary', gain: 16, sell: 2000, weight: 2, color: '#D99A00' },
};

export const ITEM_RULES = {
  inventoryMax: 20, // the Studio Store holds this many; a new one past it is not kept (a note says so)
  periodCap: 20, // item points one person can take in a year
  loveMult: 1.5,
  dislikeMult: 0.5,
  loveMorale: 3, // Morale for a loved item
  likes: { loves: [1, 2], dislikeChance: 0.5 }, // for anyone without fixed likes (data/staff.js STAFF_LIKES)
  storeIcon: 'dev_ui_41', // the Studio Store's picture (code-drawn until the file exists)
};

// Where items come from (chance per occasion; rarity weights for that source — better sources, better items).
export const ITEM_SOURCES = {
  release: { minReview: 75, chance: 0.5, weights: { common: 40, rare: 40, elite: 16, legendary: 4 }, text: 'A gift after a well-reviewed launch' },
  request: { chestChance: 0.2, weights: { common: 30, rare: 45, elite: 20, legendary: 5 }, text: 'In a request’s treasure chest' }, // M40c chests
  training: { chance: 0.25, weights: { common: 70, rare: 25, elite: 5, legendary: 0 }, text: 'A great training session' },
  sponsor: { met: 1, tierUpChance: 0.3, weights: { common: 30, rare: 45, elite: 20, legendary: 5 }, text: 'From a sponsor' },
  fans: { minReview: 80, chance: 0.3, trustBonus: 0.004, weights: { common: 50, rare: 35, elite: 12, legendary: 3 }, text: 'Fan mail after a hit' }, // + trustBonus × Fan Trust above 50
  award: { chance: 0.4, weights: { common: 0, rare: 40, elite: 45, legendary: 15 }, text: 'A prize with an award' },
  achievement: { chance: 0.3, weights: { common: 50, rare: 35, elite: 12, legendary: 3 }, text: 'For an achievement' },
  wellWisher: { monthlyChance: 0.15, weights: { common: 75, rare: 22, elite: 3, legendary: 0 }, text: 'A well-wisher sent a gift' }, // about 2 a year
};
