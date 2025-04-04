import {
  BoldItalicUnderlineToggles,
  MDXEditor,
  InsertImage,
  BlockTypeSelect,
  ListsToggle,
  StrikeThroughSupSubToggles,
  headingsPlugin,
  toolbarPlugin,
  imagePlugin,
  listsPlugin,
} from "@mdxeditor/editor";

export function MarkdownEditor({
  value,
  onChange,
  showToolbar,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  showToolbar?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <MDXEditor
      autoFocus={autoFocus}
      placeholder="Add a comment..."
      className="w-full flex-1"
      contentEditableClassName="prose prose-sm dark:prose-invert"
      markdown={value}
      onChange={onChange}
      plugins={[
        imagePlugin({
          imageUploadHandler: () => Promise.resolve<string>(""),
        }),
        headingsPlugin(),
        listsPlugin(),
        toolbarPlugin({
          toolbarClassName: !showToolbar ? "hidden!" : undefined,
          toolbarPosition: "top",
          toolbarContents: () => (
            <>
              <BoldItalicUnderlineToggles />
              <StrikeThroughSupSubToggles />
              <ListsToggle />
              <BlockTypeSelect />
              <InsertImage />
            </>
          ),
        }),
      ]}
    />
  );
}
