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
      className="flex flex-col"
    >
      {thumbnail && (
        <Image
          imageUrl={thumbnail}
          objectFit="cover"
          disableShare
          borderTopRadius={10}
          priority
        />
      )}
      {url && (
        <span
          // p="$3"
          // bg="$color5"
          // color="$color11"
          // numberOfLines={1}
          // fontSize="$4"
          className="p-3 bg-zinc-200 dark:bg-zinc-800 truncate text-ellipsis rounded-b-lg"
        >
          {displayUrl ?? url}
        </span>
      )}
    </a>
  );
}
