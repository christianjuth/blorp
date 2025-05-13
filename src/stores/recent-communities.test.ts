import { describe, test, expect } from "vitest";
import { useRecentCommunitiesStore, MAX_VISITED } from "./recent-communities";
import * as lemmy from "@/test-utils/lemmy";
import { renderHook, act } from "@testing-library/react";
import _ from "lodash";

describe("useRecentCommunitiesStore", () => {
  test("omits duplicate communities", () => {
    const { community } = lemmy.getRandomCommunity();

    const { result } = renderHook(() => useRecentCommunitiesStore());

    expect(result.current.recentlyVisited).toHaveLength(0);

    act(() => {
      result.current.update(community);
    });

    expect(result.current.recentlyVisited).toHaveLength(1);
  });

  test("saves max 5 communities", () => {
    const communities = Array.from({ length: MAX_VISITED * 2 })
      .fill(0)
      .map(lemmy.getRandomCommunity);

    const { result } = renderHook(() => useRecentCommunitiesStore());

    act(() => {
      for (const { community } of communities) {
        result.current.update(community);
      }
    });

    expect(result.current.recentlyVisited).toHaveLength(MAX_VISITED);
  });

  test("placed most recently visited at beginning of array", () => {
    const communities = Array.from({ length: MAX_VISITED * 2 })
      .fill(0)
      .map(lemmy.getRandomCommunity);

    const { result } = renderHook(() => useRecentCommunitiesStore());

    act(() => {
      for (const { community } of communities) {
        result.current.update(community);
      }
    });

    expect(result.current.recentlyVisited).toMatchObject(
      communities
        .slice(communities.length - MAX_VISITED)
        .toReversed()
        .map(({ community }) =>
          _.pick(community, ["id", "name", "title", "actor_id", "icon"]),
        ),
    );
  });
});
