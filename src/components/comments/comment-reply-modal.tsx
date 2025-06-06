import { createContext, useContext, useId, useState } from "react";
import { Comment } from "lemmy-js-client";
import {
  FlattenedComment,
  useCreateComment,
  useEditComment,
} from "@/src/lib/lemmy/index";
import _ from "lodash";
import { useMedia } from "@/src/lib/hooks/index";
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

export function useCommentEditingState({
  parent,
  comment,
  postId,
}: {
  parent?: FlattenedComment;
  comment?: FlattenedComment;
  postId?: number;
}): InternalState | null {
  const { state } = useContext(Context);

  let isMe = false;
  if (comment) {
    if (comment.comment.id === state?.comment?.id) {
      isMe = true;
    }
  } else if (parent) {
    if (parent.comment.ap_id === state?.parent?.comment.ap_id) {
      isMe = true;
    }
  } else if (_.isNumber(postId)) {
    if (postId === state?.postId && !state.parent && !state.comment) {
      isMe = true;
    }
  }

  return isMe ? state : null;
}

export function InlineCommentReply({
  state,
  autoFocus,
}: {
  state: InternalState;
  autoFocus?: boolean;
}) {
  const media = useMedia();

  if (media.maxMd) {
    return null;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        state.submit();
      }}
      className="max-md:hidden w-full flex-1 py-2"
    >
      <div className="flex-1 border rounded-xl shadow-xs focus-within:border-ring">
        <MarkdownEditor
          content={state.content}
          onChange={(val) => state.setContent(val)}
          autoFocus={autoFocus}
          placeholder="Add a comment..."
          footer={
            <div className="flex flex-row justify-end p-1.5 pt-0 gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => state.cancel()}
              >
                Cancel
              </Button>

              <Button size="sm">
                {state.comment ? "Update" : parent ? "Reply" : "Comment"}
              </Button>
            </div>
          }
        />
      </div>
    </form>
  );
}

type State = {
  comment?: Comment;
  postId: number | string;
  queryKeyParentId?: number;
  parent?: FlattenedComment;
};

interface InternalState extends State {
  content: string;
  setContent: (content: string) => void;
  cancel: () => void;
  submit: () => void;
}

const Context = createContext<{
  state: InternalState | null;
  setState: (state: State) => void;
}>({
  state: null,
  setState: () => console.error("THIS SHOULD NEVER BE CALLED"),
});

export function useLoadCommentIntoEditor() {
  return useContext(Context).setState;
}

export function CommentReplyProvider({
  children,
  presentingElement,
}: {
  children: React.ReactNode;
  presentingElement?: HTMLElement;
}) {
  const [signal, setSignal] = useState(0);
  const [state, setState] = useState<State | null>(null);

  const { queryKeyParentId, comment, postId, parent } = state ?? {};

  const createComment = useCreateComment();
  const editComment = useEditComment();

  const lastResortId = useId();
  const commentKey =
    comment?.id ?? parent?.comment.id ?? postId ?? lastResortId;
  const content =
    useCommentRepliesStore((s) => s.getComment(commentKey)) ||
    comment?.content ||
    "";

  const setContent = useCommentRepliesStore((s) => s.setComment);

  const handleSubmit = () => {
    if (!content) {
      setState(null);
      return;
    }
    if (comment) {
      editComment.mutate({
        path: comment.path,
        comment_id: comment.id,
        content: content,
      });
    } else if (_.isNumber(postId)) {
      createComment.mutate({
        post_id: +postId,
        content: content,
        parent_id: parent?.comment.id,
        parentPath: parent?.comment.path,
        queryKeyParentId,
      });
    }
    setContent(commentKey, "");
    setState(null);
    setSignal((s) => s + 1);
  };

  const internalState: InternalState | null = state
    ? {
        ...state,
        content,
        setContent: (newContent: string) => setContent(commentKey, newContent),
        cancel: () => setState(null),
        submit: handleSubmit,
      }
    : null;

  return (
    <Context.Provider value={{ setState, state: internalState }}>
      <IonModal
        isOpen={state !== null}
        onWillDismiss={() => setState(null)}
        onDidPresent={() => setSignal((s) => s + 1)}
        presentingElement={presentingElement}
        className="md:hidden"
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setState(null)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>{parent ? "Reply to comment" : "Add comment"}</IonTitle>
            <IonButtons slot="end">
              <IonButton strong={true} onClick={handleSubmit}>
                Confirm
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <MarkdownEditor
            key={signal}
            content={content}
            onChange={(val) => setContent(commentKey, val)}
            className="min-h-full"
            autoFocus
            placeholder="Add a comment..."
          />
        </IonContent>
      </IonModal>
      {children}
    </Context.Provider>
  );
}
