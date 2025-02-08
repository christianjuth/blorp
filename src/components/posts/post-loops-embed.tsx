import { useEffect, useState } from "react";
import { Video } from "react-native-video";
import { isWeb, XStack, YStack } from "tamagui";
import { scale } from "~/config/tamagui/scale";
import { Image } from "../image";
import { extractLoopsVideoSrc } from "~/src/lib/html-parsing";

const AR = 9 / 16;
const MAX_WIDTH_GT_MD = 500 * scale;

const getVideo = async (url: string) => {
  try {
    const res = await fetch(url);
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

  return (
    <XStack jc="center">
      <YStack
        bg="$gray3"
        flex={1}
        aspectRatio={AR}
        $md={{
          mx: "$-2.5",
          br: 0,
        }}
        $gtMd={{
          maxWidth: MAX_WIDTH_GT_MD * AR,
          maxHeight: MAX_WIDTH_GT_MD,
        }}
      >
        {isWeb && thumbnail && (
          <Image
            imageUrl={thumbnail}
            style={{
              height: "100%",
              width: "100%",
            }}
          />
        )}
        {!isWeb && src && (
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
    </XStack>
  );
}
