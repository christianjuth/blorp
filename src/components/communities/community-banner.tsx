import { Image } from "react-native";
import { useParams } from "one";
import { useCommunity } from "~/src/lib/lemmy";
import { View } from "tamagui";

export function CommunityBanner() {
  const { communityId } = useParams<{ communityId: string }>();

  const { data, isLoading } = useCommunity({
    id: communityId,
  });

  const banner = data?.community_view.community.banner;

  if (!isLoading && !banner) {
    return null;
  }

  return (
    <View pt="$2.5" flex={1}>
      <Image
        source={{ uri: banner }}
        style={{
          aspectRatio: 7,
          objectFit: "cover",
          borderRadius: 12,
          backgroundColor: "#eee",
          width: "100%",
        }}
      />
    </View>
  );
}
