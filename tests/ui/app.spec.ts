import { expect, test } from "@playwright/test";
import path from "path";

test("workspace shell, auth, language, and toolbox smoke flow", async ({ page }) => {
  const roiPath = path.resolve("tests/ui/fixtures/roi.geojson");
  await page.goto("/");

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("workspace-page")).toBeVisible();

  await page.getByTestId("language-switch").selectOption("en-US");
  await expect(page.getByRole("button", { name: "Workspace" })).toBeVisible();

  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("settings-page")).toBeVisible();
  await page.getByRole("button", { name: "Browser login" }).click();
  await expect(page.getByLabel("Browser login URL")).toBeVisible();
  await page.getByLabel("Account email").fill("ui-smoke@example.com");
  await page.getByLabel("Project ID (optional)").fill("ui-browser-project");
  await page.getByRole("button", { name: "Mark browser login complete" }).click();
  await page.getByRole("button", { name: "Test connection" }).click();
  await expect(page.locator(".connection-pill.connected")).toBeVisible();
  await page.getByLabel("Model").fill("mock-model");
  await page.getByLabel("Base URL").fill("mock://local");
  await page.getByLabel("API Key").fill("test-key");
  await page.getByRole("checkbox", { name: "Enable AI workflow generation" }).check();
  await page.getByRole("button", { name: "Save AI Config" }).click();

  await page.getByTestId("nav-projects").click();
  await expect(page.getByTestId("projects-page")).toBeVisible();
  await page.getByPlaceholder("Project name").fill("UI Smoke Project");
  await page.getByRole("button", { name: "Create project" }).click();

  await page.getByTestId("nav-workspace").click();
  await expect(page.getByTestId("tool-palette")).toBeVisible();
  await page.getByLabel("Upload ROI").setInputFiles(roiPath);
  await page.getByLabel("Start date").fill("2024-01-01");
  await page.getByLabel("End date").fill("2024-12-31");
  await page.getByRole("button", { name: "Save true color flow" }).click();
  await page.getByRole("banner").getByRole("button", { name: "Compile plan" }).click();
  await expect(page.getByRole("button", { name: "Execution Plan" })).toBeVisible();

  await page.getByRole("button", { name: "AI Assistant" }).click();
  await page.getByRole("button", { name: "Generate Linear Flow" }).click();
  await page.getByRole("button", { name: "Materialize Workflow" }).click();

  await page.getByTestId("nav-settings").click();
  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.locator(".connection-pill.disconnected")).toBeVisible();
});
