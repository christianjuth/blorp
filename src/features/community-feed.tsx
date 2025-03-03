import { PostCard } from "~/src/components/posts/post";
import { isWeb, View, XStack } from "tamagui";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { CommunityBanner } from "../components/communities/community-banner";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { useCommunity, useMostRecentPost, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { RefreshButton } from "../components/ui/button";

const EMPTY_ARR = [];

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

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

  const hasNewPost = data[0] && mostRecentPost?.post.ap_id !== data[0];

  return (
    <PostReportProvider>
      <ContentGutters>
        <View flex={1} />
        {communityName && <CommunitySidebar communityName={communityName} />}
      </ContentGutters>

      <FlashList
        ref={ref}
        data={["banner", "sidebar-mobile", "post-sort-bar", ...data] as const}
        renderItem={({ item }) => {
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
              <ContentGutters $md={{ dsp: "none" }} pt="$3">
                <CommunityBanner communityName={communityName} />
                <></>
              </ContentGutters>
            );
          }

          if (item === "post-sort-bar") {
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

          return (
            <ContentGutters>
              <PostCard apId={item} featuredContext="community" />
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
        stickyHeaderIndices={[2]}
        estimatedItemSize={475}
      />
    </PostReportProvider>
  );
}
