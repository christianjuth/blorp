import { MarkdownRenderer } from "../markdown/renderer";
import _ from "lodash";
import { CommentReplyButton, CommentVoting } from "../comments/comment-buttons";
import {
  InlineCommentReply,
  useCommentEditingState,
  useLoadCommentIntoEditor,
} from "../comments/comment-reply-modal";
import { useCommentsStore } from "@/src/stores/comments";
import { RelativeTime } from "../relative-time";
import { useBlockPerson, useDeleteComment } from "@/src/lib/lemmy/index";
import { CommentTree } from "@/src/lib/comment-tree";
import { useShowCommentReportModal } from "./post-report";
import { useRequireAuth } from "../auth-context";
import { useLinkContext } from "../../routing/link-context";
import { createSlug, encodeApId } from "@/src/lib/lemmy/utils";
import { Link, resolveRoute } from "../../routing/index";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { ActionMenu } from "../adaptable/action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { Deferred } from "@/src/lib/deferred";
import { PersonHoverCard } from "../person/person-hover-card";
import { useAuth } from "@/src/stores/auth";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "../ui/button";
import { useMemo, useRef } from "react";
import { ContentGutters } from "../gutters";
import { shareRoute } from "@/src/lib/share";
import { useProfilesStore } from "@/src/stores/profiles";
import { Shield, ShieldCheckmark } from "../icons";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import { create } from "zustand";
import { COMMENT_COLLAPSE_EVENT } from "./config";
import { useMedia } from "@/src/lib/hooks/index";

type StoreState = {
  expandedDetails: Record<string, boolean>;
  setExpandedDetails: (id: string, expanded: boolean) => void;
};

const useDetailsStore = create<StoreState>((set) => ({
  expandedDetails: {},
  setExpandedDetails: (id, expanded) => {
    set((prev) => ({
      expandedDetails: {
        ...prev.expandedDetails,
        [id]: expanded,
      },
    }));
  },
}));

function Byline({
  actorId,
  publishedDate,
  authorType,
  className,
}: {
  actorId: string;
  publishedDate: string;
  authorType?: "OP" | "ME" | "MOD" | "ADMIN";
  className?: string;
}) {
  const linkCtx = useLinkContext();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const profileView = useProfilesStore(
    (s) => s.profiles[getCachePrefixer()(actorId)]?.data,
  );
  const creator = profileView?.person;
  const slug = creator ? createSlug(creator) : null;
  return (
    <CollapsibleTrigger
      className={cn(
        "flex flex-row gap-1.5 items-center py-px w-full",
        className,
      )}
    >
      <Avatar className="w-6 h-6">
        <AvatarImage src={creator?.avatar} />
        <AvatarFallback className="text-xs">
          {creator?.name?.substring(0, 1).toUpperCase()}{" "}
        </AvatarFallback>
      </Avatar>
      <PersonHoverCard actorId={actorId} asChild>
        <Link
          to={`${linkCtx.root}u/:userId`}
          params={{
            userId: encodeApId(actorId),
          }}
          className="text-base overflow-ellipsis flex flex-row overflow-x-hidden items-center"
        >
          <span className="font-medium text-xs">{slug?.name}</span>
          <span className="italic text-xs text-muted-foreground">
            @{slug?.host}
          </span>
          {authorType === "ADMIN" && (
            <>
              <ShieldCheckmark className="text-brand ml-2" />
              <span className="text-xs ml-1 text-brand">ADMIN</span>
            </>
          )}
          {authorType === "OP" && (
            <Badge variant="brand" size="sm" className="ml-1.5">
              OP
            </Badge>
          )}
          {authorType === "MOD" && (
            <>
              <Shield className="text-green-500 ml-2" />
              <span className="text-xs ml-1 text-green-500">MOD</span>
            </>
          )}
          {authorType === "ME" && (
            <Badge variant="brand" size="sm" className="ml-1.5">
              Me
            </Badge>
          )}
        </Link>
      </PersonHoverCard>
      <span className="text-muted-foreground text-xs">•</span>
      <RelativeTime
        time={publishedDate}
        className="text-xs text-muted-foreground"
      />
    </CollapsibleTrigger>
  );
}

export function PostComment({
  postApId,
  queryKeyParentId,
  commentTree,
  level,
  opId,
  myUserId,
  communityName,
  modApIds,
  adminApIds,
  singleCommentThread,
  highlightCommentId,
}: {
  postApId: string;
  queryKeyParentId?: number;
  commentTree: CommentTree;
  level: number;
  opId: number | undefined;
  myUserId: number | undefined;
  communityName: string;
  modApIds?: string[];
  adminApIds?: string[];
  singleCommentThread?: boolean;
  highlightCommentId?: string;
}) {
  const media = useMedia();
  const loadCommentIntoEditor = useLoadCommentIntoEditor();

  const linkCtx = useLinkContext();
  const [alrt] = useIonAlert();

  const showReportModal = useShowCommentReportModal();
  const requireAuth = useRequireAuth();

  const blockPerson = useBlockPerson();

  const { comment: commentPath, ...rest } = commentTree;

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const commentView = useCommentsStore((s) =>
    commentPath
      ? s.comments[getCachePrefixer()(commentPath.path)]?.data
      : undefined,
  );
  const isAdmin =
    commentView && adminApIds?.includes(commentView?.creator.actor_id);
  const isMod =
    commentView && modApIds?.includes(commentView?.creator.actor_id);

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

  const open =
    useDetailsStore((s) =>
      commentView?.comment.ap_id
        ? s.expandedDetails[commentView.comment.ap_id]
        : null,
    ) ?? true;
  const setOpen = useDetailsStore((s) => s.setExpandedDetails);

  const ref = useRef<HTMLDivElement>(null);

  const editingState = useCommentEditingState({
    comment: commentView,
  });
  const replyState = useCommentEditingState({
    parent: commentView,
  });

  const router = useIonRouter();

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
      ref={ref}
      className={cn(
        "flex-1 pt-2",
        level === 0 && "max-md:px-2.5 py-3",
        level === 0 &&
          !singleCommentThread &&
          "border-t-8 max-md:border-border/50 md:border-t",
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
                to={`${linkCtx.root}c/:communityName/posts/:post/comments/:comment`}
                params={{
                  communityName,
                  post: encodeApId(postApId),
                  comment: parentLink,
                }}
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
              to={`${linkCtx.root}c/:communityName/posts/:post`}
              params={{
                communityName,
                post: encodeApId(postApId),
              }}
              replace
            >
              View all comments
            </Link>
          </Button>
          {!parentLink && <div className="h-px flex-1 bg-border" />}
        </div>
      )}
      <Collapsible
        className={cn(comment.id < 0 && "opacity-50")}
        defaultOpen={open}
        onOpenChange={() => {
          setOpen(comment.ap_id, !open);
          ref.current?.dispatchEvent(
            new CustomEvent<boolean>(COMMENT_COLLAPSE_EVENT, {
              bubbles: true,
            }),
          );
        }}
      >
        <Byline
          className={cn(
            open && "pb-1.5",
            level > 0 && !open && "pb-3",
            highlightComment && "bg-brand/10",
          )}
          actorId={creator.actor_id}
          publishedDate={comment.published}
          authorType={
            isAdmin
              ? "ADMIN"
              : isMod
                ? "MOD"
                : creator.id === opId
                  ? "OP"
                  : creator.id === myUserId
                    ? "ME"
                    : undefined
          }
        />

        <CollapsibleContent>
          {comment.deleted && <span className="italic text-sm">deleted</span>}
          {comment.removed && <span className="italic text-sm">removed</span>}

          {!hideContent && !editingState && (
            <MarkdownRenderer
              markdown={comment.content}
              className={cn(highlightComment && "bg-brand/10")}
            />
          )}

          {/* Editing */}
          {editingState && (
            <InlineCommentReply state={editingState} autoFocus />
          )}

          <div className="flex flex-row items-center text-sm text-muted-foreground justify-end gap-1">
            <ActionMenu
              actions={[
                {
                  text: "Share",
                  onClick: () =>
                    shareRoute(
                      resolveRoute(
                        `${linkCtx.root}c/:communityName/posts/:post/comments/:comment`,
                        {
                          communityName,
                          post: encodeURIComponent(postApId),
                          comment: String(comment.id),
                        },
                      ),
                    ),
                } as const,
                ...(isMyComment && !comment.deleted
                  ? [
                      {
                        text: "Edit",
                        onClick: () => {
                          loadCommentIntoEditor({
                            postId: comment.post_id,
                            queryKeyParentId: queryKeyParentId,
                            comment,
                          });
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
                        text: `Message ${creator.name}`,
                        onClick: () =>
                          requireAuth().then(() =>
                            router.push(
                              resolveRoute("/messages/chat/:userId", {
                                userId: encodeApId(creator.actor_id),
                              }),
                            ),
                          ),
                      } as const,
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

            <CommentReplyButton
              onClick={() =>
                loadCommentIntoEditor({
                  postId: comment.post_id,
                  queryKeyParentId: queryKeyParentId,
                  parent: commentView,
                })
              }
            />
            <CommentVoting commentView={commentView} className="-mr-2.5" />
          </div>

          {(sorted.length > 0 || (replyState && media.md)) && (
            <div
              className="border-l-[1.5px] border-b-[1.5px] pl-3 md:pl-3.5 rounded-bl-xl mb-2"
              style={{ borderColor: color }}
            >
              {replyState && (
                <InlineCommentReply state={replyState} autoFocus />
              )}

              {sorted.map(([id, map]) => (
                <PostComment
                  postApId={postApId}
                  queryKeyParentId={queryKeyParentId}
                  key={id}
                  commentTree={map}
                  level={level + 1}
                  opId={opId}
                  myUserId={myUserId}
                  communityName={communityName}
                  highlightCommentId={highlightCommentId}
                  modApIds={modApIds}
                  adminApIds={adminApIds}
                />
              ))}

              <div className="h-1 -mt-1 w-full bg-background translate-y-0.5" />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
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
