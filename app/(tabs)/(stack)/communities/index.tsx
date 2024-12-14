import { useListCommunities } from "~/src/lib/lemmy";
import { FlashList } from "@shopify/flash-list";
import { Community } from "~/src/components/community";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { View, useWindowDimensions } from "tamagui";

export default function Communities() {
  const ref = useRef(null);
  useScrollToTop(ref);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useListCommunities({
      limit: 50,
      sort: "TopWeek",
    });

  const communities = data?.pages.map((p) => p.communities).flat();

  const w = useWindowDimensions();

  return (
    <FlashList
      numColumns={Math.ceil(w.width / 500)}
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
    />
  );
}
