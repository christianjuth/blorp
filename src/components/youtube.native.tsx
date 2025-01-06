import { View } from "tamagui";
import { parseYouTubeVideoId } from "../lib/youtube";
import { Linking } from "react-native";
import { WebView } from "react-native-webview/src";
import { OnShouldStartLoadWithRequest } from "react-native-webview/src/WebViewTypes";

export function YouTubeVideoEmbed({ url }: { url?: string }) {
  const handleNavigation: OnShouldStartLoadWithRequest = async (event) => {
    const url = event.url;

    try {
      await Linking.canOpenURL(url);
      Linking.openURL(url);
      return false;
    } catch (err) {}

    return true;
  };

  const videoId = url ? parseYouTubeVideoId(url) : undefined;

  if (!videoId) {
    return null;
  }

  return (
    <View aspectRatio={16 / 9} br="$4" overflow="hidden">
      <WebView
        style={{
          height: "100%",
          width: "100%",
        }}
        bounces={false}
        originWhitelist={["*"]}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        source={{
          uri: `https://www.youtube.com/embed/${videoId}?modestbranding=1&controls=1&playsinline=1`,
        }}
        onShouldStartLoadWithRequest={handleNavigation}
      />
    </View>
  );
}
