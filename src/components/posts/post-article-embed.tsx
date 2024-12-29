import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import { FlattenedPost } from "~/src/lib/lemmy";

export function PostArticleEmbed({ postView }: { postView: FlattenedPost }) {
  const post = postView.post;
  const url = post.url ? new URL(post.url) : undefined;

  if (!post.url) {
    return null;
  }

  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer">
      <View br="$5" overflow="hidden">
        {post.thumbnail_url && (
          <Image
            imageUrl={post.thumbnail_url}
            aspectRatio={16 / 9}
            objectFit="cover"
            disableShare
          />
        )}
        {url && (
          <Text p="$3" bg="$color5" color="$color11" numberOfLines={1}>
            {url.host}
            {url.pathname}
          </Text>
        )}
      </View>
    </a>
  );
}
