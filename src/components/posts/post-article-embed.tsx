import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "@/src/lib/tauri";
import { cn } from "@/src/lib/utils";

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
      className="flex flex-col"
    >
      {thumbnail && (
        <img
          src={thumbnail}
          className="object-cover aspect-video rounded-t-xl"
        />
      )}
      {url && (
        <div
          className={cn(
            "p-3 bg-zinc-200 dark:bg-zinc-800 truncate text-ellipsis rounded-b-xl text-sm text-zinc-500",
            !thumbnail && "rounded-t-xl",
          )}
        >
          <span className="line-clamp-1">{displayUrl ?? url}</span>
        </div>
      )}
    </a>
  );
}
