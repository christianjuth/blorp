import { Image as RNImage, ImageProps } from "react-native";
import type FastImage from "react-native-fast-image";

export default function Image(props: ImageProps) {
  return <RNImage {...props} />;
}

const preload: typeof FastImage.preload = () => {};
const clearDiskCache: typeof FastImage.clearDiskCache = () =>
  new Promise((resolve) => resolve());

Image.preload = preload;
Image.clearDiskCache = clearDiskCache;
