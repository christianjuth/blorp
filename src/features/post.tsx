import { PostComment } from "~/src/components/posts/post-comment";
import { buildCommentMap } from "../lib/comment-map";
import { useEffect } from "react";
import { useCommunity, usePost, useComments } from "~/src/lib/lemmy/index";
import {
  PostBottomBar,
  FeedPostCard,
  PostProps,
  getPostProps,
} from "~/src/components/posts/post";
import { CommunitySidebar } from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";

import { memo, useMemo } from "react";
import _ from "lodash";
import { useRef, useState } from "react";
import {
  CommentReplyContext,
  InlineCommentReply,
} from "../components/comments/comment-reply-modal";
import { useAuth } from "../stores/auth";
import { FlashList } from "../components/flashlist";
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
import { useParams } from "react-router";
import { UserDropdown } from "../components/nav";

const MemoedPostComment = memo(PostComment);

const EMPTY_ARR = [];

const MemoedPostCard = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} detailView />
    <></>
  </ContentGutters>
));

export default function Post({ commentPath }: { commentPath?: string }) {
  const { communityName } = useParams<{ communityName: string }>();

  // const ref = useRef(null);
  // useScrollToTop(ref);

  const { post: apId } = useParams<{ post: string }>();

  const decodedApId = apId ? decodeURIComponent(apId) : undefined;

  const [commentId] = commentPath?.split(".") ?? [];

  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );

  const postQuery = usePost({
    ap_id: decodedApId,
  });

  const post = usePostsStore((s) =>
    decodedApId ? s.posts[decodedApId]?.data : null,
  );

  const parentId = commentId ? +commentId : undefined;

  const comments = useComments({
    post_id: post?.post.id,
    parent_id: parentId,
  });

  const communityTitle = post?.community?.slug;

  const isReady = true;

  const allComments = useMemo(
    () =>
      comments.data?.pages && isReady
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
      ([_id1, a], [_id2, b]) => a.sort - b.sort,
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

  const data = useMemo(
    () =>
      [
        "post",
        "post-bottom-bar",
        "comment",
        ...(structured ? structured.topLevelItems : EMPTY_ARR),
      ] as const,
    [structured],
  );

  if (!post || !decodedApId) {
    return null;
  }

  const opId = post.creator.id;

  const lastComment = structured?.topLevelItems.at(-1);
  // let paddingBottom =
  //   structured && structured.topLevelItems.length > 0 ? 10 : 20;
  // if (media.md) {
  //   paddingBottom += tabBar.height;
  // }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>{communityTitle}</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <CommentReplyContext
            postId={post.post.id}
            queryKeyParentId={parentId}
          >
            <ContentGutters>
              <div className="flex-1" />
              <div>
                {/* {communityName && ( */}
                {/*   <CommunitySidebar communityName={communityName} /> */}
                {/* )} */}
              </div>
            </ContentGutters>

            <FlashList
              className="h-full ion-content-scroll-host"
              // ref={ref}
              data={data}
              renderItem={({ item }) => {
                if (item === "post") {
                  return <MemoedPostCard {...getPostProps(post)} />;
                }

                if (item === "post-bottom-bar") {
                  return null;
                  // return (
                  //   <ContentGutters>
                  //     <PostBottomBar
                  //       apId={decodedApId}
                  //       commentsCount={post.counts.comments}
                  //     />
                  //     <></>
                  //   </ContentGutters>
                  // );
                }

                if (item === "comment") {
                  return null;
                  // return (
                  //   <ContentGutters>
                  //     <div
                  //     // flex={1} pt="$3"
                  //     >
                  //       <InlineCommentReply
                  //         postId={post.post.id}
                  //         queryKeyParentId={parentId}
                  //       />
                  //     </div>
                  //     <></>
                  //   </ContentGutters>
                  // );
                }

                return (
                  <ContentGutters>
                    <span>{item[0]}</span>
                    {/* <MemoedPostComment */}
                    {/*   postApId={decodedApId} */}
                    {/*   queryKeyParentId={parentId} */}
                    {/*   commentMap={item[1]} */}
                    {/*   level={0} */}
                    {/*   opId={opId} */}
                    {/*   myUserId={myUserId} */}
                    {/*   noBorder={item[0] === lastComment?.[0]} */}
                    {/*   communityName={communityName} */}
                    {/* /> */}
                    <></>
                  </ContentGutters>
                );
              }}
              // keyExtractor={(id) => (typeof id === "string" ? id : id[0])}
              onEndReached={loadMore}
              // onEndReachedThreshold={0.5}
              // onRefresh={refresh}
              // refreshing={refreshing}
              estimatedItemSize={450}
              stickyHeaderIndices={[1]}
            />
          </CommentReplyContext>
        </PostReportProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          {communityName && <CommunitySidebar communityName={communityName} />}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
