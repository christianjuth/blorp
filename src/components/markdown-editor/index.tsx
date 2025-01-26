import { InputAccessoryView, type TextInput } from "react-native";

import { useEffect, useId, useRef, useState } from "react";
import {
  Button,
  XStack,
  YStack,
  useTheme,
  isWeb,
  TextArea,
  TextAreaProps,
} from "tamagui";
import _ from "lodash";
import autosize from "autosize";

import {
  Quote,
  Strikethrough,
  Italic,
  Bold,
  Heading,
} from "@tamagui/lucide-icons";
import { MarkdownEditorState } from "./editor-state";

export { MarkdownEditorState } from "./editor-state";

interface MarkdownEditorProps
  extends Pick<
    TextAreaProps,
    | "placeholder"
    | "onFocus"
    | "onBlur"
    | "style"
    | "autoFocus"
    | "scrollEnabled"
    | "onContentSizeChange"
  > {
  editor: MarkdownEditorState;
  inputRef?: React.RefObject<TextInput> | React.MutableRefObject<TextInput>;
}

export const MarkdownEditor = ({
  inputRef,
  editor,
  ...rest
}: MarkdownEditorProps) => {
  const internalRef = useRef<TextInput>(null);
  const ref = inputRef ?? internalRef;

  const inputAccessoryViewID = useId();

  const theme = useTheme();

  const [_, setSignal] = useState(0);

  useEffect(() => {
    return editor.addEventListener(() => {
      setSignal((v) => v + 1);
    });
  }, [editor]);

  if (isWeb) {
    useEffect(() => {
      const elm = ref?.current;
      if (elm instanceof Element) {
        autosize(elm);
        return () => {
          autosize.destroy(elm);
        };
      }
    }, []);
  }

  if (!editor) {
    return null;
  }

  const state = editor.getState();

  const toolbar = (
    <>
      <Button
        size="$2.5"
        onPress={() => editor.bold()}
        p={4}
        mx={-4}
        aspectRatio={1}
        bg={editor.isBold() ? "$color4" : undefined}
        $gtMd={{ size: "$2" }}
        br="$5"
      >
        <Bold />
      </Button>

      <Button
        size="$2.5"
        onPress={() => editor.italic()}
        p={4}
        mx={-4}
        aspectRatio={1}
        bg={editor.isItalic() ? "$color4" : undefined}
        $gtMd={{ size: "$2" }}
        br="$5"
      >
        <Italic />
      </Button>

      <Button
        size="$2.5"
        onPress={() => editor.strikethrough()}
        p={4}
        mx={-4}
        aspectRatio={1}
        bg={editor.isStrikethrough() ? "$color4" : undefined}
        $gtMd={{ size: "$2" }}
        br="$5"
      >
        <Strikethrough />
      </Button>

      <Button
        size="$2.5"
        onPress={() => editor.quote()}
        p={4}
        mx={-4}
        aspectRatio={1}
        bg={editor.isQuote() ? "$color4" : undefined}
        $gtMd={{ size: "$2" }}
        br="$5"
      >
        <Quote fill={theme.color.val} color="transparent" />
      </Button>

      <Button
        size="$2.5"
        onPress={() => editor.toggleHeading()}
        p={4}
        mx={-4}
        aspectRatio={1}
        bg={editor.isHeading() ? "$color4" : undefined}
        $gtMd={{ size: "$2" }}
        br="$5"
      >
        <Heading />
      </Button>
    </>
  );

  return (
    <YStack flex={1} flexBasis="50%" gap="$2">
      <XStack gap="$3" mx={-3} h="$3" ai="center" $md={{ dsp: "none" }}>
        {toolbar}
      </XStack>

      <TextArea
        value={state.content}
        selection={state.cursorPosition}
        onChangeText={(val) => editor.setContent(val)}
        onSelectionChange={({ nativeEvent }) =>
          editor.setSelection(
            nativeEvent.selection.start,
            nativeEvent.selection.end,
          )
        }
        multiline
        inputAccessoryViewID={inputAccessoryViewID}
        onKeyPress={(e) => {
          if (e.nativeEvent.key === "Enter") {
            editor.onEnterPress();
          }
        }}
        caretHidden={state.hideCaret}
        ref={ref}
        rows={1}
        p={0}
        outlineColor="transparent"
        bw={0}
        minHeight="$3"
        {...rest}
        style={[
          {
            color: theme.color.val,
          },
          rest.style,
        ]}
      />

      {!isWeb && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <XStack
            bbw={1}
            bbc="$color4"
            gap="$4"
            p="$2"
            px="$3"
            ai="center"
            $gtMd={{ dsp: "none" }}
            bg="$background"
            btw={1}
            btc="$color4"
          >
            {toolbar}
          </XStack>
        </InputAccessoryView>
      )}
    </YStack>
  );
};
