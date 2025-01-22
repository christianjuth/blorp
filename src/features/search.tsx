import { useSearch } from "../lib/lemmy";
import { PostCard } from "~/src/components/posts/post";
import { View } from "tamagui";
import {
  Sidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { Community } from "~/src/components/community";

const EMPTY_ARR = [];

export function SearchFeed({
  search,
  communityName,
  defaultType = "posts",
}: {
  search?: string;
  communityName?: string;
  defaultType?: "posts" | "communities";
}) {
  // const postSort = useFiltersStore((s) => s.postSort);

  const searchResults = useSearch({
    q: search ?? "",
    community_name: communityName,
  });

  const ref = useRef(null);
  useScrollToTop(ref);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = searchResults;

  const data =
    searchResults.data?.pages
      .map((res) => (defaultType === "posts" ? res.posts : res.communities))
      .flat() ?? EMPTY_ARR;

  return (
    <FlashList
      // @ts-expect-error
      ref={ref}
      data={
        ["sidebar-desktop", "sidebar-mobile", "post-sort-bar", ...data] as const
      }
      renderItem={({ item }) => {
        if (item === "sidebar-desktop") {
          return (
            <ContentGutters>
              <View flex={1} />
              {communityName ? (
                <Sidebar communityName={communityName} hideDescription />
              ) : (
                <></>
              )}
            </ContentGutters>
          );
        }

        if (item === "sidebar-mobile") {
          return communityName ? (
            <ContentGutters>
              <SmallScreenSidebar communityName={communityName} />
              <></>
            </ContentGutters>
          ) : (
            <></>
          );
        }

        if (item === "post-sort-bar") {
          return (
            <ContentGutters>
              <PostSortBar />
              <></>
            </ContentGutters>
          );
        }

        if (typeof item === "string") {
          return (
            <ContentGutters>
              <PostCard apId={item} />
              <></>
            </ContentGutters>
          );
        }

        return (
          <ContentGutters>
            <Community communityView={item} />
            <></>
          </ContentGutters>
        );
      }}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      keyExtractor={(item) =>
        typeof item === "string" ? item : String(item.community.id)
      }
      refreshing={isRefetching}
      onRefresh={() => {
        if (!isRefetching) {
          refetch();
        }
      }}
      stickyHeaderIndices={[0]}
      scrollEventThrottle={16}
      estimatedItemSize={475}
    />
  );
}
