import { PostCard } from "~/src/components/posts/post";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { GetPostsResponse } from "lemmy-js-client";
import { ScrollView, useTheme, View, XStack } from "tamagui";
import { FlatList } from "react-native";
import {
  Sidebar,
  COMMUNITY_SIDEBAR_WIDTH,
} from "~/src/components/communities/community-sidebar";
import { CommunityBanner } from "../communities/community-banner";
import { FeedGutters } from "../feed-gutters";
import { View as RNView, StyleProp, ViewStyle } from "react-native";

const EMPTY_ARR = [];

interface CellRendererProps {
  index: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const CellRenderer: React.FC<CellRendererProps> = ({
  index,
  style,
  children,
}) => {
  const customStyle: StyleProp<ViewStyle> =
    index === 0
      ? { zIndex: 1, position: "relative" } // Apply higher zIndex and relative positioning for the first item
      : {};

  return <RNView style={[style, customStyle]}>{children}</RNView>;
};

export function PostsFeed({
  posts,
}: {
  posts: UseInfiniteQueryResult<InfiniteData<GetPostsResponse, unknown>, Error>;
}) {
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
      data={data}
      renderItem={({ item, index }) => (
        <FeedGutters>
          <PostCard postView={item} />
          {index === 0 ? <Sidebar /> : <></>}
        </FeedGutters>
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      keyExtractor={(item) => String(item.post.id)}
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
        <FeedGutters pt="$2.5">
          <CommunityBanner />
        </FeedGutters>
      )}
      CellRendererComponent={CellRenderer}
    />
  );
}
