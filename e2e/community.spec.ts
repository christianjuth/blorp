import { test, expect } from "@playwright/test";

test("loads post", async ({ page }) => {
  await page.goto("/home/c/technology@lemmy.world");
  await expect(page.getByText("Created Jun 10, 2023")).toHaveCount(2);
});
