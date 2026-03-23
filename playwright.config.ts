import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npx concurrently -k \"powershell -ExecutionPolicy Bypass -File .\\backend\\scripts\\dev.ps1\" \"npm run dev:renderer -- --host 127.0.0.1\"",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000
  }
});
