import { View } from "tamagui";
import { Sidebar } from "./sidebar";

export function MainAppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <View h="100%" dsp="flex" fd="row" $sm={{ dsp: "contents" }}>
      <View w={270} brc="$color8" brw={1} $sm={{ dsp: "none" }}>
        <Sidebar />
      </View>

      <View flex={1} h="100%" $sm={{ dsp: "contents" }}>
        {children}
      </View>
    </View>
  );
}
