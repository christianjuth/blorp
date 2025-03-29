import { parseYouTubeVideoId } from "../lib/youtube";

export function YouTubeVideoEmbed({ url }: { url?: string }) {
  const videoId = url ? parseYouTubeVideoId(url) : undefined;

  if (!videoId) {
    return null;
  }
  return (
    <div className="aspect-video rounded-xl overflow-hidden">
      <iframe
        style={{
          height: "100%",
          width: "100%",
          borderWidth: 0,
        }}
        src={`https://www.youtube.com/embed/${videoId}`}
      />
    </div>
  );
}
