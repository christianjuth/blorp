import { describe, test, expect } from "vitest";
import { useSettingsStore } from "./settings";
import { renderHook, act } from "@testing-library/react-hooks";
import _ from "lodash";

describe("useSettingsStore", () => {
  describe("image cache", () => {
    test("should not cache by default", () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.cacheImages).toBe(false);
    });

    test("enable", () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.setCacheImages(true);
      });
      expect(result.current.cacheImages).toBe(true);
    });

    test("disable", () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.setCacheImages(true);
      });
      expect(result.current.cacheImages).toBe(true);
    });
  });
});
