import { describe, test, expect } from "vitest";
import { buildCommentTree, CommentTreeTopLevel } from "./comment-tree";

describe("buildCommentTree", () => {
  test.each([
    [
      "top level comments",
      [
        { path: "0.1234" },
        { path: "0.1234.5678" },
        { path: "0.1234.5678.9101112" },
      ],
      {
        1234: {
          sort: 0,
          comment: {
            path: "0.1234",
          },
          5678: {
            sort: 1,
            comment: {
              path: "0.1234.5678",
            },
            9101112: {
              sort: 2,
              comment: {
                path: "0.1234.5678.9101112",
              },
            },
          },
        },
      } satisfies CommentTreeTopLevel,
      undefined,
    ],
    [
      "subtree of comments",
      [{ path: "0.1234.5678" }, { path: "0.1234.5678.9101112" }],
      {
        1234: {
          5678: {
            9101112: {
              comment: {
                path: "0.1234.5678.9101112",
              },
              sort: 1,
            },
            comment: {
              path: "0.1234.5678",
            },
            sort: 0,
          },
          // Because 1234 is implied and doesn't actually
          // exist in the data, it get's a sort value of 0
          sort: 0,
        },
      } satisfies CommentTreeTopLevel,
      "1234.5678",
    ],
  ])("%s", (_, comments, commentTree, commentPath) => {
    expect(buildCommentTree(comments, commentPath)).toEqual(commentTree);
  });
});
