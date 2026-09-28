// Normal combos (Milestone 15, bible §15): SYN01–SYN24 as declarative rules. Plain data only; one loop in
// src/systems/combos.js (core SynergyEvaluator) checks them all the same way.
//
// need: { family: [element ids] } — every listed family must hold one of those elements ("/" in the bible = any of;
//   "Custom 2D+" = TEC02 or better, i.e. any Technology but Licensed 2D; "Any" genre = no genre condition).
//   SYN17 asks for User Creation + Mod Support, but a recipe has one Feature slot: read as either of the two.
// reward (bible numbers; what each word means in the game is a placeholder, listed in the build log):
//   output: { key: points }  added to the finished game's outputs (Gameplay, Graphics, Story, Innovation, Polish,
//                            Audience Fit)
//   costPct                  production cost per day (−5 = 5% cheaper, +10 = 10% dearer)
//   hype                     Hype added when the game starts
//   casualPct / corePct      launch sales on casual-audience / core-audience platforms (their audience group)
//   tailPct                  "long-tail", "retention", "replay sales tail": that many % more copies in the long tail
//   trust                    Fan Trust at launch
//   franchisePct             "franchise potential": the franchise's points from this game count that many % more
//   bugPct                   "QA load" / "service QA": this many % more bugs while it is made
//   artAwardScore            hook for the art awards (Milestone 19)
//   hardwareDemandPct        hook for own hardware (Milestone 23)
// cover: the cover family the combo nudges a game towards (the resolver's prestige-override slot, Milestone 6), used
//   unless a real prestige override (a legendary franchise, a secret) takes the slot later.
const any = (...ids) => ids;
const CUSTOM_2D_PLUS = ['TEC02', 'TEC03', 'TEC04', 'TEC05', 'TEC06', 'TEC07', 'TEC08'];

export const COMBOS = [
  { id: 'SYN01', name: 'Pocket Platformer', need: { genre: any('GEN01'), theme: any('THM03'), gameplay: any('PLY01'), technology: any('TEC01'), artDirection: any('ADR01') }, reward: { output: { gameplay: 10, polish: 6 } }, cover: 'cover_01' },
  { id: 'SYN02', name: 'Epic Quest', need: { genre: any('GEN02'), theme: any('THM01'), gameplay: any('PLY01'), technology: CUSTOM_2D_PLUS, artDirection: any('ADR05', 'ADR03') }, reward: { output: { story: 10, audienceFit: 8 } }, cover: 'cover_13' },
  { id: 'SYN03', name: 'Grand Strategy', need: { genre: any('GEN03'), theme: any('THM04'), gameplay: any('PLY03') }, reward: { output: { gameplay: 9, innovation: 5 } }, cover: 'cover_14' },
  { id: 'SYN04', name: 'Tiny Tycoon', need: { genre: any('GEN04'), theme: any('THM03'), gameplay: any('PLY03'), artDirection: any('ADR02') }, reward: { output: { audienceFit: 10 }, costPct: -5 }, cover: 'cover_04' },
  { id: 'SYN05', name: 'Street Speed', need: { genre: any('GEN05'), theme: any('THM03'), gameplay: any('PLY07') }, reward: { output: { gameplay: 10, graphics: 5 } }, cover: 'cover_05' },
  { id: 'SYN06', name: 'Monster Hunt', need: { genre: any('GEN06'), theme: any('THM06'), gameplay: any('PLY02') }, reward: { output: { gameplay: 8 }, hype: 5 }, cover: 'cover_06' },
  { id: 'SYN07', name: 'Space Opera', need: { genre: any('GEN07', 'GEN02'), theme: any('THM05'), gameplay: any('PLY06') }, reward: { output: { story: 12 } }, cover: 'cover_07' },
  { id: 'SYN08', name: 'Brain Box', need: { genre: any('GEN08'), theme: any('THM09'), gameplay: any('PLY05') }, reward: { output: { polish: 8 }, casualPct: 10 }, cover: 'cover_08' },
  { id: 'SYN09', name: 'Farm Forever', need: { genre: any('GEN04'), theme: any('THM08'), gameplay: any('PLY03') }, reward: { output: { audienceFit: 12 }, tailPct: 10 }, cover: 'cover_09' },
  { id: 'SYN10', name: 'Night Signal', need: { genre: any('GEN10'), theme: any('THM02'), gameplay: any('PLY01') }, reward: { output: { story: 7, innovation: 7 } }, cover: 'cover_10' },
  { id: 'SYN11', name: 'Build & Rule', need: { genre: any('GEN03'), theme: any('THM04'), gameplay: any('PLY04') }, reward: { output: { gameplay: 8 }, tailPct: 5 }, cover: 'cover_14' },
  { id: 'SYN12', name: 'Creature Keeper', need: { genre: any('GEN04'), theme: any('THM06'), gameplay: any('PLY05') }, reward: { output: { audienceFit: 10 }, franchisePct: 8 } },
  { id: 'SYN13', name: 'Crime Story', need: { genre: any('GEN07'), theme: any('THM07'), gameplay: any('PLY06') }, reward: { output: { story: 10 }, corePct: 6 }, cover: 'cover_21' },
  { id: 'SYN14', name: 'School Days', need: { genre: any('GEN07'), theme: any('THM09'), gameplay: any('PLY06') }, reward: { output: { story: 8 }, trust: 3 }, cover: 'cover_11' },
  { id: 'SYN15', name: 'Wasteland Builder', need: { genre: any('GEN04'), theme: any('THM10'), gameplay: any('PLY04') }, reward: { output: { innovation: 8, gameplay: 7 } }, cover: 'cover_19' },
  { id: 'SYN16', name: 'Arena Rush', need: { genre: any('GEN06'), theme: any('THM02'), gameplay: any('PLY07') }, reward: { output: { gameplay: 8 }, hype: 8 } },
  { id: 'SYN17', name: 'Creator Kit', need: { genre: any('GEN04', 'GEN03'), feature: any('FEA06', 'FEA05') }, reward: { tailPct: 20, bugPct: 5 }, cover: 'cover_19' },
  { id: 'SYN18', name: 'Infinite Run', need: { genre: any('GEN06', 'GEN01'), feature: any('FEA07') }, reward: { tailPct: 15 } },
  { id: 'SYN19', name: 'World Builder', need: { genre: any('GEN02', 'GEN07'), feature: any('FEA04'), technology: any('TEC06') }, reward: { output: { graphics: 8, innovation: 8 }, costPct: 10 }, cover: 'cover_18' },
  { id: 'SYN20', name: 'Living Systems', need: { genre: any('GEN04'), technology: any('TEC07'), gameplay: any('PLY03') }, reward: { output: { innovation: 10 } }, cover: 'cover_15' },
  { id: 'SYN21', name: 'Online League', need: { genre: any('GEN09', 'GEN05'), feature: any('FEA03'), technology: any('TEC05') }, reward: { hype: 8, bugPct: 8 }, cover: 'cover_20' },
  { id: 'SYN22', name: 'Couch Classic', need: { genre: any('GEN01', 'GEN08'), feature: any('FEA02'), artDirection: any('ADR02') }, reward: { casualPct: 10, trust: 3 } },
  { id: 'SYN23', name: 'Art Game', need: { genre: any('GEN07'), artDirection: any('ADR05', 'ADR07'), gameplay: any('PLY06') }, reward: { artAwardScore: 12 }, cover: 'cover_27' },
  { id: 'SYN24', name: 'Technical Showcase', need: { technology: any('TEC04', 'TEC06'), artDirection: any('ADR04') }, reward: { output: { graphics: 12 }, hardwareDemandPct: 8 }, cover: 'cover_22' },
];
export const comboById = (id) => COMBOS.find((c) => c.id === id) ?? null;

// RP for discovering a combo the first time in a run (placeholder; the bible gives no number). Later uses of a known
// combo still get its reward, but no RP.
export const COMBO_RP = 40;

// Which platform audience groups count as "casual" and "core" (data/platforms.js group; casualCore is both).
export const AUDIENCE_GROUPS = { casual: ['kidsCasual', 'allAges', 'casualCore'], core: ['core', 'coreHardcore', 'casualCore'] };

// The reward in words, for the Discovery Archive and the banners.
const OUT_NAMES = { gameplay: 'Gameplay', graphics: 'Graphics', story: 'Story', innovation: 'Innovation', polish: 'Polish', audienceFit: 'Audience Fit' };
const sign = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);
export function rewardText(r) {
  const out = Object.entries(r.output ?? {}).map(([k, v]) => `${OUT_NAMES[k]} ${sign(v)}`);
  if (r.costPct) out.push(`production cost ${sign(r.costPct)}%`);
  if (r.hype) out.push(`Hype ${sign(r.hype)}`);
  if (r.casualPct) out.push(`casual audience ${sign(r.casualPct)}%`);
  if (r.corePct) out.push(`core audience ${sign(r.corePct)}%`);
  if (r.tailPct) out.push(`long-tail sales ${sign(r.tailPct)}%`);
  if (r.trust) out.push(`Fan Trust ${sign(r.trust)}`);
  if (r.franchisePct) out.push(`franchise potential ${sign(r.franchisePct)}%`);
  if (r.bugPct) out.push(`QA load ${sign(r.bugPct)}%`);
  if (r.artAwardScore) out.push(`art award score ${sign(r.artAwardScore)} (with the awards)`);
  if (r.hardwareDemandPct) out.push(`hardware demand ${sign(r.hardwareDemandPct)}% (with own hardware)`);
  return out.join(', ');
}
