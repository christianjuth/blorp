import { CommentView } from "lemmy-js-client";
import { useMemo } from "react";
import { View, Text, Avatar } from "tamagui";
import { Markdown } from "~/src/components/markdown";
import _ from "lodash";
import { RelativeTime } from "~/src/components/relative-time";

function PostComment({
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
      color = "#FF2A33";
      break;
    case 1:
      color = "#F98C1D";
      break;
    case 2:
      color = "#DAB84D";
      break;
    case 3:
      color = "#459E6F";
      break;
    case 4:
      color = "#3088C1";
      break;
    case 5:
      color = "purple";
      break;
  }

  const creator = commentView.creator;
  const avatar = creator.avatar;

  return (
    <View mt={level === -1 ? "$2" : undefined} pl="$2" py="$2" bg="$gray1">
      <View
        blw={level >= 0 ? "$1" : undefined}
        blc={level >= 0 ? color : undefined}
        p={level >= 0 ? "$2" : undefined}
        gap="$2"
      >
        <View dsp="flex" fd="row" ai="center">
          {avatar && (
            <Avatar size="$1.5" mr="$2">
              <Avatar.Image src={avatar} />
            </Avatar>
          )}
          <Text fontWeight={500} color="$color11">
            {commentView.creator.name} •{" "}
          </Text>
          <RelativeTime time={commentView.comment.published} color="$color11" />
        </View>

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
