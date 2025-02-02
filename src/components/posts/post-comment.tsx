import { View, Text, XStack, YStack, Avatar } from "tamagui";
import { Markdown } from "~/src/components/markdown";
import _ from "lodash";
import { CommentReplyButton, CommentVoting } from "../comments/comment-buttons";
import {
  InlineCommentReply,
  useCommentReaplyContext,
} from "../comments/comment-reply-modal";
import { useEffect, useState } from "react";
import { useCommentsStore } from "~/src/stores/comments";
import { RelativeTime } from "../relative-time";
import { ActionMenu } from "~/src/components/ui/action-menu";
import { Ellipsis } from "@tamagui/lucide-icons";
import { useDeleteComment } from "~/src/lib/lemmy/index";
import { Share } from "react-native";
import { CommentMap } from "~/src/lib/comment-map";

function Byline({
  avatar,
  author,
  publishedDate,
  authorType,
  onPress,
}: {
  avatar?: string;
  author: string;
  publishedDate: string;
  authorType?: "OP" | "Me";
  onPress?: () => void;
}) {
  return (
    <XStack ai="center">
      <Avatar size={21} mr="$2">
        <Avatar.Image src={avatar} borderRadius="$12" />
        <Avatar.Fallback
          backgroundColor="$color8"
          borderRadius="$12"
          ai="center"
          jc="center"
        >
          <Text fontSize="$1">{author?.substring(0, 1).toUpperCase()}</Text>
        </Avatar.Fallback>
      </Avatar>
      <Text fontSize="$3" fontWeight={500}>
        {author}
        {authorType && <Text color={"$accentColor"}> ({authorType})</Text>}
      </Text>
      <RelativeTime
        prefix=" • "
        time={publishedDate}
        color="$color11"
        fontSize="$3"
      />

      <View flex={1} onPress={onPress} h="100%" />
    </XStack>
  );
}

export function PostComment({
  postApId,
  commentMap,
  level,
  opId,
  myUserId,
  noBorder = false,
  communityName,
}: {
  postApId: string;
  commentMap: CommentMap;
  level: number;
  opId: number | undefined;
  myUserId: number | undefined;
  noBorder?: boolean;
  communityName?: string;
}) {
  const replyCtx = useCommentReaplyContext();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { comment: commentPath, sort, ...rest } = commentMap;

  const commentView = useCommentsStore((s) =>
    commentPath ? s.comments[commentPath.path]?.data : undefined,
  );

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
    <YStack
      mt={level === 0 ? "$2" : undefined}
      py={level === 0 ? "$3" : "$2"}
      bg="$background"
      bbc="$color3"
      bbw={level === 0 && !noBorder ? 1 : 0}
      $md={{
        px: level === 0 ? "$2.5" : undefined,
        bbw: level === 0 && !noBorder ? 0.5 : 0,
      }}
      flex={1}
      w="100%"
      opacity={comment.id < 0 ? 0.5 : undefined}
    >
      <Byline
        avatar={avatar}
        author={creator.name}
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

      <View
        blw={2}
        blc={color}
        p="$2"
        pr={0}
        pb={0}
        mt="$1"
        ml={9}
        ai="flex-start"
        dsp={collapsed ? "none" : undefined}
      >
        {comment.deleted && <Text fontStyle="italic">deleted</Text>}
        {comment.removed && <Text fontStyle="italic">removed</Text>}

        {!hideContent && (
          <View $gtMd={{ dsp: editing ? "none" : undefined }}>
            <Markdown markdown={comment.content} />
          </View>
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

        <XStack
          ai="center"
          jc="flex-end"
          w="100%"
          mt="$1.5"
          mb="$1"
          mr="$1"
          gap="$3"
        >
          <ActionMenu
            placement="top"
            actions={[
              {
                label: "Report",
                onClick: () => {},
              },
              {
                label: "Share",
                onClick: () =>
                  Share.share({
                    url: `https://blorpblorp.xyz/c/${communityName}/posts/${encodeURIComponent(postApId)}/comments/${comment.id}`,
                  }),
              },
              ...(isMyComment && !comment.deleted
                ? [
                    {
                      label: "Edit",
                      onClick: () => {
                        setEditing((e) => !e);
                        replyCtx.setComment(comment);
                      },
                    },
                  ]
                : []),
              ...(isMyComment
                ? [
                    {
                      label: comment.deleted ? "Undelete" : "Delete",
                      onClick: () => {
                        deleteComment.mutate({
                          comment_id: comment.id,
                          path: comment.path,
                          deleted: !comment.deleted,
                        });
                      },
                    },
                  ]
                : []),
            ]}
            trigger={<Ellipsis size={16} />}
          />

          <CommentReplyButton
            onPress={() => {
              setReplying(true);
              replyCtx.setParentComment(commentView);
            }}
          />
          <CommentVoting commentView={commentView} />
        </XStack>

        {replying && (
          <InlineCommentReply
            postId={comment.post_id}
            onCancel={() => setReplying(false)}
            onSubmit={() => setReplying(false)}
            parent={commentView}
            autoFocus
          />
        )}

        {sorted.map(([id, map], i) => (
          <PostComment
            postApId={postApId}
            key={id}
            commentMap={map}
            level={level + 1}
            opId={opId}
            myUserId={myUserId}
            communityName={communityName}
          />
        ))}
      </View>
    </YStack>
  );
}
