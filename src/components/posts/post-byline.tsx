import { View, Text, Avatar, YStack, XStack } from "tamagui";
import { RelativeTime } from "~/src/components/relative-time";
import { FlattenedPost } from "~/src/lib/lemmy";
import { Link } from "one";
import { useLinkContext } from "../nav/link-context";
import { ActionMenu } from "../ui/action-menu";
import { Share, Linking } from "react-native";
import { Ellipsis } from "@tamagui/lucide-icons";

export function PostByline({ postView }: { postView: FlattenedPost }) {
  const { creator, community, post } = postView;
  const linkCtx = useLinkContext();

  return (
    <XStack dsp="flex" fd="row" ai="center">
      <Avatar size={25} mr="$2">
        <Avatar.Image src={creator.avatar} borderRadius="$12" />
        <Avatar.Fallback
          backgroundColor="$color8"
          borderRadius="$12"
          ai="center"
          jc="center"
        >
          <Text fontSize="$1">
            {creator.name?.substring(0, 1).toUpperCase()}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      <YStack gap="$1">
        <Link href={`${linkCtx.root}c/${community.slug}`} push>
          <Text fontSize="$2" fontWeight={500} color="$color12">
            c/{community.slug}
          </Text>
        </Link>
        <XStack>
          <Text fontSize="$2" fontWeight={500} color="$color11">
            u/{creator.name}
          </Text>

          <RelativeTime
            prefix=" • "
            time={post.published}
            color="$color11"
            fontSize="$3"
          />
        </XStack>
      </YStack>

      <View flex={1} />

      <ActionMenu
        placement="bottom-end"
        actions={[
          {
            label: "Report",
            onClick: () => {},
          },
          {
            label: "Share",
            onClick: () =>
              Share.share({
                url: `https://blorpblorp.xyz/c/${postView.community.slug}/posts/${encodeURIComponent(postView.post.ap_id)}`,
              }),
          },
          {
            label: "View original",
            onClick: async () => {
              const url = postView.post.ap_id;
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                Linking.openURL(url);
              }
            },
          },
        ]}
        trigger={<Ellipsis size={16} />}
      />
    </XStack>
  );
}
