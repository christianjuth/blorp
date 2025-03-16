import { renderHook, act } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import * as lemmy from "~/test-utils/lemmy";
import { usePostsStore } from "./posts";
import { FlattenedPost, flattenPost } from "../lib/lemmy/utils";
import _ from "lodash";

describe("usePostsStore", () => {
  describe("cachePost", () => {
    test("can cache a single post", () => {
      const post = lemmy.getPost();
      const flatPost = flattenPost({ post_view: post });
      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.cachePost(flatPost);
      });

      expect(result.current.posts[post.post.ap_id].data).toMatchObject(
        flatPost,
      );
    });

    test("does not overwrite optimistic updates", () => {
      const post1 = lemmy.getRandomPost();

      const vote = _.random(-1, 1);
      const saved = _.sample([true, false]);
      const deleted = _.sample([true, false]);
      const read = _.sample([true, false]);

      const flatPost = flattenPost({ post_view: post1 });

      const flatPostOptimistic: FlattenedPost = {
        ...flatPost,
        optimisticRead: read,
        optimisticDeleted: deleted,
        optimisticSaved: saved,
        optimisticMyVote: vote,
      };

      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.cachePost(flatPostOptimistic);
      });

      expect(result.current.posts[post1.post.ap_id].data).toMatchObject({
        optimisticRead: read,
        optimisticDeleted: deleted,
        optimisticSaved: saved,
        optimisticMyVote: vote,
      });

      act(() => {
        result.current.cachePost(flatPost);
      });

      expect(result.current.posts[post1.post.ap_id].data).toMatchObject({
        optimisticRead: read,
        optimisticDeleted: deleted,
        optimisticSaved: saved,
        optimisticMyVote: vote,
      });
    });
  });

  describe("cachePosts", () => {
    test("can cache multiple posts", () => {
      const post1 = lemmy.getRandomPost();
      const post2 = lemmy.getRandomPost();
      const flatPost1 = flattenPost({ post_view: post1 });
      const flatPost2 = flattenPost({ post_view: post2 });

      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.cachePosts([flatPost1, flatPost2]);
      });

      expect(result.current.posts[post1.post.ap_id].data).toMatchObject(
        flatPost1,
      );
      expect(result.current.posts[post2.post.ap_id].data).toMatchObject(
        flatPost2,
      );
    });

    test("does not overwrite optimistic updates", () => {
      const post1 = lemmy.getRandomPost();

      const vote = _.random(-1, 1);
      const saved = _.sample([true, false]);
      const deleted = _.sample([true, false]);
      const read = _.sample([true, false]);

      const flatPost = flattenPost({ post_view: post1 });

      const flatPostOptimistic: FlattenedPost = {
        ...flatPost,
        optimisticRead: read,
        optimisticDeleted: deleted,
        optimisticSaved: saved,
        optimisticMyVote: vote,
      };

      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.cachePosts([flatPostOptimistic]);
      });

      expect(result.current.posts[post1.post.ap_id].data).toMatchObject({
        optimisticRead: read,
        optimisticDeleted: deleted,
        optimisticSaved: saved,
        optimisticMyVote: vote,
      });

      act(() => {
        result.current.cachePosts([flatPost]);
      });

      expect(result.current.posts[post1.post.ap_id].data).toMatchObject({
        optimisticRead: read,
        optimisticDeleted: deleted,
        optimisticSaved: saved,
        optimisticMyVote: vote,
      });
    });
  });

  test("patchPost", () => {
    const post = lemmy.getPost();
    const flatPost = flattenPost({ post_view: post });
    const { result } = renderHook(() => usePostsStore());

    act(() => {
      result.current.patchPost(flatPost.post.ap_id, flatPost);
    });

    expect(result.current.posts[post.post.ap_id].data).toMatchObject(flatPost);

    const vote = _.random(-1, 1);
    const saved = _.sample([true, false]);
    const deleted = _.sample([true, false]);
    const read = _.sample([true, false]);

    act(() => {
      result.current.patchPost(flatPost.post.ap_id, {
        optimisticMyVote: vote,
        optimisticSaved: saved,
        optimisticDeleted: deleted,
        optimisticRead: read,
      });
    });

    expect(result.current.posts[post.post.ap_id].data).toMatchObject({
      ...flatPost,
      optimisticMyVote: vote,
      optimisticSaved: saved,
      optimisticDeleted: deleted,
      optimisticRead: read,
    });
  });
});
