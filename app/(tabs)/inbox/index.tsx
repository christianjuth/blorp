import { Dot } from "@tamagui/lucide-icons";
import { CommentReplyView } from "lemmy-js-client";
import { Link } from "one";
import { FlashList } from "~/src/components/flashlist";
import { Text, View, XStack, YStack, isWeb } from "tamagui";
import { ContentGutters } from "~/src/components/gutters";
import { Markdown } from "~/src/components/markdown";
import { useCustomTabBarHeight } from "~/src/components/nav/bottom-tab-bar";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";
import { RelativeTime } from "~/src/components/relative-time";
import { useMarkReplyRead, useReplies } from "~/src/lib/lemmy";
import { createCommunitySlug } from "~/src/lib/community";

function Reply({
  replyView,
  noBorder = false,
}: {
  replyView: CommentReplyView;
  noBorder?: boolean;
}) {
  const markRead = useMarkReplyRead();
  const communitySlug = createCommunitySlug(replyView.community);
  const path = replyView.comment.path.split(".");
  const parent = path.at(-2);
  const newPath = [parent, replyView.comment.id].filter(Boolean).join(".");
  return (
    <ContentGutters>
      <Link
        href={`/inbox/c/${communitySlug}/posts/${encodeURIComponent(replyView.post.ap_id)}/comments/${newPath}`}
        asChild
      >
        <YStack
          bbw={noBorder ? 0 : 1}
          bbc="$color4"
          p="$4"
          gap="$2"
          tag="a"
          flex={1}
          onPress={() => {
            markRead.mutate({
              comment_reply_id: replyView.comment_reply.id,
              read: true,
            });
          }}
        >
          <XStack>
            {replyView.comment_reply.read ? null : (
              <Dot m={-7.5} ml={-13} size="$3" color="$accentColor" />
            )}
            <Text lineHeight="$1.5">
              <Text fontSize="$4" fontWeight="bold">
                {replyView.creator.name}
              </Text>
              <Text> replied to your comment in </Text>
              <Text fontSize="$4" fontWeight="bold">
                {replyView.post.name}
              </Text>
            </Text>
          </XStack>
          <Markdown markdown={replyView.comment.content} />
          <RelativeTime time={replyView.comment.published} color="$color10" />
        </YStack>
      </Link>
      <></>
    </ContentGutters>
  );
}

export default function HomePage() {
  const header = useCustomHeaderHeight();
  const tabBar = useCustomTabBarHeight();

  const replies = useReplies({});

  const allReplies = replies.data?.pages.flatMap((p) => p.replies);

  return (
    <FlashList
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
              paddingTop: header.height,
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
