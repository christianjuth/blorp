import { test, expect } from "@playwright/test";

test("settings page", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("STORAGE")).toBeVisible();
});

test("privacy policy page", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText("Privacy Policy for Blorp")).toBeVisible();
});
