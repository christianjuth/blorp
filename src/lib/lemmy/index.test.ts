import { beforeEach, test, expect, describe } from "vitest";
import * as lemmy from "@/test-utils/lemmy";
import { createQueryClientWrapper } from "@/test-utils/tanstack-query";
import { useComments, useCreateComment } from ".";
import { renderHook, waitFor } from "@testing-library/react";
import { CommentResponse, GetCommentsResponse } from "lemmy-v3";
import _ from "lodash";

function mockGetComments(length: number, parentId?: number) {
  const comments = Array.from({ length: length })
    .fill(0)
    .map((_i, i) =>
      lemmy.getComment({
        commentView: {
          comment: {
            id: i,
            path: _.isNumber(parentId) ? `0.${parentId}.${i}` : `0.${i}`,
          },
        },
      }),
    );

  fetchMock.once(() =>
    Promise.resolve({
      status: 200,
      body: JSON.stringify({
        comments,
      } satisfies GetCommentsResponse),
    }),
  );

  return comments;
}

function mockCreateComment(path: string) {
  fetchMock.once(() =>
    Promise.resolve({
      status: 200,
      body: JSON.stringify({
        comment_view: lemmy.getComment({
          commentView: {
            comment: {
              path,
            },
          },
        }),
        recipient_ids: [],
      } satisfies CommentResponse),
    }),
  );
}

beforeEach(() => {
  fetchMock.resetMocks();
});

describe("creating comments", () => {
  test("create top level comment", async () => {
    const queryClientWrapper = createQueryClientWrapper();

    const numComments = _.random(0, 10);
    mockGetComments(numComments);

    const POST_ID = 1234;

    const allComments = renderHook(
      () =>
        useComments({
          post_id: POST_ID,
        }),
      {
        wrapper: queryClientWrapper,
      },
    );

    const createComment = renderHook(() => useCreateComment(), {
      wrapper: queryClientWrapper,
    });

    await waitFor(() => {
      expect(
        allComments.result.current.data?.pages.flatMap((p) => p.comments),
      ).toHaveLength(numComments);
    });

    const NEW_COMMENT_PATH = "0.1234";
    const pages1 = allComments.result.current.data?.pages;
    expect(pages1?.flatMap((p) => p.comments).map((c) => c.path)).not.toContain(
      NEW_COMMENT_PATH,
    );

    mockCreateComment(NEW_COMMENT_PATH);

    await createComment.result.current.mutateAsync({
      content: "New comment",
      post_id: POST_ID,
    });
    allComments.rerender();

    const pages2 = allComments.result.current.data?.pages;
    expect(pages2?.flatMap((p) => p.comments).map((c) => c.path)).toContain(
      NEW_COMMENT_PATH,
    );
  });

  test("create reply comment", async () => {
    const queryClientWrapper = createQueryClientWrapper();

    const numComments = _.random(1, 10);
    const [parentComment] = mockGetComments(numComments);
    if (!parentComment) {
      throw new Error("this shouldn't happen");
    }

    const POST_ID = 1234;

    const allComments = renderHook(
      () =>
        useComments({
          post_id: POST_ID,
        }),
      {
        wrapper: queryClientWrapper,
      },
    );

    const createComment = renderHook(() => useCreateComment(), {
      wrapper: queryClientWrapper,
    });

    await waitFor(() => {
      expect(
        allComments.result.current.data?.pages.flatMap((p) => p.comments),
      ).toHaveLength(numComments);
    });

    const parentPath = parentComment.comment.path;
    const NEW_COMMENT_PATH = `${parentPath}.1234`;

    const pages1 = allComments.result.current.data?.pages;
    expect(pages1?.flatMap((p) => p.comments).map((c) => c.path)).not.toContain(
      NEW_COMMENT_PATH,
    );

    mockCreateComment(NEW_COMMENT_PATH);

    await createComment.result.current.mutateAsync({
      content: "New comment",
      post_id: POST_ID,
      parentPath: parentComment?.comment.path,
    });
    allComments.rerender();

    const pages2 = allComments.result.current.data?.pages;
    expect(pages2?.flatMap((p) => p.comments).map((c) => c.path)).toContain(
      NEW_COMMENT_PATH,
    );
  });

  test("create reply comment while in thread", async () => {
    const queryClientWrapper = createQueryClientWrapper();

    const POST_ID = 1234;
    const PARENT_ID = 4567;

    const numComments = _.random(1, 10);
    const mockedComments = mockGetComments(numComments, PARENT_ID);
    const parentComment = _.sample(mockedComments);
    if (!parentComment) {
      throw new Error("this shouldn't happen");
    }

    const allComments = renderHook(
      () =>
        useComments({
          post_id: POST_ID,
          parent_id: PARENT_ID,
        }),
      {
        wrapper: queryClientWrapper,
      },
    );

    const createComment = renderHook(() => useCreateComment(), {
      wrapper: queryClientWrapper,
    });

    await waitFor(() => {
      expect(
        allComments.result.current.data?.pages.flatMap((p) => p.comments),
      ).toHaveLength(numComments);
    });

    const parentPath = parentComment.comment.path;
    const NEW_COMMENT_PATH = `${parentPath}.1234`;

    const pages1 = allComments.result.current.data?.pages;
    expect(pages1?.flatMap((p) => p.comments).map((c) => c.path)).not.toContain(
      NEW_COMMENT_PATH,
    );

    mockCreateComment(NEW_COMMENT_PATH);

    await createComment.result.current.mutateAsync({
      content: "New comment",
      post_id: POST_ID,
      parent_id: parentComment?.comment.id,
      parentPath: parentComment?.comment.path,
      queryKeyParentId: PARENT_ID,
    });
    allComments.rerender();

    const pages2 = allComments.result.current.data?.pages;
    expect(pages2?.flatMap((p) => p.comments).map((c) => c.path)).toContain(
      NEW_COMMENT_PATH,
    );
  });
});
