import { PostCard } from "~/src/components/posts/post";
import { isWeb, useMedia, View } from "tamagui";
import { ContentGutters } from "../components/gutters";
import { PopularCommunitiesSidebar } from "../components/populat-communities-sidebar";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { useCustomHeaderHeight } from "../components/nav/hooks";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { FlashList, FlashListProps } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import Animated from "react-native-reanimated";
import { useScrollContext } from "../components/nav/scroll-animation-context";
import { useFiltersStore } from "../stores/filters";
import { usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";

const ReanimatedFlashList =
  Animated.createAnimatedComponent<
    FlashListProps<
      "banner" | "post-sort-bar" | "sidebar-desktop" | "sidebar-mobile" | string
    >
  >(FlashList);

const EMPTY_ARR = [];

export function HomeFeed() {
  const media = useMedia();
  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const { scrollHandler } = useScrollContext();

  const tabBar = useCustomTabBarHeight();
  const header = useCustomHeaderHeight();

  const ref = useRef(null);
  useScrollToTop(ref);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

  const List = isWeb ? FlashList : ReanimatedFlashList;

  return (
    <PostReportProvider>
      <ContentGutters>
        <View flex={1} />
        <View>
          <PopularCommunitiesSidebar />
        </View>
      </ContentGutters>

      <List
        // @ts-expect-error
        ref={ref}
        data={["post-sort-bar", ...data] as const}
        renderItem={({ item }) => {
          if (item === "post-sort-bar") {
            return (
              <ContentGutters>
                <View
                  flex={1}
                  py="$3.5"
                  bbc="$color3"
                  bbw={1}
                  $md={{
                    bbw: 0.5,
                  }}
                >
                  <PostSortBar />
                </View>
                <></>
              </ContentGutters>
            );
          }

          return (
            <ContentGutters>
              <PostCard apId={item} featuredContext="home" />
              <></>
            </ContentGutters>
          );
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) => item}
        contentContainerStyle={{
          paddingBottom: isWeb ? tabBar.height : 0,
        }}
        refreshing={isRefetching}
        onRefresh={() => {
          if (!isRefetching) {
            refetch();
          }
        }}
        scrollEventThrottle={16}
        estimatedItemSize={475}
        contentInset={{
          top: !isWeb && media.md ? header.height : undefined,
          bottom: !isWeb && media.md ? tabBar.height : undefined,
        }}
        scrollIndicatorInsets={{
          top: !isWeb && media.md ? header.height : undefined,
          bottom: !isWeb && media.md ? tabBar.height : undefined,
        }}
        automaticallyAdjustsScrollIndicatorInsets={false}
        onScroll={isWeb ? undefined : scrollHandler}
      />
    </PostReportProvider>
  );
}
