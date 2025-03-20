import { createContext, useContext, useMemo, useRef, useState } from "react";
import { PostId, Comment } from "lemmy-js-client";
// import {
//   Button,
//   Form,
//   View,
//   XStack,
//   Text,
//   YStack,
//   useMedia,
//   ScrollView,
// } from "tamagui";
import {
  FlattenedComment,
  useCreateComment,
  useEditComment,
} from "~/src/lib/lemmy/index";
import { ContentGutters } from "../gutters";
import _ from "lodash";
import { MarkdownEditorState } from "../markdown-editor/editor-state";

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
  queryKeyParentId,
  children,
}: {
  postId: PostId;
  queryKeyParentId?: number;
  children: React.ReactNode;
}) {
  const inputRef = useRef<any>(null);

  const [parentComment, setParentComment] = useState<FlattenedComment>();
  const [comment, setComment] = useState<Comment>();
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState<Record<number, MarkdownEditorState>>(
    {},
  );

  const createComment = useCreateComment({
    queryKeyParentId: queryKeyParentId,
  });
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
          // if (media.md) {
          //   inputRef.current?.focus();
          // }
        },
        setParentComment: (val) => {
          setParentComment(val);
          // if (media.md) {
          //   inputRef.current?.focus();
          // }
        },
        focus: () => inputRef.current?.focus(),
      }}
    >
      {children}

      {focused && (
        <div
          // pos="absolute"
          // t={0}
          // r={0}
          // b={0}
          // l={0}
          onClick={() => {
            setFocused(false);
            inputRef.current?.blur();
            setParentComment(undefined);
          }}
        />
      )}

      <form
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
        className="md:hidden"
      >
        <ContentGutters className="w-full">
          <div
          // btw={0.5} bg="$background" bc="$color4" flex={1}
          >
            <div
            // px="$4"
            >
              {parentComment && (
                <span
                // pt="$2"
                >
                  Replying to {parentComment?.creator.name}
                </span>
              )}
              {comment && (
                <span
                // pt="$2"
                >
                  Editing
                </span>
              )}

              {/* <ScrollView */}
              {/*   height={ */}
              {/*     focused ? 175 : bottomTabBar.height - bottomTabBar.insetBottom */}
              {/*   } */}
              {/* > */}
              {/*   <MarkdownEditor */}
              {/*     inputRef={inputRef} */}
              {/*     placeholder="Add a comment..." */}
              {/*     onFocus={() => setFocused(true)} */}
              {/*     onBlur={() => { */}
              {/*       setTimeout(() => { */}
              {/*         setFocused(false); */}
              {/*       }, 0); */}
              {/*     }} */}
              {/*     editor={ */}
              {/*       content[comment?.id ?? parentComment?.comment.id ?? 0] */}
              {/*     } */}
              {/*     style={{ */}
              {/*       borderWidth: 0, */}
              {/*       paddingVertical: 10, */}
              {/*       backgroundColor: "transparent", */}
              {/*     }} */}
              {/*   /> */}
              {/* </ScrollView> */}

              {focused && (
                <div
                // pt="$1" pb="$2" jc="flex-end"
                >
                  <button
                    type="button"
                    // size="$2.5"
                    // br="$12"
                    onClick={() => {
                      setParentComment(undefined);
                      setComment(undefined);
                      inputRef.current?.blur();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                  // bg="$accentBackground" size="$2.5" br="$12"
                  >
                    {comment ? "Update" : parentComment ? "Reply" : "Comment"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <></>
        </ContentGutters>
      </form>
    </Context.Provider>
  );
}

export function InlineCommentReply({
  comment,
  postId,
  queryKeyParentId,
  parent,
  onCancel,
  onSubmit,
  autoFocus,
}: {
  comment?: Comment;
  postId: number | string;
  queryKeyParentId?: number;
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

  const createComment = useCreateComment({
    queryKeyParentId: queryKeyParentId,
  });
  const editComment = useEditComment();

  if (autoFocus /* && !media.gtMd */) {
    return null;
  }

  return (
    <form
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
      className="max-md:hidden w-full"
    >
      <div
      // px="$3" bw={1} bc="$color5" br="$5"
      >
        {/* <MarkdownEditor */}
        {/*   placeholder="Add a comment..." */}
        {/*   onFocus={() => setFocused(true)} */}
        {/*   editor={editor} */}
        {/*   onBlur={() => { */}
        {/*     if (editor.getState().content.trim() === "") { */}
        {/*       setFocused(false); */}
        {/*       onCancel?.(); */}
        {/*     } */}
        {/*   }} */}
        {/*   autoFocus={autoFocus} */}
        {/* /> */}
        {focused && (
          <div
          // jc="flex-end" py="$2"
          >
            <button
              type="button"
              // size="$2.5"
              // br="$12"
              onClick={() => {
                setFocused(false);
                onCancel?.();
              }}
            >
              Cancel
            </button>

            <button
            // bg="$accentBackground" size="$2.5" br="$12"
            >
              {comment ? "Update" : parent ? "Reply" : "Comment"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
