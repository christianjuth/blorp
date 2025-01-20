import { useListCommunities } from "~/src/lib/lemmy";
import { Community } from "~/src/components/community";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { View, isWeb, useMedia } from "tamagui";
import { useFiltersStore } from "~/src/stores/filters";
import { ContentGutters } from "~/src/components/gutters";
import { FlashList } from "~/src/components/flashlist";

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
  } else if (media.gtLg) {
    numCols = 2;
  }

  return (
    <ContentGutters h="100%">
      <FlashList
        key={numCols}
        numColumns={numCols}
        // @ts-expect-error
        ref={ref}
        data={communities}
        renderItem={(item) => (
          <View
            h={54}
            overflow="hidden"
            w={isWeb ? `${100 / numCols}%` : "100%"}
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
        estimatedItemSize={54}
        refreshing={isRefetching}
        onRefresh={refetch}
        scrollEventThrottle={100}
      />
    </ContentGutters>
  );
}
