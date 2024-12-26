import { createContext, useState } from "react";
import { CommentId, PostId } from "lemmy-js-client";
import { Button, Form, Input, View, XStack } from "tamagui";
import { KeyboardAvoidingView } from "react-native";
import { useCustomTabBarHeight } from "../nav/bottom-tab-bar";
import { BlurBackground } from "../nav/blur-background";
import { useCreateComment } from "~/src/lib/lemmy";
import { FeedGutters } from "../feed-gutters";

const Context = createContext<{
  parentCommentId?: CommentId;
  setParentCommentId: (id: CommentId) => void;
}>({
  setParentCommentId: () => {},
});

export function CommentReplyContext({
  postId,
  children,
}: {
  postId: PostId;
  children: React.ReactNode;
}) {
  const bottomTabBar = useCustomTabBarHeight();
  const [parentCommentId, setParentCommentId] = useState<CommentId>();
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState("");

  const createComment = useCreateComment();

  return (
    <Context.Provider
      value={{
        parentCommentId,
        setParentCommentId,
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
            });
            setContent("");
          }}
        >
          <FeedGutters w="100%">
            <View
              shadowColor="$color11"
              shadowOffset={{
                width: 0,
                height: -5,
              }}
              shadowRadius={5}
              shadowOpacity={0.1}
              bg={focused ? "$background" : undefined}
              minHeight={bottomTabBar.height}
              flex={1}
            >
              <BlurBackground />
              <View px="$4">
                <Input
                  placeholder="Add a comment..."
                  bg="transparent"
                  bw={0}
                  p={0}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  value={content}
                  onChangeText={setContent}
                />
                <XStack
                  minHeight={bottomTabBar.insetBottom}
                  jc="flex-end"
                  h={focused ? undefined : bottomTabBar.insetBottom}
                >
                  <Form.Trigger asChild>
                    <Button bg="$accentBackground" size="$2.5" br="$12">
                      Reply
                    </Button>
                  </Form.Trigger>
                </XStack>
              </View>
            </View>
            <></>
          </FeedGutters>
        </Form>
      </KeyboardAvoidingView>
    </Context.Provider>
  );
}
