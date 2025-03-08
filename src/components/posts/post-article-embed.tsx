import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import { FlattenedPost } from "~/src/lib/lemmy/utils";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "~/src/lib/tauri";

export function PostArticleEmbed({ postView }: { postView: FlattenedPost }) {
  const post = postView.post;
  const url = post.url ? new URL(post.url) : undefined;

  if (!post.url) {
    return null;
  }

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (isTauri() && post.url) {
          e.preventDefault();
          openUrl(post.url);
        }
      }}
    >
      <View br={10} overflow="hidden">
        {post.thumbnail_url && (
          <Image
            imageUrl={post.thumbnail_url}
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
            fontSize="$4"
          >
            {url.host}
            {url.pathname.replace(/\/$/, "")}
          </Text>
        )}
      </View>
    </a>
  );
}
