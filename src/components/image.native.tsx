import { useState, useEffect } from "react";
import { Share } from "react-native";
import { useTheme } from "tamagui";
import _ from "lodash";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { impactAsync, ImpactFeedbackStyle } from "~/src/lib/haptics";
import { imageSizeCache, measureImage } from "../lib/image";
import { Image as ExpoImage } from "expo-image";

export const prefetch = (src: string[]) => {
  ExpoImage.prefetch(src);
};

export function clearCache() {
  return Promise.all([
    ExpoImage.clearDiskCache(),
    ExpoImage.clearMemoryCache(),
  ]);
}

export const shareImage = async (imageUrl: string) => {
  try {
    impactAsync(ImpactFeedbackStyle.Heavy);

    // Download the image to a local file
    const fileUri = `${FileSystem.cacheDirectory}shared-image.jpg`;
    const downloadedFile = await FileSystem.downloadAsync(imageUrl, fileUri);

    if (!(await Sharing.isAvailableAsync())) {
      // If sharing is not available, share via URL instead
      await Share.share({
        message: `Check out this image: ${imageUrl}`,
      });
      return;
    }

    // Share the downloaded image
    await Sharing.shareAsync(downloadedFile.uri);
  } catch (error) {
    // Alert.alert("Error", "An error occurred while sharing the image.");
    console.error(error);
  }
};

export function Image({
  imageUrl,
  priority,
  borderTopRadius,
  borderRadius,
  maxWidth,
  aspectRatio,
  objectFit = "contain",
  disableShare = false,
  style,
  onLoad,
}: {
  imageUrl?: string | number;
  priority?: boolean;
  borderTopRadius?: number;
  borderRadius?: number;
  maxWidth?: number;
  aspectRatio?: number;
  objectFit?: "contain" | "cover";
  disableShare?: boolean;
  style?: {
    height?: number | "100%";
    width?: number | "100%";
  };
  onLoad?: () => any;
}) {
  const theme = useTheme();
  const [loaded, setLoaded] = useState<string | number>();
  const [dimensions, setDimensions] = useState<
    | {
        width: number;
        height: number;
      }
    | undefined
  >(_.isString(imageUrl) ? imageSizeCache.get(imageUrl) : undefined);
  useEffect(() => {
    if (!imageUrl || _.isNumber(aspectRatio) || _.isNumber(imageUrl)) {
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
  return (
    <ExpoImage
      recyclingKey={_.isString(imageUrl) ? imageUrl : undefined}
      transition={0}
      source={_.isString(imageUrl) ? { uri: imageUrl } : imageUrl}
      cachePolicy="memory"
      priority={priority ? "high" : undefined}
      style={{
        // Don't use flex 1
        // it causes issues on native
        aspectRatio: calculatedAspectRatio,
        backgroundColor: loaded !== imageUrl ? theme.gray3.val : undefined,
        width: maxWidth ? maxWidth : "100%",
        maxWidth: "100%",
        height: undefined,
        borderRadius: borderRadius,
        borderTopRightRadius: borderTopRadius ?? borderRadius,
        borderTopLeftRadius: borderTopRadius ?? borderRadius,
        ...style,
      }}
      contentFit={objectFit}
      onLoad={({ source }) => {
        setDimensions({
          height: source.height,
          width: source.width,
        });
        setLoaded(imageUrl);
        onLoad?.();
      }}
    />
  );
}
