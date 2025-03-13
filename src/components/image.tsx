import { useState, useEffect } from "react";
import _ from "lodash";
import { imageSizeCache, measureImage } from "../lib/image";
import { useTheme } from "tamagui";

export const shareImage = async (imageUrl: string) => {};

export function prefetch(urls: string[]) {}

export function clearCache() {}

export function Image({
  imageUrl,
  priority,
  borderTopRadius,
  borderRadius,
  maxWidth,
  aspectRatio,
  objectFit = "contain",
  style,
  onLoad,
}: {
  imageUrl: string | number;
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
  const [loaded, setLoaded] = useState(false);
  const theme = useTheme();

  const [dimensions, setDimensions] = useState<
    | {
        width: number;
        height: number;
      }
    | undefined
  >(_.isString(imageUrl) ? imageSizeCache.get(imageUrl) : undefined);

  useEffect(() => {
    if (_.isNumber(aspectRatio) || _.isNumber(imageUrl)) {
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

  if (_.isNumber(imageUrl)) {
    return null;
  }

  return (
    <img
      src={imageUrl}
      style={{
        // flex: 1,
        borderRadius,
        borderTopRightRadius: borderTopRadius ?? borderRadius,
        borderTopLeftRadius: borderTopRadius ?? borderRadius,
        backgroundColor: !loaded ? theme.gray3.val : undefined,
        width: maxWidth ? "100%" : undefined,
        maxWidth: maxWidth,
        objectFit,
        aspectRatio,
        ...style,
      }}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.();
      }}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
