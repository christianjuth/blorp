import * as React from "react";
import type { Preview } from "@storybook/react";
import { Providers } from "../src/components/providers";
import { NavigationContainer } from "@react-navigation/native";
import "../app/_layout.css";
import "../app/tamagui.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: (Story) => (
    <NavigationContainer>
      <Providers>
        <Story />
      </Providers>
    </NavigationContainer>
  ),
};

export default preview;
