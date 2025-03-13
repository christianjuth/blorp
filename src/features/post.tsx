import { useNavigation } from "one";
import { PostComment } from "~/src/components/posts/post-comment";
import { buildCommentMap } from "../lib/comment-map";
import { useEffect } from "react";
import { useCommunity, usePost, useComments } from "~/src/lib/lemmy/index";
import {
  PostBottomBar,
  DetailPostCard,
  PostProps,
  getPostProps,
} from "~/src/components/posts/post";
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

const MemoedPostCard = memo((props: PostProps) => (
  <ContentGutters>
    <DetailPostCard {...props} />
    <></>
  </ContentGutters>
));

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
  const media = useMedia();
  const tabBar = useCustomTabBarHeight();

  useHideTabBar();

  const ref = useRef(null);
  useScrollToTop(ref);

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

  const comments = useComments({
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

  const allComments = useMemo(
    () =>
      comments.data && isReady
        ? comments.data.pages
            .map((p) => p.comments)
            .flat()
            .sort((a, b) => {
              if (b.creatorId === myUserId) {
                return -1;
              }
              return 0;
            })
        : EMPTY_ARR,
    [comments.data?.pages, isReady],
  );

  const structured = useMemo(() => {
    if (!isReady) {
      return null;
    }
    const map = buildCommentMap(allComments, commentId);
    const topLevelItems = _.entries(map).sort(
      ([id1, a], [id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [allComments, isReady]);

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (refreshing || !isReady) {
      return;
    }
    setRefreshing(true);
    await Promise.all([postQuery.refetch(), comments.refetch()]);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (comments.hasNextPage && !comments.isFetchingNextPage) {
      comments.fetchNextPage();
    }
  };

  if (!post || !decodedApId) {
    return null;
  }

  const opId = post.creator.id;

  const lastComment = structured?.topLevelItems.at(-1);
  let paddingBottom =
    structured && structured.topLevelItems.length > 0 ? 10 : 20;
  if (media.md) {
    paddingBottom += tabBar.height;
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

        {!isReady ? (
          <MemoedPostCard {...getPostProps(post)} />
        ) : (
          <FlashList
            ref={ref}
            data={
              [
                "post",
                "post-bottom-bar",
                "comment",
                ...(structured ? structured.topLevelItems : EMPTY_ARR),
              ] as const
            }
            renderItem={({ item }) => {
              if (item === "post") {
                return <MemoedPostCard {...getPostProps(post)} />;
              }

              if (item === "post-bottom-bar") {
                return (
                  <ContentGutters>
                    <PostBottomBar
                      apId={decodedApId}
                      commentsCount={post.counts.comments}
                    />
                    <></>
                  </ContentGutters>
                );
              }

              if (item === "comment") {
                return (
                  <ContentGutters>
                    <View flex={1} pt="$3">
                      <InlineCommentReply postId={post.post.id} />
                    </View>
                    <></>
                  </ContentGutters>
                );
              }

              return (
                <ContentGutters>
                  <MemoedPostComment
                    postApId={decodedApId}
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
            onRefresh={refresh}
            refreshing={refreshing}
            estimatedItemSize={450}
            stickyHeaderIndices={[1]}
          />
        )}
      </CommentReplyContext>
    </PostReportProvider>
  );
}
