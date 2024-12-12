import { useListCommunities } from "~/src/lib/lemmy";
import { FlatList } from "react-native";
import { Community } from "~/src/components/community";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";

export default function Communities() {
  const ref = useRef(null);
  useScrollToTop(ref);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useListCommunities({
      limit: 50,
      sort: "TopWeek",
    });

  const communities = data?.pages.map((p) => p.communities).flat();

  return (
    <FlatList
      ref={ref}
      data={communities}
      renderItem={(item) => <Community communityView={item.item} />}
      keyExtractor={(item) => String(item.community.id)}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
}
