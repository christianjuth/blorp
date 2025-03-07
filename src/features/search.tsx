import { useSearch } from "../lib/lemmy";
import { PostCard } from "~/src/components/posts/post";
import { View, XStack } from "tamagui";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { useRef, useState } from "react";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { Community } from "~/src/components/community";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
import { ToggleGroup } from "../components/ui/toggle-group";

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
  const [type, setType] = useState(defaultType);

  const postSort = useFiltersStore((s) => s.postSort);

  const searchResults = useSearch({
    q: search ?? "",
    sort: postSort,
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
      .map((res) => (type === "posts" ? res.posts : res.communities))
      .flat() ?? EMPTY_ARR;

  if (type === "communities") {
    data.sort((a, b) => {
      if (_.isString(a) || _.isString(b)) {
        return 0;
      }
      return b.counts.subscribers - a.counts.subscribers;
    });
  }

  const listItems = ["sidebar-mobile", "filter-sort-bar", ...data];

  return (
    <>
      <ContentGutters>
        <View flex={1} />
        <View>
          {communityName && (
            <CommunitySidebar communityName={communityName} hideDescription />
          )}
        </View>
      </ContentGutters>

      <FlashList
        ref={ref}
        data={listItems}
        renderItem={({ item }) => {
          if (item === "sidebar-desktop") {
            return (
              <ContentGutters>
                <View flex={1} />
                {communityName ? (
                  <CommunitySidebar
                    communityName={communityName}
                    hideDescription
                  />
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

          if (item === "filter-sort-bar") {
            return (
              <ContentGutters bg="$background">
                <XStack
                  flex={1}
                  py="$3"
                  gap="$3"
                  bbc="$color3"
                  bbw={1}
                  $md={{
                    bbw: 0.5,
                    pt: "$2",
                    px: "$3",
                  }}
                  ai="center"
                >
                  <ToggleGroup
                    defaultValue={type}
                    options={[
                      { value: "posts", label: "Posts" },
                      { value: "communities", label: "Communities" },
                    ]}
                    onValueChange={(newType) => {
                      setTimeout(() => {
                        setType(newType);
                      }, 0);
                    }}
                  />

                  {type === "posts" && (
                    <>
                      <View h="$1" w={1} bg="$color6" />
                      <PostSortBar />
                    </>
                  )}
                </XStack>
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
        scrollEventThrottle={16}
        estimatedItemSize={475}
        extraData={type}
        stickyHeaderIndices={[1]}
      />
    </>
  );
}
