import type { Meta, StoryObj } from "@storybook/react";

import { AnimatedRollingNumber } from ".";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof AnimatedRollingNumber> = {
  component: AnimatedRollingNumber,
};

export default meta;
type Story = StoryObj<typeof AnimatedRollingNumber>;

export const RollingNumber: Story = {
  args: {
    value: 156,
    textStyle: {
      color: "red",
    },
  },
};
