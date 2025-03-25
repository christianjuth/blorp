import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
// import { CommunityBanner } from "../components/communities/community-banner";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useEffect, useMemo, useRef } from "react";
// import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { useCommunity, useMostRecentPost, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { RefreshButton } from "../components/ui/button";
import { isNotNull } from "../lib/utils";
import { usePostsStore } from "../stores/posts";
import _ from "lodash";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { useParams } from "react-router";
import { CommunityBanner } from "../components/communities/community-banner";
import { useRecentCommunitiesStore } from "../stores/recent-communities";

import { Haptics, ImpactStyle } from "@capacitor/haptics";

const EMPTY_ARR = [];

const SIDEBAR_MOBILE = "sidebar-mobile";
const BANNER = "banner";
const POST_SORT_BAR = "post-sort-bar";

type Item =
  | typeof SIDEBAR_MOBILE
  | typeof BANNER
  | typeof POST_SORT_BAR
  | PostProps;

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export function CommunityFeed() {
  const { communityName } = useParams<{ communityName: string }>();

  const posts = usePosts({
    community_name: communityName,
  });

  const mostRecentPost = useMostRecentPost({
    community_name: communityName,
  });

  const community = useCommunity({
    name: communityName,
  });

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community_view.community);
    }
  }, [community.data]);

  // const tabBar = useCustomTabBarHeight();

  // const ref = useRef<FlashList<any>>(null);
  // useScrollToTop(ref);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView, "community") : null;
      })
      .filter(isNotNull);

    return [BANNER, SIDEBAR_MOBILE, POST_SORT_BAR, ...postViews] as const;
  }, [posts.data?.pages, postCache]);

  const firstPost = posts.data?.pages[0]?.posts[0];
  const hasNewPost = mostRecentPost?.data?.post.ap_id !== firstPost;

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });

    if (!isRefetching) {
      Promise.all([refetch(), mostRecentPost.refetch()]).finally(() => {
        event.detail.complete();
      });
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <ContentGutters data-tauri-drag-region>
            <>
              <IonButtons slot="start">
                <IonBackButton text="" />
              </IonButtons>
              <IonTitle data-tauri-drag-region>{communityName}</IonTitle>
            </>
          </ContentGutters>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <FlashList<Item>
            className="h-full ion-content-scroll-host"
            // ref={ref}
            data={data}
            renderItem={({ item }) => {
              if (item === SIDEBAR_MOBILE) {
                return communityName ? (
                  <ContentGutters>
                    {/* <SmallScreenSidebar communityName={communityName} /> */}
                    <></>
                  </ContentGutters>
                ) : (
                  <></>
                );
              }

              if (item === BANNER) {
                return (
                  <ContentGutters className="max-md:hidden pt-3">
                    <CommunityBanner communityName={communityName} />
                    <></>
                  </ContentGutters>
                );
              }

              if (item === POST_SORT_BAR) {
                return null;
                // return (
                //   <ContentGutters>
                //     <XStack
                //       ai="center"
                //       gap="$3"
                //       flex={1}
                //       py="$2"
                //       bbc="$color3"
                //       bbw={1}
                //       $md={{
                //         bbw: 0.5,
                //         px: "$3",
                //         py: "$1.5",
                //       }}
                //     >
                //       <PostSortBar />
                //       {hasNewPost && (
                //         <RefreshButton
                //           onPress={() => {
                //             ref.current?.scrollToOffset({
                //               offset: 0,
                //             });
                //             refetch();
                //           }}
                //         />
                //       )}
                //     </XStack>
                //     <></>
                //   </ContentGutters>
                // );
              }

              return <Post {...item} />;
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            stickyHeaderIndices={[2]}
            estimatedItemSize={475}
          />
        </PostReportProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          {communityName && <CommunitySidebar communityName={communityName} />}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
