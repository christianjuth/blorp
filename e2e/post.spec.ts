import { test, expect } from "@playwright/test";

test("loads post", async ({ page }) => {
  await page.goto(
    "/communities/c/asklemmy@lemmy.ml/posts/https:%2F%2Flemmy.world%2Fpost%2F23863920",
  );
  const postCard = page.getByTestId("post-card");
  await expect(postCard).toBeInViewport();
  await expect(postCard).toContainText(
    "What TV shows are you watching and would recommend?",
  );
});
