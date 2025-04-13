// TODO: gracefully handle can't fetch loops on web fallback to link out

import { useEffect, useState } from "react";
import { extractLoopsVideoSrc } from "@/src/lib/html-parsing";
import { isTauri } from "@/src/lib/tauri";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// const AR = 9 / 16;
// const MAX_WIDTH_GT_MD = 700;

const getVideo = async (url: string) => {
  try {
    const res = await (isTauri() ? tauriFetch(url) : fetch(url));
    const html = await res.text();
    return extractLoopsVideoSrc(html);
  } catch {
    return undefined;
  }
};

export function PostLoopsEmbed({
  url,
  thumbnail,
  autoPlay = false,
}: {
  url: string;
  thumbnail?: string;
  autoPlay?: boolean;
}) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    getVideo(url).then(setSrc);
  }, [url]);

  // const linkOut = isWeb && !isTauri();
  const linkOut = false;

  const content = (
    <div className="bg-muted max-md:contents">
      <div className="aspect-[9/16] md:max-w-xs mx-auto relative max-md:-mx-2.5">
        {!src && thumbnail && (
          <img
            src={thumbnail}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {!linkOut && src && (
          <video
            src={src}
            controls
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay={autoPlay}
          />
        )}
      </div>

      {/* {linkOut && ( */}
      {/*   <div */}
      {/*     br={99999} */}
      {/*     p="$4" */}
      {/*     bg="$color05" */}
      {/*     pos="absolute" */}
      {/*     t="50%" */}
      {/*     l="50%" */}
      {/*     transform={[{ translateX: "-50%" }, { translateY: "-50%" }]} */}
      {/*     hoverStyle={{ */}
      {/*       opacity: 0.8, */}
      {/*     }} */}
      {/*   > */}
      {/*     <Play color="white" size="$3" /> */}
      {/*   </div> */}
      {/* )} */}
    </div>
  );

  return linkOut ? (
    <a href={url as any} target="_blank">
      {content}
    </a>
  ) : (
    content
  );
}
