import { Video } from "react-native-video";
import { View } from "tamagui";

export function PostVideoEmbed({
  url,
  autoPlay = false,
}: {
  url: string;
  autoPlay?: boolean;
}) {
  return (
    <View
      aspectRatio={16 / 9}
      pos="relative"
      $md={{
        mx: "$-2.5",
      }}
      br="$3"
      bg="$color5"
      overflow="hidden"
    >
      <Video
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
        source={{
          uri: url,
        }}
        controls
        resizeMode="contain"
        paused={autoPlay}
      />
    </View>
  );
}
