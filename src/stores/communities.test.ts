import { describe, test, expect } from "vitest";
import * as lemmy from "~/test-utils/lemmy";
import { useCommunitiesStore } from "./communities";
import _ from "lodash";
import { renderHook, act } from "@testing-library/react";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { SubscribedType } from "lemmy-js-client";

describe("useCommunitiesStore", () => {
  describe("cacheCommunity", () => {
    const communityView = lemmy.getCommunity();
    const slug = createCommunitySlug(communityView.community);

    test("load post into store", () => {
      const { result } = renderHook(() => useCommunitiesStore());

      act(() => {
        result.current.cacheCommunity({
          communityView,
        });
      });

      expect(result.current.communities[slug].data).toMatchObject({
        communityView,
      });
    });

    test("does not overwrite optimistic subscribed", () => {
      const { result } = renderHook(() => useCommunitiesStore());
      const optimisticSubscribed = _.sample([
        "Subscribed",
        "Pending",
        "NotSubscribed",
        "ApprovalRequired",
      ] satisfies SubscribedType[]);

      act(() => {
        result.current.cacheCommunity({
          communityView,
          optimisticSubscribed,
        });
      });

      act(() => {
        result.current.cacheCommunity({
          communityView,
        });
      });

      expect(result.current.communities[slug].data).toMatchObject({
        optimisticSubscribed,
      });
    });

    test.todo("patches do not overwrite community mod list");
  });

  describe("patchCommunity", () => {
    const communityView = lemmy.getCommunity();
    const slug = createCommunitySlug(communityView.community);

    test("load post into store", () => {
      const { result } = renderHook(() => useCommunitiesStore());

      act(() => {
        result.current.patchCommunity(slug, {
          communityView,
        });
      });

      expect(result.current.communities[slug].data).toMatchObject({
        communityView,
      });
    });

    test("does not overwrite optimistic subscribed", () => {
      const { result } = renderHook(() => useCommunitiesStore());
      const optimisticSubscribed = _.sample([
        "Subscribed",
        "Pending",
        "NotSubscribed",
        "ApprovalRequired",
      ] satisfies SubscribedType[]);

      act(() => {
        result.current.patchCommunity(slug, {
          communityView,
          optimisticSubscribed,
        });
      });

      act(() => {
        result.current.patchCommunity(slug, {
          communityView,
        });
      });

      expect(result.current.communities[slug].data).toMatchObject({
        optimisticSubscribed,
      });
    });

    test.todo("patches do not overwrite community mod list");
  });

  describe("cacheCommunities", () => {
    const communityView1 = lemmy.getRandomCommunity();
    const slug1 = createCommunitySlug(communityView1.community);
    const communityView2 = lemmy.getRandomCommunity();
    const slug2 = createCommunitySlug(communityView2.community);

    test("load posts into store", () => {
      const { result } = renderHook(() => useCommunitiesStore());

      act(() => {
        result.current.cacheCommunities([
          { communityView: communityView1 },
          { communityView: communityView2 },
        ]);
      });

      expect(result.current.communities[slug1].data).toMatchObject({
        communityView: communityView1,
      });
      expect(result.current.communities[slug2].data).toMatchObject({
        communityView: communityView2,
      });
    });

    test("does not overwrite optimistic subscribed", () => {
      const { result } = renderHook(() => useCommunitiesStore());

      const optimisticSubscribed = _.sample([
        "Subscribed",
        "Pending",
        "NotSubscribed",
        "ApprovalRequired",
      ] satisfies SubscribedType[]);

      act(() => {
        result.current.cacheCommunities([
          { communityView: communityView1, optimisticSubscribed },
          { communityView: communityView2, optimisticSubscribed },
        ]);
      });

      act(() => {
        result.current.cacheCommunities([
          { communityView: communityView1 },
          { communityView: communityView2 },
        ]);
      });

      expect(result.current.communities[slug1].data).toMatchObject({
        optimisticSubscribed,
      });
      expect(result.current.communities[slug2].data).toMatchObject({
        optimisticSubscribed,
      });
    });

    test.todo("patches do not overwrite community mod list");
  });
});
