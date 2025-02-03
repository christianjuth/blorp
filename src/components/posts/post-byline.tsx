import { View, Text, Avatar, YStack, XStack } from "tamagui";
import { RelativeTime } from "~/src/components/relative-time";
import { FlattenedPost, useBlockPerson } from "~/src/lib/lemmy/index";
import { Link } from "one";
import { useLinkContext } from "../nav/link-context";
import { ActionMenu } from "../ui/action-menu";
import { Share, Linking } from "react-native";
import { Ellipsis, Pin } from "@tamagui/lucide-icons";
import { useRequireAuth } from "../auth-context";
import { useShowPostReportModal } from "./post-report";
import { useAlert } from "../ui/alert";

export function PostByline({
  postView,
  featuredContext,
}: {
  postView: FlattenedPost;
  featuredContext?: "community";
}) {
  const alrt = useAlert();

  const showReportModal = useShowPostReportModal();
  const requireAuth = useRequireAuth();
  const blockPerson = useBlockPerson();

  const { creator, community, post } = postView;
  const linkCtx = useLinkContext();

  let pinned = false;
  if (featuredContext === "community") {
    pinned = postView.post.featured_community;
  }
  // else if (featuredContext === "site") {
  //   pinned = post.featured_local;
  // }

  return (
    <XStack dsp="flex" fd="row" ai="center" gap={9}>
      <Avatar size="$2.5">
        <Avatar.Image src={creator.avatar} borderRadius="$12" />
        <Avatar.Fallback
          backgroundColor="$color8"
          borderRadius="$12"
          ai="center"
          jc="center"
        >
          <Text fontSize="$4">
            {creator.name?.substring(0, 1).toUpperCase()}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      <YStack gap={4}>
        <Link href={`${linkCtx.root}c/${community.slug}`} push>
          <Text fontSize="$2" fontWeight={500} color="$color12">
            c/{community.slug}
          </Text>
        </Link>
        <XStack>
          <Link href={`${linkCtx.root}u/${postView.creator.id}`} push>
            <Text fontSize="$2" fontWeight={500} color="$color11">
              u/{creator.name}
            </Text>
          </Link>

          <RelativeTime
            prefix=" • "
            time={post.published}
            color="$color11"
            fontSize="$3"
          />
        </XStack>
      </YStack>

      <View flex={1} />

      {pinned && (
        <Pin fill="#17B169" color="#17B169" size="$1" rotate="45deg" />
      )}

      <ActionMenu
        placement="bottom-end"
        actions={[
          {
            label: "Share",
            onClick: () =>
              Share.share({
                url: `https://blorpblorp.xyz/c/${postView.community.slug}/posts/${encodeURIComponent(postView.post.ap_id)}`,
              }),
          },
          {
            label: "View source",
            onClick: async () => {
              const url = postView.post.ap_id;
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                Linking.openURL(url);
              }
            },
          },
          {
            label: "Report",
            onClick: () =>
              requireAuth().then(() => {
                showReportModal(postView.post.ap_id);
              }),
            danger: true,
          },
          {
            label: "Block person",
            onClick: async () => {
              try {
                await requireAuth();
                await alrt(`Block ${postView.creator.name}`);
                blockPerson.mutate({
                  person_id: postView.creator.id,
                  block: true,
                });
              } catch (err) {}
            },
            danger: true,
          },
        ]}
        trigger={
          <View p="$2.5" pr={0}>
            <Ellipsis size={16} />
          </View>
        }
      />
    </XStack>
  );
}
