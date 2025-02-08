import { useEffect, useState } from "react";
import { Video } from "react-native-video";
import { isWeb, View, XStack, YStack } from "tamagui";
import { scale } from "~/config/tamagui/scale";
import { Image } from "../image";
import { extractLoopsVideoSrc } from "~/src/lib/html-parsing";
import { Link } from "one";
import { Play, PlayCircle } from "@tamagui/lucide-icons";

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

  const content = (
    <XStack jc="center" bg="$gray3" pos="relative">
      <YStack
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

      {isWeb && (
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

  return isWeb ? (
    <Link href={url as any} target="_blank">
      {content}
    </Link>
  ) : (
    content
  );
}
