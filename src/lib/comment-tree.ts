export interface CommentTree {
  comment?: {
    path: string;
  };
  sort: number;
  [key: number]: CommentTree;
}

export interface CommentTreeTopLevel {
  [key: number]: CommentTree;
}

/**
 * Lemmy returns us an array of comments, but what we really
 * need is a tree where child comments are attached to their
 * parent. We have all the information we need in the list to
 * build this tree. This function transforms the array into a tree.
 *
 * @example
 *   cosnt comments = useComments();
 *
 *   const tree = buildCommentTree(comments);
 *
 *   // Render tree recursivly
 */
export function buildCommentTree(
  commentViews: {
    path: string;
  }[],
  commentPath?: string,
) {
  const map: CommentTreeTopLevel = {};

  const firstCommentInPath = commentPath?.split(".")?.[0];

  let i = 0;
  for (const view of commentViews) {
    let loc = map;
    let viewPath = view.path;

    if (firstCommentInPath && viewPath.indexOf(firstCommentInPath) > -1) {
      viewPath =
        "0." + viewPath.substring(viewPath.indexOf(firstCommentInPath));
    }

    if (commentPath && viewPath.length > commentPath.length) {
      if (viewPath.indexOf(commentPath) === -1) {
        continue;
      }
    }

    const [_, ...path] = viewPath.split(".");

    while (path.length > 1) {
      const front: keyof typeof loc = path.shift()! as any;
      loc[front] = loc[front] ?? {
        sort: i++,
      };
      loc = loc[front];
    }

    const front: keyof typeof loc = path.shift()! as any;

    loc[front] = loc[front] ?? {
      sort: i++,
    };
    loc[front].comment = view;
  }

  return map;
}
