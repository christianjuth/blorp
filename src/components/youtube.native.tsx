import { View } from "tamagui";
import { parseYouTubeVideoId } from "../lib/youtube";
import { Linking } from "react-native";
import { WebView } from "react-native-webview/src";
import { OnShouldStartLoadWithRequest } from "react-native-webview/src/WebViewTypes";

export function YouTubeVideoEmbed({ url }: { url?: string }) {
  const videoId = url ? parseYouTubeVideoId(url) : undefined;

  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&controls=1&playsinline=1`;

  const handleNavigation: OnShouldStartLoadWithRequest = (event) => {
    const newUrl = event.url;

    if (newUrl === embedUrl) {
      return true;
    }

    try {
      Linking.canOpenURL(newUrl)
        .then(() => {
          Linking.openURL(newUrl);
        })
        .catch((err) => {
          console.error("failed to open url", err);
        });
      return false;
    } catch (err) {}

    return false;
  };

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
