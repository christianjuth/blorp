import { describe, test, expect } from "vitest";
import { abbriviateNumber } from "./format";

describe("abbriviateNumber", () => {
  test.each([
    [184, "184"],
    [1000, "1k"],
    [2340, "2.3k"],
    [29481, "29.4k"],
    [1000000, "1m"],
    [2842183, "2.8m"],
  ])("abbriviateNumber(%s) == %s", (input, abr) => {
    expect(abbriviateNumber(input)).toBe(abr);
  });
});
