export function PostVideoEmbed({
  url,
  autoPlay = false,
}: {
  url: string;
  autoPlay?: boolean;
}) {
  return (
    <div className="max-md:-mx-3.5 md:contents">
      <video
        className="aspect-video w-full md:rounded-xl"
        src={url}
        controls
        autoPlay={autoPlay}
        playsInline
      />
    </div>
  );
}
