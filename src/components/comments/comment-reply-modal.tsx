import { useId, useState } from "react";
import { Comment } from "lemmy-js-client";
import {
  FlattenedComment,
  useCreateComment,
  useEditComment,
} from "@/src/lib/lemmy/index";
import _ from "lodash";
import { useMedia } from "@/src/lib/hooks";
import { MarkdownEditor } from "../markdown/editor";
import { useCommentRepliesStore } from "@/src/stores/comment-replies";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Button } from "@/src/components/ui/button";

export function useInlineCommentReplyState(
  commentKey?: number | string,
  initContent?: string,
) {
  const media = useMedia();

  const lastResortId = useId();
  commentKey ??= lastResortId;
  const content =
    useCommentRepliesStore((s) => s.getComment(commentKey)) ||
    initContent ||
    "";

  const setContent = useCommentRepliesStore((s) => s.setComment);

  const isEditing = useCommentRepliesStore((s) => s.isEditing(commentKey));
  const setIsEditing = useCommentRepliesStore((s) => s.setIsEditing);

  const [localIsEditing, setLocalIsEditing] = useState(false);
  if (localIsEditing && media.md) {
    setLocalIsEditing(false);
  }

  return {
    content,
    setContent: (content: string) => {
      setContent(commentKey, content);
    },
    isEditing: media.maxMd ? localIsEditing : isEditing,
    setIsEditing: (isEditing: boolean) => {
      if (media.maxMd) {
        setLocalIsEditing(isEditing);
      } else {
        setIsEditing(commentKey, isEditing);
      }
    },
  };
}

export function InlineCommentReply({
  state,
  comment,
  postId,
  queryKeyParentId,
  parent,
  onCancel,
  onSubmit,
  autoFocus,
  mode = "auto",
}: {
  state: ReturnType<typeof useInlineCommentReplyState>;
  comment?: Comment;
  postId: number | string;
  queryKeyParentId?: number;
  parent?: FlattenedComment;
  onCancel?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  mode?: "auto" | "mobile-only" | "desktop-only";
}) {
  const [submitSignal, setSubmitSignal] = useState(0);
  const media = useMedia();

  const createComment = useCreateComment({
    queryKeyParentId: queryKeyParentId,
  });
  const editComment = useEditComment();

  const handleSubmit = () => {
    if (!state.content) {
      state.setIsEditing(false);
      return;
    }
    if (comment) {
      editComment.mutate({
        path: comment.path,
        comment_id: comment.id,
        content: state.content,
      });
    } else {
      createComment.mutate({
        post_id: +postId,
        content: state.content,
        parent_id: parent?.comment.id,
        parentPath: parent?.comment.path ?? "0",
      });
    }
    state.setIsEditing(false);
    state.setContent("");
    setSubmitSignal((s) => s + 1);
    onSubmit?.();
  };

  if (media.maxMd) {
    if (mode === "desktop-only") {
      return null;
    }
    return (
      <IonModal
        isOpen={state.isEditing}
        onWillDismiss={() => state.setIsEditing(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => state.setIsEditing(false)}>
                Cancel
              </IonButton>
            </IonButtons>
            <IonTitle>{parent ? "Reply to comment" : "Add comment"}</IonTitle>
            <IonButtons slot="end">
              <IonButton strong={true} onClick={handleSubmit}>
                Confirm
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent scrollY={false}>
          <MarkdownEditor
            content={state.content}
            onChange={(val) => state.setContent(val)}
            className="h-full"
            autoFocus
            placeholder="Add a comment..."
          />
        </IonContent>
      </IonModal>
    );
  }

  if (mode === "mobile-only") {
    return null;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
        onSubmit?.();
      }}
      className="max-md:hidden w-full flex-1 py-2"
    >
      <div className="flex-1 border rounded-xl focus-within:shadow-xs focus-within:border-ring">
        <MarkdownEditor
          className="block"
          key={submitSignal}
          content={state.content}
          onChange={(val) => state.setContent(val)}
          autoFocus={autoFocus}
          placeholder="Add a comment..."
          onFocus={() => state.setIsEditing(true)}
          onBlur={() => state.setIsEditing(false)}
          footer={
            state.isEditing && (
              <div className="flex flex-row justify-end p-1.5 pt-0 gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    state.setIsEditing(false);
                    onCancel?.();
                  }}
                >
                  Cancel
                </Button>

                <Button size="sm">
                  {comment ? "Update" : parent ? "Reply" : "Comment"}
                </Button>
              </div>
            )
          }
        />
      </div>
    </form>
  );
}
