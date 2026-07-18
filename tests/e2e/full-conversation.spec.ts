import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./fixtures/mockApiRoutes";
import type { ConverseResponseBody } from "@/types";

function replyFor(turnIndex: number, exchangeTarget: number): ConverseResponseBody {
  if (turnIndex === 0) {
    return {
      speech: "నమస్కారం Asha! ఎలా ఉన్నావు?",
      childSpokeTelugu: false,
      exchangeComplete: false,
      celebrationLevel: "none",
      sessionComplete: false,
    };
  }
  // turnIndex 0 is the greeting; turnIndex N (N >= 1) is the reply to the
  // Nth exchange, so the reply that completes exchangeTarget exchanges is
  // turnIndex === exchangeTarget.
  const isClosing = turnIndex >= exchangeTarget;
  return {
    speech: isClosing ? "శభాష్! బై బై, రేపు మళ్ళీ కలుద్దాం!" : "శభాష్! చాలా బాగుంది!",
    childSpokeTelugu: true,
    exchangeComplete: true,
    celebrationLevel: isClosing ? "big" : "small",
    sessionComplete: isClosing,
  };
}

test("full 4-exchange session: greet -> exchanges -> celebration", async ({ page }) => {
  const exchangeTarget = 4;
  await mockApiRoutes(page, { reply: (turnIndex) => replyFor(turnIndex, exchangeTarget) });

  await page.goto("/");

  await page.getByTestId("child-name-input").fill("Asha");
  await page.getByTestId("name-submit-button").click();
  await expect(page.getByTestId("play-button")).toBeVisible();

  await page.getByTestId("play-button").click();

  // Greeting: Mila should start talking.
  await expect(page.locator('[data-state="talking"]')).toBeVisible({ timeout: 10_000 });

  // Drive through all 4 exchanges: wait for listening, tap mic to stop
  // (deterministic — real VAD silence timing is not something a test
  // should wait on), then wait for Mila to talk again.
  for (let i = 0; i < exchangeTarget; i++) {
    await expect(page.locator('[data-state="listening"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("mic-button")).toBeEnabled();
    await page.getByTestId("mic-button").click();
    await expect(page.locator('[data-state="talking"]')).toBeVisible({ timeout: 10_000 });
  }

  // Final exchange carried session_complete -> celebration screen.
  await expect(page.getByTestId("home-button")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-state="celebrating"]')).toBeVisible();

  await page.getByTestId("home-button").click();
  await expect(page.getByTestId("play-button")).toBeVisible();
});
