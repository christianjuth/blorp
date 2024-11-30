import { View } from "tamagui";
import { Feed } from "~/src/features/feed";

function DesktopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <View h="100%" dsp="flex" fd="row" $md={{ dsp: "contents" }}>
      <View w={300} brc="$color8" brw={1} $md={{ dsp: "none" }} />
      <View flex={1} h="100%">
        {children}
      </View>
    </View>
  );
}

export function HomePage() {
  return (
    <DesktopTemplate>
      <Feed />
    </DesktopTemplate>
  );
}
