import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import { ContentGutters } from "../components/gutters";
import { memo, useMemo } from "react";
import { useFiltersStore } from "../stores/filters";
import { useMostRecentPost, usePosts } from "../lib/lemmy";
import { usePostsStore } from "../stores/posts";
import _ from "lodash";
import { isNotNull } from "../lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

import { PopularCommunitiesSidebar } from "../components/populat-communities-sidebar";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { FlashList } from "../components/flashlist";
import { UserDropdown } from "../components/nav";
import { HomeFilter, PostSortBar } from "../components/lemmy-sort";
import { useMedia } from "../lib/hooks";

const HEADER = "header";

export const scrollToTop = {
  current: { scrollToOffset: () => {} },
};

type Item = typeof HEADER | PostProps;

const EMPTY_ARR = [];

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export default function HomeFeed() {
  const media = useMedia();
  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const mostRecentPost = useMostRecentPost({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

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
        return postView ? getPostProps(postView, "home") : null;
      })
      .filter(isNotNull);

    return [
      // HEADER,
      ...postViews,
    ] as const;
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
      <IonHeader className="bg-background dismissable">
        <IonToolbar data-tauri-drag-region className="dismissable">
          <IonButtons slot="start">
            <HomeFilter />
          </IonButtons>
          <IonButtons slot="end" className="gap-3">
            <PostSortBar />
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false} fullscreen={media.maxMd}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <FlashList
          dismissHeaderTabBar={media.maxMd}
          estimatedItemSize={450}
          data={data}
          renderItem={({ item: post }) => <Post key={post.apId} {...post} />}
          className="h-full ion-content-scroll-host absolute inset-0 pt-[var(--offset-top)] pb-[var(--offset-bottom)]"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
        />
        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          <PopularCommunitiesSidebar />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
