import { describe, test, expect } from "vitest";
import { createSlug } from "./utils";

describe("createSlug", () => {
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
  ])('createSlug("%s").slug == %s', (actor_id, slug) => {
    expect(createSlug({ actor_id })?.slug).toBe(slug);
  });

  test.each([
    // ["https://lemmy.world/u/ajetsf"],
    ["https://google.com"],
    ["https://youtube.com"],
    ["https://www.youtube.com"],
  ])('createSlug("%s").slug == ""', (actor_id) => {
    expect(createSlug({ actor_id })?.slug).toBe(undefined);
  });
});
