import { Image } from "react-native";
import { useParams } from "one";
import { useCommunity } from "~/src/lib/lemmy";

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
    <Image
      source={{ uri: banner }}
      style={{
        aspectRatio: 7,
        objectFit: "cover",
        borderRadius: 12,
        flex: 1,
      }}
    />
  );
}
