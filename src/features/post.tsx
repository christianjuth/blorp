import { useNavigation } from "one";
import {
  PostComment,
  buildCommentMap,
} from "~/src/components/posts/post-comment";
import { useEffect } from "react";
import { usePost, usePostComments } from "~/src/lib/lemmy";
import { PostCard } from "~/src/components/posts/post";
import { Sidebar } from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";

import { memo, useMemo } from "react";
import { useMedia, View } from "tamagui";
import _ from "lodash";
import { useScrollToTop } from "@react-navigation/native";
import { useRef, useState } from "react";
import {
  CommentReplyContext,
  InlineCommentReply,
} from "../components/comments/comment-reply-modal";
import { useAuth } from "../stores/auth";
import {
  useCustomTabBarHeight,
  useHideTabBar,
} from "../components/nav/bottom-tab-bar";
import { FlashList } from "../components/flashlist";

const MemoedPostComment = memo(PostComment);

const EMPTY_ARR = [];

export function PostComments({
  apId,
  commentViews,
  loadMore,
  onRefresh,
  refreshing,
  opId,
  myUserId,
  communityName,
  commentId,
  postId,
}: {
  apId: string;
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
  postId: number;
}) {
  const media = useMedia();

  const tabBar = useCustomTabBarHeight();

  useHideTabBar();

  const ref = useRef(null);
  useScrollToTop(ref);

  const structured = useMemo(() => {
    const map = buildCommentMap(commentViews, commentId);
    const topLevelItems = _.entries(map).sort(
      ([id1, a], [id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [commentViews]);

  const lastComment = structured.topLevelItems.at(-1);

  let paddingBottom = structured.topLevelItems.length > 0 ? 10 : 20;
  if (media.md) {
    paddingBottom += tabBar.height;
  }

  return (
    <FlashList
      // @ts-expect-error
      ref={ref}
      data={
        ["sidebar", "post", "comment", ...structured.topLevelItems] as const
      }
      renderItem={({ item }) => {
        if (item === "sidebar") {
          return (
            <ContentGutters>
              <View flex={1} />
              {communityName ? (
                <Sidebar communityName={communityName} />
              ) : (
                <></>
              )}
            </ContentGutters>
          );
        }

        if (item === "post") {
          return (
            <ContentGutters>
              <PostCard apId={apId} featuredContext="community" detailView />
              <></>
            </ContentGutters>
          );
        }

        if (item === "comment") {
          return (
            <ContentGutters>
              <View flex={1}>
                <InlineCommentReply postId={postId} />
              </View>
              <></>
            </ContentGutters>
          );
        }

        return (
          <ContentGutters>
            <MemoedPostComment
              postApId={apId}
              commentMap={item[1]}
              level={0}
              opId={opId}
              myUserId={myUserId}
              noBorder={item[0] === lastComment?.[0]}
              communityName={communityName}
            />
            <></>
          </ContentGutters>
        );
      }}
      keyExtractor={(id) => (typeof id === "string" ? id : id[0])}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        paddingBottom,
      }}
      stickyHeaderIndices={[0]}
      onRefresh={onRefresh}
      refreshing={refreshing}
      estimatedItemSize={450}
    />
  );
}

export function Post({
  apId,
  communityName,
  commentPath,
}: {
  apId?: string;
  communityName?: string;
  commentPath?: string;
}) {
  const decodedApId = apId ? decodeURIComponent(apId) : undefined;

  const [commentId] = commentPath?.split(".") ?? [];

  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );
  const nav = useNavigation();

  const post = usePost({
    ap_id: decodedApId,
  });

  const comments = usePostComments({
    post_id: post.data?.post.id,
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
            return -1;
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

  if (!post.data || !decodedApId) {
    return null;
  }

  return (
    <CommentReplyContext postId={post.data.post.id}>
      <PostComments
        commentViews={allComments}
        apId={decodedApId}
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
        postId={post.data.post.id}
      />
    </CommentReplyContext>
  );
}
