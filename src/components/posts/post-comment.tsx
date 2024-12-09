import { CommentView } from "lemmy-js-client";
import { memo, useMemo } from "react";
import { View, Text, Avatar, useTheme, useThemeName } from "tamagui";
import { Markdown } from "~/src/components/markdown";
import _ from "lodash";
import { FlatList } from "react-native";
import { Byline } from "../byline";
import { FeedGutters } from "../feed-gutters";

function PostComment({
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
    <View
      mt={level === 0 ? "$2" : undefined}
      py={level === 0 ? "$3" : "$2"}
      bg="$color1"
      $sm={{
        px: level === 0 ? "$2.5" : undefined,
      }}
      flex={1}
    >
      <Byline
        avatar={avatar}
        author={creator.name}
        publishedDate={comment.published}
        highlightAuthor={creator.id === opId}
      />

      <View blw={2} blc={color} p="$2" mt="$1" ml={9} gap="$2">
        {comment.deleted && <Text fontStyle="italic">deleted</Text>}
        {comment.removed && <Text fontStyle="italic">removed</Text>}

        {!hideContent && <Markdown markdown={comment.content} />}
        {sorted.map(([id, map]) => (
          <PostComment
            key={id}
            commentMap={map}
            level={level + 1}
            opId={opId}
          />
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
  opId,
}: {
  commentViews: CommentView[];
  header: JSX.Element | null;
  loadMore: () => any;
  opId: number | undefined;
}) {
  const theme = useTheme();

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
        <FeedGutters>
          <Memoed commentMap={row.item[1]} level={0} opId={opId} />
          <></>
        </FeedGutters>
      )}
      keyExtractor={([id]) => id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        backgroundColor: theme.color1.val,
      }}
    />
  );
}
