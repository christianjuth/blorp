import { View, Text, XStack, ScrollView, Avatar, YStack } from "tamagui";
import { Link } from "one";
import { useListCommunities } from "~/src/lib/lemmy";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useCustomHeaderHeight } from "~/src/components/headers";
import { useWindowDimensions } from "react-native";
import { CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "~/src/lib/format";

dayjs.extend(localizedFormat);

function SmallComunityCard({
  communityView,
}: {
  communityView: CommunityView;
}) {
  const { community, counts } = communityView;

  return (
    <Link href={`/c/${community.id}`} key={community.id} asChild replace>
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
  const header = useCustomHeaderHeight();
  const dimensions = useWindowDimensions();

  const { data } = useListCommunities({
    sort: "TopAll",
    limit: 20,
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
    >
      <ScrollView bg="$color3" br="$4" zIndex="$5" p="$4">
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
