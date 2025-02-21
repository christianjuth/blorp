import { View, Text, Avatar, YStack, XStack } from "tamagui";
import { RelativeTime } from "~/src/components/relative-time";
import {
  useBlockPerson,
  useDeletePost,
  useSavePost,
} from "~/src/lib/lemmy/index";
import { FlattenedPost } from "~/src/lib/lemmy/utils";
import { Link } from "one";
import { useLinkContext } from "../nav/link-context";
import { ActionMenu } from "../ui/action-menu";
import { Share } from "react-native";
import { Ellipsis, Pin } from "@tamagui/lucide-icons";
import { useRequireAuth } from "../auth-context";
import { useShowPostReportModal } from "./post-report";
import { useAlert } from "../ui/alert";
import { encodeApId } from "~/src/lib/lemmy/utils";
import { useAuth } from "~/src/stores/auth";
import { openUrl } from "~/src/lib/linking";

export function PostByline({
  postView,
  featuredContext,
}: {
  postView: FlattenedPost;
  featuredContext?: "community" | "home";
}) {
  const alrt = useAlert();

  const showReportModal = useShowPostReportModal();
  const requireAuth = useRequireAuth();
  const blockPerson = useBlockPerson();
  const deletePost = useDeletePost(postView.post.ap_id);
  const savePost = useSavePost(postView.post.ap_id);

  const { creator, community, post } = postView;
  const linkCtx = useLinkContext();

  let pinned = false;
  if (featuredContext === "community") {
    pinned = postView.post.featured_community;
  }
  if (featuredContext === "home") {
    pinned = postView.post.featured_local;
  }

  const saved = postView.optimisticSaved ?? postView.saved;

  const user = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person,
  );
  const isMyPost = creator.actor_id === user?.actor_id;

  const deleted = postView.optimisticDeleted ?? postView.post.deleted;

  return (
    <XStack dsp="flex" fd="row" ai="center" gap={9}>
      <Avatar size="$2.5">
        <Avatar.Image src={creator.avatar} borderRadius="$12" />
        <Avatar.Fallback
          backgroundColor="$color8"
          borderRadius="$12"
          ai="center"
          jc="center"
        >
          <Text fontSize="$4">
            {creator.name?.substring(0, 1).toUpperCase()}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      <YStack gap={4}>
        <Link href={`${linkCtx.root}c/${community.slug}`} push>
          <Text fontSize="$2" fontWeight={500} color="$color12">
            c/{community.slug}
          </Text>
        </Link>
        <XStack>
          <Link
            href={`${linkCtx.root}u/${encodeApId(postView.creator.actor_id)}`}
            push
          >
            <Text fontSize="$2" fontWeight={500} color="$color11">
              u/{creator.name}
            </Text>
          </Link>

          <RelativeTime
            prefix=" • "
            time={post.published}
            color="$color11"
            fontSize="$3"
          />
        </XStack>
      </YStack>

      <View flex={1} />

      {pinned && (
        <Pin fill="#17B169" color="#17B169" size="$1" rotate="45deg" />
      )}

      <ActionMenu
        placement="bottom-end"
        actions={[
          {
            label: "Share",
            onClick: () =>
              Share.share({
                url: `https://blorpblorp.xyz/c/${postView.community.slug}/posts/${encodeURIComponent(postView.post.ap_id)}`,
              }),
          },
          {
            label: saved ? "Unsave" : "Save",
            onClick: () =>
              requireAuth().then(() => {
                savePost.mutate({
                  post_id: post.id,
                  save: !saved,
                });
              }),
          },
          {
            label: "View source",
            onClick: async () => {
              const url = postView.post.ap_id;
              try {
                openUrl(url);
              } catch {
                // TODO: handle error
              }
            },
          },
          ...(isMyPost
            ? [
                {
                  label: deleted ? "Restore" : "Delete",
                  onClick: () =>
                    deletePost.mutate({
                      post_id: postView.post.id,
                      deleted: !deleted,
                    }),
                  danger: true,
                },
              ]
            : [
                {
                  label: "Report",
                  onClick: () =>
                    requireAuth().then(() => {
                      showReportModal(postView.post.ap_id);
                    }),
                  danger: true,
                },
                {
                  label: "Block person",
                  onClick: async () => {
                    try {
                      await requireAuth();
                      await alrt(`Block ${postView.creator.name}`);
                      blockPerson.mutate({
                        person_id: postView.creator.id,
                        block: true,
                      });
                    } catch (err) {}
                  },
                  danger: true,
                },
              ]),
        ]}
        trigger={
          <View p="$2" pr={0}>
            <Ellipsis size={16} />
          </View>
        }
      />
    </XStack>
  );
}
