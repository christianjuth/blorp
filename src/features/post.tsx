import { PostComment } from "@/src/components/posts/post-comment";
import { buildCommentTree } from "../lib/comment-tree";
import { Fragment, useEffect } from "react";
import { usePost, useComments, useCommunity } from "@/src/lib/api/index";
import {
  PostBottomBar,
  FeedPostCard,
  PostProps,
  PostCardSkeleton,
} from "@/src/components/posts/post";
import { CommunitySidebar } from "@/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { memo, useMemo } from "react";
import _ from "lodash";
import { useState } from "react";
import {
  CommentReplyProvider,
  InlineCommentReply,
  useCommentEditingState,
  useLoadCommentIntoEditor,
} from "../components/comments/comment-reply-modal";
import { getAccountSite, useAuth } from "../stores/auth";
import { VirtualList } from "../components/virtual-list";
import { PostReportProvider } from "../components/posts/post-report";
import { usePostsStore } from "../stores/posts";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { resolveRoute, useParams } from "@/src/routing/index";
import { UserDropdown } from "../components/nav";
import { PageTitle } from "../components/page-title";
import { useIonPageElement, useMedia, useTheme } from "../lib/hooks";
import { NotFound } from "./not-found";
import { CommentSkeleton } from "../components/comments/comment-skeleton";
import { useLinkContext } from "../routing/link-context";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";

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

function ReplyToPost({ postApId }: { postApId: string }) {
  const postReplyState = useCommentEditingState({
    postApId,
  });
  const loadCommentIntoEditor = useLoadCommentIntoEditor();
  const media = useMedia();
  return (
    <ContentGutters className="md:py-3" key="post-reply">
      <div className="flex-1">
        {postReplyState && media.md ? (
          <InlineCommentReply state={postReplyState} autoFocus={media.md} />
        ) : (
          <button
            className="py-2 px-3 my-4 border rounded-2xl w-full text-left shadow-xs text-muted-foreground text-sm"
            onClick={() =>
              loadCommentIntoEditor({
                postApId,
              })
            }
          >
            Add a comment
          </button>
        )}
      </div>
      <></>
    </ContentGutters>
  );
}

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
  const [search, setSearch] = useState("");

  const decodedApId = apId ? decodeURIComponent(apId) : undefined;

  const commentPathArr = commentPath?.split(".") ?? [];
  const [commentId] = commentPathArr;
  const highlightCommentId = commentPathArr.at(-1);

  const myUserId = useAuth((s) => getAccountSite(s.getSelectedAccount()))?.me
    ?.id;

  const community = useCommunity({
    name: communityName,
  });
  const modApIds = community.data?.mods.map((m) => m.apId);
  const postQuery = usePost({
    ap_id: decodedApId,
  });

  const adminApIds = useAuth(
    (s) => getAccountSite(s.getSelectedAccount())?.admins,
  )?.map((a) => a.apId);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) =>
    decodedApId ? s.posts[getCachePrefixer()(decodedApId)]?.data : null,
  );

  const parentId = commentId ? +commentId : undefined;

  const comments = useComments({
    postApId: decodedApId,
    parentId: parentId,
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
    const map = buildCommentTree(allComments, commentId);
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

  const pageElement = useIonPageElement();

  const router = useIonRouter();

  if (!decodedApId || (postQuery.isError && !post)) {
    return <NotFound />;
  }

  const opId = post?.creatorId;

  return (
    <IonPage ref={pageElement.ref}>
      <PageTitle>{post?.title ?? "Post"}</PageTitle>
      <IonHeader>
        <IonToolbar
          data-tauri-drag-region
          className="max-md:text-white"
          style={
            media.maxMd
              ? theme === "light"
                ? {
                    "--background": "var(--color-brand-secondary)",
                    "--border-color": "var(--color-brand-secondary)",
                  }
                : {
                    "--border-color": "var(--color-background)",
                  }
              : undefined
          }
        >
          <IonButtons slot="start" className="gap-2">
            <IonBackButton text="" />
            <ToolbarTitle className="md:hidden" size="sm">
              {communityName}
            </ToolbarTitle>
          </IonButtons>
          <form
            className="max-md:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(
                resolveRoute(
                  `${linkCtx.root}c/:communityName/s`,
                  {
                    communityName,
                  },
                  `?s=${search}`,
                ),
              );
            }}
            data-tauri-drag-region
          >
            <IonSearchbar
              className="max-w-md mx-auto"
              placeholder={`Search ${communityName}`}
              value={search}
              onIonInput={(e) => setSearch(e.detail.value ?? "")}
            />
          </form>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <CommentReplyProvider presentingElement={pageElement.element}>
          <PostReportProvider>
            <VirtualList
              keepMountedIndices={[0]}
              className="h-full ion-content-scroll-host"
              data={data}
              header={[
                post ? (
                  <MemoedPostCard
                    key="post-details"
                    apId={post.apId}
                    featuredContext="community"
                    detailView
                    modApIds={modApIds}
                  />
                ) : (
                  <ContentGutters className="px-0" key="post-skeleton">
                    <PostCardSkeleton hideImage={false} detailView />
                    <></>
                  </ContentGutters>
                ),
                post && (
                  <Fragment key="post-bottom-bar">
                    <ContentGutters className="px-0">
                      <PostBottomBar
                        apId={decodedApId}
                        commentsCount={post.commentsCount}
                        onReply={() => {}}
                      />
                      <></>
                    </ContentGutters>
                  </Fragment>
                ),
                post && !commentPath && (
                  <ReplyToPost key="reply-to-post" postApId={post.apId} />
                ),
              ]}
              renderItem={({ item }) => (
                <MemoedPostComment
                  highlightCommentId={highlightCommentId}
                  postApId={decodedApId}
                  queryKeyParentId={parentId}
                  commentTree={item[1]}
                  level={0}
                  opId={opId}
                  myUserId={myUserId}
                  communityName={communityName}
                  modApIds={modApIds}
                  adminApIds={adminApIds}
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
                _.isNumber(post?.commentsCount)
                  ? Math.max(1, post.commentsCount)
                  : undefined
              }
              onEndReached={loadMore}
              estimatedItemSize={450}
              stickyHeaderIndices={[1]}
              refresh={refresh}
            />
          </PostReportProvider>
        </CommentReplyProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0 z-10">
          <div className="flex-1" />
          {communityName && (
            <CommunitySidebar
              communityName={communityName}
              actorId={community.data?.community.apId}
            />
          )}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
