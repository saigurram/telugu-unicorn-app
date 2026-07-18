import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  // Real audio decode/playback + fake media devices are resource-heavy;
  // running them serially avoids flaky timeouts from CPU contention
  // between parallel workers, and the suite is small enough that this
  // costs little wall-clock time.
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    ...devices["Pixel 5"],
    permissions: ["microphone"],
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium",
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--autoplay-policy=no-user-gesture-required",
      ],
    },
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
