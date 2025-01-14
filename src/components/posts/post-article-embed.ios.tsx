import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import { FlattenedPost } from "~/src/lib/lemmy";
import SafariView from "react-native-safari-view";

export function PostArticleEmbed({ postView }: { postView: FlattenedPost }) {
  const post = postView.post;
  const url = post.url ? new URL(post.url) : undefined;

  if (!post.url) {
    return null;
  }

  return (
    <View
      onPress={() => {
        const url = post.url;
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
      {post.thumbnail_url && (
        <Image
          imageUrl={post.thumbnail_url}
          aspectRatio={16 / 9}
          objectFit="cover"
          disableShare
          borderTopRadius={10}
        />
      )}
      {url && (
        <Text
          p="$3"
          bg="$color5"
          color="$color11"
          numberOfLines={1}
          br={post.thumbnail_url ? undefined : 10}
          bbrr={10}
          bblr={10}
        >
          {url.host}
          {url.pathname}
        </Text>
      )}
    </View>
  );
}
