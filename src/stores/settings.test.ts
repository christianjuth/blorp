import { describe, test, expect, afterEach } from "vitest";
import { useSettingsStore } from "./settings";
import { renderHook, act } from "@testing-library/react";
import _ from "lodash";

afterEach(() => {
  const { result } = renderHook(() => useSettingsStore());
  act(() => {
    result.current.reset();
  });
});

describe("useSettingsStore", () => {});
