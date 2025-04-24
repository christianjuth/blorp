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
import { IoLogoMarkdown, IoDocumentText } from "react-icons/io5";
import { useUploadImage } from "@/src/lib/lemmy";
import { LuImageUp } from "react-icons/lu";
import _ from "lodash";

function IconFileInput({ onFile }: { onFile: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
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
  if (!editor) {
    return null;
  }
  return (
    <div className="flex flex-row items-center">
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

      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().toggleCode().run()} */}
      {/*   disabled={!editor.can().chain().focus().toggleCode().run()} */}
      {/*   className={editor.isActive("code") ? "is-active" : ""} */}
      {/* > */}
      {/*   Code */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().unsetAllMarks().run()} */}
      {/* > */}
      {/*   Clear marks */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().clearNodes().run()} */}
      {/* > */}
      {/*   Clear nodes */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().setParagraph().run()} */}
      {/*   className={editor.isActive("paragraph") ? "is-active" : ""} */}
      {/* > */}
      {/*   Paragraph */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => */}
      {/*     editor.chain().focus().toggleHeading({ level: 1 }).run() */}
      {/*   } */}
      {/*   className={ */}
      {/*     editor.isActive("heading", { level: 1 }) ? "is-active" : "" */}
      {/*   } */}
      {/* > */}
      {/*   H1 */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => */}
      {/*     editor.chain().focus().toggleHeading({ level: 2 }).run() */}
      {/*   } */}
      {/*   className={ */}
      {/*     editor.isActive("heading", { level: 2 }) ? "is-active" : "" */}
      {/*   } */}
      {/* > */}
      {/*   H2 */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => */}
      {/*     editor.chain().focus().toggleHeading({ level: 3 }).run() */}
      {/*   } */}
      {/*   className={ */}
      {/*     editor.isActive("heading", { level: 3 }) ? "is-active" : "" */}
      {/*   } */}
      {/* > */}
      {/*   H3 */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => */}
      {/*     editor.chain().focus().toggleHeading({ level: 4 }).run() */}
      {/*   } */}
      {/*   className={ */}
      {/*     editor.isActive("heading", { level: 4 }) ? "is-active" : "" */}
      {/*   } */}
      {/* > */}
      {/*   H4 */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => */}
      {/*     editor.chain().focus().toggleHeading({ level: 5 }).run() */}
      {/*   } */}
      {/*   className={ */}
      {/*     editor.isActive("heading", { level: 5 }) ? "is-active" : "" */}
      {/*   } */}
      {/* > */}
      {/*   H5 */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => */}
      {/*     editor.chain().focus().toggleHeading({ level: 6 }).run() */}
      {/*   } */}
      {/*   className={ */}
      {/*     editor.isActive("heading", { level: 6 }) ? "is-active" : "" */}
      {/*   } */}
      {/* > */}
      {/*   H6 */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().toggleBulletList().run()} */}
      {/*   className={editor.isActive("bulletList") ? "is-active" : ""} */}
      {/* > */}
      {/*   Bullet list */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().toggleOrderedList().run()} */}
      {/*   className={editor.isActive("orderedList") ? "is-active" : ""} */}
      {/* > */}
      {/*   Ordered list */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().toggleCodeBlock().run()} */}
      {/*   className={editor.isActive("codeBlock") ? "is-active" : ""} */}
      {/* > */}
      {/*   Code block */}
      {/* </button> */}
      <Toggle
        size="icon"
        data-state={editor.isActive("blockquote") ? "on" : "off"}
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
      >
        <FaQuoteRight />
      </Toggle>
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().setHorizontalRule().run()} */}
      {/* > */}
      {/*   Horizontal rule */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().setHardBreak().run()} */}
      {/* > */}
      {/*   Hard break */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().undo().run()} */}
      {/*   disabled={!editor.can().chain().focus().undo().run()} */}
      {/* > */}
      {/*   Undo */}
      {/* </button> */}
      {/* <button */}
      {/*   type="button" */}
      {/*   onClick={() => editor.chain().focus().redo().run()} */}
      {/*   disabled={!editor.can().chain().focus().redo().run()} */}
      {/* > */}
      {/*   Redo */}
      {/* </button> */}

      <IconFileInput onFile={onFile} />

      <Toggle
        type="button"
        onClick={() =>
          // @ts-expect-error
          editor.commands.insertSpoiler()
        }
        size="sm"
      >
        Spoiler
      </Toggle>
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
}: {
  autoFocus?: boolean;
  content: string;
  onChange: (content: string) => void;
  onChangeEditorType: () => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  id?: string;
}) {
  const uploadImage = useUploadImage();

  const handleFile = async (file: File) => {
    if (file.type === "image/jpeg" || file.type === "image/png") {
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
      StarterKit,
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
    ],
    onUpdate: ({ editor }) => {
      const markdown = editor?.storage.markdown.getMarkdown();
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
                const node = schema.nodes.image.create({ src: url }); // creates the image element
                const transaction = view.state.tr.insert(
                  coordinates?.pos ?? 0,
                  node,
                ); // places it in the correct position
                return view.dispatch(transaction);
              })
              .catch(console.error);
          }
          return true; // handled
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor?.storage.markdown.getMarkdown() !== content) {
      editor?.commands.setContent(content);
    }
  }, [content]);

  return (
    <>
      <div className="flex flex-row justify-between p-1.5 pb-0">
        <MenuBar
          editor={editor}
          onFile={(file) =>
            handleFile(file)
              .then(({ url }) => {
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run();
                }
              })
              .catch(console.error)
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
        className="prose dark:prose-invert prose-sm flex-1 max-w-full leading-normal py-2 px-3 overflow-auto"
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
}: {
  content: string;
  onChange: (content: string) => void;
  onChangeEditorType: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  id?: string;
}) {
  return (
    <>
      <div className="flex flex-row justify-end p-1.5 pb-0">
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
        className="prose dark:prose-invert prose-sm resize-none w-full font-mono outline-none pt-2 px-3 flex-1"
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
  onBlur,
  onChageEditorType,
  footer,
  id,
}: {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onChageEditorType?: () => void;
  footer?: React.ReactNode;
  id?: string;
}) {
  const skipBlurRef = useRef(-1);

  const [autoFocus, setAutoFocus] = useState(autoFocusDefault ?? false);
  const showMarkdown = useSettingsStore((s) => s.showMarkdown);
  const setShowMarkdown = useSettingsStore((s) => s.setShowMarkdown);

  return (
    <div
      className={cn("flex flex-col flex-1", className)}
      onMouseDown={() => {
        skipBlurRef.current = Date.now();
      }}
    >
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
          onBlur={() => {
            if (Date.now() - skipBlurRef.current < 50) {
              skipBlurRef.current = -1;
              return;
            }
            onBlur?.();
          }}
          id={id}
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
          onBlur={() => {
            if (Date.now() - skipBlurRef.current < 50) {
              skipBlurRef.current = -1;
              return;
            }
            onBlur?.();
          }}
          id={id}
        />
      )}
      {footer}
    </div>
  );
}
