// Sponsors (Milestone 18, bible §24). Plain data only; the rules are src/systems/sponsors.js. The bible gives the eight
// sponsors, their perks and exact obligations, the slots by rank, 6-month deals and the relationship tiers; the
// stipend, bonus and tier numbers are placeholders (plan review B), listed in the build log.
//
// perk (while the deal runs; summed over active sponsors, read through the studio's effect query):
//   stipendPct            the monthly stipend this % higher
//   moraleMonthly         every member of staff +this Morale at each month end
//   engineResearchPct     engine projects this % faster;  researchPct  research this % faster
//   onlineQaPct           bug fixing this % faster on games with Co-op or Competitive Online
//   trainingDaysPct       training courses this % shorter (−6 = 6% shorter)
//   audioCostPct.premium  the Premium audio package this % cheaper;  output.audio  Audio + this on finished games
//   hardwareCostPct       own-hardware prototype cost (Milestone 23)
//   marketingCostPct      marketing actions this % cheaper;  advancePct  publisher advances this % bigger
//   toolsResearchPct      tools / automation research (a later milestone)
// obligation (exact, with a deterministic counter):
//   { kind: 'count', signal, min }        min matching events during the deal (conventions, releases…)
//   { kind: 'months', test, min, of }     at least min of the deal's `of` month ends pass `test`
//   later: the system it needs doesn't exist yet — never offered until it does
export const SPONSORS = [
  { id: 'SPN01', name: 'Volt Cola', theme: 'Cash / Morale', perkText: 'Monthly stipend +8%; break-room morale +3', perk: { stipendPct: 8, moraleMonthly: 3 }, obligation: { kind: 'count', signal: 'convention', min: 2 }, obligationText: 'Attend 2 conventions during the 6-month deal', counterText: 'Conventions attended', logo: 'sponsor_logo_spn01' },
  { id: 'SPN02', name: 'HexaCore', theme: 'PC Hardware', perkText: 'Engine compile / research +8%', perk: { engineResearchPct: 8, researchPct: 8 }, obligation: { kind: 'count', signal: 'releasePC', min: 1 }, obligationText: 'Ship 1 OpenDesk PC title during the deal', counterText: 'OpenDesk PC releases', logo: 'sponsor_logo_spn02' },
  { id: 'SPN03', name: 'NovaNet', theme: 'Online', perkText: 'Online feature QA +10%', perk: { onlineQaPct: 10 }, obligation: { kind: 'count', signal: 'releaseOnline', min: 1 }, obligationText: 'Ship 1 game with Competitive Online or Co-op during the deal', counterText: 'Online / Co-op releases', logo: 'sponsor_logo_spn03' },
  { id: 'SPN04', name: 'PixelDesk', theme: 'Office Tech', perkText: 'Training time −6%', perk: { trainingDaysPct: -6 }, obligation: { kind: 'months', test: 'morale60', min: 4, of: 6 }, obligationText: 'Keep the monthly average staff morale at 60 or more in 4 of the 6 months', counterText: 'Months with morale ≥ 60', logo: 'sponsor_logo_spn04' },
  { id: 'SPN05', name: 'EchoSound', theme: 'Audio', perkText: 'Premium audio package cost −12%; Audio +3', perk: { 'audioCostPct.premium': -12, 'output.audio': 3 }, obligation: { kind: 'count', signal: 'releasePremiumAudio', min: 1 }, obligationText: 'Use the Premium audio package in 1 release during the deal', counterText: 'Premium-audio releases', logo: 'sponsor_logo_spn05' },
  { id: 'SPN06', name: 'IronPeak Hardware', theme: 'Console Components', perkText: 'Hardware prototype cost −8%', perk: { hardwareCostPct: -8 }, obligation: { kind: 'count', signal: 'ironPeakPart', min: 1 }, obligationText: 'Use one IronPeak-tagged component in the next hardware project started during the deal', counterText: 'IronPeak parts used', needs: 'hardwareLab', logo: 'sponsor_logo_spn06' },
  { id: 'SPN07', name: 'Crown Finance', theme: 'Commercial', perkText: 'Publishing / marketing cashflow +10%', perk: { marketingCostPct: -10, advancePct: 10 }, obligation: { kind: 'months', test: 'positiveCash', min: 4, of: 6 }, obligationText: 'Positive net monthly cashflow in 4 of the 6 deal months', counterText: 'Months in profit', logo: 'sponsor_logo_spn07' },
  { id: 'SPN08', name: 'BOTWORKS Systems', theme: 'AI / Robotics', perkText: 'Tools / automation research +10%; crossover event', perk: { toolsResearchPct: 10 }, obligation: { kind: 'count', signal: 'botworksDemo', min: 1 }, obligationText: 'Complete the BOTWORKS technology demo contract while the deal is active', counterText: 'BOTWORKS demos', needs: 'botworksEvents', logo: 'sponsor_logo_spn08' },
];
export const sponsorById = (id) => SPONSORS.find((s) => s.id === id) ?? null;

// Relationship tiers (bible §24). A met deal moves one tier up; a failed one keeps the tier.
export const SPONSOR_TIERS = [
  { id: 'partner', name: 'Partner' },
  { id: 'preferred', name: 'Preferred' },
  { id: 'major', name: 'Major' },
  { id: 'strategic', name: 'Strategic' },
];

export const SPONSOR_BALANCE = {
  dealMonths: 6, // bible §24
  slots: { E: 1, D: 1, C: 2, B: 2, A: 3, S: 3 }, // bible §24
  // Stipend: paid at every month end of the deal: (base + perRank × rank index) × (1 + tierPct × tier) × (1 + stipendPct).
  stipend: { base: 400, perRank: 200, tierPct: 15 },
  // Completion bonus when the obligation is met: bonusMonths × that stipend. A failed deal loses it.
  bonusMonths: 2,
  // Offers: every sponsor not in a deal, not cooling down and not waiting for a later system; a met deal offers
  // renewal straight away (also counts from a higher tier); a failed one waits cooldownMonths before offering again.
  offerMonths: 2, // an offer stays this many months
  cooldownMonths: 6,
  morale: 60, // SPN04's line
};
