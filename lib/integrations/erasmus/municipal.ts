// Which Swedish organisations in the Erasmus+ data are a municipality.
// The Erasmus+ project lists give names and addresses but no
// organisationsnummer, and most municipal participants are schools
// ("Lundellska skolan"), not "Uppsala kommun". Two rules give the
// municipality's organisationsnummer:
//
//  1. The name says so: "Uppsala kommun Fritid", "Malmö stad,
//     Grundskoleförvaltningen", "City of Gothenburg", "Municipality of
//     Robertsfors".
//  2. Skolverket's school-unit register: the name is one of the
//     municipality's own school units (or the start of one, "Dragonskolan"
//     for "Dragonskolan GY1"), and the address town is that municipality, or
//     no other municipality has a unit by that name and no independent
//     school does either.
//
// Regions, kommunalförbund, municipal companies (AB), foundations and
// associations never match, the same as in the rest of the history.

/** What scripts/import/erasmus.ts --fetch saves from Skolverket's register. */
export interface SkolverketRegister {
  fetchedAt: string;
  /** Every school unit: code and name (active, dormant and closed). */
  units: { code: string; name: string }[];
  /** Municipal organisers with the codes of their school units. */
  municipalities: { orgNumber: string; municipalityCode: string; name: string; unitCodes: string[] }[];
}

export interface MunicipalMatch {
  orgNumber: string;
  municipalityCode: string;
  municipality: string;
  /** How it was found, shown with the match in the history. */
  how: string;
}

/** Lower case, punctuation to single spaces; å, ä, ö kept so that Habo and
 * Håbo stay apart. */
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Like norm, but every accent dropped: the EU data often writes "UMEA
 * KOMMUN" and "PITEA KOMMUN". */
function ascii(text: string): string {
  return norm(text).normalize("NFD").replace(/\p{M}/gu, "");
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[ ]?");
}

/** Never a municipality, whatever place name it carries. */
const NOT_MUNICIPAL =
  /\bregion|landsting|lansstyrelse|\bab\b|aktiebolag|forening|forbund|universitet|university|hogskola|stiftelse|forsamling|ekonomisk|\bhb\b|\bkb\b|kyrka|folkuniversitet|\babf\b|ideell/;

/** Organisation types a municipal school or office is listed under. */
const SCHOOL_OR_PUBLIC = /school|local public|public service|^other$|^$/i;

/** English names the EU data uses for some municipalities. */
const ENGLISH: Record<string, string[]> = { Göteborg: ["Gothenburg"] };

interface Municipality {
  orgNumber: string;
  code: string;
  name: string;
  /** "Uppsala kommun", "Malmö stad", "City of Gothenburg" … */
  byName: RegExp;
  /** The same on accent-free text, only when no other municipality has
   * the same accent-free name (Habo, Håbo). */
  byAsciiName: RegExp | null;
  /** The bare name, for the address town. */
  town: RegExp;
  asciiTown: RegExp | null;
}

// Word edges that also hold next to å, ä and ö (\\b does not).
const B = "(?<![\\p{L}\\p{N}])";
const E = "(?![\\p{L}\\p{N}])";

function namePattern(names: string[]): RegExp {
  const alt = names.map(escape).join("|");
  return new RegExp(
    `${B}(${alt})s? (kommun|stad|kommunes)${E}|${B}(municipality|city|kommun) (of )?(${alt})${E}|${B}(${alt}) (municipality|city council|city)${E}`,
    "u",
  );
}

export class MunicipalRegister {
  private readonly municipalities: Municipality[];
  /** Municipal school units: name (norm) → municipality codes. */
  private readonly municipalUnits: { name: string; asciiName: string; codes: Set<string> }[] = [];
  /** Names (ascii) of every school unit that is not municipal. */
  private readonly otherUnits = new Set<string>();
  private readonly cache = new Map<string, Set<string>>();

  constructor(register: SkolverketRegister) {
    const asciiCount = new Map<string, number>();
    for (const m of register.municipalities) asciiCount.set(ascii(m.name), (asciiCount.get(ascii(m.name)) ?? 0) + 1);
    this.municipalities = register.municipalities
      .map((m) => {
        const names = [m.name, ...(ENGLISH[m.name] ?? [])];
        const unique = asciiCount.get(ascii(m.name)) === 1;
        return {
          orgNumber: m.orgNumber,
          code: m.municipalityCode,
          name: m.name,
          byName: namePattern(names.map(norm)),
          byAsciiName: unique ? namePattern(names.map(ascii)) : null,
          town: new RegExp(`${B}${escape(norm(m.name))}${E}`, "u"),
          asciiTown: unique ? new RegExp(`${B}${escape(ascii(m.name))}${E}`, "u") : null,
        };
      })
      // Longest name first, so the most specific name wins.
      .sort((a, b) => b.name.length - a.name.length);

    const owner = new Map<string, string>();
    for (const m of register.municipalities) for (const u of m.unitCodes) owner.set(u, m.municipalityCode);
    const byName = new Map<string, { asciiName: string; codes: Set<string> }>();
    for (const unit of register.units) {
      const code = owner.get(unit.code);
      if (!code) {
        this.otherUnits.add(ascii(unit.name));
        continue;
      }
      const key = norm(unit.name);
      const entry = byName.get(key) ?? { asciiName: ascii(unit.name), codes: new Set<string>() };
      entry.codes.add(code);
      byName.set(key, entry);
    }
    for (const [name, entry] of byName) this.municipalUnits.push({ name, ...entry });
  }

  private byCode(code: string): Municipality {
    return this.municipalities.find((m) => m.code === code)!;
  }

  /** The municipality named in the last part of an address ("…, 753 12,
   * Uppsala"). */
  private addressTown(address: string): Municipality | null {
    const parts = address.split(",").filter((p) => p.trim());
    if (parts.length === 0) return null;
    const last = parts[parts.length - 1];
    const n = norm(last);
    const a = ascii(last);
    return (
      this.municipalities.find((m) => m.town.test(n)) ??
      this.municipalities.find((m) => m.asciiTown?.test(a)) ??
      null
    );
  }

  /** Municipalities with a school unit called `name` or "`name` …". */
  private unitMunicipalities(name: string): Set<string> {
    const cached = this.cache.get(name);
    if (cached) return cached;
    const a = ascii(name);
    const codes = new Set<string>();
    for (const u of this.municipalUnits) {
      if (u.name === name || u.name.startsWith(`${name} `) || u.asciiName === a || u.asciiName.startsWith(`${a} `)) {
        u.codes.forEach((c) => codes.add(c));
      }
    }
    this.cache.set(name, codes);
    return codes;
  }

  match(org: { name: string; type: string; address: string }): MunicipalMatch | null {
    const n = norm(org.name);
    const a = ascii(org.name);
    if (NOT_MUNICIPAL.test(a)) return null;

    const named =
      this.municipalities.find((m) => m.byName.test(n)) ??
      this.municipalities.find((m) => m.byAsciiName?.test(a));
    if (named) return this.result(named, `namnet "${org.name}"`);

    if (!SCHOOL_OR_PUBLIC.test(org.type.trim())) return null;
    const town = this.addressTown(org.address);
    // "Katedralskolan Uppsala", "Vargbroskolan i Storfors": drop the town.
    const base = town ? n.replace(new RegExp(`( i)? ${escape(norm(town.name))}s?$`, "u"), "").trim() || n : n;
    if (base.length < 6) return null;
    const codes = this.unitMunicipalities(base);
    if (codes.size === 0) return null;
    if (town) {
      return codes.has(town.code) ? this.result(town, `Skolverket: kommunal skolenhet "${org.name}" i ${town.name}`) : null;
    }
    if (codes.size === 1 && !this.otherUnits.has(ascii(base))) {
      const only = this.byCode([...codes][0]);
      return this.result(only, `Skolverket: kommunal skolenhet "${org.name}"`);
    }
    return null;
  }

  private result(m: Municipality, how: string): MunicipalMatch {
    return { orgNumber: m.orgNumber, municipalityCode: m.code, municipality: m.name, how };
  }
}
