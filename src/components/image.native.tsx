import { useState, useEffect, memo, useMemo } from "react";
import { Image as RNImage } from "react-native";
import { measureImage } from "../lib/lemmy";
import { useTheme } from "tamagui";

export function Image({
  imageUrl,
  priority,
  loading,
}: {
  imageUrl: string;
  priority?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    measureImage(imageUrl).then(setDimensions);
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
      }}
      resizeMethod="scale"
      resizeMode="cover"
      blurRadius={loading ? 100 : undefined}
    />
  );
}
