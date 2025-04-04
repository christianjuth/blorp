import type { StorybookConfig } from "@storybook/react-vite";

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
  framework: "@storybook/react-vite",
  async viteFinal(config) {
    // @ts-expect-error
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    config.plugins?.unshift(tsconfigPaths(), tailwindcss());
    return config;
  },
};
export default config;
