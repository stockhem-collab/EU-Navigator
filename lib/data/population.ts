// Population per municipality (kommunkod → inhabitants), for EU grants per
// inhabitant in the leadership report. Statistics Sweden (SCB), population
// on 31 December 2024, table BE0101N1 (Folkmängd), read from SCB's API
// 2026-10-16 for the municipalities in lib/data/municipalities.ts.
export const POPULATION_YEAR = 2024;

export const POPULATION: Record<string, number> = {
  "0180": 995_574, // Stockholm
  "1480": 608_993, // Göteborg
  "1280": 365_644, // Malmö
  "0380": 248_016, // Uppsala
  "0580": 168_035, // Linköping
  "1880": 160_140, // Örebro
  "1980": 160_634, // Västerås
  "1283": 152_091, // Helsingborg
  "0581": 144_980, // Norrköping
  "0680": 147_654, // Jönköping
  "2480": 134_249, // Umeå
  "0186": 48_377, // Lidingö
  "0162": 32_425, // Danderyd
  "0160": 77_744, // Täby
  "0182": 112_112, // Nacka
  "0184": 85_789, // Solna
  "0163": 77_624, // Sollentuna
  "0117": 49_787, // Österåker
  "0181": 102_911, // Södertälje
  "0123": 88_950, // Järfälla
  "0127": 95_905, // Botkyrka
};

export function populationOf(kommunkod: string | null | undefined): number | null {
  return (kommunkod && POPULATION[kommunkod]) || null;
}
