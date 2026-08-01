import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./fixtures/mockApiRoutes";
import type { ConverseResponseBody } from "@/types";

const STORAGE_KEY = "mila:appStorage:v1";

function seededStorage(exchangeTarget: number) {
  return {
    version: 1,
    child: { name: "Asha", createdAt: new Date().toISOString() },
    sessions: { count: 0, lastSessionAt: null, streakCount: 0, streakLastDate: null },
    phraseHistory: {},
    settings: { voiceEnabled: true, exchangeTarget, captionsEnabled: false, sfxMuted: true },
  };
}

test("celebration screen persists session count and streak", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(seededStorage(1))],
  );

  await mockApiRoutes(page, {
    reply: (turnIndex): ConverseResponseBody =>
      turnIndex === 0
        ? {
            speech: "నమస్కారం!",
            childSpokeTelugu: false,
            exchangeComplete: false,
            celebrationLevel: "none",
            sessionComplete: false,
            remember: null,
          }
        : {
            speech: "శభాష్! బై బై!",
            childSpokeTelugu: true,
            exchangeComplete: true,
            celebrationLevel: "big",
            sessionComplete: true,
            remember: null,
          },
  });

  await page.goto("/");
  await page.getByTestId("play-button").click();

  await expect(page.locator('[data-state="talking"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-state="listening"]')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("mic-button").click();

  await expect(page.getByTestId("home-button")).toBeVisible({ timeout: 10_000 });

  const stored = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);

  expect(stored.sessions.count).toBe(1);
  expect(stored.sessions.streakCount).toBe(1);
});

test("ending a session early always reaches the celebration screen", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(seededStorage(4))],
  );

  await mockApiRoutes(page, {
    reply: (): ConverseResponseBody => ({
      speech: "నమస్కారం!",
      childSpokeTelugu: false,
      exchangeComplete: false,
      celebrationLevel: "none",
      sessionComplete: false,
      remember: null,
    }),
  });

  await page.goto("/");
  await page.getByTestId("play-button").click();

  await expect(page.locator('[data-state="talking"]')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("end-session-button").click();

  await expect(page.getByTestId("home-button")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-state="celebrating"]')).toBeVisible();
});

test("ending a session early while Mila is listening also reaches celebration", async ({ page }) => {
  // Leaving LISTENING stops the mic, which fires CHILD_RECORDING_COMPLETE
  // just after the phase already moved to CELEBRATION — that late action
  // must not pull the session back into TRANSCRIBING.
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(seededStorage(4))],
  );

  await mockApiRoutes(page, {
    reply: (): ConverseResponseBody => ({
      speech: "నమస్కారం!",
      childSpokeTelugu: false,
      exchangeComplete: false,
      celebrationLevel: "none",
      sessionComplete: false,
      remember: null,
    }),
  });

  await page.goto("/");
  await page.getByTestId("play-button").click();

  await expect(page.locator('[data-state="listening"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("mic-button")).toBeEnabled();
  await page.getByTestId("end-session-button").click();

  await expect(page.getByTestId("home-button")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-state="celebrating"]')).toBeVisible();
});
