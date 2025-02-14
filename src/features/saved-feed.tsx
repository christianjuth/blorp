import { PostCard } from "~/src/components/posts/post";
import { isWeb } from "tamagui";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { FlashList } from "../components/flashlist";
import { usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";

const EMPTY_ARR = [];

export function SavedFeed() {
  const posts = usePosts({
    limit: 50,
    saved_only: true,
  });

  const tabBar = useCustomTabBarHeight();

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
    <PostReportProvider>
      <FlashList
        // @ts-expect-error
        ref={ref}
        data={data}
        renderItem={({ item }) => {
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
        scrollEventThrottle={16}
        estimatedItemSize={475}
      />
    </PostReportProvider>
  );
}
