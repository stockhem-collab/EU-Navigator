import { test as setup, expect } from "@playwright/test";
import { AUTH_STATE } from "../../playwright.config";

// Outside production the demo password falls back to "demo" (see
// lib/auth/session.ts), which is what the test server runs with.
setup("log in", async ({ request }) => {
  const response = await request.post("/api/login", { data: { email: "test@exempelstad.se", password: "demo" } });
  expect(response.ok()).toBe(true);
  await request.storageState({ path: AUTH_STATE });
});
