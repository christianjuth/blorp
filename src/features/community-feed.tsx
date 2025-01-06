import { PostCard } from "~/src/components/posts/post";
import { isWeb, View } from "tamagui";
import {
  Sidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { CommunityBanner } from "../components/communities/community-banner";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { useCustomHeaderHeight } from "../components/nav/hooks";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { useFiltersStore } from "../stores/filters";
import { usePosts } from "../lib/lemmy";

const EMPTY_ARR = [];

export function CommunityFeed({ communityName }: { communityName?: string }) {
  const postSort = useFiltersStore((s) => s.postSort);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    community_name: communityName,
  });

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

  return (
    <FlashList
      automaticallyAdjustsScrollIndicatorInsets={false}
      // @ts-expect-error
      ref={ref}
      data={
        [
          "banner",
          "sidebar-desktop",
          "sidebar-mobile",
          "post-sort-bar",
          ...data,
        ] as const
      }
      renderItem={({ item }) => {
        if (item === "sidebar-desktop") {
          return (
            <ContentGutters $platform-web={{ pt: header.height }}>
              <View flex={1} />
              {communityName ? (
                <Sidebar communityName={communityName} />
              ) : (
                <></>
              )}
            </ContentGutters>
          );
        }

        if (item === "sidebar-mobile") {
          return communityName ? (
            <ContentGutters>
              <SmallScreenSidebar communityName={communityName} />
              <></>
            </ContentGutters>
          ) : (
            <></>
          );
        }

        if (item === "banner") {
          return (
            <ContentGutters
              transform={[{ translateY: isWeb ? header.height : 0 }]}
            >
              <CommunityBanner />
            </ContentGutters>
          );
        }

        if (item === "post-sort-bar") {
          return (
            <ContentGutters>
              <PostSortBar />
              <></>
            </ContentGutters>
          );
        }

        return (
          <ContentGutters>
            <PostCard apId={item} />
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
      stickyHeaderIndices={[1]}
      scrollEventThrottle={16}
      estimatedItemSize={475}
      contentInset={{
        top: header.height,
        bottom: tabBar.height,
      }}
      scrollIndicatorInsets={{
        top: header.height,
        bottom: tabBar.height,
      }}
    />
  );
}
