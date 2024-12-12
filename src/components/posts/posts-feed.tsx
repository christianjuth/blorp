import { PostCard } from "~/src/components/posts/post";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { GetPostsResponse } from "lemmy-js-client";
import { useTheme, View } from "tamagui";
import { FlatList } from "react-native";
import { Sidebar } from "~/src/components/communities/community-sidebar";
import { CommunityBanner } from "../communities/community-banner";
import { FeedGutters } from "../feed-gutters";
import { useParams } from "one";
import { PopularCommunitiesSidebar } from "../populat-communities-sidebar";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";

const EMPTY_ARR = [];

export function PostsFeed({
  posts,
}: {
  posts: UseInfiniteQueryResult<InfiniteData<GetPostsResponse, unknown>, Error>;
}) {
  const ref = useRef(null);
  useScrollToTop(ref);

  const { communityName } = useParams<{ communityName: string }>();

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
      ref={ref}
      data={["sidebar", ...data]}
      renderItem={({ item }) =>
        typeof item === "string" ? (
          <FeedGutters>
            <View flex={1} />
            {communityName ? (
              <Sidebar communityName={communityName} />
            ) : (
              <PopularCommunitiesSidebar />
            )}
          </FeedGutters>
        ) : (
          <FeedGutters>
            <PostCard postView={item} />
            <></>
          </FeedGutters>
        )
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      keyExtractor={(item) =>
        typeof item === "string" ? item : String(item.post.id)
      }
      contentContainerStyle={{
        backgroundColor: theme.color1.val,
      }}
      refreshing={isRefetching}
      onRefresh={() => {
        if (!isRefetching) {
          refetch();
        }
      }}
      ListHeaderComponent={() => (
        <FeedGutters>
          <CommunityBanner />
        </FeedGutters>
      )}
      stickyHeaderIndices={[1]}
    />
  );
}
