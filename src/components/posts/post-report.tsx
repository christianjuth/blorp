import { createContext, useContext, useMemo, useState } from "react";
import _ from "lodash";
import { Modal } from "../ui/modal";
import { TextArea, Text, YStack, Form, XStack } from "tamagui";
import { usePostsStore } from "~/src/stores/posts";
import { Button } from "../ui/button";
import { useCreatePostReport, useCreateCommentReport } from "~/src/lib/lemmy";
import { useCommentsStore } from "~/src/stores/comments";
import { useShallow } from "zustand/react/shallow";

const Context = createContext<{
  apId?: string;
  setApId: (postId: string) => any;
  commentPath?: string;
  setCommentPath: (path: string) => any;
}>({
  setApId: _.noop,
  setCommentPath: _.noop,
});

export function PostReportProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reason, setReason] = useState("");
  const [apId, setApId] = useState<string | undefined>();
  const [commentPath, setCommentPath] = useState<string | undefined>();

  const createPostReport = useCreatePostReport();
  const createCommentReport = useCreateCommentReport();

  const post = usePostsStore((s) => (apId ? s.posts[apId]?.data.post : null));
  const comment = useCommentsStore((s) =>
    commentPath ? s.comments[commentPath] : null,
  );

  const value = useMemo(
    () => ({
      apId,
      setApId,
      commentPath,
      setCommentPath,
    }),
    [],
  );

  return (
    <Context.Provider value={value}>
      <Modal
        open={!!post || !!commentPath}
        onClose={() => {
          setApId(undefined);
          setCommentPath(undefined);
        }}
      >
        <Form
          onSubmit={() => {
            if (post) {
              createPostReport
                .mutateAsync({
                  post_id: post.id,
                  reason,
                })
                .then(() => {
                  setReason("");
                  setApId(undefined);
                });
            } else if (comment) {
              createCommentReport
                .mutateAsync({
                  comment_id: comment.data.comment.id,
                  reason,
                })
                .then(() => {
                  setReason("");
                  setApId(undefined);
                });
            }
          }}
        >
          <YStack p="$3" gap="$3">
            {post && (
              <>
                <Text fontWeight="bold">Report post</Text>
                <Text>{post?.name}</Text>
              </>
            )}

            {comment && (
              <>
                <Text fontWeight="bold">Report comment</Text>
                <Text maxWidth={400} numberOfLines={3}>
                  {comment.data.comment.content}
                </Text>
              </>
            )}

            <TextArea value={reason} onChangeText={setReason} />

            <XStack gap="$2">
              <Button
                size="$3"
                f={1}
                bg="$color9"
                onPress={() => {
                  setApId(undefined);
                  setCommentPath(undefined);
                }}
              >
                Cancel
              </Button>
              <Form.Trigger asChild>
                <Button size="$3" f={1}>
                  Submit
                </Button>
              </Form.Trigger>
            </XStack>
          </YStack>
        </Form>
      </Modal>
      {children}
    </Context.Provider>
  );
}

export function useShowPostReportModal() {
  return useContext(Context).setApId;
}

export function useShowCommentReportModal() {
  return useContext(Context).setCommentPath;
}
