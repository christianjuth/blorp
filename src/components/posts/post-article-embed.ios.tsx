import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import SafariView from "react-native-safari-view";

export function PostArticleEmbed({
  url,
  displayUrl,
  thumbnail,
}: {
  url?: string;
  displayUrl: string;
  thumbnail?: string;
}) {
  if (!url) {
    return null;
  }

  return (
    <View
      onPress={() => {
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
      dsp={!url ? "none" : undefined}
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
          {displayUrl}
        </Text>
      )}
    </View>
  );
}
