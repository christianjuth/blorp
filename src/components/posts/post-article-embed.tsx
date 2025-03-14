import { Text, View } from "tamagui";
import { Image } from "~/src/components/image";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "~/src/lib/tauri";

export function PostArticleEmbed({
  url,
  displayUrl,
  thumbnail,
}: {
  url?: string;
  displayUrl?: string;
  thumbnail?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (isTauri() && url) {
          e.preventDefault();
          openUrl(url);
        }
      }}
      style={{
        display: !url ? "none" : undefined,
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
            {displayUrl ?? url}
          </Text>
        )}
      </View>
    </a>
  );
}
