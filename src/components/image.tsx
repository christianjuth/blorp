import { useState, useEffect } from "react";
import { Platform } from "react-native";
import { imageSizeCache, measureImage } from "../lib/lemmy";
import { useTheme } from "tamagui";
import _ from "lodash";
import { Image as ExpoImage } from "expo-image";
import { useSettingsStore } from "../stores/settings";

export function Image({
  imageUrl,
  priority,
  borderRadius,
  maxWidth,
  aspectRatio,
}: {
  imageUrl: string;
  priority?: boolean;
  borderRadius?: number;
  maxWidth?: number;
  aspectRatio?: number;
}) {
  const cacheImages = useSettingsStore((s) => s.cacheImages);
  const theme = useTheme();

  if (Platform.OS === "web") {
    return (
      <img
        src={imageUrl}
        style={{
          flex: 1,
          borderRadius,
          borderWidth: 1,
          borderColor: theme.gray4.val,
          borderStyle: "solid",
          width: maxWidth ? "100%" : undefined,
          maxWidth: maxWidth,
          objectFit: "contain",
          aspectRatio,
        }}
        fetchPriority={priority ? "high" : undefined}
      />
    );
  }

  const [dimensions, setDimensions] = useState<
    | {
        width: number;
        height: number;
      }
    | undefined
  >(imageSizeCache.get(imageUrl));

  useEffect(() => {
    if (_.isNumber(aspectRatio)) {
      return;
    }

    measureImage(imageUrl)
      .then((data) => {
        if (data) {
          setDimensions(data);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }, [imageUrl, aspectRatio]);

  // Calculate aspect ratio
  aspectRatio =
    aspectRatio ??
    (dimensions ? dimensions.width / dimensions.height : undefined);
  aspectRatio = _.isNaN(aspectRatio) ? 1 : (aspectRatio ?? 1);

  return (
    <ExpoImage
      // key={imageUrl}
      source={{ uri: imageUrl }}
      style={{
        aspectRatio: aspectRatio,
        flex: 1,
        backgroundColor: theme.gray3.val,
        borderRadius,
        borderWidth: 1,
        borderColor: theme.gray2.val,
        width: maxWidth ? "100%" : undefined,
        maxWidth: maxWidth,
        // THIS IS A HACK
        // aspect ratio doesn't seem to be working
        // with react native fast image
        height: maxWidth ? maxWidth / aspectRatio : undefined,
      }}
      contentFit="contain"
      cachePolicy={cacheImages ? "disk" : "memory"}
    />
  );
}
