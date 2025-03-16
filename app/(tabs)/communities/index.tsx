import { useListCommunities } from "~/src/lib/lemmy/index";
import { Community } from "~/src/components/community";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useMemo, useRef } from "react";
import { View, useMedia } from "tamagui";
import { useFiltersStore } from "~/src/stores/filters";
import { ContentGutters } from "~/src/components/gutters";
import { FlashList } from "~/src/components/flashlist";
import { CommunityView } from "lemmy-js-client";

const MemoedListItem = memo(
  function ListItem(props: CommunityView) {
    return <Community communityView={props} />;
  },
  (a, b) => {
    return a.community.actor_id === b.community.actor_id;
  },
);

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

  const communities = useMemo(
    () => data?.pages.map((p) => p.communities).flat(),
    [data?.pages],
  );

  let numCols = 1;
  if (media.gtXl) {
    numCols = 3;
  } else if (media.gtSm) {
    numCols = 2;
  }

  return (
    <ContentGutters flex={1}>
      <FlashList
        numColumns={numCols}
        ref={ref}
        data={communities}
        renderItem={({ item }) => <MemoedListItem {...item} />}
        keyExtractor={(item) => String(item.community.id)}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        // estimatedItemSize={54}
        refreshing={isRefetching}
        onRefresh={refetch}
        scrollEventThrottle={100}
        contentContainerStyle={{
          paddingTop: 6,
          paddingBottom: 6,
        }}
      />
    </ContentGutters>
  );
}
