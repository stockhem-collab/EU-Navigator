import { CurrencyCode, Money } from "./types";

/** Yearly average EUR/SEK, keyed by year (data/vaxelkurs.csv). */
export type EurSekRates = Record<number, number>;

/** Parses data/vaxelkurs.csv ("År,EUR/SEK,Källa,Anteckning"). */
export function parseEurSekRates(csvText: string): EurSekRates {
  const rates: EurSekRates = {};
  for (const line of csvText.replace(/^﻿/, "").split(/\r?\n/).slice(1)) {
    const [year, rate] = line.split(",");
    if (/^\d{4}$/.test(year?.trim() ?? "") && rate && Number.isFinite(Number(rate))) {
      rates[Number(year)] = Number(rate);
    }
  }
  return rates;
}

/** The rate for a year, falling back to the nearest year in the table. */
export function eurSekRate(rates: EurSekRates, year: number): number {
  const years = Object.keys(rates).map(Number);
  if (years.length === 0) throw new Error("No EUR/SEK rates loaded");
  if (rates[year] !== undefined) return rates[year];
  const nearest = years.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a));
  return rates[nearest];
}

/** Converts an amount between EUR and SEK at the yearly average rate of
 * `year` (usually the project's start year). Rounded to whole units. */
export function convert(money: Money, to: CurrencyCode, year: number, rates: EurSekRates): Money {
  if (money.currency === to) return money;
  const rate = eurSekRate(rates, year);
  const amount = money.currency === "EUR" ? money.amount * rate : money.amount / rate;
  return { amount: Math.round(amount), currency: to };
}

export function money(amount: number | null, currency: CurrencyCode): Money | null {
  return amount === null ? null : { amount, currency };
}
