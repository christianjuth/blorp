import { describe, test, expect } from "vitest";
import { buildCommentMap, CommentMapTopLevel } from "./comment-map";

describe("buildCommentMap", () => {
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
      } satisfies CommentMapTopLevel,
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
              sort: 2,
            },
            comment: {
              path: "0.1234.5678",
            },
            sort: 1,
          },
          sort: 0,
        },
      } satisfies CommentMapTopLevel,
      "1234.5678",
    ],
  ])("%s", (_, comments, commentMap, commentPath) => {
    expect(buildCommentMap(comments, commentPath)).toEqual(commentMap);
  });
});
