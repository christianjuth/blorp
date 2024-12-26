import { useFocusEffect, useNavigation } from "one";
import {
  PostComment,
  buildCommentMap,
} from "~/src/components/posts/post-comment";
import { useEffect } from "react";
import { usePost, usePostComments } from "~/src/lib/lemmy";
import { PostDetail } from "~/src/components/posts/post-details";
import { Sidebar } from "~/src/components/communities/community-sidebar";
import { FeedGutters } from "../components/feed-gutters";

import { CommentView } from "lemmy-js-client";
import { memo, useMemo } from "react";
import { useTheme, View } from "tamagui";
import _ from "lodash";
import { FlashList } from "@shopify/flash-list";
import { useScrollToTop } from "@react-navigation/native";
import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomHeaderHeight } from "../components/nav/hooks";

const MemoedPostComment = memo(PostComment);

const EMPTY_ARR = [];

export function PostComments({
  postId,
  commentViews,
  loadMore,
  onRefresh,
  refreshing,
  opId,
  communityName,
}: {
  postId: number | string;
  commentViews: CommentView[];
  loadMore: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  opId: number | undefined;
  communityName?: string;
}) {
  const header = useCustomHeaderHeight();

  const navigation = useNavigation();
  useFocusEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });

    return () => {
      // Reset the tab bar visibility when leaving the screen
      parent?.setOptions({
        tabBarStyle: { display: "flex", backgroundColor: "transparent" },
      });
    };
  });

  const insets = useSafeAreaInsets();

  const ref = useRef(null);
  useScrollToTop(ref);

  const theme = useTheme();

  const structured = useMemo(() => {
    const map = buildCommentMap(commentViews);
    const topLevelItems = _.entries(map).sort(
      ([id1, a], [id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [commentViews]);

  return (
    <FlashList
      ref={ref}
      data={["sidebar", "post", ...structured.topLevelItems] as const}
      renderItem={({ item }) => {
        if (item === "sidebar") {
          return (
            <FeedGutters>
              <View flex={1} />
              {communityName ? (
                <Sidebar communityName={communityName} />
              ) : (
                <></>
              )}
            </FeedGutters>
          );
        }

        if (item === "post") {
          return (
            <FeedGutters>
              <PostDetail postId={postId} />
              <></>
            </FeedGutters>
          );
        }

        return (
          <FeedGutters>
            <MemoedPostComment commentMap={item[1]} level={0} opId={opId} />
            <></>
          </FeedGutters>
        );
      }}
      keyExtractor={(id) => (typeof id === "string" ? id : id[0])}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        backgroundColor: theme.background.val,
      }}
      stickyHeaderIndices={[0]}
      contentInset={{
        top: header.height,
        bottom: insets.bottom,
      }}
      scrollIndicatorInsets={{
        top: header.height,
        bottom: insets.bottom,
      }}
      automaticallyAdjustsScrollIndicatorInsets={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      estimatedItemSize={450}
    />
  );
}

export function Post({
  postId,
  communityName,
}: {
  postId?: string;
  communityName?: string;
}) {
  const nav = useNavigation();

  const post = usePost({
    id: postId,
    communityName,
  });

  const comments = usePostComments({
    post_id: postId ? parseInt(postId) : undefined,
    limit: 50,
    type_: "All",
    max_depth: 6,
    saved_only: false,
  });

  const communityTitle = post.data?.community?.title;

  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  const allComments = comments.data
    ? comments.data.pages.map((p) => p.comments).flat()
    : EMPTY_ARR;

  if (!post.data || !postId) {
    return null;
  }

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    await Promise.all([post.refetch(), comments.refetch()]);
    setRefreshing(false);
  };

  return (
    <PostComments
      commentViews={allComments}
      postId={postId}
      loadMore={() => {
        if (comments.hasNextPage && !comments.isFetchingNextPage) {
          comments.fetchNextPage();
        }
      }}
      opId={post.data?.creator?.id}
      communityName={communityName}
      onRefresh={refresh}
      refreshing={refreshing}
    />
  );
}
