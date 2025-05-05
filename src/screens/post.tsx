import { PostComment } from "@/src/components/posts/post-comment";
import { buildCommentMap } from "../lib/comment-map";
import { useEffect } from "react";
import { usePost, useComments, useCommunity } from "@/src/lib/lemmy/index";
import {
  PostBottomBar,
  FeedPostCard,
  PostProps,
  getPostProps,
  PostCardSkeleton,
} from "@/src/components/posts/post";
import { CommunitySidebar } from "@/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";

import { memo, useMemo } from "react";
import _ from "lodash";
import { useState } from "react";
import {
  InlineCommentReply,
  useInlineCommentReplyState,
} from "../components/comments/comment-reply-modal";
import { useAuth } from "../stores/auth";
import { VirtualList } from "../components/virtual-list";
import { PostReportProvider } from "../components/posts/post-report";
import { usePostsStore } from "../stores/posts";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useParams } from "@/src/routing/index";
import { UserDropdown } from "../components/nav";
import { PageTitle } from "../components/page-title";
import { useMedia, useTheme } from "../lib/hooks";
import { NotFound } from "./not-found";
import { CommentSkeleton } from "../components/comments/comment-skeleton";
import { useLinkContext } from "../routing/link-context";

const MemoedPostComment = memo(PostComment);

const EMPTY_ARR: never[] = [];

function useDelayedReady(delay: number) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIsReady(true), delay);
    return () => clearTimeout(id);
  }, []);
  return isReady;
}

const MemoedPostCard = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} detailView />
    <></>
  </ContentGutters>
));

export default function Post() {
  const theme = useTheme();
  const media = useMedia();
  const linkCtx = useLinkContext();
  const {
    communityName,
    post: apId,
    comment: commentPath,
  } = useParams(
    `${linkCtx.root}c/:communityName/posts/:post/comments/:comment`,
  );

  const decodedApId = apId ? decodeURIComponent(apId) : undefined;

  const commentPathArr = commentPath?.split(".") ?? [];
  const [commentId] = commentPathArr;
  const highlightCommentId = commentPathArr.at(-1);

  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );

  const community = useCommunity({
    name: communityName,
  });
  const modApIds = community.data?.moderators.map((m) => m.moderator.actor_id);
  const postQuery = usePost({
    ap_id: decodedApId,
  });

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) =>
    decodedApId ? s.posts[getCachePrefixer()(decodedApId)]?.data : null,
  );

  const parentId = commentId ? +commentId : undefined;

  const comments = useComments({
    post_id: post?.post.id,
    parent_id: parentId,
  });

  const isReady = useDelayedReady(500);

  const allComments = useMemo(
    () =>
      comments.data?.pages && isReady
        ? comments.data.pages.map((p) => p.comments).flat()
        : EMPTY_ARR,
    [comments.data?.pages, isReady],
  );

  const structured = useMemo(() => {
    if (!isReady) {
      return null;
    }
    const map = buildCommentMap(allComments, commentId);
    const topLevelItems = _.entries(map).sort(
      ([_id1, a], [_id2, b]) => a.sort - b.sort,
    );
    return { map, topLevelItems };
  }, [allComments, isReady, commentId]);

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

  const data = useMemo(
    () => (structured ? structured.topLevelItems : EMPTY_ARR),
    [structured],
  );

  const mobleReply = useInlineCommentReplyState();
  const reply = useInlineCommentReplyState();

  if (!decodedApId || (postQuery.isError && !post)) {
    return <NotFound />;
  }

  const opId = post?.creator.id;

  return (
    <IonPage>
      <PageTitle>{post?.post.name ?? "Post"}</PageTitle>
      <IonHeader>
        <IonToolbar
          data-tauri-drag-region
          className="max-md:text-white"
          style={
            media.maxMd && theme === "light"
              ? {
                  "--background": "var(--color-brand-secondary)",
                  "--border-color": "var(--color-brand-secondary)",
                }
              : undefined
          }
        >
          <IonButtons slot="start" className="gap-2">
            <IonBackButton text="" />
            <span className="font-bold max-w-[calc(100vw-180px)] overflow-hidden overflow-ellipsis md:hidden max-md:text-white">
              {communityName}
            </span>
          </IonButtons>
          <IonTitle className="max-md:hidden">{communityName}</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <VirtualList
            className="h-full ion-content-scroll-host pb-4"
            data={data}
            header={[
              post ? (
                <MemoedPostCard
                  {...getPostProps(post, {
                    featuredContext: "community",
                    modApIds,
                    detailView: true,
                  })}
                />
              ) : (
                <ContentGutters className="px-0">
                  <PostCardSkeleton hideImage={false} detailView />
                  <></>
                </ContentGutters>
              ),
              post && (
                <>
                  <ContentGutters className="px-0">
                    <PostBottomBar
                      apId={decodedApId}
                      commentsCount={post.counts.comments}
                      onReply={() => mobleReply.setIsEditing(true)}
                    />
                    <></>
                  </ContentGutters>
                  <InlineCommentReply
                    state={mobleReply}
                    postId={post.post.id}
                    queryKeyParentId={parentId}
                    autoFocus={reply.isEditing}
                    mode="mobile-only"
                  />
                </>
              ),
              post && !commentPath && (
                <ContentGutters className="md:py-3">
                  <div className="flex-1">
                    <InlineCommentReply
                      state={reply}
                      postId={post.post.id}
                      queryKeyParentId={parentId}
                      autoFocus={reply.isEditing}
                      mode="desktop-only"
                    />
                    <button
                      className="md:hidden py-2 px-3 my-4 border rounded-2xl w-full text-left shadow-xs text-muted-foreground text-sm"
                      onClick={() => mobleReply.setIsEditing(true)}
                    >
                      Add a comment
                    </button>
                  </div>
                  <></>
                </ContentGutters>
              ),
            ]}
            renderItem={({ item }) => (
              <MemoedPostComment
                highlightCommentId={highlightCommentId}
                postApId={decodedApId}
                queryKeyParentId={parentId}
                commentMap={item[1]}
                level={0}
                opId={opId}
                myUserId={myUserId}
                communityName={communityName}
                modApIds={modApIds}
                singleCommentThread={!!commentPath}
              />
            )}
            placeholder={
              comments.isPending || !isReady ? (
                <ContentGutters className="px-0">
                  <CommentSkeleton />
                  <></>
                </ContentGutters>
              ) : undefined
            }
            numPlaceholders={
              _.isNumber(post?.counts.comments)
                ? Math.max(1, post.counts.comments)
                : undefined
            }
            onEndReached={loadMore}
            estimatedItemSize={450}
            stickyHeaderIndices={[1]}
            refresh={refresh}
          />
        </PostReportProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0 z-10">
          <div className="flex-1" />
          {communityName && (
            <CommunitySidebar
              communityName={communityName}
              actorId={community.data?.community_view.community.actor_id}
            />
          )}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
