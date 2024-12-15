import { Image } from "react-native";
import { useParams } from "one";
import { useCommunity } from "~/src/lib/lemmy";
import { View } from "tamagui";

export function CommunityBanner() {
  const { communityName } = useParams<{ communityName: string }>();

  const { data, isLoading } = useCommunity({
    name: communityName,
  });

  const banner = data?.community_view.community.banner;
  const icon = data?.community_view.community.icon;

  if (!isLoading && !banner) {
    return null;
  }

  return (
    <View pt="$2.5" flex={1} $md={{ dsp: "none" }} pos="relative" mb={25}>
      <Image
        source={{ uri: banner }}
        style={{
          aspectRatio: 5,
          objectFit: "cover",
          // borderRadius: 12,
          backgroundColor: "#eee",
          width: "100%",
        }}
      />

      <View
        h={80}
        w={80}
        bg="$color1"
        pos="absolute"
        top="100%"
        l="$4"
        transform={[
          {
            translateY: -40,
          },
        ]}
        borderRadius="$12"
        bc="$color2"
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
  );
}
