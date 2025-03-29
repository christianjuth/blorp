import Markdown from "react-markdown";
import _ from "lodash";
import { CommentReplyButton, CommentVoting } from "../comments/comment-buttons";
import {
  InlineCommentReply,
  useCommentReaplyContext,
} from "../comments/comment-reply-modal";
import { useEffect, useState } from "react";
import { useCommentsStore } from "~/src/stores/comments";
import { RelativeTime } from "../relative-time";
import { useBlockPerson, useDeleteComment } from "~/src/lib/lemmy/index";
import { CommentMap } from "~/src/lib/comment-map";
import { useShowCommentReportModal } from "./post-report";
import { useRequireAuth } from "../auth-context";
import { useLinkContext } from "../nav/link-context";
import { Person } from "lemmy-js-client";
import { createPersonSlug, encodeApId } from "~/src/lib/lemmy/utils";
import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/src/components/ui/avatar";
import { cn } from "~/src/lib/utils";
import { ActionMenu } from "../action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useIonAlert } from "@ionic/react";
import { message } from "@tauri-apps/plugin-dialog";
import { Deferred } from "~/src/lib/deferred";

function Byline({
  creator,
  publishedDate,
  authorType,
  onPress,
}: {
  creator: Pick<Person, "actor_id" | "avatar" | "name">;
  publishedDate: string;
  authorType?: "OP" | "Me";
  onPress?: () => void;
}) {
  const linkCtx = useLinkContext();
  return (
    <div
      // ai="center"
      className="flex flex-row gap-1.5 items-center py-px"
    >
      <Avatar className="w-5 h-5">
        <AvatarImage src={creator.avatar} />
        <AvatarFallback className="text-xs">
          {creator.name?.substring(0, 1).toUpperCase()}{" "}
        </AvatarFallback>
      </Avatar>
      {/* <Avatar size={21} mr="$2"> */}
      {/*   <Avatar.Image src={creator.avatar} borderRadius="$12" /> */}
      {/*   <Avatar.Fallback */}
      {/*     backgroundColor="$color8" */}
      {/*     borderRadius="$12" */}
      {/*     ai="center" */}
      {/*     jc="center" */}
      {/*   > */}
      {/*     <Text fontSize="$1"> */}
      {/*       {creator.name?.substring(0, 1).toUpperCase()} */}
      {/*     </Text> */}
      {/*   </Avatar.Fallback> */}
      {/* </Avatar> */}
      <Link
        to={`${linkCtx.root}u/${encodeApId(creator.actor_id)}`}
        className="text-sm"
      >
        {createPersonSlug(creator)}
        {authorType && <span> ({authorType})</span>}
      </Link>
      <RelativeTime
        prefix=" • "
        time={publishedDate}
        className="text-sm"
        // color="$color11"
        // fontSize="$3"
      />

      <div className="flex-1 h-full" onClick={onPress} />
    </div>
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
}: {
  postApId: string;
  queryKeyParentId?: number;
  commentMap: CommentMap;
  level: number;
  opId: number | undefined;
  myUserId: number | undefined;
  noBorder?: boolean;
  communityName?: string;
}) {
  const [alrt] = useIonAlert();

  const showReportModal = useShowCommentReportModal();
  const requireAuth = useRequireAuth();

  const blockPerson = useBlockPerson();

  const replyCtx = useCommentReaplyContext();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { comment: commentPath, sort, ...rest } = commentMap;

  const commentView = useCommentsStore((s) =>
    commentPath ? s.comments[commentPath.path]?.data : undefined,
  );

  // console.log(commentPath, commentView?.comment.content);

  useEffect(() => {
    setEditing(false);
  }, [commentView?.comment.content]);

  const deleteComment = useDeleteComment();

  const isMyComment = commentView?.comment.creator_id === myUserId;

  if (!commentView) {
    return null;
  }

  const sorted = _.entries(_.omit(rest)).sort(
    ([id1, a], [id2, b]) => a.sort - b.sort,
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
  const avatar = creator.avatar;

  const hideContent = comment.removed || comment.deleted;

  return (
    <div
      className={cn(
        "flex-1 py-2 overflow-x-hidden",
        level === 0 && "mt-2",
        level === 0 && !noBorder && "border-b-[0.5px] pb-5",
        comment.id < 0 && "opacity-50",
      )}
      // bg="$background"
      // bbc="$color3"
      // bbw={level === 0 && !noBorder ? 1 : 0}
      // $md={{
      //   px: level === 0 ? "$2.5" : undefined,
      //   bbw: level === 0 && !noBorder ? 0.5 : 0,
      // }}
      // w="100%"
    >
      <Byline
        creator={creator}
        publishedDate={comment.published}
        authorType={
          creator.id === opId
            ? "OP"
            : creator.id === myUserId
              ? "Me"
              : undefined
        }
        onPress={() => setCollapsed((c) => !c)}
      />

      <div
        className="border-l-2 px-2 ml-2 pt-px"
        style={{ borderColor: color }}
      >
        {comment.deleted && <span className="italic">deleted</span>}
        {comment.removed && <span className="italic">removed</span>}

        {!hideContent && (
          <div
            className="prose dark:prose-invert prose-sm"
            // $gtMd={{ dsp: editing ? "none" : undefined }} w="100%"
          >
            <Markdown>{comment.content}</Markdown>
          </div>
        )}

        {editing && (
          <InlineCommentReply
            postId={comment.post_id}
            comment={comment}
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={() => setEditing(false)}
          />
        )}

        <div className="flex flex-row items-center gap-5 text-sm text-muted-foreground justify-end">
          <ActionMenu
            // placement="top"
            actions={[
              {
                text: "Share",
                onClick: () => {
                  // Share.share({
                  //   url: `https://blorpblorp.xyz/c/${communityName}/posts/${encodeURIComponent(postApId)}/comments/${comment.id}`,
                  // }),
                },
              } as const,
              ...(isMyComment && !comment.deleted
                ? [
                    {
                      text: "Edit",
                      onClick: () => {
                        setEditing((e) => !e);
                        replyCtx.setComment(comment);
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
                      // danger: true,
                    } as const,
                  ]
                : [
                    {
                      text: "Report",
                      onClick: () =>
                        requireAuth().then(() => showReportModal(comment.path)),
                      // danger: true,
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
                        } catch (err) {}
                      },
                      // danger: true,
                    } as const,
                  ]),
            ]}
            trigger={<IoEllipsisHorizontal size={16} />}
          />

          <CommentReplyButton
            onClick={() => {
              setReplying(true);
              replyCtx.setParentComment(commentView);
            }}
          />
          <CommentVoting commentView={commentView} />
        </div>

        {replying && (
          <InlineCommentReply
            postId={comment.post_id}
            queryKeyParentId={queryKeyParentId}
            onCancel={() => setReplying(false)}
            onSubmit={() => setReplying(false)}
            parent={commentView}
            autoFocus
          />
        )}

        {sorted.map(([id, map], i) => (
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
    </div>
  );
}
