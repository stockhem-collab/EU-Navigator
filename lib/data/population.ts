// Population per municipality (kommunkod → inhabitants), for EU grants per
// inhabitant in the leadership report. Statistics Sweden (SCB), population
// on 31 December, table BE0101N1 (Folkmängd), for every municipality in
// lib/data/kommuner.ts (npm run build:kommuner).
import { KOMMUNER, KOMMUNER_POPULATION_YEAR } from "./kommuner";

export const POPULATION_YEAR = KOMMUNER_POPULATION_YEAR;

export const POPULATION: Record<string, number> = Object.fromEntries(KOMMUNER.map((k) => [k.kommunkod, k.population]));

export function populationOf(kommunkod: string | null | undefined): number | null {
  return (kommunkod && POPULATION[kommunkod]) || null;
}
