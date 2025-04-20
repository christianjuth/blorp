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
import { Link } from "react-router-dom";
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
import { Share } from "@capacitor/share";
import { useAuth } from "@/src/stores/auth";
import { Badge } from "@/src/components/ui/badge";

function Byline({
  creator,
  publishedDate,
  authorType,
}: {
  creator: Pick<Person, "actor_id" | "avatar" | "name">;
  publishedDate: string;
  authorType?: "OP" | "ME" | "MOD";
}) {
  const linkCtx = useLinkContext();
  const slug = createSlug(creator);
  return (
    <summary className="flex flex-row gap-1 items-center py-px">
      <Avatar className="w-5 h-5">
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
          {slug?.name}
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
  noBorder = false,
  communityName,
  modApIds,
}: {
  postApId: string;
  queryKeyParentId?: number;
  commentMap: CommentMap;
  level: number;
  opId: number | undefined;
  myUserId: number | undefined;
  noBorder?: boolean;
  communityName?: string;
  modApIds?: string[];
}) {
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

  if (!commentView) {
    return null;
  }

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

  const comment = commentView.comment;
  const creator = commentView.creator;

  const hideContent = comment.removed || comment.deleted;

  console.log(creator.id, myUserId);

  return (
    <details
      open
      className={cn(
        "flex-1 pt-2",
        level === 0 && "mt-2",
        level === 0 && !noBorder && "border-b-[0.5px] pb-5",
        comment.id < 0 && "opacity-50",
      )}
    >
      <Byline
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

      <div
        className="border-l-2 pl-1.5 ml-2 pt-1"
        style={{ borderColor: color }}
      >
        {comment.deleted && <span className="italic text-sm">deleted</span>}
        {comment.removed && <span className="italic text-sm">removed</span>}

        {!hideContent && !edit.isEditing && (
          <MarkdownRenderer markdown={comment.content} />
        )}

        {edit.isEditing && (
          <InlineCommentReply
            state={edit}
            postId={comment.post_id}
            comment={comment}
            autoFocus
            // onCancel={() => edit.setIsEditing(false)}
            // onSubmit={() => edit.setIsEditing(false)}
          />
        )}

        <div className="flex flex-row items-center gap-5 text-sm text-muted-foreground justify-end pt-2.5">
          <ActionMenu
            actions={[
              {
                text: "Share",
                onClick: () =>
                  Share.share({
                    url: `https://blorpblorp.xyz/c/${communityName}/posts/${encodeURIComponent(postApId)}/comments/${comment.id}`,
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
                        requireAuth().then(() => showReportModal(comment.path)),
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
            trigger={<IoEllipsisHorizontal size={16} />}
          />

          <CommentReplyButton onClick={() => reply.setIsEditing(true)} />
          <CommentVoting commentView={commentView} />
        </div>

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
          />
        ))}
      </div>
    </details>
  );
}
