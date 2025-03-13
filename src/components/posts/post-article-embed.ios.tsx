import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import SafariView from "react-native-safari-view";

export function PostArticleEmbed({
  url: postUrl,
  thumbnail,
}: {
  url: string;
  thumbnail?: string;
}) {
  if (!postUrl) {
    return null;
  }

  const url = postUrl ? new URL(postUrl) : undefined;

  return (
    <View
      onPress={() => {
        const url = postUrl;
        if (url) {
          SafariView.isAvailable()
            .then(() =>
              SafariView.show({
                url,
                readerMode: true,
              }),
            )
            .catch((error) => {});
        }
      }}
    >
      {thumbnail && (
        <Image
          imageUrl={thumbnail}
          aspectRatio={16 / 9}
          objectFit="cover"
          disableShare
          borderTopRadius={10}
          priority
        />
      )}
      {url && (
        <Text
          p="$3"
          bg="$color5"
          color="$color11"
          numberOfLines={1}
          br={thumbnail ? undefined : 10}
          bbrr={10}
          bblr={10}
          fontSize="$4"
        >
          {url.host}
          {url.pathname}
        </Text>
      )}
    </View>
  );
}
