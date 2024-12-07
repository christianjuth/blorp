import { useState, useEffect } from "react";
import { Image as RNImage, Platform } from "react-native";
import { measureImage } from "../lib/lemmy";
import { useTheme } from "tamagui";
import Animated from "react-native-reanimated";

export function Image({
  imageUrl,
  priority,
  borderRadius,
}: {
  imageUrl: string;
  priority?: boolean;
  borderRadius?: number;
}) {
  const theme = useTheme();

  if (Platform.OS === "web") {
    return (
      <img
        src={imageUrl}
        style={{
          width: "100%",
          borderRadius,
          borderWidth: 1,
          borderColor: theme.gray4.val,
          borderStyle: "solid",
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
  >(undefined);

  useEffect(() => {
    measureImage(imageUrl)
      .then((data) => {
        if (data) {
          setDimensions(data);
        }
      })
      .catch(() => {});
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
        aspectRatio: aspectRatio ?? 1,
        width: "100%",
        backgroundColor: theme.gray3.val,
        borderRadius,
        borderWidth: 1,
        borderColor: theme.gray2.val,
      }}
      resizeMethod="scale"
      resizeMode="cover"
    />
  );
}
