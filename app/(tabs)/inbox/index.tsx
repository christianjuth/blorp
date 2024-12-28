import { CommentReplyView } from "lemmy-js-client";
import { Link } from "one";
import { Platform } from "react-native";
import { Text, YStack, ScrollView } from "tamagui";
import { FeedGutters } from "~/src/components/feed-gutters";
import { Markdown } from "~/src/components/markdown";
import { useCustomTabBarHeight } from "~/src/components/nav/bottom-tab-bar";
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
    <Link
      href={`/inbox/c/${communitySlug}/posts/${replyView.post.id}/comments/${newPath}`}
      asChild
    >
      <YStack bbw={noBorder ? 0 : 1} bbc="$color4" p="$4" gap="$2" tag="a">
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
  );
}

export default function HomePage() {
  const tabBar = useCustomTabBarHeight();

  const replies = useReplies({});

  const allReplies = replies.data?.pages.flatMap((p) => p.replies);

  return (
    <ScrollView
      h="100%"
      bg="$background"
      scrollIndicatorInsets={{
        bottom: tabBar.height,
      }}
      contentInset={{
        bottom: tabBar.height,
      }}
      automaticallyAdjustContentInsets={false}
      contentContainerStyle={
        Platform.OS == "web"
          ? {
              paddingBottom: tabBar.height,
            }
          : undefined
      }
    >
      <FeedGutters>
        <YStack w="100%">
          {allReplies?.map((r, i) => (
            <Reply
              key={r.comment_reply.id}
              replyView={r}
              noBorder={i + 1 === allReplies.length}
            />
          ))}
        </YStack>
      </FeedGutters>
    </ScrollView>
  );
}
