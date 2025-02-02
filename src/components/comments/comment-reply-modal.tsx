import { createContext, useContext, useMemo, useRef, useState } from "react";
import { PostId, Comment } from "lemmy-js-client";
import { Button, Form, View, XStack, Text, YStack, useMedia } from "tamagui";
import { KeyboardAvoidingView, TextInput } from "react-native";
import { useCustomTabBarHeight } from "../nav/bottom-tab-bar";
import {
  FlattenedComment,
  useCreateComment,
  useEditComment,
} from "~/src/lib/lemmy/index";
import { ContentGutters } from "../gutters";
import _ from "lodash";
import { MarkdownEditor, MarkdownEditorState } from "../markdown-editor";

const Context = createContext<{
  setComment: (comment: Comment | undefined) => void;
  parentComment?: FlattenedComment;
  setParentComment: (comment: FlattenedComment | undefined) => void;
  focus: () => void;
}>({
  setComment: () => {},
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
  const inputRef = useRef<TextInput>(null);

  const bottomTabBar = useCustomTabBarHeight();
  const [parentComment, setParentComment] = useState<FlattenedComment>();
  const [comment, setComment] = useState<Comment>();
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState<Record<number, MarkdownEditorState>>(
    {},
  );
  const media = useMedia();

  const createComment = useCreateComment();
  const editComment = useEditComment();

  if (!content[comment?.id ?? parentComment?.comment.id ?? 0]) {
    setContent((prev) => ({
      ...prev,
      [comment?.id ?? parentComment?.comment.id ?? 0]: new MarkdownEditorState(
        "",
      ),
    }));
  }

  return (
    <Context.Provider
      value={{
        parentComment,
        setComment: (comment) => {
          if (comment) {
            setContent((prev) => ({
              ...prev,
              [comment.id]: new MarkdownEditorState(comment.content),
            }));
          }
          setComment(comment);
          if (media.md) {
            inputRef.current?.focus();
          }
        },
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
            if (comment) {
              const editor = content[comment.id];
              editComment.mutate({
                path: comment.path,
                comment_id: comment.id,
                content: editor.getState().content,
              });
              editor.reset();
            } else {
              const editor = content[parentComment?.comment.id ?? 0];
              createComment.mutate({
                post_id: postId,
                content: editor.getState().content,
                parent_id: parentComment?.comment.id,
                parentPath: parentComment?.comment.path ?? "0",
              });
              editor.reset();
            }
            inputRef.current?.blur();
            setParentComment(undefined);
            setComment(undefined);
          }}
          $gtMd={{
            dsp: "none",
          }}
        >
          <ContentGutters w="100%">
            <View
              btw={0.5}
              bg="$background"
              bc="$color4"
              minHeight={bottomTabBar.height}
              flex={1}
            >
              <YStack px="$4">
                {parentComment && (
                  <Text pt="$2">Replying to {parentComment?.creator.name}</Text>
                )}
                {comment && <Text pt="$2">Editing</Text>}

                <MarkdownEditor
                  inputRef={inputRef}
                  placeholder="Add a comment..."
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setFocused(false);
                    }, 0);
                  }}
                  editor={
                    content[comment?.id ?? parentComment?.comment.id ?? 0]
                  }
                  style={{
                    borderWidth: 0,
                    paddingVertical: 10,
                    backgroundColor: "transparent",
                  }}
                />
                {focused ? (
                  <XStack
                    pb="$2"
                    minHeight={bottomTabBar.insetBottom}
                    jc="flex-end"
                  >
                    <Button
                      size="$2.5"
                      br="$12"
                      onPress={() => {
                        setParentComment(undefined);
                        setComment(undefined);
                        inputRef.current?.blur();
                      }}
                    >
                      Cancel
                    </Button>
                    <Form.Trigger asChild>
                      <Button bg="$accentBackground" size="$2.5" br="$12">
                        {comment
                          ? "Update"
                          : parentComment
                            ? "Reply"
                            : "Comment"}
                      </Button>
                    </Form.Trigger>
                  </XStack>
                ) : (
                  <View h={bottomTabBar.insetBottom} />
                )}
              </YStack>
            </View>
            <></>
          </ContentGutters>
        </Form>
      </KeyboardAvoidingView>
    </Context.Provider>
  );
}

export function InlineCommentReply({
  comment,
  postId,
  parent,
  onCancel,
  onSubmit,
  autoFocus,
}: {
  comment?: Comment;
  postId: number | string;
  parent?: FlattenedComment;
  onCancel?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(autoFocus ?? false);

  const editor = useMemo(
    () => new MarkdownEditorState(comment?.content),
    [comment?.updated],
  );

  const media = useMedia();
  const createComment = useCreateComment();
  const editComment = useEditComment();

  if (autoFocus && !media.gtMd) {
    return null;
  }

  return (
    <Form
      onSubmit={() => {
        if (comment) {
          editComment.mutate({
            path: comment.path,
            comment_id: comment.id,
            content: editor.getState().content,
          });
        } else {
          createComment.mutate({
            post_id: +postId,
            content: editor.getState().content,
            parent_id: parent?.comment.id,
            parentPath: parent?.comment.path ?? "0",
          });
        }
        onSubmit?.();
        editor.reset();
      }}
      $md={{
        dsp: "none",
      }}
      w="100%"
    >
      <View px="$3" bw={1} bc="$color5" br="$5">
        <MarkdownEditor
          placeholder="Add a comment..."
          onFocus={() => setFocused(true)}
          editor={editor}
          onBlur={() => {
            if (editor.getState().content.trim() === "") {
              setFocused(false);
              onCancel?.();
            }
          }}
          autoFocus={autoFocus}
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
                {comment ? "Update" : parent ? "Reply" : "Comment"}
              </Button>
            </Form.Trigger>
          </XStack>
        )}
      </View>
    </Form>
  );
}
