// Stations that open later (Milestone 9): a station with `unlock: { rank }` in data/studio.js is placed in the studio
// by itself once the studio has reached that rank (the Marketing Wall, F13, at Rank D). Facilities proper, bought and
// placed in Build Mode, come with Milestone 11.
import { STATIONS } from '../../data/studio.js';
import { FAME } from '../../data/balance.js';
import { rankIndexOf } from '../../../../core/CompanyRank.js';

// The stations due at this rank that are not in the studio yet.
export const stationsDue = (world, rankIndex) => STATIONS.filter((d) => d.unlock?.rank && rankIndex >= rankIndexOf(FAME.ranks, d.unlock.rank) && !world.stationById(d.id));

// Place every station now due. Returns the ones placed.
export function openStations(world, rankIndex) {
  return stationsDue(world, rankIndex).map((d) => world.addStation(d.id)).filter(Boolean);
}
