import { describe, test, expect } from "vitest";
import { createCommunitySlug } from "./utils";

describe("createCommunitySlug", () => {
  test.each([
    ["https://lemmy.world/c/brexit", "brexit@lemmy.world"],
    ["https://lemmy.world/c/finance_greece", "finance_greece@lemmy.world"],
    ["https://lemmy.world/c/economy", "economy@lemmy.world"],
    ["https://midwest.social/c/memes", "memes@midwest.social"],
    [
      "https://lemmy.blahaj.zone/c/onehundredninetysix",
      "onehundredninetysix@lemmy.blahaj.zone",
    ],
    ["https://lemdro.id/c/meta", "meta@lemdro.id"],
  ])('createCommunitySlug("%s") == %s', (actor_id, slug) => {
    expect(createCommunitySlug({ actor_id })).toBe(slug);
  });

  test.each([
    // ["https://lemmy.world/u/ajetsf"],
    ["https://google.com"],
    ["https://youtube.com"],
    ["https://www.youtube.com"],
  ])('createCommunitySlug("%s") == ""', (actor_id) => {
    expect(createCommunitySlug({ actor_id })).toBe("");
  });
});
