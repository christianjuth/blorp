import { View, Text, XStack, ScrollView, Avatar, YStack } from "tamagui";
import { Link } from "one";
import { createCommunitySlug, useListCommunities } from "~/src/lib/lemmy";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";
import { useWindowDimensions } from "react-native";
import { CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "~/src/lib/format";
import { useFiltersStore } from "../stores/filters";

dayjs.extend(localizedFormat);

function SmallComunityCard({
  communityView,
}: {
  communityView: CommunityView;
}) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);
  return (
    <Link href={`/c/${slug}`} asChild replace>
      <XStack ai="center" gap="$3" tag="a">
        <Avatar size="$2.5" borderRadius="$12">
          <Avatar.Image src={community.icon} />
          <Avatar.Fallback
            backgroundColor="$color8"
            borderRadius="$12"
            ai="center"
            jc="center"
          >
            <Text fontSize="$4">{community.title.substring(0, 1)}</Text>
          </Avatar.Fallback>
        </Avatar>
        <YStack gap="$0.5">
          <Text fontSize="$3.5">c/{community.name}</Text>
          <Text fontSize="$3" color="$color10">
            {abbriviateNumber(counts.subscribers)} members
          </Text>
        </YStack>
      </XStack>
    </Link>
  );
}

export function PopularCommunitiesSidebar() {
  const listingType = useFiltersStore((s) => s.listingType);

  const header = useCustomHeaderHeight();
  const dimensions = useWindowDimensions();

  const { data } = useListCommunities({
    sort: "TopWeek",
    limit: 20,
    type_: listingType,
  });

  const communities = data?.pages.map((p) => p.communities).flat();

  return (
    <View
      maxHeight={dimensions.height - header.height}
      position="absolute"
      l="$0"
      r="$0"
      t="$0"
      py="$4"
      bg="$background"
    >
      <ScrollView
        bg="$color3"
        $theme-dark={{
          bg: "$background",
        }}
        br="$4"
        zIndex="$5"
        p="$4"
      >
        <YStack gap="$3">
          <Text color="$color10" fontSize="$3">
            POPULAR COMMUNITIES
          </Text>

          {communities?.map((view) => (
            <SmallComunityCard key={view.community.id} communityView={view} />
          ))}
        </YStack>
      </ScrollView>
    </View>
  );
}
