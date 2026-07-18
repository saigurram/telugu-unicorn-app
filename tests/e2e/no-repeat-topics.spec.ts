import { test, expect } from "@playwright/test";
import topicsBank from "../../src/data/topics.json";
import type { ConverseResponseBody } from "@/types";

const STORAGE_KEY = "mila:appStorage:v1";
const ELIGIBLE_TOPIC_ID = "color-05";

test("session picks the one topic not seen within the last 5 sessions", async ({ page }) => {
  const phraseHistory: Record<string, { lastSeenSession: number; timesSeen: number }> = {};
  for (const topic of topicsBank.topics) {
    if (topic.id === ELIGIBLE_TOPIC_ID) continue;
    phraseHistory[topic.id] = { lastSeenSession: 1, timesSeen: 1 };
  }

  const seeded = {
    version: 1,
    child: { name: "Asha", createdAt: new Date().toISOString() },
    sessions: { count: 0, lastSessionAt: null, streakCount: 0, streakLastDate: null },
    phraseHistory,
    settings: { voiceEnabled: true, exchangeTarget: 4, captionsEnabled: false, sfxMuted: true },
  };

  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(seeded)],
  );

  let capturedTopicId: string | null = null;

  await page.route("**/api/converse", async (route) => {
    const requestBody = route.request().postDataJSON() as { topic: { id: string } };
    capturedTopicId ??= requestBody.topic.id;
    const body: ConverseResponseBody = {
      speech: "నమస్కారం!",
      childSpokeTelugu: false,
      exchangeComplete: false,
      celebrationLevel: "none",
      sessionComplete: false,
    };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/api/speak", async (route) => {
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.alloc(0) });
  });

  await page.goto("/");
  await page.getByTestId("play-button").click();

  await expect.poll(() => capturedTopicId).toBe(ELIGIBLE_TOPIC_ID);
});
