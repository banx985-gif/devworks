// Awards (Milestone 19, bible §28): C01–C10 visible, C11 / C12 secret (defined, locked and hidden: Milestone 30).
// Plain data only; the rules are src/systems/awards.js. Placeholders (plan review B): the month each is held, the Fame,
// the extras, the "successful release" line; listed in the build log. Plan review: C05's "Technology score" = the
// average of Graphics and Polish.
//
//   month     held at the end of this month every year (C10: only in Year 20)
//   unlock    { rank } | { rank, trophies } | { engineOrGraphics: 70 } | { rank, year: 20 }
//   entry     which of the season's releases may enter: { scopes } | { review } | { output: [keys], min } |
//             { successful: n } (n releases reviewed 70+ in the season) | { platformFamily: n } | { review, record }
//   score     how an entry is judged: 'review' | 'gameplay' | 'tech' (max of Graphics and the Technology score) |
//             'storyOrGraphics' | 'top2' (average of the two best reviews) | 'family3' (average of the 3 best on one
//             platform family)
//   fame      Fame for a win (the award's weight in Rankings is fame ÷ 100);  major: counts as a major award (C04+)
//   trophy    the trophy picture (art list: no labels, mapped by closest meaning)
//   extra     'agencyRefresh' | 'rp' (+ amount) | 'eliteArrival' | 'moreOffers' | 'ending' — the "main reward" beyond Fame
export const AWARDS = [
  { id: 'C01', name: 'Local Indie Showcase', month: 2, unlock: { rank: 'E' }, entry: { scopes: ['tiny', 'small'] }, score: 'review', fame: 40, trophy: 'award_trophy_01', rewardText: 'First trophy; the road to Rank D' },
  { id: 'C02', name: 'Rising Studio Awards', month: 3, unlock: { rank: 'D' }, entry: { review: 65 }, score: 'review', fame: 65, trophy: 'award_trophy_01', extra: 'agencyRefresh', rewardText: 'A free Agency Search on the recruitment board' },
  { id: 'C03', name: 'Design Guild Prize', month: 4, unlock: { rank: 'D' }, entry: { output: ['gameplay'], min: 70 }, score: 'gameplay', fame: 65, trophy: 'award_trophy_02', extra: 'rp', rp: 120, rewardText: 'Design research bonus: +120 RP' },
  { id: 'C04', name: 'National Game Awards', month: 5, unlock: { rank: 'C' }, entry: { successful: 2 }, score: 'top2', fame: 175, major: true, trophy: 'award_trophy_02', rewardText: 'A big step towards Rank B' },
  { id: 'C05', name: 'Technical Achievement Expo', month: 6, unlock: { engineOrGraphics: 70 }, entry: { output: ['graphics', 'tech'], min: 80 }, score: 'tech', fame: 115, major: true, trophy: 'award_trophy_03', extra: 'rp', rp: 200, rewardText: 'Engine tech: +200 RP' },
  { id: 'C06', name: 'Narrative & Arts Awards', month: 8, unlock: { rank: 'B' }, entry: { output: ['story', 'graphics'], min: 82 }, score: 'storyOrGraphics', fame: 175, major: true, trophy: 'award_trophy_04', extra: 'eliteArrival', rewardText: 'Elite staff take an interest (an Elite on the recruitment board)' },
  { id: 'C07', name: 'International Dev Festival', month: 9, unlock: { rank: 'B', trophies: 3 }, entry: { review: 85 }, score: 'review', fame: 225, major: true, trophy: 'award_trophy_05', extra: 'moreOffers', rewardText: 'Global publishers: an extra publisher offer' },
  { id: 'C08', name: 'Platform Excellence Awards', month: 10, unlock: { rank: 'A' }, entry: { platformFamily: 3 }, score: 'family3', fame: 225, major: true, trophy: 'award_trophy_06', rewardText: 'Platform deal (with the platform deals milestone)' },
  { id: 'C09', name: 'Global Interactive Awards', month: 11, unlock: { rank: 'A', trophies: 5 }, entry: { review: 88 }, score: 'review', fame: 375, major: true, trophy: 'award_trophy_06', rewardText: 'The road to Rank S' },
  { id: 'C10', name: 'Game of the Year / Studio of the Year', month: 12, unlock: { rank: 'S', year: 20 }, entry: { review: 90, record: true }, score: 'review', fame: 750, major: true, finale: true, trophy: 'award_trophy_07', extra: 'ending', rewardText: 'The Year-20 ending' },
  // Secret prestige awards (Milestone 30): held every year at the end of Month 12 (after C10) once their SEC-COMP secret
  // has opened them; never shown before that ("???").
  //   C11 entry: a prestige-eligible game — review 90+, released this season, a Legendary or Prestige person credited.
  //   C12 entry: a PROJECT ONE-eligible game (Milestone 31 defines it); until then review 95+ with zero launch bugs.
  { id: 'C11', name: 'Legends Summit', secret: 'SEC-COMP-01', month: 12, unlock: { secret: true }, entry: { review: 90, prestige: true }, score: 'review', fame: 500, major: true, trophy: 'award_trophy_08', hidden: true, event: 'dev_event_15', tokens: 2, rewardText: '2 Prestige Tokens (once per year won)' },
  { id: 'C12', name: 'Perfect Game Circle', secret: 'SEC-COMP-02', month: 12, unlock: { secret: true }, entry: { review: 95, bugsZero: true }, score: 'review', fame: 625, major: true, trophy: 'award_trophy_08', hidden: true, event: 'dev_event_16', rewardText: 'The software endgame (PROJECT ONE, Milestone 31)' },
];
export const awardById = (id) => AWARDS.find((a) => a.id === id) ?? null;
export const VISIBLE_AWARDS = AWARDS.filter((a) => !a.hidden);
export const SECRET_AWARDS = AWARDS.filter((a) => a.hidden); // Milestone 30: C11, C12

export const AWARD_BALANCE = {
  seasonMonths: 12, // releases in the 12 months up to the ceremony compete
  successfulReview: 70, // a "successful release"
  jitter: 3, // every entry's score ± this, seeded by the run, the award and the year (locked once announced)
  rankingPoints: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], // core Rankings, × the award's weight (fame ÷ 100)
  fieldSize: 8, // entries per ceremony (the best)
};
