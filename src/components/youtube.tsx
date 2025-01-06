import { View } from "tamagui";
import { parseYouTubeVideoId } from "../lib/youtube";

export function YouTubeVideoEmbed({ url }: { url?: string }) {
  const videoId = url ? parseYouTubeVideoId(url) : undefined;

  if (!videoId) {
    return null;
  }
  return (
    <View aspectRatio={16 / 9} br="$4" overflow="hidden">
      <iframe
        style={{
          height: "100%",
          width: "100%",
          borderWidth: 0,
        }}
        src={`https://www.youtube.com/embed/${videoId}`}
      />
    </View>
  );
}
