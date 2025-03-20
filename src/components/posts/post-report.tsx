import { createContext, useContext, useMemo, useState } from "react";
import _ from "lodash";
import { usePostsStore } from "~/src/stores/posts";
import { useCreatePostReport, useCreateCommentReport } from "~/src/lib/lemmy";
import { useCommentsStore } from "~/src/stores/comments";
import { IonModal } from "@ionic/react";

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
      <IonModal
        isOpen={!!post || !!commentPath}
        onDidDismiss={() => {
          setApId(undefined);
          setCommentPath(undefined);
        }}
      >
        <form
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
          <div
          // p="$3" gap="$3"
          >
            {post && (
              <>
                <span className="font-bold">Report post</span>
                <span>{post?.name}</span>
              </>
            )}

            {comment && (
              <>
                <span className="font-bold">Report comment</span>
                <span>{comment.data.comment.content}</span>
              </>
            )}

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div
            // gap="$2"
            >
              <button
                // size="$3"
                // f={1}
                // bg="$color9"
                onClick={() => {
                  setApId(undefined);
                  setCommentPath(undefined);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
              // size="$3" f={1}
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </IonModal>
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
