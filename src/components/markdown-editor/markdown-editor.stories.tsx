import type { Meta, StoryObj } from "@storybook/react";

import { MarkdownEditor, MarkdownEditorState } from ".";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof MarkdownEditor> = {
  component: MarkdownEditor,
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

export const Editor: Story = {
  args: {
    editor: new MarkdownEditorState("this is some test copy"),
  },
};
