import { useState, useEffect } from "react";
import { Image as RNImage } from "react-native";
import { Stack } from "tamagui";
import { Image as TImage } from "@tamagui/image-next";

export const Image = ({ imageUrl }: { imageUrl: string }) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // Fetch the image dimensions
    RNImage.getSize(
      imageUrl,
      (width, height) => {
        setDimensions({ width, height });
      },
      (error) => {
        console.error("Failed to get image size:", error);
      },
    );
  }, [imageUrl]);

  // Calculate aspect ratio
  const aspectRatio = dimensions
    ? dimensions.width / dimensions.height
    : undefined;

  return (
    <Stack width="100%">
      <TImage
        aspectRatio={aspectRatio}
        width="100%"
        src={imageUrl}
        objectFit="contain"
      />
    </Stack>
  );
};
