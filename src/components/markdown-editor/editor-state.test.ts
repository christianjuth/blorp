import { expect, test, describe } from "vitest";
import { MarkdownEditorState } from "./editor-state";

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
      '"%s%s" isWrappedWithMarkder("%s") = %s',
      (content, _, marker, isWrapped, selection) => {
        const editor = new MarkdownEditorState(content);
        editor.setSelection(selection.start, selection.end);
        expect(editor.isWrappedWithMarker(marker)).toBe(isWrapped);
      },
    );
  });

  describe("toolbar states", () => {
    test.each([
      ...createIsWrappedTestCases("**", "isBold"),
      ...createIsWrappedTestCases("_", "isItalic"),
      ...createIsWrappedTestCases("~~", "isStrikethrough"),
    ])('"%s" %s(%s) = %s', (content, method, _, isWrapped, selection) => {
      if (!method) {
        throw new Error("missing method");
      }
      const editor = new MarkdownEditorState(content);
      editor.setSelection(selection.start, selection.end);
      expect(editor[method]()).toBe(isWrapped);
    });
  });

  describe("toolbar actions", () => {
    test.each([["bold", "text", "**text**"]])(
      '%s("%s") = "%s"',
      (method, initContent, transformedContent) => {
        const editor = new MarkdownEditorState(initContent);
        editor.setSelection(0, initContent.length);
        editor[method]();
        const state = editor.getState();
        expect(state.content).toBe(transformedContent);
      },
    );
  });

  test.each([["text\ntext\ntext", sel(2, 8), [0, 1]]])(
    "getSelectedLineIndicies",
    (content, selection, output) => {
      const editor = new MarkdownEditorState(content);
      editor.setSelection(selection.start, selection.end);
      expect(editor.getSelectedLineIndicies()).toEqual(output);
    },
  );
});
