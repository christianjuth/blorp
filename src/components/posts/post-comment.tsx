import { MarkdownRenderer } from "../markdown/renderer";
import _ from "lodash";
import { CommentReplyButton, CommentVoting } from "../comments/comment-buttons";
import {
  InlineCommentReply,
  useInlineCommentReplyState,
} from "../comments/comment-reply-modal";
import { useCommentsStore } from "@/src/stores/comments";
import { RelativeTime } from "../relative-time";
import { useBlockPerson, useDeleteComment } from "@/src/lib/lemmy/index";
import { CommentMap } from "@/src/lib/comment-map";
import { useShowCommentReportModal } from "./post-report";
import { useRequireAuth } from "../auth-context";
import { useLinkContext } from "../nav/link-context";
import { Person } from "lemmy-js-client";
import { createSlug, encodeApId } from "@/src/lib/lemmy/utils";
import { Link } from "../nav/index";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { ActionMenu } from "../action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useIonAlert } from "@ionic/react";
import { Deferred } from "@/src/lib/deferred";
import { PersonHoverCard } from "../person/person-hover-card";
import { useAuth } from "@/src/stores/auth";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "../ui/button";
import { useMemo } from "react";
import { ContentGutters } from "../gutters";
import { shareRoute } from "@/src/lib/share";

function Byline({
  creator,
  publishedDate,
  authorType,
  className,
}: {
  creator: Pick<Person, "actor_id" | "avatar" | "name">;
  publishedDate: string;
  authorType?: "OP" | "ME" | "MOD";
  className?: string;
}) {
  const linkCtx = useLinkContext();
  const slug = createSlug(creator);
  return (
    <summary
      className={cn("flex flex-row gap-1.5 items-center py-px", className)}
    >
      <Avatar className="w-6 h-6">
        <AvatarImage src={creator.avatar} />
        <AvatarFallback className="text-xs">
          {creator.name?.substring(0, 1).toUpperCase()}{" "}
        </AvatarFallback>
      </Avatar>
      <PersonHoverCard actorId={creator.actor_id}>
        <Link
          to={`${linkCtx.root}u/${encodeApId(creator.actor_id)}`}
          className="text-xs overflow-ellipsis flex flex-row overflow-x-hidden items-center"
        >
          <span className="font-medium">{slug?.name}</span>
          <span className="italic text-muted-foreground">@{slug?.host}</span>
          {authorType === "OP" && <Badge className="ml-1.5">OP</Badge>}
          {authorType === "MOD" && <Badge className="ml-1.5">Mod</Badge>}
          {authorType === "ME" && <Badge className="ml-1.5">Me</Badge>}
        </Link>
      </PersonHoverCard>
      <span className="text-muted-foreground text-xs">•</span>
      <RelativeTime
        time={publishedDate}
        className="text-xs text-muted-foreground"
      />
    </summary>
  );
}

export function PostComment({
  postApId,
  queryKeyParentId,
  commentMap,
  level,
  opId,
  myUserId,
  communityName,
  modApIds,
  singleCommentThread,
  highlightCommentId,
}: {
  postApId: string;
  queryKeyParentId?: number;
  commentMap: CommentMap;
  level: number;
  opId: number | undefined;
  myUserId: number | undefined;
  communityName?: string;
  modApIds?: string[];
  singleCommentThread?: boolean;
  highlightCommentId?: string;
}) {
  const linkCtx = useLinkContext();
  const [alrt] = useIonAlert();

  const showReportModal = useShowCommentReportModal();
  const requireAuth = useRequireAuth();

  const blockPerson = useBlockPerson();

  const { comment: commentPath, ...rest } = commentMap;

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const commentView = useCommentsStore((s) =>
    commentPath
      ? s.comments[getCachePrefixer()(commentPath.path)]?.data
      : undefined,
  );
  const isMod =
    commentView && modApIds?.includes(commentView?.creator.actor_id);

  const edit = useInlineCommentReplyState(
    commentView?.comment.ap_id,
    commentView?.comment.content,
  );
  const reply = useInlineCommentReplyState(
    commentView?.comment.ap_id + "reply",
  );

  const deleteComment = useDeleteComment();

  const isMyComment = commentView?.comment.creator_id === myUserId;

  const sorted = _.entries(_.omit(rest, "sort")).sort(
    ([_id1, a], [_id2, b]) => a.sort - b.sort,
  );

  let color = "red";
  switch (level % 6) {
    case 0:
      color = "#FF2A33";
      break;
    case 1:
      color = "#F98C1D";
      break;
    case 2:
      color = "#DAB84D";
      break;
    case 3:
      color = "#459E6F";
      break;
    case 4:
      color = "#3088C1";
      break;
    case 5:
      color = "purple";
      break;
  }

  const parentLink = useMemo(() => {
    if (level > 0 || !commentPath || !singleCommentThread) {
      return undefined;
    }
    const parent = commentPath.path.split(".").slice(-2);
    if (parent.length < 1 || parent?.includes("0")) {
      return undefined;
    }
    return parent.join(".");
  }, [level, commentPath, singleCommentThread]);

  if (!commentView) {
    return null;
  }

  const comment = commentView.comment;
  const creator = commentView.creator;

  const hideContent = comment.removed || comment.deleted;

  const highlightComment =
    highlightCommentId && highlightCommentId === String(comment.id);

  const content = (
    <div
      className={cn(
        "flex-1 pt-2",
        level === 0 && "max-md:px-2.5 py-3",
        level === 0 &&
          !singleCommentThread &&
          "border-t-7 max-md:border-border/40 md:border-t-[0.5px]",
      )}
    >
      {singleCommentThread && level === 0 && (
        <div className="flex flex-row gap-2 items-center mb-6">
          {parentLink && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground font-normal"
              asChild
            >
              <Link
                to={`${linkCtx.root}c/${communityName}/posts/${encodeApId(postApId)}/comments/${parentLink}`}
                replace
              >
                View parent comment
              </Link>
            </Button>
          )}
          <div className="h-px flex-1 bg-border" />
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground font-normal"
            asChild
          >
            <Link
              to={`${linkCtx.root}c/${communityName}/posts/${encodeApId(postApId)}`}
              replace
            >
              View all comments
            </Link>
          </Button>
          {!parentLink && <div className="h-px flex-1 bg-border" />}
        </div>
      )}
      <details open className={cn(comment.id < 0 && "opacity-50")}>
        <Byline
          className={cn("pb-2", highlightComment && "bg-brand/10")}
          creator={creator}
          publishedDate={comment.published}
          authorType={
            isMod
              ? "MOD"
              : creator.id === opId
                ? "OP"
                : creator.id === myUserId
                  ? "ME"
                  : undefined
          }
        />

        <div>
          {comment.deleted && <span className="italic text-sm">deleted</span>}
          {comment.removed && <span className="italic text-sm">removed</span>}

          {!hideContent && !edit.isEditing && (
            <MarkdownRenderer
              markdown={comment.content}
              className={cn(highlightComment && "bg-brand/10")}
            />
          )}

          {edit.isEditing && (
            <InlineCommentReply
              state={edit}
              postId={comment.post_id}
              comment={comment}
              autoFocus
            />
          )}

          <div className="flex flex-row items-center text-sm text-muted-foreground justify-end gap-1">
            <ActionMenu
              actions={[
                {
                  text: "Share",
                  onClick: () =>
                    shareRoute({
                      route: `${linkCtx.root}c/${communityName}/posts/${encodeURIComponent(postApId)}/comments/${comment.id}`,
                    }),
                } as const,
                ...(isMyComment && !comment.deleted
                  ? [
                      {
                        text: "Edit",
                        onClick: () => {
                          edit.setIsEditing(!edit.isEditing);
                        },
                      } as const,
                    ]
                  : []),
                ...(isMyComment
                  ? [
                      {
                        text: comment.deleted ? "Restore" : "Delete",
                        onClick: () => {
                          deleteComment.mutate({
                            comment_id: comment.id,
                            path: comment.path,
                            deleted: !comment.deleted,
                          });
                        },
                        danger: true,
                      } as const,
                    ]
                  : [
                      {
                        text: "Report",
                        onClick: () =>
                          requireAuth().then(() =>
                            showReportModal(comment.path),
                          ),
                        danger: true,
                      } as const,
                      {
                        text: "Block person",
                        onClick: async () => {
                          try {
                            await requireAuth();
                            const deferred = new Deferred();
                            alrt({
                              message: `Block ${commentView.creator.name}`,
                              buttons: [
                                {
                                  text: "Cancel",
                                  role: "cancel",
                                  handler: () => deferred.reject(),
                                },
                                {
                                  text: "OK",
                                  role: "confirm",
                                  handler: () => deferred.resolve(),
                                },
                              ],
                            });
                            await deferred.promise;
                            blockPerson.mutate({
                              person_id: commentView.creator.id,
                              block: true,
                            });
                          } catch {}
                        },
                        danger: true,
                      } as const,
                    ]),
              ]}
              trigger={
                <Button size="icon" variant="ghost" asChild>
                  <div>
                    <IoEllipsisHorizontal size={16} />
                  </div>
                </Button>
              }
            />

            <CommentReplyButton onClick={() => reply.setIsEditing(true)} />
            <CommentVoting commentView={commentView} />
          </div>

          {(sorted.length > 0 || reply.isEditing) && (
            <div
              className="border-l-[1.5px] border-b-[1.5px] pl-3 md:pl-3.5 rounded-bl-xl mb-2"
              style={{ borderColor: color }}
            >
              {reply.isEditing && (
                <InlineCommentReply
                  state={reply}
                  postId={comment.post_id}
                  queryKeyParentId={queryKeyParentId}
                  parent={commentView}
                  autoFocus
                />
              )}

              {sorted.map(([id, map]) => (
                <PostComment
                  postApId={postApId}
                  queryKeyParentId={queryKeyParentId}
                  key={id}
                  commentMap={map}
                  level={level + 1}
                  opId={opId}
                  myUserId={myUserId}
                  communityName={communityName}
                  highlightCommentId={highlightCommentId}
                />
              ))}

              <div className="h-1 -mt-1 w-full bg-background translate-y-0.5" />
            </div>
          )}
        </div>
      </details>
    </div>
  );

  if (level === 0) {
    return (
      <ContentGutters className="px-0">
        {content}
        <></>
      </ContentGutters>
    );
  }

  return content;
}
