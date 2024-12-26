import { createContext, useContext, useState } from "react";
import { PostId } from "lemmy-js-client";
import { Button, Form, View, XStack, Text } from "tamagui";
import { KeyboardAvoidingView } from "react-native";
import { useCustomTabBarHeight } from "../nav/bottom-tab-bar";
import { BlurBackground } from "../nav/blur-background";
import {
  FlattenedComment,
  FlattenedPost,
  useCreateComment,
} from "~/src/lib/lemmy";
import { FeedGutters } from "../feed-gutters";
import {
  MarkdownTextInput,
  parseExpensiMark,
} from "@expensify/react-native-live-markdown";

const Context = createContext<{
  parentComment?: FlattenedComment;
  setParentComment: (comment: FlattenedComment | undefined) => void;
}>({
  setParentComment: () => {},
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
  const bottomTabBar = useCustomTabBarHeight();
  const [parentComment, setParentComment] = useState<FlattenedComment>();
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState("");

  const createComment = useCreateComment();

  return (
    <Context.Provider
      value={{
        parentComment,
        setParentComment,
      }}
    >
      {children}

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
              content,
              parent_id: parentComment?.comment.id,
              parentPath: parentComment?.comment.path ?? "0",
            });
            setFocused(false);
            setParentComment(undefined);
            setContent("");
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
              <View px="$4">
                {parentComment && (
                  <Text>Replying to {parentComment?.creator.name}</Text>
                )}
                <MarkdownTextInput
                  placeholder="Add a comment..."
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setFocused(false);
                      setParentComment(undefined);
                    }, 100);
                  }}
                  value={content}
                  onChangeText={setContent}
                  parser={parseExpensiMark}
                  style={{
                    borderWidth: 0,
                    paddingVertical: 10,
                  }}
                  multiline
                  autoFocus={!!parentComment}
                  key={parentComment?.comment.id}
                />
                {focused ? (
                  <XStack minHeight={bottomTabBar.insetBottom} jc="flex-end">
                    <Form.Trigger asChild>
                      <Button bg="$accentBackground" size="$2.5" br="$12">
                        Reply
                      </Button>
                    </Form.Trigger>
                  </XStack>
                ) : (
                  <View h={bottomTabBar.insetBottom} />
                )}
              </View>
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

  const createComment = useCreateComment();
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
        <MarkdownTextInput
          placeholder="Add a comment..."
          onFocus={() => setFocused(true)}
          value={content}
          onChangeText={setContent}
          parser={parseExpensiMark}
          style={{
            borderWidth: 0,
            paddingVertical: 10,
          }}
          multiline
          autoFocus
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
                Comment
              </Button>
            </Form.Trigger>
          </XStack>
        )}
      </View>
    </Form>
  );
}
