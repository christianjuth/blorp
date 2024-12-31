import { createContext, useContext, useRef, useState } from "react";
import { PostId, Comment } from "lemmy-js-client";
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
import {
  FlattenedComment,
  useCreateComment,
  useEditComment,
} from "~/src/lib/lemmy";
import { ContentGutters } from "../gutters";
import _ from "lodash";

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
  const inputRef = useRef<Input>(null);

  const bottomTabBar = useCustomTabBarHeight();
  const [parentComment, setParentComment] = useState<FlattenedComment>();
  const [comment, setComment] = useState<Comment>();
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState<Record<number, string>>({});
  const media = useMedia();

  const createComment = useCreateComment();
  const editComment = useEditComment();

  return (
    <Context.Provider
      value={{
        parentComment,
        setComment: (comment) => {
          if (comment) {
            setContent((prev) => ({
              ...prev,
              [comment.id]: comment.content,
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
              editComment.mutate({
                path: comment.path,
                comment_id: comment.id,
                content: content[comment.id],
              });
            } else {
              createComment.mutate({
                post_id: postId,
                content: content[parentComment?.comment.id ?? 0],
                parent_id: parentComment?.comment.id,
                parentPath: parentComment?.comment.path ?? "0",
              });
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
              bc="$color4"
              minHeight={bottomTabBar.height}
              flex={1}
            >
              <BlurBackground />
              <YStack px="$4">
                {parentComment && (
                  <Text pt="$2">Replying to {parentComment?.creator.name}</Text>
                )}
                {comment && <Text pt="$2">Editing</Text>}

                <Input
                  ref={inputRef}
                  placeholder="Add a comment..."
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setFocused(false);
                    }, 0);
                  }}
                  value={
                    content[comment?.id ?? parentComment?.comment.id ?? 0] ?? ""
                  }
                  onChangeText={(val) =>
                    setContent((prev) => ({
                      ...prev,
                      [comment?.id ?? parentComment?.comment.id ?? 0]: val,
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
                  outlineColor="transparent"
                />
                {focused ? (
                  <XStack minHeight={bottomTabBar.insetBottom} jc="flex-end">
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
  const [content, setContent] = useState(comment?.content ?? "");

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
            content: content,
          });
        } else {
          createComment.mutate({
            post_id: +postId,
            content,
            parent_id: parent?.comment.id,
            parentPath: parent?.comment.path ?? "0",
          });
        }
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
          outlineColor="transparent"
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
