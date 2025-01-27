import { Image } from "react-native";
import { useParams } from "one";
import { useCommunity } from "~/src/lib/lemmy";
import { View, XStack, YStack, Text } from "tamagui";
import { CommunityJoinButton } from "./community-join-button";
import { createCommunitySlug } from "~/src/lib/community";
import { useCommunitiesStore } from "~/src/stores/communities";

export function CommunityBanner() {
  const { communityName } = useParams<{ communityName: string }>();

  useCommunity({
    name: communityName,
  });
  const data = useCommunitiesStore((s) =>
    communityName ? s.communities[communityName]?.data : null,
  );

  const slug = data ? createCommunitySlug(data.communityView.community) : null;

  const banner = data?.communityView.community.banner;
  const icon = data?.communityView.community.icon;

  const hideBanner = !banner;

  return (
    <YStack flex={1}>
      {!hideBanner && (
        <View pt="$2.5" flex={1} $md={{ dsp: "none" }} pos="relative">
          <Image
            source={{ uri: banner }}
            style={{
              aspectRatio: 5,
              objectFit: "cover",
              borderRadius: 12,
              backgroundColor: "#eee",
              width: "100%",
            }}
          />

          <View
            h={90}
            w={90}
            bg="$color1"
            pos="absolute"
            top="100%"
            l="$4"
            transform={[
              {
                translateY: -45,
              },
            ]}
            borderRadius="$12"
            bc="$background"
            bw={2}
          >
            <Image
              source={{ uri: icon }}
              style={{
                height: "100%",
                width: "100%",
                borderRadius: 9999999,
                position: "absolute",
              }}
            />
          </View>
        </View>
      )}

      <XStack
        pl={hideBanner ? 0 : 120}
        $md={{ dsp: "none" }}
        ai="center"
        jc="space-between"
        my="$2"
      >
        <Text fontWeight="bold" fontSize="$7">
          c/{slug}
        </Text>
        <CommunityJoinButton communityName={communityName} />
      </XStack>
    </YStack>
  );
}
