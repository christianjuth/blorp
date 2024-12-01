import {
  PostCompact,
  POST_HEIGHT,
  // EXPANDED_POST_HEIGHT,
} from "~/src/components/posts/post";
import { useState } from "react";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { GetPostsResponse } from "lemmy-js-client";
import { useTheme, View } from "tamagui";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMPTY_ARR = [];

const PADDING = 10;

export function PostsFeed({
  posts,
}: {
  posts: UseInfiniteQueryResult<InfiniteData<GetPostsResponse, unknown>, Error>;
}) {
  const insets = useSafeAreaInsets();

  const { hasNextPage, fetchNextPage, isFetchingNextPage } = posts;

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const prevState = prev[id] ?? false;
      return {
        ...prev,
        [id]: !prevState,
      };
    });
  };

  return (
    <FlashList
      data={data}
      renderItem={(item) => (
        <PostCompact
          postView={item.item}
          toggleExpand={() => toggleExpand(item.item.post.id)}
          expanded={expanded[item.item.post.id] ?? false}
        />
      )}
      estimatedItemSize={POST_HEIGHT}
      ItemSeparatorComponent={() => <View h={PADDING} />}
      // contentInset={{
      //   top: insets.top,
      //   bottom: insets.bottom,
      // }}
      onEndReached={
        hasNextPage && !isFetchingNextPage ? fetchNextPage : undefined
      }
      onEndReachedThreshold={0.5}
      keyExtractor={(item) => String(item.post.id)}
    />
  );
}
