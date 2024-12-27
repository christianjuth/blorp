import { createContext, useContext, useEffect, useRef, useState } from "react";
import { PostId } from "lemmy-js-client";
import {
  Button,
  Form,
  View,
  XStack,
  Text,
  YStack,
  Input,
  useMedia,
} from "tamagui";
import { KeyboardAvoidingView } from "react-native";
import { useCustomTabBarHeight } from "../nav/bottom-tab-bar";
import { BlurBackground } from "../nav/blur-background";
import { FlattenedComment, useCreateComment } from "~/src/lib/lemmy";
import { FeedGutters } from "../feed-gutters";
import _ from "lodash";

const Context = createContext<{
  parentComment?: FlattenedComment;
  setParentComment: (comment: FlattenedComment | undefined) => void;
  focus: () => void;
}>({
  setParentComment: () => {},
  focus: _.noop,
});

export function useCommentReaplyContext() {
  return useContext(Context);
}

export function CommentReplyContext({
  postId,
  children,
}: {
  postId: PostId;
  children: React.ReactNode;
}) {
  const inputRef = useRef<Input>(null);

  const bottomTabBar = useCustomTabBarHeight();
  const [parentComment, setParentComment] = useState<FlattenedComment>();
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState<Record<number, string>>({});
  const media = useMedia();

  const createComment = useCreateComment();

  return (
    <Context.Provider
      value={{
        parentComment,
        setParentComment: (val) => {
          setParentComment(val);
          if (media.md) {
            inputRef.current?.focus();
          }
        },
        focus: () => inputRef.current?.focus(),
      }}
    >
      {children}

      {focused && (
        <View
          pos="absolute"
          t={0}
          r={0}
          b={0}
          l={0}
          onPress={() => {
            setFocused(false);
            inputRef.current?.blur();
            setParentComment(undefined);
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior="padding"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <Form
          onSubmit={() => {
            createComment.mutate({
              post_id: postId,
              content: content[parentComment?.comment.id ?? 0],
              parent_id: parentComment?.comment.id,
              parentPath: parentComment?.comment.path ?? "0",
            });
            inputRef.current?.blur();
            setParentComment(undefined);
          }}
          $gtMd={{
            dsp: "none",
          }}
        >
          <FeedGutters w="100%">
            <View
              btw={0.5}
              bc="$color4"
              minHeight={bottomTabBar.height}
              flex={1}
            >
              <BlurBackground />
              <YStack px="$4">
                {parentComment && (
                  <Text pt="$2">Replying to {parentComment?.creator.name}</Text>
                )}

                <Input
                  ref={inputRef}
                  placeholder="Add a comment..."
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  value={content[parentComment?.comment.id ?? 0]}
                  onChangeText={(val) =>
                    setContent((prev) => ({
                      ...prev,
                      [parentComment?.comment.id ?? 0]: val,
                    }))
                  }
                  style={{
                    borderWidth: 0,
                    paddingVertical: 10,
                  }}
                  multiline
                  p={0}
                  py="$2"
                  bw={0}
                  h={focused ? undefined : "$3.5"}
                  bg="transparent"
                />
                {focused ? (
                  <XStack minHeight={bottomTabBar.insetBottom} jc="flex-end">
                    <Button
                      size="$2.5"
                      br="$12"
                      onPress={() => {
                        inputRef.current?.blur();
                        setParentComment(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                    <Form.Trigger asChild>
                      <Button bg="$accentBackground" size="$2.5" br="$12">
                        {parentComment ? "Reply" : "Comment"}
                      </Button>
                    </Form.Trigger>
                  </XStack>
                ) : (
                  <View h={bottomTabBar.insetBottom} />
                )}
              </YStack>
            </View>
            <></>
          </FeedGutters>
        </Form>
      </KeyboardAvoidingView>
    </Context.Provider>
  );
}

export function InlineCommentReply({
  postId,
  parent,
  onCancel,
  onSubmit,
  autoFocus,
}: {
  postId: number | string;
  parent?: FlattenedComment;
  onCancel?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(autoFocus ?? false);
  const [content, setContent] = useState("");

  const media = useMedia();
  const createComment = useCreateComment();

  if (autoFocus && !media.gtMd) {
    return null;
  }

  return (
    <Form
      onSubmit={() => {
        createComment.mutate({
          post_id: +postId,
          content,
          parent_id: parent?.comment.id,
          parentPath: parent?.comment.path ?? "0",
        });
        onSubmit?.();
        setContent("");
        setFocused(false);
      }}
      $md={{
        dsp: "none",
      }}
      w="100%"
    >
      <View px="$3" bw={1} bc="$color5" br="$6">
        <Input
          placeholder="Add a comment..."
          onFocus={() => setFocused(true)}
          value={content}
          onChangeText={setContent}
          onBlur={() => {
            if (content.trim() === "") {
              setFocused(false);
              onCancel?.();
            }
          }}
          autoFocus={autoFocus}
          p={0}
          py="$2"
          bw={0}
          h={focused ? undefined : "$3.5"}
          bg="transparent"
        />
        {focused && (
          <XStack jc="flex-end" py="$2">
            <Button
              size="$2.5"
              br="$12"
              onPress={() => {
                setFocused(false);
                onCancel?.();
              }}
            >
              Cancel
            </Button>

            <Form.Trigger asChild>
              <Button bg="$accentBackground" size="$2.5" br="$12">
                {parent ? "Reply" : "Comment"}
              </Button>
            </Form.Trigger>
          </XStack>
        )}
      </View>
    </Form>
  );
}
