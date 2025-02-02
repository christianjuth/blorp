import { act, renderHook } from "@testing-library/react-hooks";
import { describe, test, expect } from "vitest";
import * as lemmy from "~/test-utils/lemmy";
import { usePostsStore } from "./posts";
import { flattenPost } from "../lib/lemmy/utils";
import _ from "lodash";

describe("usePostsStore", () => {
  test("cachePost", () => {
    const post = lemmy.getPost();
    const flatPost = flattenPost({ post_view: post });
    const { result } = renderHook(() => usePostsStore());

    act(() => {
      result.current.cachePost(flatPost);
    });

    expect(result.current.posts[post.post.ap_id].data).toMatchObject(flatPost);
  });

  test("cachePosts", () => {
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

  test("patchPost", () => {
    const post = lemmy.getPost();
    const flatPost = flattenPost({ post_view: post });
    const { result } = renderHook(() => usePostsStore());

    act(() => {
      result.current.patchPost(flatPost.post.ap_id, flatPost);
    });

    expect(result.current.posts[post.post.ap_id].data).toMatchObject(flatPost);

    const vote = _.random(-1, 1);

    act(() => {
      result.current.patchPost(flatPost.post.ap_id, {
        optimisticMyVote: vote,
      });
    });

    expect(result.current.posts[post.post.ap_id].data).toMatchObject({
      ...flatPost,
      optimisticMyVote: vote,
    });
  });
});
