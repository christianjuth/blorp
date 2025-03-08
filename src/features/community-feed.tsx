import { PostCard } from "~/src/components/posts/post";
import { isWeb, View, XStack } from "tamagui";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { CommunityBanner } from "../components/communities/community-banner";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useMemo, useRef } from "react";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { useCommunity, useMostRecentPost, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { RefreshButton } from "../components/ui/button";

const EMPTY_ARR = [];

const SIDEBAR_MOBILE = "sidebar-mobile";
const BANNER = "banner";
const POST_SORT_BAR = "post-sort-bar";
const POST = "post";

const Post = memo(({ item }: { item: string }) => (
  <ContentGutters>
    <PostCard apId={item} featuredContext="community" />
    <></>
  </ContentGutters>
));

export function CommunityFeed({ communityName }: { communityName?: string }) {
  const posts = usePosts({
    community_name: communityName,
  });

  const mostRecentPost = useMostRecentPost({
    community_name: communityName,
  });

  useCommunity({
    name: communityName,
  });

  const tabBar = useCustomTabBarHeight();

  const ref = useRef<FlashList<any>>(null);
  useScrollToTop(ref);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const data = useMemo(
    () => [
      BANNER,
      SIDEBAR_MOBILE,
      POST_SORT_BAR,
      ...(posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR),
    ],
    [posts.data?.pages],
  );

  const firstPost = posts.data?.pages[0]?.posts[0];
  const hasNewPost = mostRecentPost?.data?.post.ap_id !== firstPost;

  return (
    <PostReportProvider>
      <ContentGutters>
        <View flex={1} />
        {communityName && <CommunitySidebar communityName={communityName} />}
      </ContentGutters>

      <FlashList<string>
        ref={ref}
        data={data}
        renderItem={({ item }) => {
          if (item === SIDEBAR_MOBILE) {
            return communityName ? (
              <ContentGutters>
                <SmallScreenSidebar communityName={communityName} />
                <></>
              </ContentGutters>
            ) : (
              <></>
            );
          }

          if (item === BANNER) {
            return (
              <ContentGutters $md={{ dsp: "none" }} pt="$3">
                <CommunityBanner communityName={communityName} />
                <></>
              </ContentGutters>
            );
          }

          if (item === POST_SORT_BAR) {
            return (
              <ContentGutters bg="$background">
                <XStack
                  ai="center"
                  gap="$3"
                  flex={1}
                  py="$2"
                  bbc="$color3"
                  bbw={1}
                  $md={{
                    bbw: 0.5,
                    px: "$3",
                    py: "$1.5",
                  }}
                >
                  <PostSortBar />
                  {hasNewPost && (
                    <RefreshButton
                      onPress={() => {
                        ref.current?.scrollToOffset({
                          offset: 0,
                        });
                        refetch();
                      }}
                    />
                  )}
                </XStack>
                <></>
              </ContentGutters>
            );
          }

          return <Post item={item} />;
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) => item}
        getItemType={(item) => {
          switch (item) {
            case SIDEBAR_MOBILE:
              return SIDEBAR_MOBILE;
            case BANNER:
              return BANNER;
            case POST_SORT_BAR:
              return POST_SORT_BAR;
            default:
              return POST;
          }
        }}
        contentContainerStyle={{
          paddingBottom: isWeb ? tabBar.height : 0,
        }}
        refreshing={isRefetching}
        onRefresh={() => {
          if (!isRefetching) {
            refetch();
            mostRecentPost.refetch();
          }
        }}
        stickyHeaderIndices={[2]}
        estimatedItemSize={475}
      />
    </PostReportProvider>
  );
}
