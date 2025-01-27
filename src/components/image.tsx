import { useState, useEffect } from "react";
import { Platform, Share } from "react-native";
import { imageSizeCache, measureImage } from "../lib/lemmy";
import { useTheme } from "tamagui";
import _ from "lodash";
import { Image as ExpoImage } from "expo-image";
import { useSettingsStore } from "../stores/settings";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { impactAsync, ImpactFeedbackStyle } from "~/src/lib/haptics";

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
}: {
  imageUrl: string;
  priority?: boolean;
  borderTopRadius?: number;
  borderRadius?: number;
  maxWidth?: number;
  aspectRatio?: number;
  objectFit?: "contain" | "cover";
  disableShare?: boolean;
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
          borderTopRightRadius: borderTopRadius ?? borderRadius,
          borderTopLeftRadius: borderTopRadius ?? borderRadius,
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
      recyclingKey={imageUrl}
      source={{ uri: imageUrl }}
      style={{
        // Don't use flex 1
        // it causes issues on native
        aspectRatio: calculatedAspectRatio,
        backgroundColor: theme.gray3.val,
        width: maxWidth ? maxWidth : "100%",
        maxWidth: "100%",
        height: undefined,
        borderRadius: borderRadius,
        borderTopRightRadius: borderTopRadius ?? borderRadius,
        borderTopLeftRadius: borderTopRadius ?? borderRadius,
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
