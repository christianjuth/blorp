import { useSearch } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import { View, XStack } from "tamagui";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useMemo, useRef, useState } from "react";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { Community } from "~/src/components/community";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
import { ToggleGroup } from "../components/ui/toggle-group";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommunityView } from "lemmy-js-client";

const EMPTY_ARR = [];

const SIDEBAR_MOBILE = "sidebar-mobile";
const FILTER_SORT_BAR = "filter-sort-bar";

type Item =
  | typeof SIDEBAR_MOBILE
  | typeof FILTER_SORT_BAR
  | PostProps
  | CommunityView;

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

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

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    if (type === "communities") {
      const communities =
        searchResults.data?.pages.map((res) => res.communities).flat() ??
        EMPTY_ARR;

      communities.sort((a, b) => {
        if (_.isString(a) || _.isString(b)) {
          return 0;
        }
        return b.counts.subscribers - a.counts.subscribers;
      });

      return communities;
    }

    const postIds =
      searchResults.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [searchResults.data?.pages, postCache, type]);

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

      <FlashList<Item>
        ref={ref}
        data={["sidebar-mobile", "filter-sort-bar", ...data]}
        renderItem={({ item }) => {
          // if (item === "sidebar-desktop") {
          //   return (
          //     <ContentGutters>
          //       <View flex={1} />
          //       {communityName ? (
          //         <CommunitySidebar
          //           communityName={communityName}
          //           hideDescription
          //         />
          //       ) : (
          //         <></>
          //       )}
          //     </ContentGutters>
          //   );
          // }

          if (item === SIDEBAR_MOBILE) {
            return communityName ? (
              <ContentGutters>
                <SmallScreenSidebar communityName={communityName} />
                <></>
              </ContentGutters>
            ) : (
              <></>
            );
          }

          if (item === FILTER_SORT_BAR) {
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

          if (isPost(item)) {
            return <Post {...item} />;
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
          typeof item === "string"
            ? item
            : isPost(item)
              ? item.apId
              : item.community.actor_id
        }
        getItemType={(item) => {
          if (_.isString(item)) {
            return item;
          } else if (isPost(item)) {
            return item.type;
          } else {
            return "community";
          }
        }}
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
