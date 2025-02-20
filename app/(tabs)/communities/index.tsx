import { useListCommunities } from "~/src/lib/lemmy/index";
import { Community } from "~/src/components/community";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { View, isWeb, useMedia } from "tamagui";
import { useFiltersStore } from "~/src/stores/filters";
import { ContentGutters } from "~/src/components/gutters";
import { scale } from "~/config/tamagui/scale";
import { FlashList } from "@shopify/flash-list";

export default function Communities() {
  const communitySort = useFiltersStore((s) => s.communitySort);
  const listingType = useFiltersStore((s) => s.communitiesListingType);
  const media = useMedia();

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
    type_: listingType,
  });

  const communities = data?.pages.map((p) => p.communities).flat();

  let numCols = 1;
  if (media.gtXl) {
    numCols = 3;
  } else if (media.gtSm) {
    numCols = 2;
  }

  return (
    <ContentGutters flex={1}>
      <FlashList
        key={numCols}
        numColumns={numCols}
        ref={ref}
        data={communities}
        renderItem={(item) => (
          <View
            h={54 * scale}
            overflow="hidden"
            w="100%"
            $gtMd={{
              pr: "$4",
            }}
          >
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
        estimatedItemSize={54 * scale}
        refreshing={isRefetching}
        onRefresh={refetch}
        scrollEventThrottle={100}
        contentContainerStyle={{
          paddingTop: 6 * scale,
          paddingBottom: 6 * scale,
        }}
      />
    </ContentGutters>
  );
}
