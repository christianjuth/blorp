import { useNavigation } from "one";
import { PostComment } from "~/src/components/posts/post-comment";
import { buildCommentMap } from "../lib/comment-map";
import { useEffect } from "react";
import { useCommunity, usePost, usePostComments } from "~/src/lib/lemmy/index";
import { PostCard } from "~/src/components/posts/post";
import { CommunitySidebar } from "~/src/components/communities/community-sidebar";
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
import { PostReportProvider } from "../components/posts/post-report";
import { usePostsStore } from "../stores/posts";

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
  isReady,
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
  isReady?: boolean;
}) {
  const media = useMedia();

  const tabBar = useCustomTabBarHeight();

  useHideTabBar();

  const ref = useRef(null);
  useScrollToTop(ref);

  const structured = useMemo(() => {
    if (!isReady) {
      return null;
    }
    const map = buildCommentMap(commentViews, commentId);
    const topLevelItems = _.entries(map).sort(
      ([id1, a], [id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [commentViews]);

  const lastComment = structured?.topLevelItems.at(-1);

  let paddingBottom =
    structured && structured.topLevelItems.length > 0 ? 10 : 20;
  if (media.md) {
    paddingBottom += tabBar.height;
  }

  return (
    <FlashList
      // @ts-expect-error
      ref={ref}
      data={
        [
          "post",
          "comment",
          ...(structured ? structured.topLevelItems : EMPTY_ARR),
        ] as const
      }
      renderItem={({ item }) => {
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
  isReady,
}: {
  apId?: string;
  communityName?: string;
  commentPath?: string;
  isReady?: boolean;
}) {
  const decodedApId = apId ? decodeURIComponent(apId) : undefined;

  const [commentId] = commentPath?.split(".") ?? [];

  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );
  const nav = useNavigation();

  const postQuery = usePost({
    ap_id: decodedApId,
  });
  const post = usePostsStore((s) =>
    decodedApId ? s.posts[decodedApId]?.data : null,
  );

  useCommunity({
    name: communityName,
  });

  const comments = usePostComments({
    post_id: post?.post.id,
    parent_id: commentId ? +commentId : undefined,
    limit: 50,
    type_: "All",
    max_depth: 6,
    saved_only: false,
  });

  const communityTitle = post?.community?.title;

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
    if (refreshing || !isReady) {
      return;
    }
    setRefreshing(true);
    await Promise.all([postQuery.refetch(), comments.refetch()]);
    setRefreshing(false);
  };

  if (!post || !decodedApId) {
    return null;
  }

  return (
    <PostReportProvider>
      <CommentReplyContext postId={post.post.id}>
        <ContentGutters>
          <View flex={1} />
          <View>
            {communityName && (
              <CommunitySidebar communityName={communityName} />
            )}
          </View>
        </ContentGutters>

        <PostComments
          commentViews={allComments}
          apId={decodedApId}
          loadMore={() => {
            if (comments.hasNextPage && !comments.isFetchingNextPage) {
              comments.fetchNextPage();
            }
          }}
          opId={post.creator?.id}
          myUserId={myUserId}
          communityName={communityName}
          onRefresh={refresh}
          refreshing={refreshing}
          commentId={commentId}
          postId={post.post.id}
          isReady={isReady}
        />
      </CommentReplyContext>
    </PostReportProvider>
  );
}
