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
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { FlashList } from "../components/flashlist";
import { UserDropdown } from "../components/nav";

const HEADER = "header";

export const scrollToTop = {
  current: { scrollToOffset: () => {} },
};

type Item = typeof HEADER | PostProps;

const EMPTY_ARR = [];

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export default function HomeFeed() {
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
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonTitle data-tauri-drag-region>Home</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <FlashList
          estimatedItemSize={450}
          data={data}
          renderItem={({ item: post }) => <Post key={post.apId} {...post} />}
          className="h-full ion-content-scroll-host"
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

  // return (
  //   <PostReportProvider>
  //     <ContentGutters>
  //       <View flex={1} />
  //       <View>
  //         <PopularCommunitiesSidebar />
  //       </View>
  //     </ContentGutters>

  //     <List
  //       ref={ref}
  //       data={data}
  //       renderItem={({ item }) => {
  //         if (item === HEADER) {
  //           return (
  //             <ContentGutters>
  //               <XStack
  //                 flex={1}
  //                 py="$2"
  //                 ai="center"
  //                 gap="$3"
  //                 bg="$background"
  //                 $md={{ dsp: "none" }}
  //               >
  //                 <PostSortBar />
  //                 {hasNewPost && (
  //                   <RefreshButton
  //                     onPress={() => {
  //                       scrollToTop.current.scrollToOffset();
  //                       refresh();
  //                     }}
  //                   />
  //                 )}
  //               </XStack>
  //               <></>
  //             </ContentGutters>
  //           );
  //         }
  //         return <Post {...item} />;
  //       }}
  //       onEndReached={() => {
  //         if (hasNextPage && !isFetchingNextPage) {
  //           fetchNextPage();
  //         }
  //       }}
  //       onEndReachedThreshold={0.5}
  //       keyExtractor={(item) => (_.isString(item) ? item : item.apId)}
  //       getItemType={(item) => (_.isString(item) ? item : item.recyclingType)}
  //       contentContainerStyle={{
  //         paddingBottom: isWeb ? tabBar.height : 0,
  //       }}
  //       refreshing={isRefetching}
  //       onRefresh={refresh}
  //       scrollEventThrottle={16}
  //       estimatedItemSize={475}
  //       contentInset={{
  //         top: !isWeb && media.md ? header.height : undefined,
  //         bottom: !isWeb && media.md ? tabBar.height : undefined,
  //       }}
  //       scrollIndicatorInsets={{
  //         top: !isWeb && media.md ? header.height : undefined,
  //         bottom: !isWeb && media.md ? tabBar.height : undefined,
  //       }}
  //       automaticallyAdjustsScrollIndicatorInsets={false}
  //       automaticallyAdjustContentInsets={false}
  //       onScroll={isWeb ? undefined : scrollHandler}
  //       stickyHeaderIndices={[0]}
  //     />
  //   </PostReportProvider>
  // );
}
