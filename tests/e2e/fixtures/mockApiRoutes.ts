import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { ConverseResponseBody } from "@/types";

const toneMp3 = fs.readFileSync(path.join(__dirname, "tone.mp3"));

interface MockConverseOptions {
  /** Called for each request; return the response body for that turn. */
  reply: (turnIndex: number, requestBody: unknown) => ConverseResponseBody;
}

/** Mocks all three /api/* routes so the full state machine can be driven
 * end-to-end without any real vendor keys or network access. */
export async function mockApiRoutes(page: Page, options: MockConverseOptions) {
  let turnIndex = 0;

  await page.route("**/api/converse", async (route) => {
    const requestBody = route.request().postDataJSON();
    const body = options.reply(turnIndex, requestBody);
    turnIndex += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });

  await page.route("**/api/speak", async (route) => {
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: toneMp3 });
  });

  await page.route("**/api/transcribe", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: "నమస్కారం" }),
    });
  });
}
