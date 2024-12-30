import { PostCard } from "~/src/components/posts/post";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useTheme, View, Text, XStack, YStack, Button } from "tamagui";
import {
  Sidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { CommunityBanner } from "../communities/community-banner";
import { FeedGutters } from "../feed-gutters";
import { useParams } from "one";
import { PopularCommunitiesSidebar } from "../populat-communities-sidebar";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { useCustomHeaderHeight } from "../nav/hooks";
import { useCustomTabBarHeight } from "../nav/bottom-tab-bar";
import { FlatList } from "react-native";
import { useAuth } from "~/src/stores/auth";
import { useInstances } from "~/src/lib/lemmy";
import { abbriviateNumber } from "~/src/lib/format";
import { useFiltersStore } from "~/src/stores/filters";

const EMPTY_ARR = [];

export function PostsFeed({
  posts,
}: {
  posts: UseInfiniteQueryResult<
    InfiniteData<{ posts: number[] }, unknown>,
    Error
  >;
}) {
  const listingType = useFiltersStore((s) => s.listingType);
  const setListingType = useFiltersStore((s) => s.setListingType);

  const instance = useAuth((s) => s.instance);
  const instances = useInstances();

  const myInstance = instances.data?.find((i) => i.url === instance);

  const tabBar = useCustomTabBarHeight();
  const header = useCustomHeaderHeight();

  const ref = useRef(null);
  useScrollToTop(ref);

  const { communityName, search } = useParams<{
    communityName: string;
    search: string;
  }>();

  const theme = useTheme();

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

  return (
    <FlatList
      automaticallyAdjustsScrollIndicatorInsets={false}
      ref={ref}
      data={["banner", "sidebar-desktop", "sidebar-mobile", ...data] as const}
      renderItem={({ item }) => {
        if (item === "sidebar-desktop") {
          return (
            <FeedGutters pt={header.height}>
              <View flex={1} />
              {communityName ? (
                <Sidebar communityName={communityName} />
              ) : (
                <PopularCommunitiesSidebar />
              )}
            </FeedGutters>
          );
        }

        if (item === "sidebar-mobile") {
          return communityName ? (
            <FeedGutters>
              <SmallScreenSidebar communityName={communityName} />
              <></>
            </FeedGutters>
          ) : null;
        }

        if (item === "banner") {
          if (search) {
            return null;
          }
          return (
            <FeedGutters transform={[{ translateY: header.height }]}>
              <CommunityBanner />
            </FeedGutters>
          );
        }

        return (
          <>
            {item === data[0] && listingType === "Local" && (
              <FeedGutters pt="$4">
                <YStack
                  bc="$accentColor"
                  br="$4"
                  p="$3"
                  bw={1}
                  pos="relative"
                  flex={1}
                  gap="$1.5"
                >
                  <View
                    pos="absolute"
                    top={0}
                    right={0}
                    bottom={0}
                    left={0}
                    bg="$accentColor"
                    opacity={0.3}
                    br="inherit"
                  />
                  <Text>
                    Your home planet has{" "}
                    {abbriviateNumber(
                      myInstance?.counts.users_active_month ?? 0,
                    )}{" "}
                    monthly active users.
                  </Text>
                  <Button unstyled p={0} bw={0} bg="transparent">
                    <Text
                      textDecorationLine="underline"
                      onPress={() => setListingType("All")}
                      textAlign="left"
                      fontSize="$4"
                    >
                      Explore the entire galaxy, for more posts.
                    </Text>
                  </Button>
                </YStack>
                <></>
              </FeedGutters>
            )}
            <FeedGutters>
              <PostCard postId={item} />
              <></>
            </FeedGutters>
          </>
        );
      }}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      keyExtractor={(item) => String(item)}
      contentContainerStyle={{
        backgroundColor: theme.background.val,
        paddingBottom: tabBar.height,
      }}
      refreshing={isRefetching}
      onRefresh={() => {
        if (!isRefetching) {
          refetch();
        }
      }}
      stickyHeaderIndices={[1]}
      scrollEventThrottle={16}
    />
  );
}
