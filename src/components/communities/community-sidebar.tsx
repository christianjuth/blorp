import { View, Text, XStack, YStack } from "tamagui";
import { useParams } from "one";
import { useCommunity } from "~/src/lib/lemmy";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Markdown } from "../markdown";
import { CakeSlice } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";

dayjs.extend(localizedFormat);

export const COMMUNITY_SIDEBAR_WIDTH = 300;

export function Sidebar() {
  const { communityId } = useParams<{ communityId: string }>();

  const { data } = useCommunity({
    id: communityId,
  });

  if (!data) {
    return null;
  }

  const communityView = data.community_view;
  const community = communityView.community;
  const counts = communityView.counts;

  return (
    <View
      l="$0"
      r="$0"
      t="$4"
      bg="$gray3"
      position="absolute"
      br="$3"
      zIndex="$5"
      w={COMMUNITY_SIDEBAR_WIDTH}
    >
      <YStack p="$3" gap="$3">
        <Text fontSize="$5" fontWeight="bold">
          {community.title}
        </Text>

        <XStack ai="center" gap="$1.5">
          <CakeSlice size="$1" color="$color11" />
          <Text fontSize="$3" color="$color11">
            Created {dayjs(community.published).format("LL")}
          </Text>
        </XStack>

        <XStack>
          <YStack gap="$1" flex={2}>
            <Text fontWeight="bold" fontSize="$4">
              {abbriviateNumber(counts.subscribers)}
            </Text>
            <Text fontSize="$3" color="$color11">
              Members
            </Text>
          </YStack>

          <YStack gap="$1" flex={2}>
            <Text fontWeight="bold" fontSize="$4">
              {abbriviateNumber(counts.posts)}
            </Text>
            <Text fontSize="$3" color="$color11">
              Posts
            </Text>
          </YStack>

          <YStack gap="$1" flex={1}>
            <Text fontWeight="bold" fontSize="$4">
              {abbriviateNumber(counts.comments)}
            </Text>
            <Text fontSize="$3" color="$color11">
              Comments
            </Text>
          </YStack>
        </XStack>
      </YStack>
      {community.description && (
        <View p="$3" btc="$borderColor" btw={1}>
          <Markdown markdown={community.description} color="$color11" />
        </View>
      )}
    </View>
  );
}
