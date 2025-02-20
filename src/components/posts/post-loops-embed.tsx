import { useEffect, useState } from "react";
import { Video } from "react-native-video";
import { isWeb, View, XStack, YStack } from "tamagui";
import { scale } from "~/config/tamagui/scale";
import { Image } from "../image";
import { extractLoopsVideoSrc } from "~/src/lib/html-parsing";
import { Link } from "one";
import { Play } from "@tamagui/lucide-icons";
import { isTauri } from "~/src/lib/tauri";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const AR = 9 / 16;
const MAX_WIDTH_GT_MD = 700 * scale;

const getVideo = async (url: string) => {
  try {
    const res = await (isTauri() ? tauriFetch(url) : fetch(url));
    const html = await res.text();
    return extractLoopsVideoSrc(html);
  } catch (err) {
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

  const linkOut = isWeb && !isTauri();

  const content = (
    <XStack jc="center" pos="relative" bg="$gray1">
      <YStack
        flex={1}
        aspectRatio={AR}
        bg="black"
        $md={{
          mx: "$-3",
          br: 0,
        }}
        $gtMd={{
          maxWidth: MAX_WIDTH_GT_MD * AR,
          maxHeight: MAX_WIDTH_GT_MD,
        }}
      >
        {!src && thumbnail && (
          <Image
            imageUrl={thumbnail}
            style={{
              height: "100%",
              width: "100%",
            }}
          />
        )}
        {!linkOut && src && (
          <Video
            style={{
              height: "100%",
              width: "100%",
            }}
            source={{
              uri: src,
            }}
            controls
            resizeMode="contain"
            paused={!autoPlay}
          />
        )}
      </YStack>

      {linkOut && (
        <View
          br={99999}
          p="$4"
          bg="$color05"
          pos="absolute"
          t="50%"
          l="50%"
          transform={[{ translateX: "-50%" }, { translateY: "-50%" }]}
          hoverStyle={{
            opacity: 0.8,
          }}
        >
          <Play color="white" size="$3" />
        </View>
      )}
    </XStack>
  );

  return linkOut ? (
    <Link href={url as any} target="_blank">
      {content}
    </Link>
  ) : (
    content
  );
}
