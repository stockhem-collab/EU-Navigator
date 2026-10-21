import fs from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@playwright/test";
import { AUTH_STATE } from "../../playwright.config";

// Outside production the demo password falls back to "demo" (see
// lib/auth/session.ts), which is what the test server runs with.
//
// The saved session also turns off opening the Ansökningsstudio on its Krav
// tab for a new application (useRequirementsIntro), so tests that aren't
// about the requirements land in Ansökan as before; requirements.spec.ts
// clears it.
setup("log in", async ({ request }) => {
  const response = await request.post("/api/login", { data: { email: "test@exempelstad.se", password: "demo" } });
  expect(response.ok()).toBe(true);
  const state = await request.storageState();
  state.origins = [
    ...state.origins.filter((o) => o.origin !== "http://localhost:3100"),
    { origin: "http://localhost:3100", localStorage: [{ name: "eu-navigator-requirements-first", value: "off" }] },
  ];
  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });
  fs.writeFileSync(AUTH_STATE, JSON.stringify(state, null, 2));
});
