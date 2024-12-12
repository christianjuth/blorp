import { useListCommunities } from "~/src/lib/lemmy";
import { FlatList } from "react-native";
import { Community } from "~/src/components/community";

export default function Communities() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useListCommunities({
      limit: 50,
      sort: "TopWeek",
    });

  const communities = data?.pages.map((p) => p.communities).flat();

  return (
    <FlatList
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
