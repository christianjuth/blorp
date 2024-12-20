import FastImage, { FastImageProps } from "react-native-fast-image";
import _ from "lodash";
import { useSettingsStore } from "../stores/settings";

export default function Image(props: FastImageProps) {
  const cacheImages = useSettingsStore((s) => s.cacheImages);
  return (
    <FastImage
      {...props}
      source={
        _.isObject(props.source)
          ? {
              cache: cacheImages ? "immutable" : "web",
              ...props.source,
            }
          : props.source
      }
    />
  );
}

Image.preload = FastImage.preload;
Image.clearDiskCache = FastImage.clearDiskCache;
