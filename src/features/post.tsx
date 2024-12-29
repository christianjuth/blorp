import { useFocusEffect, useNavigation } from "one";
import {
  PostComment,
  buildCommentMap,
} from "~/src/components/posts/post-comment";
import { useEffect } from "react";
import { usePost, usePostComments } from "~/src/lib/lemmy";
import { PostCard } from "~/src/components/posts/post";
import { Sidebar } from "~/src/components/communities/community-sidebar";
import { FeedGutters } from "../components/feed-gutters";
import { memo, useMemo } from "react";
import { useTheme, View, YStack } from "tamagui";
import _ from "lodash";
import { FlatList } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import { useRef, useState } from "react";
import { useCustomHeaderHeight } from "../components/nav/hooks";
import {
  CommentReplyContext,
  InlineCommentReply,
} from "../components/comments/comment-reply-modal";
import { useAuth } from "../stores/auth";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";

const MemoedPostComment = memo(PostComment);

const EMPTY_ARR = [];

export function PostComments({
  postId,
  commentViews,
  loadMore,
  onRefresh,
  refreshing,
  opId,
  myUserId,
  communityName,
  commentId,
}: {
  postId: number | string;
  commentViews: {
    path: string;
  }[];
  loadMore: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  opId: number | undefined;
  myUserId: number | undefined;
  communityName?: string;
  commentId?: string;
}) {
  const header = useCustomHeaderHeight();
  const tabBar = useCustomTabBarHeight();

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

  const ref = useRef(null);
  useScrollToTop(ref);

  const theme = useTheme();

  const structured = useMemo(() => {
    const map = buildCommentMap(commentViews, commentId);
    const topLevelItems = _.entries(map).sort(
      ([id1, a], [id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [commentViews]);

  return (
    <FlatList
      ref={ref}
      data={["sidebar", "post", ...structured.topLevelItems] as const}
      renderItem={({ item }) => {
        if (item === "sidebar") {
          return (
            <FeedGutters pt={header.height}>
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
              <YStack flex={1}>
                <PostCard postId={postId} detailView />
                <InlineCommentReply postId={postId} />
              </YStack>
              <></>
            </FeedGutters>
          );
        }

        return (
          <FeedGutters>
            <MemoedPostComment
              commentMap={item[1]}
              level={0}
              opId={opId}
              myUserId={myUserId}
              communityName={communityName}
            />
            <></>
          </FeedGutters>
        );
      }}
      keyExtractor={(id) => (typeof id === "string" ? id : id[0])}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        backgroundColor: theme.background.val,
        paddingBottom: tabBar.height,
      }}
      stickyHeaderIndices={[0]}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}

export function Post({
  postId,
  communityName,
  commentPath,
}: {
  postId?: string;
  communityName?: string;
  commentPath?: string;
}) {
  const [commentId] = commentPath?.split(".") ?? [];

  const myUserId = useAuth((s) => s.site?.my_user?.local_user_view.person.id);
  const nav = useNavigation();

  const post = usePost({
    id: postId,
    communityName,
  });

  const comments = usePostComments({
    post_id: postId ? parseInt(postId) : undefined,
    parent_id: commentId ? +commentId : undefined,
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
    ? comments.data.pages
        .map((p) => p.comments)
        .flat()
        .sort((a, b) => {
          if (b.creatorId === myUserId) {
            return 1;
          }
          return 0;
        })
    : EMPTY_ARR;

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    await Promise.all([post.refetch(), comments.refetch()]);
    setRefreshing(false);
  };

  if (!post.data || !postId) {
    return null;
  }

  return (
    <CommentReplyContext postId={+postId}>
      <PostComments
        commentViews={allComments}
        postId={postId}
        loadMore={() => {
          if (comments.hasNextPage && !comments.isFetchingNextPage) {
            comments.fetchNextPage();
          }
        }}
        opId={post.data?.creator?.id}
        myUserId={myUserId}
        communityName={communityName}
        onRefresh={refresh}
        refreshing={refreshing}
        commentId={commentId}
      />
    </CommentReplyContext>
  );
}
