import { useListCommunities } from "~/src/lib/lemmy";
import { FlashList } from "@shopify/flash-list";
import { Community } from "~/src/components/community";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { View, useMedia } from "tamagui";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";
import { useFiltersStore } from "~/src/stores/filters";

export default function Communities() {
  const communitySort = useFiltersStore((s) => s.communitySort);
  const communityFilter = useFiltersStore((s) => s.communityFilter);
  const media = useMedia();

  const header = useCustomHeaderHeight();

  const ref = useRef(null);
  useScrollToTop(ref);

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isRefetching,
    refetch,
  } = useListCommunities({
    limit: 50,
    sort: communitySort,
    type_: communityFilter,
  });

  const communities = data?.pages.map((p) => p.communities).flat();

  let numCols = 1;
  if (media.gtXl) {
    numCols = 3;
  } else if (media.gtLg) {
    numCols = 2;
  }

  return (
    <FlashList
      numColumns={numCols}
      ref={ref}
      data={communities}
      renderItem={(item) => (
        <View h={54} overflow="hidden" w="100%">
          <Community communityView={item.item} />
        </View>
      )}
      keyExtractor={(item) => String(item.community.id)}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      estimatedItemSize={54}
      contentInset={{ top: header.height }}
      scrollIndicatorInsets={{ top: header.height }}
      automaticallyAdjustsScrollIndicatorInsets={false}
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
}
