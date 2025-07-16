import { cn } from "@/src/lib/utils";

export function PostVideoEmbed({
  url,
  autoPlay = false,
  blurNsfw,
}: {
  url: string;
  autoPlay?: boolean;
  blurNsfw: boolean;
}) {
  return (
    <div className="max-md:-mx-3.5 md:contents relative">
      <video
        className={cn(
          "aspect-video w-full md:rounded-xl",
          blurNsfw && "blur-3xl",
        )}
        src={url}
        controls
        autoPlay={autoPlay}
        playsInline
      />
      {blurNsfw && (
        <div className="absolute top-1/2 inset-x-0 text-center z-0 font-bold text-xl">
          NSFW
        </div>
      )}
    </div>
  );
}
