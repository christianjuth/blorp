import { ContentGutters } from "../components/gutters";
import { abbriviateNumber } from "../lib/format";
import { usePersonDetails, usePersonPosts } from "../lib/lemmy";
import { Avatar, Text, View, XStack, YStack } from "tamagui";
import { PostCard } from "../components/posts/post";
import { Markdown } from "../components/markdown";
import { FlashList } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import { useEffect, useRef } from "react";
import { useScrollToTop } from "@react-navigation/native";
import { useNavigation } from "one";
import { CakeSlice } from "@tamagui/lucide-icons";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { decodeApId } from "../lib/lemmy/utils";

dayjs.extend(localizedFormat);

const EMPTY_ARR = [];

export function User({ userId }: { userId?: string }) {
  const actorId = userId ? decodeApId(userId) : undefined;

  const personQuery = usePersonDetails({ actorId });
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    data,
  } = usePersonPosts({ actorId });

  const ref = useRef(null);
  useScrollToTop(ref);

  const navigation = useNavigation();

  useEffect(() => {
    const person = personQuery.data?.person_view.person;
    if (person) {
      navigation.setOptions({ title: person.display_name ?? person.name });
    }
  }, [personQuery.data?.person_view]);

  if (!personQuery.data) {
    return null;
  }

  const personView = personQuery.data.person_view;
  const person = personView.person;
  const counts = personView.counts;

  const posts = data?.pages.flatMap((p) => p.posts) ?? EMPTY_ARR;

  return (
    <FlashList
      ref={ref}
      data={
        [
          "sidebar-desktop",
          "banner",
          // "sidebar-mobile",
          "post-sort-bar",
          ...posts,
        ] as const
      }
      renderItem={({ item }) => {
        if (item === "sidebar-desktop") {
          return (
            <ContentGutters>
              <View flex={1} />
              <YStack
                py="$4"
                br="$4"
                zIndex="$5"
                gap="$4"
                pos="absolute"
                w="100%"
              >
                <Text fontWeight="bold" fontSize="$5">
                  {personView.person.display_name ?? personView.person.name}
                </Text>

                <XStack ai="center" gap="$1.5">
                  <CakeSlice size="$1" color="$color11" />
                  <Text fontSize="$3" color="$color11">
                    Created {dayjs(personView.person.published).format("ll")}
                  </Text>
                </XStack>

                {person.bio && <Markdown markdown={person.bio} />}

                <XStack>
                  <YStack gap="$1" flex={1}>
                    <Text fontWeight="bold" fontSize="$4">
                      {abbriviateNumber(counts.post_count)}
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      Posts
                    </Text>
                  </YStack>

                  <YStack gap="$1" flex={1}>
                    <Text fontWeight="bold" fontSize="$4">
                      {abbriviateNumber(counts.comment_count)}
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      Comments
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </ContentGutters>
          );
        }

        // if (item === "sidebar-mobile") {
        //   return communityName ? (
        //     <ContentGutters>
        //       <SmallScreenSidebar communityName={communityName} />
        //       <></>
        //     </ContentGutters>
        //   ) : (
        //     <></>
        //   );
        // }

        if (item === "banner") {
          return (
            <ContentGutters>
              <XStack
                ai="center"
                flex={1}
                $md={{ px: "$2", bbw: 1, bbc: "$color4" }}
              >
                <Avatar size="$5" mr="$2">
                  <Avatar.Image src={person.avatar} borderRadius="$12" />
                  <Avatar.Fallback
                    backgroundColor="$color8"
                    borderRadius="$12"
                    ai="center"
                    jc="center"
                  >
                    <Text fontSize="$7">
                      {person.name?.substring(0, 1).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>

                <YStack flex={1} py="$4" gap="$1">
                  <Text fontWeight="bold" fontSize="$7">
                    {personView.person.display_name ?? personView.person.name}
                  </Text>
                  <Text>u/{personView.person.name}</Text>
                </YStack>
              </XStack>
            </ContentGutters>
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

        return (
          <ContentGutters>
            <PostCard apId={item} />
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
      keyExtractor={(item) => item}
      refreshing={isRefetching}
      onRefresh={() => {
        if (!isRefetching) {
          refetch();
        }
      }}
      stickyHeaderIndices={[0]}
      estimatedItemSize={475}
    />
  );
}
