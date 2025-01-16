import { expect, test, describe, vi } from "vitest";
import { MarkdownEditorState } from "./editor-state";
import _ from "lodash";

vi.useFakeTimers();

function sel(start: number, end: number) {
  return {
    start,
    end,
  };
}

function createIsWrappedTestCases<S extends string, M extends string>(
  marker: S,
  method?: M,
) {
  return [
    [
      `${marker}text${marker}`,
      method ?? "",
      method ? "" : marker,
      true,
      sel(marker.length, marker.length + 4),
    ],
    ["text", method ?? "", method ? "" : marker, false, sel(0, 4)],
  ] as const;
}

describe("MarkdownEditorState", () => {
  test("it allows content to be set", () => {
    const editor = new MarkdownEditorState("");
    const state1 = editor.getState();
    expect(state1.content).toBe("");

    const newContent = "This is a test";
    editor.setContent(newContent);
    const state2 = editor.getState();
    expect(state2.content).toBe(newContent);
  });

  test("it allows selection to be set", () => {
    const editor = new MarkdownEditorState("");
    const state1 = editor.getState();
    expect(state1.cursorPosition).toBe(undefined);

    const newContent = "This is a test";
    editor.setContent(newContent);
    editor.setSelection(newContent.length, newContent.length);
    const state2 = editor.getState();

    // We return undefined for cursorPosition
    // in this context to prevent locking the selection
    // on React Native. Essentially we subscribe to but
    // don't make it a controled component.
    //
    // However, when we queue multiple updates view
    // queueUpdate, that temporarily switched the input
    // to controlled by returning cursorPosition.
    expect(state2.cursorPosition).toBe(undefined);
  });

  describe("isWrappedWithMarker", () => {
    test.each([
      ...createIsWrappedTestCases("**"),
      ...createIsWrappedTestCases("_"),
      ...createIsWrappedTestCases("~~"),
    ])(
      '"%s%s" isWrappedWithMarkder("%s") is %s',
      (content, _, marker, isWrapped, selection) => {
        const editor = new MarkdownEditorState(content);
        editor.setSelection(selection.start, selection.end);
        expect(editor.isWrappedWithMarker(marker)).toBe(isWrapped);
      },
    );
  });

  describe("toolbar states", () => {
    describe("isBold", () => {
      test.each(createIsWrappedTestCases("**", "isBold"))(
        '"%s" %s(%s) is %s',
        (content, method, _, isWrapped, selection) => {
          if (!method) {
            throw new Error("missing method");
          }
          const editor = new MarkdownEditorState(content);
          editor.setSelection(selection.start, selection.end);
          expect(editor[method]()).toBe(isWrapped);
        },
      );
    });

    describe("isItalic", () => {
      test.each(createIsWrappedTestCases("_", "isItalic"))(
        '"%s" %s(%s) is %s',
        (content, method, _, isWrapped, selection) => {
          if (!method) {
            throw new Error("missing method");
          }
          const editor = new MarkdownEditorState(content);
          editor.setSelection(selection.start, selection.end);
          expect(editor[method]()).toBe(isWrapped);
        },
      );
    });

    describe("isStrikethrough", () => {
      test.each(createIsWrappedTestCases("~~", "isStrikethrough"))(
        '"%s" %s(%s) is %s',
        (content, method, _, isWrapped, selection) => {
          if (!method) {
            throw new Error("missing method");
          }
          const editor = new MarkdownEditorState(content);
          editor.setSelection(selection.start, selection.end);
          expect(editor[method]()).toBe(isWrapped);
        },
      );
    });

    describe("isHeading", () => {
      test.each([
        ["not a heading", false],
        ["#also not a heading", false],
        ["# is a heading", true],
      ])('isHeading("%s") is %s', (content, isHeading) => {
        const editor = new MarkdownEditorState(content);
        editor.setSelection(0, 0);
        expect(editor.isHeading()).toBe(isHeading);
      });
    });

    describe("isQuote", () => {
      test.each([
        ["not a quote", false],
        [">also not a quote", false],
        ["> is a quote", true],
      ])('isQuote("%s") is %s', (content, isHeading) => {
        const editor = new MarkdownEditorState(content);
        editor.setSelection(0, 0);
        expect(editor.isQuote()).toBe(isHeading);
      });
    });
  });

  describe("toolbar actions", () => {
    test.each([
      ["bold", "text", "**text**"],
      ["italic", "text", "_text_"],
      ["strikethrough", "text", "~~text~~"],
      ["quote", "text", "> text"],
      ["quote", "> text", "text"],
      ["toggleHeading", "text", "# text"],
      ["toggleHeading", "# text", "text"],
    ])('%s("%s") = "%s"', (method, initContent, transformedContent) => {
      const editor = new MarkdownEditorState(initContent);
      editor.setSelection(0, initContent.length);
      editor[method]();
      const state = editor.getState();
      expect(state.content).toBe(transformedContent);
    });
  });

  test.each([["text\ntext\ntext", sel(2, 8), [0, 1]]])(
    "getSelectedLineIndicies",
    (content, selection, output) => {
      const editor = new MarkdownEditorState(content);
      editor.setSelection(selection.start, selection.end);
      expect(editor.getSelectedLineIndicies()).toEqual(output);
    },
  );

  test("addEventListener", () => {
    const editor = new MarkdownEditorState();
    const listener = vi.fn();
    const unsubscribe = editor.addEventListener(listener);

    for (let i = 0; i < 5; i++) {
      editor.setContent("");
      expect(listener).toBeCalledTimes(i + 1);
    }

    unsubscribe();
    for (let i = 0; i < 5; i++) {
      editor.setContent("");
      expect(listener).toBeCalledTimes(5);
    }
  });

  describe("onEnterPress", () => {
    test.each([
      ["* list item", "* "],
      ["1. list item", "2. "],
      ["> list item", "> "],
      ["list item", ""],
    ])(
      'onEnterPress("%s") prefixes new line with "%s"',
      (initContent, newLinePrefix) => {
        const editor = new MarkdownEditorState(initContent);
        editor.setSelection(initContent.length, initContent.length);

        editor.onEnterPress();
        const state1 = editor.getState();
        if (!newLinePrefix) {
          // In this case, onEnterPress doesn't
          // do anything special. We check the content
          // hasn't changed, and there should be no \n
          // since we're waiting for <TextInput />
          // onTextChange, which will update content
          expect(state1.content).toBe(initContent);
          return;
        }
        expect(state1.content).toBe(`${initContent}\n${newLinePrefix}`);
        expect(state1.cursorPosition).not.toBe(undefined);

        vi.advanceTimersByTime(500);
        const state2 = editor.getState();
        expect(state2.content).toBe(`${initContent}\n${newLinePrefix}`);
        // Not 100% sure if this is right, but pinning this
        // behavior for now so I know if it changes
        expect(state1.cursorPosition).not.toBe(undefined);
      },
    );
  });
});
