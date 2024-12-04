import { CommentView } from "lemmy-js-client";
import { memo, useMemo } from "react";
import { View, Text, Avatar, useTheme, useThemeName } from "tamagui";
import { Markdown } from "~/src/components/markdown";
import _ from "lodash";
import { RelativeTime } from "~/src/components/relative-time";
import { FlatList } from "react-native";

function PostComment({
  commentMap,
  level,
}: {
  commentMap: CommentMap;
  level: number;
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
    <View mt={level === -1 ? "$2" : undefined} pl="$2" py="$2" bg="$gray1">
      <View
        blw={level >= 0 ? "$1" : undefined}
        blc={level >= 0 ? color : undefined}
        p={level >= 0 ? "$2" : undefined}
        gap="$2"
      >
        <View dsp="flex" fd="row" ai="center">
          <Avatar size="$1.5" mr="$2">
            <Avatar.Image src={avatar} borderRadius="$12" />
            <Avatar.Fallback
              backgroundColor="$color8"
              borderRadius="$12"
              ai="center"
              jc="center"
            >
              <Text fontSize="$1">
                {creator.name?.substring(0, 1).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <Text fontWeight={500} color="$color11">
            {commentView.creator.name} •{" "}
          </Text>
          <RelativeTime time={commentView.comment.published} color="$color11" />
        </View>

        {comment.deleted && <Text fontStyle="italic">deleted</Text>}
        {comment.removed && <Text fontStyle="italic">removed</Text>}

        {!hideContent && <Markdown markdown={comment.content} />}
        {sorted.map(([id, map]) => (
          <PostComment key={id} commentMap={map} level={level + 1} />
        ))}
      </View>
    </View>
  );
}

const Memoed = memo(PostComment);

interface CommentMap {
  comment?: CommentView;
  sort: number;
  [key: number]: CommentMap;
}

interface CommentMapTopLevel {
  [key: number]: CommentMap;
}

function buildCommentMap(commentViews: CommentView[]) {
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

export function PostComments({
  header,
  commentViews,
  loadMore,
}: {
  commentViews: CommentView[];
  header: JSX.Element;
  loadMore: () => any;
}) {
  const theme = useTheme();
  const isDark = useThemeName() === "dark";

  const structured = useMemo(() => {
    const map = buildCommentMap(commentViews);
    const topLevelItems = _.entries(map).sort(
      ([id1, a], [id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [commentViews]);

  return (
    <FlatList
      ListHeaderComponent={header}
      data={structured.topLevelItems}
      renderItem={(row) => (
        <View key={row.item[0]} maxWidth={800} mx="auto" w="100%">
          <Memoed commentMap={row.item[1]} level={-1} />
        </View>
      )}
      keyExtractor={([id]) => id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        backgroundColor: isDark ? theme.color1.val : theme.color6.val,
      }}
    />
  );
}
