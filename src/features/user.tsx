import { ContentGutters } from "../components/gutters";
import { abbriviateNumber } from "../lib/format";
import { usePersonDetails, usePersonFeed } from "../lib/lemmy";
import { Avatar, Text, View, XStack, YStack } from "tamagui";
import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "../components/posts/post";
import { Markdown } from "../components/markdown";
import { FlashList } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useScrollToTop } from "@react-navigation/native";
import { useNavigation, Link } from "one";
import { CakeSlice } from "@tamagui/lucide-icons";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { decodeApId, encodeApId } from "../lib/lemmy/utils";
import { ToggleGroup } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { useLinkContext } from "../components/nav/link-context";
import { useProfilesStore } from "../stores/profiles";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommentView } from "lemmy-js-client";

const BANNER = "banner";
const POST_SORT_BAR = "post-sort-bar";

type Item = typeof BANNER | typeof POST_SORT_BAR | PostProps | CommentView;

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

const Comment = memo(function Comment({ path }: { path: string }) {
  const commentView = useCommentsStore((s) => s.comments[path]?.data);
  const linkCtx = useLinkContext();

  if (!commentView) {
    return null;
  }

  const { comment, community, post } = commentView;

  const parent = path.split(".").at(-2);
  const newPath = [parent !== "0" ? parent : undefined, comment.id]
    .filter(Boolean)
    .join(".");

  return (
    <ContentGutters>
      <Link
        href={`${linkCtx.root}c/${community.slug}/posts/${encodeApId(post.ap_id)}/comments/${newPath}`}
        asChild
      >
        <YStack py="$3" bbw={1} bbc="$color4" flex={1} tag="a">
          <Markdown markdown={comment.content} />
        </YStack>
      </Link>
      <></>
    </ContentGutters>
  );
});

dayjs.extend(localizedFormat);

const EMPTY_ARR = [];

export function User({ userId }: { userId?: string }) {
  const actorId = userId ? decodeApId(userId) : undefined;

  const [type, setType] = useState<"posts" | "comments">("posts");

  const personQuery = usePersonDetails({ actorId });
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    data,
  } = usePersonFeed({ actorId });

  const ref = useRef(null);
  useScrollToTop(ref);

  const navigation = useNavigation();

  useEffect(() => {
    const person = personQuery.data?.person_view.person;
    if (person) {
      navigation.setOptions({ title: person.display_name ?? person.name });
    }
  }, [personQuery.data?.person_view]);

  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[actorId]?.data : undefined,
  );

  const person = personView?.person;
  const counts = personView?.counts;

  const postCache = usePostsStore((s) => s.posts);

  const listData = useMemo(() => {
    if (type === "comments") {
      return data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR;
    }

    const postIds = data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [data?.pages, postCache]);

  if (!personView) {
    return null;
  }

  return (
    <>
      <ContentGutters>
        <View flex={1} />
        <YStack py="$4" br="$4" zIndex="$5" gap="$4" pos="absolute" w="100%">
          <Text fontWeight="bold" fontSize="$5">
            {personView.person.display_name ?? personView.person.name}
          </Text>

          <XStack ai="center" gap="$1.5">
            <CakeSlice size="$1" color="$color11" />
            <Text fontSize="$3" color="$color11">
              Created {dayjs(personView.person.published).format("ll")}
            </Text>
          </XStack>

          {person?.bio && <Markdown markdown={person.bio} />}

          {counts && (
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
          )}
        </YStack>
      </ContentGutters>

      <FlashList<Item>
        ref={ref}
        data={
          [
            BANNER,
            // "sidebar-mobile",
            POST_SORT_BAR,
            ...listData,
          ] as const
        }
        renderItem={({ item }) => {
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
                <XStack ai="center" flex={1} $md={{ px: "$2" }}>
                  <Avatar size="$5" mr="$2">
                    <Avatar.Image src={person?.avatar} borderRadius="$12" />
                    <Avatar.Fallback
                      backgroundColor="$color8"
                      borderRadius="$12"
                      ai="center"
                      jc="center"
                    >
                      <Text fontSize="$7">
                        {person?.name?.substring(0, 1).toUpperCase()}
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
                <XStack
                  flex={1}
                  py="$2"
                  gap="$3"
                  bbc="$color3"
                  bbw={1}
                  $md={{
                    bbw: 0.5,
                    px: "$3",
                  }}
                  ai="center"
                  bg="$background"
                >
                  <ToggleGroup
                    defaultValue={type}
                    options={[
                      { value: "posts", label: "Posts" },
                      { value: "comments", label: "Comments" },
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

          return <Comment path={item.comment.path} />;
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) =>
          _.isString(item)
            ? item
            : isPost(item)
              ? item.apId
              : item.comment.ap_id
        }
        getItemType={(item) => {
          if (_.isString(item)) {
            return item;
          } else if (isPost(item)) {
            return item.recyclingType;
          } else {
            return "comment";
          }
        }}
        refreshing={isRefetching}
        onRefresh={() => {
          if (!isRefetching) {
            refetch();
          }
        }}
        stickyHeaderIndices={[1]}
        estimatedItemSize={475}
        automaticallyAdjustContentInsets={false}
      />
    </>
  );
}
