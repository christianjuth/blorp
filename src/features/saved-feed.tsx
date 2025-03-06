import { PostCard } from "~/src/components/posts/post";
import { isWeb, XStack, YStack } from "tamagui";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { useRef, useState } from "react";
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
import { createCommunitySlug, encodeApId } from "../lib/lemmy/utils";

const EMPTY_ARR = [];

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

  const postData = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;
  const commentData =
    comments.data?.pages.flatMap((res) => res.comments) ?? EMPTY_ARR;

  const data = type === "posts" ? postData : commentData;

  return (
    <PostReportProvider>
      <FlashList
        ref={ref}
        data={["header", ...data]}
        renderItem={({ item }) => {
          if (item === "header") {
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

          if (_.isObject(item)) {
            return (
              <ContentGutters>
                <Comment path={item.path} />
                <></>
              </ContentGutters>
            );
          }

          return (
            <ContentGutters>
              <PostCard apId={item} savedOnly />
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
        keyExtractor={(item) => (_.isString(item) ? item : item.path)}
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
