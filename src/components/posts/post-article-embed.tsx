import { openUrl } from "@tauri-apps/plugin-opener";
import {
  InAppBrowser,
  DefaultSystemBrowserOptions,
} from "@capacitor/inappbrowser";
import { isTauri } from "@/src/lib/tauri";
import { cn } from "@/src/lib/utils";
import { Capacitor } from "@capacitor/core";

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
        if (!url) {
          return;
        }

        if (isTauri()) {
          e.preventDefault();
          openUrl(url);
        } else if (Capacitor.isNativePlatform()) {
          e.preventDefault();
          InAppBrowser.openInSystemBrowser({
            url,
            options: {
              ...DefaultSystemBrowserOptions,
              iOS: {
                ...DefaultSystemBrowserOptions.iOS,
                enableReadersMode: true,
              },
            },
          });
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
