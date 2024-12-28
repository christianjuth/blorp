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
  objectFit = "contain",
}: {
  imageUrl: string;
  priority?: boolean;
  borderRadius?: number;
  maxWidth?: number;
  aspectRatio?: number;
  objectFit?: "contain" | "cover";
}) {
  const cacheImages = useSettingsStore((s) => s.cacheImages);
  const theme = useTheme();

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
  let calculatedAspectRatio =
    aspectRatio ??
    (dimensions ? dimensions.width / dimensions.height : undefined);
  calculatedAspectRatio = _.isNaN(calculatedAspectRatio)
    ? 1
    : (calculatedAspectRatio ?? 1);

  if (Platform.OS === "web") {
    return (
      <img
        src={imageUrl}
        style={{
          // flex: 1,
          borderRadius,
          width: maxWidth ? "100%" : undefined,
          maxWidth: maxWidth,
          objectFit,
          aspectRatio,
        }}
        fetchPriority={priority ? "high" : undefined}
      />
    );
  }

  return (
    <ExpoImage
      key={imageUrl}
      source={{ uri: imageUrl }}
      style={{
        // Don't use flex 1
        // it causes issues on native
        aspectRatio: calculatedAspectRatio,
        backgroundColor: theme.gray3.val,
        width: maxWidth ? maxWidth : "100%",
        maxWidth: "100%",
        height: undefined,
      }}
      contentFit={objectFit}
      cachePolicy={cacheImages ? "disk" : "memory"}
      onLoad={({ source }) => {
        setDimensions({
          height: source.height,
          width: source.width,
        });
      }}
      priority={priority ? "high" : undefined}
    />
  );
}
