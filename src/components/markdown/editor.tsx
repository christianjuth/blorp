import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Spoiler from "./spoiler-plugin";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../ui/button";
import {
  AiOutlineBold,
  AiOutlineItalic,
  AiOutlineStrikethrough,
} from "react-icons/ai";
import { FaQuoteRight } from "react-icons/fa6";
import { Toggle } from "../ui/toggle";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
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
  content,
  onChange,
  onChangeEditorType,
}: {
  content: string;
  onChange: (content: string) => void;
  onChangeEditorType: () => void;
}) {
  const editor = useEditor({
    content,
    extensions: [StarterKit, Markdown, Spoiler],
    onUpdate: ({ editor }) => {
      const markdown = editor?.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  return (
    <>
      <div className="flex flex-row justify-between">
        <MenuBar editor={editor} />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onChangeEditorType}
        >
          Show markdown editor
        </Button>
      </div>
      <EditorContent
        autoFocus
        className="prose dark:prose-invert prose-sm flex-1 max-w-full leading-normal p-2"
        editor={editor}
      />
    </>
  );
}

function PlainTextEditorInner({
  content,
  onChange,
  onChangeEditorType,
}: {
  content: string;
  onChange: (content: string) => void;
  onChangeEditorType: () => void;
}) {
  return (
    <>
      <div className="flex flex-row justify-end">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onChangeEditorType}
        >
          Show rich text editor
        </Button>
      </div>
      <TextareaAutosize
        autoFocus
        defaultValue={content}
        onChange={(e) => onChange(e.target.value)}
        className="prose dark:prose-invert prose-sm resize-none max-w-full font-mono outline-none"
      />
    </>
  );
}

export function MarkdownEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const [showMarkdown, setShowMarkdown] = useState(false);

  return (
    <div className="flex flex-col flex-1 p-2">
      {showMarkdown ? (
        <PlainTextEditorInner
          content={content}
          onChange={onChange}
          onChangeEditorType={() => setShowMarkdown(false)}
        />
      ) : (
        <MarkdownEditorInner
          content={content}
          onChange={onChange}
          onChangeEditorType={() => setShowMarkdown(true)}
        />
      )}
    </div>
  );
}
