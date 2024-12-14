import { CommentView } from "lemmy-js-client";
import { View, Text, XStack, YStack } from "tamagui";
import { Markdown } from "~/src/components/markdown";
import _ from "lodash";
import { Byline } from "../byline";
import { CommentVoting } from "../comments/comment-buttons";

export function PostComment({
  commentMap,
  level,
  opId,
}: {
  commentMap: CommentMap;
  level: number;
  opId: number | undefined;
}) {
  const { comment: commentView, sort, ...rest } = commentMap;
  if (!commentView) {
    return null;
  }

  const sorted = _.entries(_.omit(rest)).sort(
    ([id1, a], [id2, b]) => a.sort - b.sort,
  );

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

  const comment = commentView.comment;
  const creator = commentView.creator;
  const avatar = creator.avatar;

  const hideContent = comment.removed || comment.deleted;

  return (
    <YStack
      mt={level === 0 ? "$2" : undefined}
      py={level === 0 ? "$3" : "$2"}
      bg="$color1"
      $md={{
        px: level === 0 ? "$2.5" : undefined,
      }}
      flex={1}
      w="100%"
    >
      <Byline
        avatar={avatar}
        author={creator.name}
        publishedDate={comment.published}
        highlightAuthor={creator.id === opId}
      />

      <View
        blw={2}
        blc={color}
        p="$2"
        pr={0}
        pb={0}
        mt="$1"
        ml={9}
        ai="flex-start"
      >
        {comment.deleted && <Text fontStyle="italic">deleted</Text>}
        {comment.removed && <Text fontStyle="italic">removed</Text>}

        {!hideContent && <Markdown markdown={comment.content} />}

        <XStack jc="flex-end" w="100%" mb="$1">
          <CommentVoting postView={commentView} />
        </XStack>

        {sorted.map(([id, map], i) => (
          <PostComment
            key={id}
            commentMap={map}
            level={level + 1}
            opId={opId}
          />
        ))}
      </View>
    </YStack>
  );
}

interface CommentMap {
  comment?: CommentView;
  sort: number;
  [key: number]: CommentMap;
}

interface CommentMapTopLevel {
  [key: number]: CommentMap;
}

export function buildCommentMap(commentViews: CommentView[]) {
  const map: CommentMapTopLevel = {};

  let i = 0;
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
    loc[front].sort = i++;
  }

  return map;
}
