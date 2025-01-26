import { View, Text, XStack, YStack, ScrollView, Button } from "tamagui";
import { useCommunity } from "~/src/lib/lemmy";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Markdown } from "../markdown";
import { CakeSlice } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";
import { useCustomHeaderHeight } from "../nav/hooks";
import { useWindowDimensions } from "react-native";
import { CommunityJoinButton } from "./community-join-button";
import { Link } from "one";
import { useLinkContext } from "../nav/link-context";

dayjs.extend(localizedFormat);

export const COMMUNITY_SIDEBAR_WIDTH = 300;

export function Sidebar({
  communityName,
  hideDescription = false,
}: {
  communityName: string;
  hideDescription?: boolean;
}) {
  const header = useCustomHeaderHeight();
  const dimensions = useWindowDimensions();

  const { data } = useCommunity({
    name: communityName,
  });

  if (!data) {
    return null;
  }

  const communityView = data.community_view;
  const community = communityView.community;
  const counts = communityView.counts;

  return (
    <View
      maxHeight={dimensions.height - header.height}
      position="absolute"
      l="$0"
      r="$0"
      t="$0"
      bg="$background"
      $md={{
        p: "$4",
      }}
    >
      <ScrollView zIndex="$5">
        <YStack py="$3" gap="$3">
          <XStack ai="flex-start" jc="space-between">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                {community.title}
              </Text>

              <XStack ai="center" gap="$1.5">
                <CakeSlice size="$1" color="$color11" />
                <Text fontSize="$3" color="$color11">
                  Created {dayjs(community.published).format("ll")}
                </Text>
              </XStack>
            </YStack>

            <CommunityJoinButton
              communityName={communityName}
              $gtMd={{ dsp: "none" }}
            />
          </XStack>

          <XStack>
            <YStack gap="$1" flex={1}>
              <Text fontWeight="bold" fontSize="$4">
                {abbriviateNumber(counts.subscribers)}
              </Text>
              <Text fontSize="$3" color="$color11">
                Members
              </Text>
            </YStack>

            <YStack gap="$1" flex={1}>
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
        {community.description && !hideDescription && (
          <View py="$3" btc="$color0" btw={1}>
            <Markdown markdown={community.description} color="$color11" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function SmallScreenSidebar({
  communityName,
}: {
  communityName: string;
}) {
  const linkCtx = useLinkContext();

  const { data } = useCommunity({
    name: communityName,
  });

  if (!data) {
    return null;
  }

  const communityView = data.community_view;
  const community = communityView.community;
  const counts = communityView.counts;

  return (
    <YStack
      bg="$background"
      bbc="$color3"
      bbw={1}
      flex={1}
      p="$3"
      gap="$3"
      $gtMd={{ dsp: "none" }}
    >
      <XStack ai="flex-start" jc="space-between">
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="bold">
            {community.title}
          </Text>

          <XStack ai="center" gap="$1.5">
            <CakeSlice size="$1" color="$color11" />
            <Text fontSize="$3" color="$color11">
              Created {dayjs(community.published).format("ll")}
            </Text>
          </XStack>
        </YStack>

        <CommunityJoinButton communityName={communityName} />
      </XStack>

      <XStack>
        <YStack gap="$1" flex={1}>
          <Text fontWeight="bold" fontSize="$4">
            {abbriviateNumber(counts.subscribers)}
          </Text>
          <Text fontSize="$3" color="$color11">
            Members
          </Text>
        </YStack>

        <YStack gap="$1" flex={1}>
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

      <Link href={`${linkCtx.root}c/${communityName}/sidebar`} asChild>
        <Button ai="flex-start" jc="flex-start" p={0} pt="$1" h="auto" tag="a">
          <Text color="$accentColor">Show more</Text>
        </Button>
      </Link>
    </YStack>
  );
}
