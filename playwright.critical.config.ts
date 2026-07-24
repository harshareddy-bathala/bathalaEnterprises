import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PREDEPLOY_BASE_URL ?? "http://127.0.0.1:3100";
const shouldStartServer = process.env.PREDEPLOY_SKIP_WEBSERVER !== "1";
const useDevServer = process.env.PREDEPLOY_USE_DEV_SERVER === "1";
const parsedBaseUrl = new URL(BASE_URL);
const webServerHost = parsedBaseUrl.hostname;
const webServerPort = Number(
  parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80")
);
const nextBin = "node ./node_modules/next/dist/bin/next";
const webServerCommand = useDevServer
  ? `${nextBin} dev -H ${webServerHost} -p ${webServerPort}`
  : `${nextBin} build && ${nextBin} start -H ${webServerHost} -p ${webServerPort}`;

export default defineConfig({
  testDir: "./tests/qa",
  testMatch: /.*critical-flows\.spec\.ts/,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/critical", open: "never" }],
    ["json", { outputFile: "test-results/critical-results.json" }],
  ],
  outputDir: "test-results/critical-artifacts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  webServer: shouldStartServer
    ? {
        command: webServerCommand,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 420_000,
      }
    : undefined,
  projects: [
    {
      name: "critical-desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "critical-mobile-chrome",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
