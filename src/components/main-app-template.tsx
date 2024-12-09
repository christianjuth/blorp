import { ScrollView, View } from "tamagui";
import { Sidebar } from "./sidebar";
import { SafeAreaView } from "react-native-safe-area-context";

export function MainAppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <View h="100%" dsp="flex" fd="row" $sm={{ dsp: "contents" }}>
      <View
        w={270}
        backgroundColor="$color1"
        brc="$color5"
        brw={1}
        $sm={{ dsp: "none" }}
      >
        <ScrollView>
          <SafeAreaView>
            <View p="$3">
              <Sidebar />
            </View>
          </SafeAreaView>
        </ScrollView>
      </View>

      <View flex={1} h="100%" $sm={{ dsp: "contents" }}>
        {children}
      </View>
    </View>
  );
}
