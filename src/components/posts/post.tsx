import { Text, useMedia, View, XStack, YStack } from "tamagui";
import { Image, shareImage } from "~/src/components/image";
import { PostCommentsButton, Voting } from "./post-buttons";
import { Link } from "one";
import { PostByline } from "./post-byline";
import { useState } from "react";
import { usePostsStore } from "~/src/stores/posts";
import { useLinkContext } from "../nav/link-context";
import { PostArticleEmbed } from "./post-article-embed";
import { Markdown } from "~/src/components/markdown";
import { PostVideoEmbed } from "./post-video-embed";
import { Pressable } from "react-native";
import { useCommentReaplyContext } from "../comments/comment-reply-modal";
import { YouTubeVideoEmbed } from "../youtube";
import { Repeat2 } from "@tamagui/lucide-icons";
import { usePost } from "~/src/lib/lemmy/index";
import { useSettingsStore } from "~/src/stores/settings";
import { getPostEmbed } from "~/src/lib/post";
import { PostLoopsEmbed } from "./post-loops-embed";
import { ComentSortSelect } from "../lemmy-sort";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Text color="$color11" fontStyle="italic" py="$4">
      {children}
    </Text>
  );
}

export function PostCard({
  apId,
  detailView = false,
  featuredContext,
  savedOnly,
}: {
  apId: string;
  detailView?: boolean;
  /**
   * featuredContext, if set to community, instructs the post
   * to check if post.featured_community is true, and if so,
   * mark it as a pinned post in the context of a community feed.
   */
  featuredContext?: "community" | "home";
  savedOnly?: boolean;
}) {
  const media = useMedia();

  const { refetch: prefetch } = usePost({
    ap_id: apId,
    enabled: false,
  });

  const showNsfw = useSettingsStore((s) => s.setShowNsfw);
  const filterKeywords = useSettingsStore((s) => s.filterKeywords);

  const linkCtx = useLinkContext();
  const [pressed, setPressed] = useState(false);
  const postView = usePostsStore((s) => s.posts[apId]?.data);

  if (!postView) {
    return null;
  }

  const deleted = postView.optimisticDeleted ?? postView.post.deleted;

  const saved = postView.optimisticSaved ?? postView.saved;
  if (savedOnly && !saved) {
    return null;
  }

  const { community, post } = postView;
  const body = post?.body;

  for (const keyword of filterKeywords) {
    if (post.name.toLowerCase().includes(keyword.toLowerCase())) {
      return detailView ? (
        <Notice>Hidden by "{keyword}" keyword filter</Notice>
      ) : null;
    }
  }

  if (postView.post.nsfw && !showNsfw) {
    return detailView ? <Notice>NSFW content hidden</Notice> : null;
  }

  const imageDetails = postView.imageDetails;
  const aspectRatio = imageDetails
    ? imageDetails.width / imageDetails.height
    : undefined;

  const { thumbnail, type: embedType } = getPostEmbed(post);

  const postDetailsLink =
    `${linkCtx.root}c/${community.slug}/posts/${encodeURIComponent(post.ap_id)}` as const;

  const crossPost = detailView
    ? postView.crossPosts?.find(
        ({ post }) => post.published.localeCompare(postView.post.published) < 0,
      )
    : undefined;

  const titleWithOptionalImage = (
    <YStack gap="$2">
      <Text
        fontWeight={500}
        fontSize="$6"
        lineHeight="$4"
        fontStyle={deleted ? "italic" : undefined}
      >
        {deleted ? "deleted" : post.name}
      </Text>

      {thumbnail && embedType === "image" && !deleted && (
        <View br="$5" $md={{ mx: "$-3", br: 0 }}>
          <Image
            imageUrl={thumbnail}
            aspectRatio={aspectRatio}
            borderRadius={media.gtMd ? 10 : 0}
          />
        </View>
      )}
    </YStack>
  );

  const preview = (
    <>
      {detailView ? (
        <Pressable
          onLongPress={() => {
            if (embedType === "image" && thumbnail) {
              shareImage(thumbnail);
            }
          }}
        >
          {titleWithOptionalImage}
        </Pressable>
      ) : (
        <Link
          href={postDetailsLink}
          onPress={() => prefetch()}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          asChild
          onLongPress={() => {
            if (embedType === "image" && thumbnail) {
              shareImage(thumbnail);
            }
          }}
        >
          <View tag="a">{titleWithOptionalImage}</View>
        </Link>
      )}

      {embedType === "article" && !deleted && (
        <PostArticleEmbed postView={postView} />
      )}
      {embedType === "video" && !deleted && post.url && (
        <PostVideoEmbed url={post.url} autoPlay={detailView} />
      )}
      {embedType === "loops" && !deleted && post.url && (
        <PostLoopsEmbed
          url={post.url}
          thumbnail={thumbnail}
          autoPlay={detailView}
        />
      )}
      {embedType === "youtube" && !deleted && (
        <YouTubeVideoEmbed url={post.url} />
      )}
    </>
  );

  return (
    <YStack
      pt="$4"
      pb={detailView ? "$1.5" : "$4"}
      bbc="$color3"
      bbw={detailView ? 0 : 1}
      mx="auto"
      flex={1}
      $md={{
        px: "$3",
        bbw: detailView ? 0 : 0.5,
      }}
      gap="$2"
      opacity={pressed ? 0.8 : 1}
      animation="100ms"
      w="100%"
    >
      <PostByline postView={postView} featuredContext={featuredContext} />

      {preview}

      {detailView && crossPost && (
        <Link
          href={`${linkCtx.root}c/${crossPost.community.slug}/posts/${encodeURIComponent(crossPost.post.ap_id)}`}
          asChild
        >
          <XStack gap="$1" mt="$2">
            <Repeat2 color="$accentColor" size={16} />
            <Text fontSize={13} color="$accentColor">
              Cross posted from {crossPost.community.slug}
            </Text>
          </XStack>
        </Link>
      )}

      {detailView && body && !deleted && (
        <View pt="$2">
          <Markdown markdown={body} />
        </View>
      )}

      {!detailView && (
        <XStack jc="flex-end" ai="center" gap="$2" pt="$1.5">
          <Link href={postDetailsLink} asChild>
            <PostCommentsButton postView={postView} />
          </Link>
          {postView && <Voting apId={apId} />}
        </XStack>
      )}
    </YStack>
  );
}

export function PostBottomBar({ apId }: { apId: string }) {
  const postView = usePostsStore((s) => s.posts[apId]?.data);
  const replyCtx = useCommentReaplyContext();

  if (!postView) {
    return null;
  }

  return (
    <XStack
      ai="center"
      gap="$2"
      py="$2"
      bbc="$color3"
      mx="auto"
      flex={1}
      $md={{
        px: "$3",
        bbw: 0.5,
      }}
      bg="$background"
    >
      <ComentSortSelect />

      <View flex={1} />

      <PostCommentsButton postView={postView} onPress={replyCtx.focus} />
      {postView && <Voting apId={apId} />}
    </XStack>
  );
}
