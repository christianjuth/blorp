export interface CommentMap {
  comment?: {
    path: string;
  };
  sort: number;
  [key: number]: CommentMap;
}

export interface CommentMapTopLevel {
  [key: number]: CommentMap;
}

export function buildCommentMap(
  commentViews: {
    path: string;
  }[],
  commentPath?: string,
) {
  const map: CommentMapTopLevel = {};

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
