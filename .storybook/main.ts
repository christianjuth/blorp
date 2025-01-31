import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: "@storybook/react-native-web-vite",
  async viteFinal(config) {
    config.plugins?.unshift(tsconfigPaths());
    config.resolve!.alias = {
      one: path.resolve(__dirname, "../test-utils/mocks/one.js"),
    };
    return config;
  },
};
export default config;
