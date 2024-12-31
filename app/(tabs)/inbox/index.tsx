import { CommentReplyView } from "lemmy-js-client";
import { Link } from "one";
import { FlatList } from "react-native";
import { Text, YStack, isWeb } from "tamagui";
import { ContentGutters } from "~/src/components/gutters";
import { Markdown } from "~/src/components/markdown";
import { useCustomTabBarHeight } from "~/src/components/nav/bottom-tab-bar";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";
import { RelativeTime } from "~/src/components/relative-time";
import { createCommunitySlug, useReplies } from "~/src/lib/lemmy";

function Reply({
  replyView,
  noBorder = false,
}: {
  replyView: CommentReplyView;
  noBorder?: boolean;
}) {
  const communitySlug = createCommunitySlug(replyView.community);
  const path = replyView.comment.path.split(".");
  const parent = path.at(-2);
  const newPath = [parent, replyView.comment.id].filter(Boolean).join(".");
  return (
    <ContentGutters>
      <Link
        href={`/inbox/c/${communitySlug}/posts/${replyView.post.ap_id}/comments/${newPath}`}
        asChild
      >
        <YStack
          bbw={noBorder ? 0 : 1}
          bbc="$color4"
          p="$4"
          gap="$2"
          tag="a"
          w="100%"
        >
          <Text lineHeight="$1.5">
            <Text fontSize="$4" fontWeight="bold">
              {replyView.creator.name}
            </Text>
            <Text> replied to your comment in </Text>
            <Text fontSize="$4" fontWeight="bold">
              {replyView.post.name}
            </Text>
          </Text>
          <Markdown markdown={replyView.comment.content} />
          <RelativeTime time={replyView.comment.published} color="$color10" />
        </YStack>
      </Link>
    </ContentGutters>
  );
}

export default function HomePage() {
  const header = useCustomHeaderHeight();
  const tabBar = useCustomTabBarHeight();

  const replies = useReplies({});

  const allReplies = replies.data?.pages.flatMap((p) => p.replies);

  return (
    <FlatList
      data={allReplies}
      scrollIndicatorInsets={{
        top: header.height,
        bottom: tabBar.height,
      }}
      contentInset={{
        top: header.height,
        bottom: tabBar.height,
      }}
      automaticallyAdjustContentInsets={false}
      contentContainerStyle={
        isWeb
          ? {
              top: header.height,
              paddingBottom: tabBar.height,
            }
          : undefined
      }
      renderItem={({ item, index }) => (
        <Reply
          key={item.comment_reply.id}
          replyView={item}
          noBorder={index + 1 === allReplies?.length}
        />
      )}
      refreshing={replies.isRefetching}
      onRefresh={() => {
        if (!replies.isRefetching) {
          replies.refetch();
        }
      }}
      onEndReached={() => {
        if (replies.hasNextPage) {
          replies.fetchNextPage();
        }
      }}
    />
  );
}
