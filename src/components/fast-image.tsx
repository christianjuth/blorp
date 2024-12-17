import { ImageProps } from "react-native";
import type FastImage from "react-native-fast-image";

export default function Image(props: ImageProps) {
  return <Image {...props} />;
}

const preload: typeof FastImage.preload = () => {};

Image.preload = preload;
