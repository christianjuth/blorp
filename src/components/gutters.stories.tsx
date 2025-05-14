import type { Meta, StoryObj } from "@storybook/react";

import { ContentGutters } from "./gutters";
import { Fragment } from "react";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof ContentGutters> = {
  component: ContentGutters,
};

export default meta;
type Story = StoryObj<typeof ContentGutters>;

export const FullWidthContent: Story = {
  args: {
    children: <div className="h-32 bg-muted">Full width content</div>,
  },
};

export const ContentWidthSidebar: Story = {
  args: {
    children: [
      <div className="h-32 bg-muted" key={0}>
        I respect the sidebar
      </div>,
      <div className="h-32 bg-muted" key={1}>
        Sidebar
      </div>,
    ],
  },
};

export const ContentRespectSidebar: Story = {
  args: {
    children: [
      <div className="h-32 bg-muted" key={0}>
        I respect the sidebar
      </div>,
      <Fragment key={1}></Fragment>,
    ],
  },
};

export const SidebarRespectContent: Story = {
  args: {
    children: [
      <div className="flex-1" key={0} />,
      <div className="h-32 bg-muted" key={1}>
        I respect the content
      </div>,
    ],
  },
};
