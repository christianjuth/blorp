import "./_layout.css";
import "./tamagui.css";

import { LoadProgressBar, Slot } from "one";
import { Providers } from "~/src/components/providers";
import { NavigationContainer } from "@react-navigation/native";

export default function Layout() {
  return (
    <>
      {/* <LoadProgressBar /> */}

      <NavigationContainer>
        <Providers>
          <Slot />
        </Providers>
      </NavigationContainer>
    </>
  );
}
