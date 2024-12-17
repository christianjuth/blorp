import { useState, useEffect } from "react";
import {
  // Image as RNImage,
  Platform,
} from "react-native";
import { imageSizeCache, measureImage } from "../lib/lemmy";
import { useTheme, Text } from "tamagui";
import _ from "lodash";
import RNImage from "./fast-image";

export function Image({
  imageUrl,
  priority,
  borderRadius,
  maxWidth,
}: {
  imageUrl: string;
  priority?: boolean;
  borderRadius?: number;
  maxWidth?: number;
}) {
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
    measureImage(imageUrl)
      .then((data) => {
        if (data) {
          setDimensions(data);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }, [imageUrl]);

  // Calculate aspect ratio
  const aspectRatio = dimensions
    ? dimensions.width / dimensions.height
    : undefined;

  return (
    <RNImage
      key={imageUrl}
      source={{ uri: imageUrl }}
      style={{
        aspectRatio: (_.isNaN(aspectRatio) ? undefined : aspectRatio) ?? 1,
        flex: 1,
        backgroundColor: theme.gray3.val,
        borderRadius,
        borderWidth: 1,
        borderColor: theme.gray2.val,
        width: maxWidth ? "100%" : undefined,
        maxWidth: maxWidth,
      }}
      resizeMethod="scale"
      resizeMode="cover"
    />
  );
}
