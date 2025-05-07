import {
  Editor,
  EditorContent,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Spoiler from "./spoiler-plugin";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../ui/button";
import {
  AiOutlineBold,
  AiOutlineItalic,
  AiOutlineStrikethrough,
} from "react-icons/ai";
import { FaQuoteRight } from "react-icons/fa6";
import { Toggle } from "../ui/toggle";
import { cn } from "@/src/lib/utils";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { CodeBlockEditor, lowlight } from "./code-block";
import { useSettingsStore } from "@/src/stores/settings";
import {
  IoLogoMarkdown,
  IoDocumentText,
  IoLink,
  IoEllipsisHorizontal,
} from "react-icons/io5";
import { useUploadImage } from "@/src/lib/lemmy";
import { LuImageUp } from "react-icons/lu";
import _ from "lodash";
import { useIonAlert } from "@ionic/react";
import { Deferred } from "@/src/lib/deferred";
import z from "zod";
import { ActionMenu } from "../adaptable/action-menu";
import { toast } from "sonner";
import { MdOutlineFormatClear } from "react-icons/md";

const linkSchema = z.object({
  description: z.string(),
  url: z.string(),
});

function IconFileInput({ onFile }: { onFile: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
        }}
      />
      <Toggle
        data-state="off"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload File"
      >
        <LuImageUp />
      </Toggle>
    </>
  );
}

const MenuBar = ({
  editor,
  onFile,
}: {
  editor: Editor | null;
  onFile: (file: File) => void;
}) => {
  const [alrt] = useIonAlert();

  if (!editor) {
    return null;
  }
  return (
    <div className="flex flex-row items-center gap-1.5">
      <IconFileInput onFile={onFile} />

      <Toggle
        size="icon"
        data-state={editor.isActive("link") ? "on" : "off"}
        type="button"
        onClick={async () => {
          const isLinkActive = editor.isActive("link");

          let prevDescription = "";
          const { from, to } = editor.state.selection;
          if (isLinkActive) {
            editor.chain().focus().extendMarkRange("link").run();
            prevDescription = editor.state.doc.textBetween(from, to, " ");
          } else if (to > from) {
            prevDescription = editor.state.doc.textBetween(from, to, " ");
          }

          const previousUrl = editor.getAttributes("link")["href"];

          try {
            const deferred = new Deferred<z.infer<typeof linkSchema>>();
            alrt({
              header: "Insert link",
              inputs: [
                {
                  name: "description",
                  placeholder: "Desscription",
                  value: prevDescription,
                },
                {
                  name: "url",
                  placeholder: "https://join-lemmy.org",
                  value: previousUrl,
                },
              ],
              buttons: [
                {
                  text: "Cancel",
                  role: "cancel",
                  handler: () => deferred.reject(),
                },
                {
                  text: "OK",
                  role: "confirm",
                  handler: (v) => {
                    console.log(v, "v");
                    try {
                      const link = linkSchema.parse(v);
                      deferred.resolve(link);
                    } catch {
                      deferred.reject();
                    }
                  },
                },
              ],
            });
            let { url, description } = await deferred.promise;
            description = description.trim() || url;

            if (url.trim() === "") {
              editor.chain().focus().unsetLink().run();
            } else if (isLinkActive) {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .insertContent(description)
                .setLink({ href: url })
                .run();
            } else {
              const { from } = editor.state.selection;
              const to = from + description.length;
              editor
                .chain()
                .focus()
                .insertContent(description)
                .setTextSelection({ from, to })
                .setLink({ href: url })
                .setTextSelection({ from: to, to })
                .run();
            }
          } catch {}
        }}
      >
        <IoLink />
      </Toggle>

      <Toggle
        size="icon"
        data-state={editor.isActive("bold") ? "on" : "off"}
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <AiOutlineBold />
      </Toggle>

      <Toggle
        size="icon"
        data-state={editor.isActive("italic") ? "on" : "off"}
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <AiOutlineItalic />
      </Toggle>

      <Toggle
        size="icon"
        data-state={editor.isActive("strike") ? "on" : "off"}
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
      >
        <AiOutlineStrikethrough />
      </Toggle>

      <Toggle
        size="icon"
        data-state={editor.isActive("blockquote") ? "on" : "off"}
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
      >
        <FaQuoteRight />
      </Toggle>

      <Toggle
        size="icon"
        data-state="off"
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <MdOutlineFormatClear />
      </Toggle>

      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().clearNodes().run()} */}
      {/* > */}
      {/*   Clear nodes */}
      {/* </button> */}

      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().setHardBreak().run()} */}
      {/* > */}
      {/*   Hard break */}
      {/* </button> */}

      <ActionMenu
        actions={[
          {
            text: "Horizontal Line",
            onClick: () => editor.chain().focus().setHorizontalRule().run(),
          },
          {
            text: "Code",
            onClick: () => editor.chain().focus().toggleCodeBlock().run(),
          },
          {
            text: "Spoiler",
            onClick: () => {
              // @ts-expect-error
              editor.commands.insertSpoiler();
            },
          },
          {
            text: "Unordered List",
            onClick: () => editor.chain().focus().toggleBulletList().run(),
          },
          {
            text: "Ordered List",
            onClick: () => editor.chain().focus().toggleOrderedList().run(),
          },
        ]}
        trigger={<IoEllipsisHorizontal className="text-muted-foreground" />}
      />
    </div>
  );
};

function MarkdownEditorInner({
  autoFocus,
  content,
  onChange,
  onChangeEditorType,
  placeholder,
  onFocus,
  onBlur,
  id,
  hideMenu,
}: {
  autoFocus?: boolean;
  content: string;
  onChange: (content: string) => void;
  onChangeEditorType: () => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  id?: string;
  hideMenu?: boolean;
}) {
  const uploadImage = useUploadImage();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("only images can be uploaded");
    }
    return uploadImage.mutateAsync({
      image: file,
    });
  };

  const editor = useEditor({
    autofocus: autoFocus,
    content,
    extensions: [
      Placeholder.configure({
        placeholder,
      }),
      StarterKit.configure({
        codeBlock: false,
      }),
      Image,
      Markdown,
      Spoiler,
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockEditor);
        },
      }).configure({
        lowlight,
      }),
      Link.configure({
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    onUpdate: ({ editor }) => {
      const markdown = editor?.storage["markdown"].getMarkdown();
      onChange(markdown);
    },
    onFocus: () => onFocus?.(),
    onBlur,
    editorProps: {
      attributes: {
        class: "flex-1 h-full",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file.type === "image/jpeg" || file.type === "image/png") {
            handleFile(file)
              .then(({ url }) => {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (schema.nodes["image"]) {
                  const node = schema.nodes["image"].create({ src: url }); // creates the image element
                  const transaction = view.state.tr.insert(
                    coordinates?.pos ?? 0,
                    node,
                  ); // places it in the correct position
                  return view.dispatch(transaction);
                } else {
                  console.error("Failed to handle dropped image");
                }
              })
              .catch((err) => {
                if (err instanceof Error) {
                  toast.error(err.message);
                } else {
                  toast.error("Failed to upload image");
                }
              });
          }
          return true; // handled
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor?.storage["markdown"].getMarkdown() !== content) {
      editor?.commands.setContent(content);
    }
  }, [content]);

  return (
    <>
      <div
        className={cn(
          "flex flex-row justify-between py-1.5 px-2 pb-0",
          hideMenu && "hidden",
        )}
      >
        <MenuBar
          editor={editor}
          onFile={(file) =>
            handleFile(file)
              .then(({ url }) => {
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run();
                }
              })
              .catch((err) => {
                if (err instanceof Error) {
                  toast.error(err.message);
                } else {
                  toast.error("Failed to upload image");
                }
              })
          }
        />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="max-md:hidden"
          onClick={onChangeEditorType}
        >
          Show markdown editor
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          className="md:hidden"
          onClick={onChangeEditorType}
        >
          <IoLogoMarkdown />
        </Button>
      </div>
      <EditorContent
        id={id}
        className="prose dark:prose-invert prose-sm flex-1 max-w-full leading-normal py-2 px-3.5 overflow-auto"
        editor={editor}
      />
    </>
  );
}

function PlainTextEditorInner({
  content,
  onChange,
  onChangeEditorType,
  autoFocus,
  placeholder,
  onFocus,
  onBlur,
  id,
  hideMenu,
}: {
  content: string;
  onChange: (content: string) => void;
  onChangeEditorType: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  id?: string;
  hideMenu?: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "flex flex-row justify-end py-1.5 px-2 pb-0",
          hideMenu && "hidden",
        )}
      >
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="max-md:hidden"
          onClick={onChangeEditorType}
        >
          Show rich text editor
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          className="md:hidden"
          onClick={onChangeEditorType}
        >
          <IoDocumentText />
        </Button>
      </div>
      <TextareaAutosize
        id={id}
        autoFocus={autoFocus}
        defaultValue={content}
        onChange={(e) => onChange(e.target.value)}
        className="prose dark:prose-invert prose-sm resize-none w-full font-mono outline-none pt-2 px-3.5"
        placeholder={placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </>
  );
}

export function MarkdownEditor({
  content,
  onChange,
  className,
  autoFocus: autoFocusDefault,
  placeholder,
  onFocus,
  onChageEditorType,
  footer,
  id,
  hideMenu,
}: {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onChageEditorType?: () => void;
  footer?: React.ReactNode;
  id?: string;
  hideMenu?: boolean;
}) {
  const [autoFocus, setAutoFocus] = useState(autoFocusDefault ?? false);
  const showMarkdown = useSettingsStore((s) => s.showMarkdown);
  const setShowMarkdown = useSettingsStore((s) => s.setShowMarkdown);

  return (
    <div className={cn("flex flex-col flex-1", className)}>
      {showMarkdown ? (
        <PlainTextEditorInner
          content={content}
          onChange={onChange}
          onChangeEditorType={() => {
            onChageEditorType?.();
            setAutoFocus(true);
            setShowMarkdown(false);
          }}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onFocus={onFocus}
          id={id}
          hideMenu={hideMenu}
        />
      ) : (
        <MarkdownEditorInner
          content={content}
          onChange={onChange}
          onChangeEditorType={() => {
            onChageEditorType?.();
            setAutoFocus(true);
            setShowMarkdown(true);
          }}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onFocus={onFocus}
          id={id}
          hideMenu={hideMenu}
        />
      )}
      {footer}
    </div>
  );
}
