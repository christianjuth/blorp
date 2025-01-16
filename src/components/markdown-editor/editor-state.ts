import _ from "lodash";

interface CursorPosition {
  start: number;
  end: number;
}

type ChangeListener = (content: string) => void;

interface Update {
  cursorPosition?: CursorPosition;
  content: string;
  delay: number;
  hideCaret?: boolean;
}

export class MarkdownEditorState {
  private content: string;
  private cursorPosition: CursorPosition;
  private changeListeners: Map<number, ChangeListener>;
  private listenerIdCounter: number;

  private newCursorPosition?: CursorPosition;

  private updates: Update[] = [];

  getState(): Omit<Update, "delay"> {
    if (this.updates.length > 0) {
      const nextState = this.updates.shift()!;
      this.content = nextState.content;
      this.cursorPosition = nextState.cursorPosition ?? this.cursorPosition;
      const nextUpdate = this.updates[0];
      if (nextUpdate) {
        if (nextUpdate.delay === 0) {
          requestAnimationFrame(() => {
            this.notifyChange();
          });
        } else {
          setTimeout(() => {
            this.notifyChange();
          }, nextUpdate.delay);
        }
      }
      return nextState;
    }

    return {
      content: this.content,
      // cursorPosition: this.cursorPosition,
    };
  }

  constructor(content: string = "") {
    this.content = content;
    this.cursorPosition = { start: 0, end: 0 };
    this.changeListeners = new Map();
    this.listenerIdCounter = 0;
  }

  // Add a listener for changes
  addEventListener(listener: ChangeListener) {
    const listenerId = this.listenerIdCounter++;
    this.changeListeners.set(listenerId, listener);

    return () => {
      this.changeListeners.delete(listenerId);
    };
  }

  // Notify all listeners about a change
  private notifyChange(): void {
    this.changeListeners.forEach((listener) => listener(this.content));
  }

  // Set new content
  setContent(newContent: string): void {
    if (this.updates.length > 0) {
      return;
    }
    this.content = newContent;
    this.notifyChange();
  }

  // Set cursor position (selection)
  setSelection(start: number, end: number): void {
    if (this.updates.length > 0) {
      return;
    } else {
      this.cursorPosition = { start, end };
    }
    this.notifyChange();
  }

  getSelection() {
    const pos = this.newCursorPosition;
    if (pos) {
      this.cursorPosition = pos;
    }
    return pos;
  }

  isWrappedWithMarker(marker: string): boolean {
    const { start, end } = this.cursorPosition;
    const before = this.content.slice(0, start);
    const selected = this.content.slice(start, end);
    const after = this.content.slice(end);

    // Case 1: Check if the selection is fully wrapped by markers (including markers themselves)
    const isFullyWrapped =
      selected.startsWith(marker) && selected.endsWith(marker);

    // Case 2: Check if markers are directly around the selection
    const isSurrounded = before.endsWith(marker) && after.startsWith(marker);

    // Case 3: Check if the cursor or selection is inside a wrapped section
    const openMarker = before.lastIndexOf(marker);
    const closeMarker = after.indexOf(marker);

    const isCursorInside =
      openMarker !== -1 &&
      closeMarker !== -1 &&
      openMarker === before.length - marker.length &&
      closeMarker === 0;

    return isFullyWrapped || isSurrounded || isCursorInside;
  }

  // Check if the selection is bold
  isBold(): boolean {
    return this.isWrappedWithMarker("**");
  }

  // Check if the selection is italic
  isItalic(): boolean {
    return this.isWrappedWithMarker("_");
  }

  // Check if the selection is strikethrough
  isStrikethrough(): boolean {
    return this.isWrappedWithMarker("~~");
  }

  isHeading(): boolean {
    const lines = this.content.split("\n");
    const [firstLine] = this.getSelectedLineIndicies();
    return lines[firstLine]?.startsWith("# ") ?? false;
  }

  isQuote(): boolean {
    const lines = this.content.split("\n");
    const [firstLine] = this.getSelectedLineIndicies();
    return lines[firstLine]?.startsWith("> ") ?? false;
  }

  // Generic function to wrap/unwrap content with a marker
  private updateContent(
    wrapperStart: string,
    wrapperEnd: string = wrapperStart,
  ): void {
    const { start, end } = this.cursorPosition;
    let before = this.content.slice(0, start);
    let selected = this.content.slice(start, end);
    let after = this.content.slice(end);

    let newCursorPos = this.cursorPosition;

    const isWrapped =
      before.endsWith(wrapperStart) && after.startsWith(wrapperEnd);

    if (isWrapped) {
      // Remove surrounding markers
      before = before.slice(0, before.length - wrapperStart.length);
      after = after.slice(wrapperEnd.length);

      // Adjust selection to exclude removed markers
      newCursorPos = {
        start: start - wrapperStart.length,
        end: end - wrapperStart.length,
      };
    } else if (
      selected.startsWith(wrapperStart) &&
      selected.endsWith(wrapperEnd)
    ) {
      // Remove markers from selected text
      selected = selected.slice(
        wrapperStart.length,
        selected.length - wrapperEnd.length,
      );

      // Adjust selection to exclude removed markers
      newCursorPos = {
        start: start,
        end: end - wrapperStart.length - wrapperEnd.length,
      };
    } else {
      // Add markers around the selected text
      selected = `${wrapperStart}${selected}${wrapperEnd}`;

      // Adjust selection to include added markers
      newCursorPos = {
        start: start + wrapperStart.length,
        end: end + wrapperStart.length,
      };
    }

    // Update the content
    const newContent = `${before}${selected}${after}`;
    this.queueUpdate({
      content: newContent,
      cursorPosition: newCursorPos,
    });
  }

  getSelectedLineIndicies() {
    const { start, end } = this.cursorPosition;

    const lines = this.content.split("\n");

    const lineIndeces: number[] = [];

    let selected = false;

    let lineStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineEnd = lineStart + lines[i].length;

      if (!selected && start >= lineStart && start <= lineEnd) {
        selected = true;
        lineIndeces.push(i);
        if (end >= lineStart && end <= lineEnd) {
          break;
        }
      } else if (selected && end >= lineStart && end <= lineEnd) {
        lineIndeces.push(i);
        selected = false;
        break;
      } else if (selected) {
        lineIndeces.push(i);
      }

      lineStart += lines[i].length + 1;
    }

    return lineIndeces;
  }

  // Insert a blockquote
  quote(): void {
    const { start, end } = this.cursorPosition;

    const lines = this.content.split("\n");

    const lineIndeces = this.getSelectedLineIndicies();

    const isFirstLineQuoted = lines[lineIndeces[0]]?.startsWith(">") ?? false;

    let cursorOffset = 0;
    for (const lineIndex of lineIndeces) {
      if (isFirstLineQuoted && lines[lineIndex].startsWith(">")) {
        lines[lineIndex] = lines[lineIndex].replace(/>\s{0,1}/, "");
        cursorOffset -= 2;
      } else if (!isFirstLineQuoted && !lines[lineIndex].startsWith(">")) {
        lines[lineIndex] = "> " + lines[lineIndex];
        cursorOffset += 2;
      }
    }

    const newContent = lines.join("\n");
    const newSelection = {
      start: start + (cursorOffset > 0 ? 2 : -2),
      end: end + cursorOffset,
    };

    this.queueUpdate({
      content: newContent,
      cursorPosition: newSelection,
    });
  }

  // Handle Enter key press
  onEnterPress(): void {
    const { start } = this.cursorPosition;

    // Split content into lines
    const lines = this.content.split("\n");
    let charCount = 0;
    let currentLineIndex = 0;

    // Find the current line based on the cursor position
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for newline character
      if (charCount > start) {
        currentLineIndex = i;
        break;
      }
    }

    const currentLine = lines[currentLineIndex];
    let newLinePrefix = "";

    const blockQuoteMatch = currentLine.match(/^(\s*>+\s*)/);
    const unorderedListMatch = currentLine.match(/^(\s*[-*+] )/);
    const orderedListMatch = currentLine.match(/^(\s*\d+\.)\s+/);

    // Detect block quotes

    if (blockQuoteMatch) {
      newLinePrefix = blockQuoteMatch[1]; // Match the block quote prefix (e.g., "> ")
    }

    // Detect unordered list items
    else if (unorderedListMatch) {
      newLinePrefix = unorderedListMatch[1]; // Match the list prefix (e.g., "- ")
    }

    // Detect ordered list items
    else if (orderedListMatch) {
      const currentNumber = parseInt(orderedListMatch[1], 10); // Extract the number
      const nextNumber = currentNumber + 1; // Increment for the next list item
      newLinePrefix = `${nextNumber}. `;
    } else {
      return;
    }

    // Insert the new line with the detected prefix
    const before = this.content.slice(0, start);
    const after = this.content.slice(start);

    const newContent = `${before}\n${newLinePrefix}${after}`;
    const newCursorStart = `${before}\n${newLinePrefix}`.length;

    this.queueUpdate({
      content: newContent,
      cursorPosition: {
        start: newCursorStart,
        end: newCursorStart,
      },
    });
  }

  debouncedOnEnterPress() {
    return _.debounce(() => this.onEnterPress(), 50);
  }

  // Apply bold formatting
  bold(): void {
    this.updateContent("**");
  }

  // Apply italic formatting
  italic(): void {
    this.updateContent("_");
  }

  // Apply strikethrough formatting
  strikethrough(): void {
    this.updateContent("~~");
  }

  toggleLinePrefix(prefix: string) {}

  toggleHeading(): void {
    const lines = this.content.split("\n");
    const [firstLine] = this.getSelectedLineIndicies();

    let offset = 0;
    if (lines[firstLine].startsWith("# ")) {
      lines[firstLine] = lines[firstLine].substring(2);
      offset = -2;
    } else {
      lines[firstLine] = "# " + lines[firstLine];
      offset = 2;
    }

    const newCursorPos: CursorPosition = {
      start: this.cursorPosition.start + offset,
      end: this.cursorPosition.end + offset,
    };
    const newContent = lines.join("\n");

    this.queueUpdate({
      content: newContent,
      cursorPosition: newCursorPos,
    });
  }

  queueUpdate(update: { content: string; cursorPosition: CursorPosition }) {
    this.updates.push(
      {
        ...update,
        delay: 0,
        hideCaret: true,
      },
      {
        ...update,
        delay: 10,
      },
      {
        ...update,
        delay: 100,
      },
    );
    this.notifyChange();
  }

  reset() {
    this.content = "";
    this.cursorPosition = {
      start: 0,
      end: 0,
    };
    this.updates = [];
    this.notifyChange();
  }
}
