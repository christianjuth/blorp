import { CommentView } from "lemmy-js-client";
import { useMemo } from "react";
import { View, Text } from "tamagui";
import { Markdown } from "~/src/components/markdown";
import _ from "lodash";

export function PostComment({
  commentMap,
  level,
}: {
  commentMap: CommentMap;
  level: number;
}) {
  const { comment: commentView, ...rest } = commentMap;
  if (!commentView) {
    return null;
  }

  let color = "red";
  switch (level % 6) {
    case 0:
      color = "red";
      break;
    case 1:
      color = "orange";
      break;
    case 2:
      color = "yellow";
      break;
    case 3:
      color = "green";
      break;
    case 4:
      color = "blue";
      break;
    case 5:
      color = "purple";
      break;
  }

  return (
    <View mt="$2" pl="$2" gap="$1.5" py="$2" bg="$gray1">
      <View
        blw={level >= 0 ? "$1" : undefined}
        blc={level >= 0 ? color : undefined}
        p={level >= 0 ? "$2" : undefined}
      >
        <Text fontWeight="bold">{commentView.creator.name}</Text>
        <Markdown markdown={commentView.comment.content} />
        {_.entries(rest).map(([id, map]) => (
          <PostComment key={id} commentMap={map} level={level + 1} />
        ))}
      </View>
    </View>
  );
}

interface CommentMap {
  comment?: CommentView;
  [key: number]: CommentMap;
}

function buildCommentMap(commentViews: CommentView[]) {
  const map: CommentMap = {};

  for (const view of commentViews) {
    let loc = map;
    const [_, ...path] = view.comment.path.split(".");

    while (path.length > 1) {
      const front = path.shift()!;
      loc[front] = loc[front] ?? {};
      loc = loc[front];
    }

    const front = path.shift()!;
    loc[front] = loc[front] ?? {};
    loc[front].comment = view;
  }

  return map;
}

export function PostComments({
  commentViews,
}: {
  commentViews: CommentView[];
}) {
  const commentMap = useMemo(
    () => buildCommentMap(commentViews),
    [commentViews],
  );

  return (
    <>
      {_.entries(commentMap).map(([id, map]) => (
        <PostComment key={id} commentMap={map} level={-1} />
      ))}
    </>
  );
}
