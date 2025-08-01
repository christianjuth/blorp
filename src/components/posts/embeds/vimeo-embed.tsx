import { useMemo } from "react";

export function VimeoEmbed({ url }: { url: string }) {
  const embedUrl = useMemo(() => {
    return url.replace("://vimeo.com/", "://player.vimeo.com/video/");
  }, [url]);
  return (
    <iframe
      className="aspect-video rounded-lg"
      src={embedUrl}
      allowFullScreen
    />
  );
}
