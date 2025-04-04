import * as React from "react";
import type { Preview } from "@storybook/react";
import { Providers } from "../src/components/providers";
import "../src/index.css";

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
    <Providers>
      <Story />
    </Providers>
  ),
};

export default preview;
