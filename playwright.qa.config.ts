import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const BASE_URL = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const shouldStartServer = process.env.QA_SKIP_WEBSERVER !== "1";

type GenericDevice = Record<string, unknown>;
const knownDevices = devices as Record<string, GenericDevice>;

function device(name: string): GenericDevice {
  return knownDevices[name] ?? {};
}

const crossBrowserSpec = /.*cross-browser\.spec\.ts/;
const devicesSpec = /.*devices\.spec\.ts/;
const accessibilitySpec = /.*accessibility\.spec\.ts/;
const performanceSpec = /.*performance-smoke\.spec\.ts/;

const config: PlaywrightTestConfig = defineConfig({
  testDir: "./tests/qa",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/qa", open: "never" }],
    ["json", { outputFile: "test-results/qa-results.json" }],
  ],
  outputDir: "test-results/qa-artifacts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  webServer: shouldStartServer
    ? {
        command: "node ./node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
  projects: [
    // Cross-browser targets
    {
      name: "qa-crossbrowser-chrome",
      testMatch: crossBrowserSpec,
      use: {
        ...device("Desktop Chrome"),
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "qa-crossbrowser-firefox",
      testMatch: crossBrowserSpec,
      use: {
        ...device("Desktop Firefox"),
        browserName: "firefox",
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          firefoxUserPrefs: {
            "gfx.webrender.all": false,
            "layers.acceleration.disabled": true,
          },
        },
      },
    },
    {
      name: "qa-crossbrowser-safari-webkit",
      testMatch: crossBrowserSpec,
      use: {
        ...device("Desktop Safari"),
        browserName: "webkit",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "qa-crossbrowser-edge",
      testMatch: crossBrowserSpec,
      use: {
        ...device("Desktop Edge"),
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
      },
    },
    {
      name: "qa-crossbrowser-samsung-internet",
      testMatch: crossBrowserSpec,
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "qa-crossbrowser-ios-safari-iphone14pro",
      testMatch: crossBrowserSpec,
      use: {
        ...device("iPhone 14 Pro"),
        browserName: "webkit",
      },
    },
    {
      name: "qa-crossbrowser-ios-safari-ipad",
      testMatch: crossBrowserSpec,
      use: {
        ...device("iPad Pro 11"),
        browserName: "webkit",
        viewport: { width: 834, height: 1194 },
      },
    },
    {
      name: "qa-crossbrowser-chrome-android",
      testMatch: crossBrowserSpec,
      use: {
        ...device("Pixel 7"),
        browserName: "chromium",
      },
    },

    // Device viewport targets
    {
      name: "qa-device-iphone-se-375",
      testMatch: devicesSpec,
      use: {
        ...device("iPhone SE"),
        browserName: "webkit",
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: "qa-device-iphone-14-pro-393",
      testMatch: devicesSpec,
      use: {
        ...device("iPhone 14 Pro"),
        browserName: "webkit",
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: "qa-device-iphone-14-pro-max-430",
      testMatch: devicesSpec,
      use: {
        ...device("iPhone 14 Pro Max"),
        browserName: "webkit",
        viewport: { width: 430, height: 932 },
      },
    },
    {
      name: "qa-device-galaxy-s21-360",
      testMatch: devicesSpec,
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: "qa-device-ipad-mini-768",
      testMatch: devicesSpec,
      use: {
        browserName: "webkit",
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "qa-device-ipad-pro-11-834",
      testMatch: devicesSpec,
      use: {
        ...device("iPad Pro 11"),
        browserName: "webkit",
        viewport: { width: 834, height: 1194 },
      },
    },
    {
      name: "qa-device-ipad-pro-12-9-1024",
      testMatch: devicesSpec,
      use: {
        browserName: "webkit",
        viewport: { width: 1024, height: 1366 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "qa-device-macbook-air-13-1440",
      testMatch: devicesSpec,
      use: {
        ...device("Desktop Chrome"),
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "qa-device-desktop-1920-1080",
      testMatch: devicesSpec,
      use: {
        ...device("Desktop Chrome"),
        browserName: "chromium",
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "qa-device-desktop-2560-1440",
      testMatch: devicesSpec,
      use: {
        ...device("Desktop Chrome"),
        browserName: "chromium",
        viewport: { width: 2560, height: 1440 },
      },
    },

    // Accessibility deep scans
    {
      name: "qa-a11y-chromium",
      testMatch: accessibilitySpec,
      use: {
        ...device("Desktop Chrome"),
        browserName: "chromium",
      },
    },
    {
      name: "qa-a11y-firefox",
      testMatch: accessibilitySpec,
      use: {
        ...device("Desktop Firefox"),
        browserName: "firefox",
        launchOptions: {
          firefoxUserPrefs: {
            "gfx.webrender.all": false,
            "layers.acceleration.disabled": true,
          },
        },
      },
    },
    {
      name: "qa-a11y-webkit",
      testMatch: accessibilitySpec,
      use: {
        ...device("Desktop Safari"),
        browserName: "webkit",
      },
    },

    // Performance smoke
    {
      name: "qa-performance-chromium",
      testMatch: performanceSpec,
      use: {
        ...device("Desktop Chrome"),
        browserName: "chromium",
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});

export default config;
