import { test, expect } from "@playwright/test";
import { suggestTags } from "../../lib/matching/tagSuggestions";
import { ALL_TAGS, tagGroup, tagIdFor, tagWeight } from "../../lib/data/tags";
import callList from "../../lib/data/callList.json";

// Tag suggestions run on Swedish text, where the subject is often inside a
// compound ("klimatanpassning", "matavfallet") — the cases the exact-word
// lookup used to miss — and must not fire on unrelated senses of a word.
test.describe("tag suggestions", () => {
  test("catch Swedish compounds and inflections", () => {
    expect(suggestTags("Klimatanpassning mot skyfall och värmebölja")).toContain("klimatanpassning");
    expect(suggestTags("Cirkulärt byggande med återbruk av byggmaterial")).toContain("cirkular-ekonomi");
    expect(suggestTags("Bättre sortering av matavfallet")).toContain("cirkular-ekonomi");
    expect(suggestTags("Vägar till jobb för unga och nyanlända")).toEqual(
      expect.arrayContaining(["arbetsmarknad", "unga", "migration-integration"])
    );
    expect(suggestTags("Fossilfria arbetsmaskiner och transporter")).toEqual(
      expect.arrayContaining(["klimatatgarder", "hallbara-transporter"])
    );
  });

  test("match phrases as consecutive words, and skip ambiguous single words", () => {
    // "integration" here is about energy systems, not migrants.
    expect(suggestTags("Mikronät för bättre integration i stadens energisystem")).not.toContain("migration-integration");
    expect(suggestTags("Mikronät för bättre integration i stadens energisystem")).toContain("energinat");
    // "biologisk" and "mångfald" apart are not the phrase.
    expect(suggestTags("Mångfald i rekryteringen, biologisk forskning")).not.toContain("natur-biologisk-mangfald");
    expect(suggestTags("Konstruktion av en ny bro")).not.toContain("kultur-kreativitet");
  });

  test("every tag is suggested from its own Swedish label and has a picker group", () => {
    for (const tag of ALL_TAGS) {
      expect(suggestTags(tag.label_sv), tag.id).toContain(tag.id);
      expect(tagGroup(tag), tag.id).not.toBe("custom");
    }
  });
});

test.describe("tag vocabulary", () => {
  test("ways of working and very broad tags weigh less than subject tags", () => {
    expect(tagWeight("klimatanpassning")).toBe(7);
    expect(tagWeight("konsortiesamarbete")).toBe(3);
    expect(tagWeight("hallbarhet")).toBe(3);
    expect(tagWeight("egen-tagg")).toBe(7);
  });

  test("CSV values resolve by Swedish or English label or id", () => {
    expect(tagIdFor("Klimatanpassning")).toBe("klimatanpassning");
    expect(tagIdFor(" climate adaptation ")).toBe("klimatanpassning");
    expect(tagIdFor("vatten-avlopp")).toBe("vatten-avlopp");
    expect(tagIdFor("Okänd")).toBeUndefined();
  });

  test("every real call in utlysningar.csv carries tags", () => {
    for (const call of callList) expect(call.tags.length, call.id).toBeGreaterThan(0);
  });
});
