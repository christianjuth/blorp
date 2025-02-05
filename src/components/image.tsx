import { useState, useEffect } from "react";
import _ from "lodash";
import type { ImagePrefetchOptions } from "expo-image";
import { imageSizeCache, measureImage } from "../lib/image";

export const shareImage = async (imageUrl: string) => {};

export function prefetch(urls: string[], options?: ImagePrefetchOptions) {}

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
  imageUrl: string;
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
        ...style,
      }}
      fetchPriority={priority ? "high" : undefined}
      onLoad={onLoad}
    />
  );
}
