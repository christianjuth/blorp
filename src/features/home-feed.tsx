import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import { isWeb, useMedia, View, XStack } from "tamagui";
import { ContentGutters } from "../components/gutters";
import { PopularCommunitiesSidebar } from "../components/populat-communities-sidebar";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useMemo, useRef } from "react";
import { useCustomHeaderHeight } from "../components/nav/hooks";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { FlashList, FlashListProps } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import Animated from "react-native-reanimated";
import { useScrollContext } from "../components/nav/scroll-animation-context";
import { useFiltersStore } from "../stores/filters";
import { useMostRecentPost, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { RefreshButton } from "../components/ui/button";
import { usePostsStore } from "../stores/posts";
import _ from "lodash";
import { isNotNull } from "../lib/utils";

const HEADER = "header";

export const scrollToTop = {
  current: { scrollToOffset: () => {} },
};

type Item = typeof HEADER | PostProps;

const List = isWeb
  ? FlashList<Item>
  : Animated.createAnimatedComponent<FlashListProps<Item>>(FlashList);

const EMPTY_ARR = [];

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export function HomeFeed() {
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

  const { scrollHandler } = useScrollContext();

  const tabBar = useCustomTabBarHeight();
  const header = useCustomHeaderHeight();

  const ref = useRef<FlashList<any>>(null);
  scrollToTop.current = {
    scrollToOffset: () =>
      ref.current?.scrollToOffset({
        offset: -header.height,
        animated: true,
      }),
  };
  useScrollToTop(scrollToTop);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const refresh = () => {
    if (!isRefetching) {
      refetch();
      mostRecentPost.refetch();
    }
  };

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView, "home") : null;
      })
      .filter(isNotNull);

    return [HEADER, ...postViews] as const;
  }, [posts.data?.pages, postCache]);

  const firstPost = posts.data?.pages[0]?.posts[0];
  const hasNewPost = mostRecentPost?.data?.post.ap_id !== firstPost;

  return (
    <PostReportProvider>
      <ContentGutters>
        <View flex={1} />
        <View>
          <PopularCommunitiesSidebar />
        </View>
      </ContentGutters>

      <List
        ref={ref}
        data={data}
        renderItem={({ item }) => {
          if (item === HEADER) {
            return (
              <ContentGutters>
                <XStack
                  flex={1}
                  py="$2"
                  ai="center"
                  gap="$3"
                  bg="$background"
                  $md={{ dsp: "none" }}
                >
                  <PostSortBar />
                  {hasNewPost && (
                    <RefreshButton
                      onPress={() => {
                        scrollToTop.current.scrollToOffset();
                        refresh();
                      }}
                    />
                  )}
                </XStack>
                <></>
              </ContentGutters>
            );
          }
          return <Post {...item} />;
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) => (_.isString(item) ? item : item.apId)}
        getItemType={(item) => (_.isString(item) ? item : item.recyclingType)}
        contentContainerStyle={{
          paddingBottom: isWeb ? tabBar.height : 0,
        }}
        refreshing={isRefetching}
        onRefresh={refresh}
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
        automaticallyAdjustContentInsets={false}
        onScroll={isWeb ? undefined : scrollHandler}
        stickyHeaderIndices={[0]}
      />
    </PostReportProvider>
  );
}
