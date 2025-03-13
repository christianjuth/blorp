import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "~/src/lib/tauri";

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
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (isTauri() && postUrl) {
          e.preventDefault();
          openUrl(postUrl);
        }
      }}
    >
      <View br={10} overflow="hidden">
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
