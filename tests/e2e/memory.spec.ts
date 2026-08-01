import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./fixtures/mockApiRoutes";
import type { ConverseResponseBody, ConverseRequestBody } from "@/types";

const STORAGE_KEY = "mila:appStorage:v1";

function seededStorage(sessionCount: number, memories: { text: string; session: number }[]) {
  return {
    version: 1,
    child: { name: "Asha", createdAt: new Date().toISOString() },
    sessions: { count: sessionCount, lastSessionAt: null, streakCount: 0, streakLastDate: null },
    phraseHistory: {},
    memories,
    settings: { voiceEnabled: true, exchangeTarget: 3, captionsEnabled: false, sfxMuted: true },
  };
}

test("a fact Mila learns is stored and sent back to her next session", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(seededStorage(0, []))],
  );

  await mockApiRoutes(page, {
    reply: (turnIndex): ConverseResponseBody => ({
      speech: "నమస్కారం!",
      childSpokeTelugu: true,
      exchangeComplete: false,
      celebrationLevel: "none",
      sessionComplete: false,
      // Mila picks up a fact on her very first turn.
      remember: turnIndex === 0 ? "loves dosa" : null,
    }),
  });

  await page.goto("/");
  await page.getByTestId("play-button").click();
  await expect(page.locator('[data-state="talking"]')).toBeVisible({ timeout: 10_000 });

  await expect
    .poll(async () =>
      page.evaluate((key) => {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw).memories ?? []).map((m: { text: string }) => m.text) : [];
      }, STORAGE_KEY),
    )
    .toEqual(["loves dosa"]);
});

test("stored memories and the session's activity are sent to Mila", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(seededStorage(1, [{ text: "loves dosa", session: 1 }]))],
  );

  const requests: ConverseRequestBody[] = [];
  await mockApiRoutes(page, {
    reply: (_turnIndex, requestBody): ConverseResponseBody => {
      requests.push(requestBody as ConverseRequestBody);
      return {
        speech: "నమస్కారం!",
        childSpokeTelugu: false,
        exchangeComplete: false,
        celebrationLevel: "none",
        sessionComplete: false,
        remember: null,
      };
    },
  });

  await page.goto("/");
  await page.getByTestId("play-button").click();
  await expect(page.locator('[data-state="talking"]')).toBeVisible({ timeout: 10_000 });

  expect(requests[0].memories).toEqual(["loves dosa"]);
  // Session 2 of the rotation is the game format.
  expect(requests[0].activity).toBe("game");
});
