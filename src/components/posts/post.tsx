import { Text, View, XStack, YStack } from "tamagui";
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
import { isYouTubeVideoUrl } from "~/src/lib/youtube";
import { YouTubeVideoEmbed } from "../youtube";

export function PostCard({
  apId,
  detailView = false,
  featuredContext,
}: {
  apId: string;
  detailView?: boolean;
  featuredContext?: "community";
}) {
  const replyCtx = useCommentReaplyContext();
  const linkCtx = useLinkContext();
  const [pressed, setPressed] = useState(false);
  let postView = usePostsStore((s) => s.posts[apId]?.data);

  if (!postView) {
    return null;
  }

  const imageDetails = postView.imageDetails;
  const aspectRatio = imageDetails
    ? imageDetails.width / imageDetails.height
    : undefined;

  const { community, post } = postView;
  const body = post?.body;

  const urlContentType = post.url_content_type;

  let embedType: "image" | "video" | "article" | "youtube" = "article";

  if (
    (urlContentType && urlContentType.indexOf("image/") !== -1) ||
    post.url?.endsWith(".jpeg") ||
    post.url?.endsWith(".jpg") ||
    post.url?.endsWith(".png") ||
    post.url?.endsWith(".webp")
  ) {
    embedType = "image";
  } else if (urlContentType && urlContentType.indexOf("video/") !== -1) {
    embedType = "video";
  } else if (post.url && isYouTubeVideoUrl(post.url)) {
    embedType = "youtube";
  }

  const postDetailsLink =
    `${linkCtx.root}c/${community.slug}/posts/${encodeURIComponent(post.ap_id)}` as const;

  const crossPost = detailView
    ? postView.crossPosts?.find(
        ({ post }) => post.published.localeCompare(postView.post.published) < 0,
      )
    : undefined;

  const titleWithOptionalImage = (
    <YStack gap="$2">
      {!crossPost && (
        <Text
          fontWeight={500}
          fontSize={detailView ? "$7" : "$6"}
          lineHeight="$4"
        >
          {post.name}
        </Text>
      )}

      {post.thumbnail_url && embedType === "image" && (
        <View br="$5" overflow="hidden" $md={{ mx: "$-2.5", br: 0 }}>
          <Image imageUrl={post.thumbnail_url} aspectRatio={aspectRatio} />
        </View>
      )}
    </YStack>
  );

  const preview = (
    <>
      {detailView ? (
        <Pressable
          onLongPress={() => {
            if (embedType === "image" && post.thumbnail_url) {
              shareImage(post.thumbnail_url);
            }
          }}
        >
          {titleWithOptionalImage}
        </Pressable>
      ) : (
        <Link
          href={postDetailsLink}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          asChild
          onLongPress={() => {
            if (embedType === "image" && post.thumbnail_url) {
              shareImage(post.thumbnail_url);
            }
          }}
        >
          <View tag="a">{titleWithOptionalImage}</View>
        </Link>
      )}

      {embedType === "article" && <PostArticleEmbed postView={postView} />}
      {embedType === "video" && post.url && (
        <PostVideoEmbed url={post.url} autoPlay={detailView} />
      )}
      {embedType === "youtube" && <YouTubeVideoEmbed url={post.url} />}
    </>
  );

  return (
    <YStack
      py="$4"
      bbc="$color4"
      bbw={detailView ? 0 : 1}
      mx="auto"
      flex={1}
      $md={{
        px: "$2.5",
        bbw: 1,
      }}
      gap="$2"
      opacity={pressed ? 0.8 : 1}
      animation="100ms"
      w="100%"
    >
      <PostByline postView={postView} featuredContext={featuredContext} />

      {crossPost ? (
        <>
          <Text fontWeight={500} fontSize="$6" lineHeight="$3">
            {post.name}
          </Text>

          <Link
            href={`${linkCtx.root}c/${crossPost.community.slug}/posts/${encodeURIComponent(crossPost.post.ap_id)}`}
            asChild
          >
            <YStack bc="$color4" bw={1} br="$4" py="$2.5" gap="$2" tag="a">
              <Text px="$3" color="$color11" fontSize="$3">
                c/{crossPost.community.slug}
              </Text>
              <Text px="$3" fontWeight={500} fontSize="$5" lineHeight="$3">
                {crossPost.post.name}
              </Text>
              <View mx="$2.5">{preview}</View>
            </YStack>
          </Link>
        </>
      ) : (
        preview
      )}

      {detailView && body && (
        <View pt="$2">
          <Markdown markdown={body} />
        </View>
      )}

      <XStack jc="flex-end" ai="center" gap="$2">
        {detailView ? (
          <PostCommentsButton postView={postView} onPress={replyCtx.focus} />
        ) : (
          <Link href={postDetailsLink} asChild>
            <PostCommentsButton postView={postView} />
          </Link>
        )}
        {postView && <Voting apId={apId} />}
      </XStack>
    </YStack>
  );
}
