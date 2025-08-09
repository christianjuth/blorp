export function IFramePostEmbed({ embedVideoUrl }: { embedVideoUrl: string }) {
  return (
    <iframe
      className="aspect-video rounded-lg"
      src={embedVideoUrl}
      allowFullScreen
    />
  );
}
