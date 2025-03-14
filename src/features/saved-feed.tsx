import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import { isWeb, XStack, YStack } from "tamagui";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useMemo, useRef, useState } from "react";
import { useCustomTabBarHeight } from "../components/nav/bottom-tab-bar";
import { FlashList } from "../components/flashlist";
import { useComments, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { ToggleGroup } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { Markdown } from "../components/markdown";
import { Link } from "one";
import { useLinkContext } from "../components/nav/link-context";
import { encodeApId } from "../lib/lemmy/utils";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";

const EMPTY_ARR = [];

const HEADER = "header";

type Item =
  | typeof HEADER
  | PostProps
  | {
      path: string;
      postId: number;
      creatorId: number;
    };

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

function Comment({ path }: { path: string }) {
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
    <Link
      href={`${linkCtx.root}c/${community.slug}/posts/${encodeApId(post.ap_id)}/comments/${newPath}`}
    >
      <YStack py="$3" bbw={1} bbc="$color4" flex={1}>
        <Markdown markdown={comment.content} />
      </YStack>
    </Link>
  );
}

export function SavedFeed() {
  const [type, setType] = useState<"posts" | "comments">("posts");

  const comments = useComments({
    saved_only: true,
    type_: "All",
  });

  const posts = usePosts({
    limit: 50,
    saved_only: true,
    type_: "All",
  });

  const tabBar = useCustomTabBarHeight();

  const ref = useRef(null);
  useScrollToTop(ref);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    if (type === "comments") {
      return (
        comments.data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR
      );
    }

    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [posts.data?.pages, comments.data?.pages, postCache]);

  return (
    <PostReportProvider>
      <FlashList<Item>
        ref={ref}
        data={[HEADER, ...data]}
        renderItem={({ item }) => {
          if (item === HEADER) {
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
                      { value: "comments", label: "Comments" },
                    ]}
                    onValueChange={(newType) => {
                      setTimeout(() => {
                        setType(newType);
                      }, 0);
                    }}
                  />
                </XStack>
                <></>
              </ContentGutters>
            );
          }

          if (isPost(item)) {
            return (
              <ContentGutters>
                <Post {...item} />
                <></>
              </ContentGutters>
            );
          }

          return (
            <ContentGutters>
              <Comment path={item.path} />
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
          _.isString(item) ? item : isPost(item) ? item.apId : item.path
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
        contentContainerStyle={{
          paddingBottom: isWeb ? tabBar.height : 0,
        }}
        refreshing={isRefetching}
        onRefresh={() => {
          if (!isRefetching) {
            refetch();
          }
        }}
        scrollEventThrottle={16}
        estimatedItemSize={475}
        stickyHeaderIndices={[0]}
      />
    </PostReportProvider>
  );
}
