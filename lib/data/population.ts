// Population per municipality (kommunkod → inhabitants), for EU grants per
// inhabitant in the leadership report. Statistics Sweden (SCB), population
// on 31 December 2023, table BE0101N1 — entered by hand for the
// municipalities in lib/data/municipalities.ts; check against SCB and
// update when a newer year is wanted.
export const POPULATION_YEAR = 2023;

export const POPULATION: Record<string, number> = {
  "0180": 984_748, // Stockholm
  "1480": 604_616, // Göteborg
  "1280": 362_133, // Malmö
  "0380": 242_140, // Uppsala
  "0580": 166_673, // Linköping
  "1880": 158_683, // Örebro
  "1980": 158_653, // Västerås
  "1283": 151_742, // Helsingborg
  "0581": 145_627, // Norrköping
  "0680": 144_819, // Jönköping
  "2480": 133_040, // Umeå
};

export function populationOf(kommunkod: string | null | undefined): number | null {
  return (kommunkod && POPULATION[kommunkod]) || null;
}
