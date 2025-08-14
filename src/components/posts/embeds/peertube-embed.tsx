import { useMemo } from "react";

export function PeerTubeEmbed({ url }: { url: string }) {
  const embedUrl = useMemo(() => {
    return url
      .replace("/videos/watch/", "/videos/embed/")
      .replace("/w/", "/videos/embed/");
  }, [url]);
  return (
    <iframe
      className="aspect-video rounded-lg"
      src={embedUrl}
      allowFullScreen
    />
  );
}
