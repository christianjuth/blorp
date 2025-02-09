import { View, Text, XStack, YStack, ScrollView } from "tamagui";
import { useCommunity } from "~/src/lib/lemmy/index";
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
import { useCommunitiesStore } from "~/src/stores/communities";
import { ContentGutters } from "../gutters";

dayjs.extend(localizedFormat);

export const COMMUNITY_SIDEBAR_WIDTH = 300;

export function CommunitySidebar({
  communityName,
  hideDescription = false,
  asPage,
}: {
  communityName: string;
  hideDescription?: boolean;
  asPage?: boolean;
}) {
  const header = useCustomHeaderHeight();
  const dimensions = useWindowDimensions();

  const data = useCommunitiesStore((s) => s.communities[communityName]?.data);

  if (!data) {
    return null;
  }

  const communityView = data.communityView;
  const community = communityView.community;
  const counts = communityView.counts;

  const content = (
    <>
      <YStack $gtMd={{ py: "$3" }} gap="$3">
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
              {counts && abbriviateNumber(counts.subscribers)}
            </Text>
            <Text fontSize="$3" color="$color11">
              Members
            </Text>
          </YStack>

          <YStack gap="$1" flex={1}>
            <Text fontWeight="bold" fontSize="$4">
              {counts && abbriviateNumber(counts.posts)}
            </Text>
            <Text fontSize="$3" color="$color11">
              Posts
            </Text>
          </YStack>

          <YStack gap="$1" flex={1}>
            <Text fontWeight="bold" fontSize="$4">
              {counts && abbriviateNumber(counts.comments)}
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
    </>
  );

  return (
    <View
      position={asPage ? undefined : "absolute"}
      maxHeight={dimensions.height - header.height}
      bg="$background"
      flex={1}
    >
      <ScrollView
        zIndex="$5"
        $md={{
          p: "$4",
        }}
      >
        {asPage ? (
          <ContentGutters>
            <View flex={1}>{content}</View>
          </ContentGutters>
        ) : (
          content
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

  useCommunity({
    name: communityName,
  });
  const data = useCommunitiesStore((s) => s.communities[communityName]?.data);

  if (!data) {
    return null;
  }

  const communityView = data.communityView;
  const community = communityView.community;
  const counts = communityView.counts;

  return (
    <YStack
      bg="$background"
      bbc="$color3"
      bbw={0.5}
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
            {counts && abbriviateNumber(counts.subscribers)}
          </Text>
          <Text fontSize="$3" color="$color11">
            Members
          </Text>
        </YStack>

        <YStack gap="$1" flex={1}>
          <Text fontWeight="bold" fontSize="$4">
            {counts && abbriviateNumber(counts.posts)}
          </Text>
          <Text fontSize="$3" color="$color11">
            Posts
          </Text>
        </YStack>

        <YStack gap="$1" flex={1}>
          <Text fontWeight="bold" fontSize="$4">
            {counts && abbriviateNumber(counts.comments)}
          </Text>
          <Text fontSize="$3" color="$color11">
            Comments
          </Text>
        </YStack>
      </XStack>

      <Link href={`${linkCtx.root}c/${communityName}/sidebar`}>
        <Text color="$accentColor">Show more</Text>
      </Link>
    </YStack>
  );
}
