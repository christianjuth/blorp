import { isWeb, Text, useMedia, View, XStack, YStack } from "tamagui";
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
import { useCommentReaplyContext } from "../comments/comment-reply-modal";
import { YouTubeVideoEmbed } from "../youtube";
import { Repeat2 } from "@tamagui/lucide-icons";
import { useSettingsStore } from "~/src/stores/settings";
import { getPostEmbed } from "~/src/lib/post";
import { PostLoopsEmbed } from "./post-loops-embed";
import { CommentSortSelect } from "../lemmy-sort";
import { encodeApId, FlattenedPost } from "~/src/lib/lemmy/utils";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Text color="$color11" fontStyle="italic" py="$4">
      {children}
    </Text>
  );
}

export function getPostProps(
  postView: FlattenedPost,
  featuredContext?: "community" | "home",
) {
  const embed = getPostEmbed(postView.post);

  const imageDetails = postView.imageDetails;
  const aspectRatio = imageDetails
    ? imageDetails.width / imageDetails.height
    : undefined;

  const myVote = postView?.optimisticMyVote ?? postView?.myVote ?? 0;
  const diff =
    typeof postView?.optimisticMyVote === "number"
      ? postView?.optimisticMyVote - (postView?.myVote ?? 0)
      : 0;
  const score = postView?.counts.score + diff;

  let pinned = false;
  if (featuredContext === "community") {
    pinned = postView.post.featured_community;
  }
  if (featuredContext === "home") {
    pinned = postView.post.featured_local;
  }

  const crossPost = postView.crossPosts?.find(
    ({ post }) => post.published.localeCompare(postView.post.published) < 0,
  );

  return {
    ...embed,
    id: postView.post.id,
    apId: postView.post.ap_id,
    encodedApId: encodeApId(postView.post.ap_id),
    read: postView.optimisticRead ?? postView.read,
    deleted: postView.optimisticDeleted ?? postView.post.deleted,
    name: postView.post.name,
    url: postView.post.url,
    aspectRatio,
    myVote,
    score,
    pinned,
    saved: postView.optimisticSaved ?? postView.saved,
    creatorId: postView.creator.id,
    creatorApId: postView.creator.actor_id,
    encodedCreatorApId: encodeApId(postView.creator.actor_id),
    creatorName: postView.creator.name,
    communitySlug: postView.community.slug,
    published: postView.post.published,
    body: postView.post.body,
    nsfw: postView.post.nsfw,
    commentsCount: postView.counts.comments,
    crossPostCommunitySlug: crossPost?.community.slug,
    crossPostEncodedApId: crossPost
      ? encodeApId(crossPost?.post.ap_id)
      : undefined,
  };
}

export type PostProps = ReturnType<typeof getPostProps>;

export function DetailPostCard(props: PostProps) {
  const media = useMedia();

  const {
    apId,
    deleted,
    name,
    type,
    url,
    thumbnail,
    aspectRatio,
    communitySlug,
    body,
    nsfw,
    encodedApId,
    crossPostEncodedApId,
    crossPostCommunitySlug,
  } = props;

  const linkCtx = useLinkContext();

  const showNsfw = useSettingsStore((s) => s.setShowNsfw);
  const filterKeywords = useSettingsStore((s) => s.filterKeywords);

  if (nsfw && !showNsfw) {
    return <Notice>NSFW content hidden</Notice>;
  }

  for (const keyword of filterKeywords) {
    if (name.toLowerCase().includes(keyword.toLowerCase())) {
      return <Notice>Hidden by "{keyword}" keyword filter</Notice>;
    }
  }

  const postDetailsLink =
    `${linkCtx.root}c/${communitySlug}/posts/${encodedApId}` as const;

  return (
    <YStack
      pt="$4"
      pb="$4"
      bbc="$color3"
      mx="auto"
      flex={1}
      $md={{
        px: "$3",
      }}
      gap="$2"
      w="100%"
    >
      <PostByline {...props} />

      <Link href={postDetailsLink}>
        <Text
          fontWeight={500}
          fontSize="$6"
          lineHeight="$4"
          fontStyle={deleted ? "italic" : undefined}
        >
          {deleted ? "deleted" : name}
        </Text>
      </Link>

      {thumbnail && type === "image" && !deleted && (
        <View
          br="$5"
          $md={{ mx: "$-3", br: 0 }}
          onLongPress={() => shareImage(thumbnail)}
        >
          <Image
            imageUrl={thumbnail}
            aspectRatio={aspectRatio}
            borderRadius={media.gtMd ? 10 : 0}
            priority
          />
        </View>
      )}

      {type === "article" && !deleted && url && (
        <PostArticleEmbed url={url} thumbnail={thumbnail} />
      )}
      {type === "video" && !deleted && url && (
        <PostVideoEmbed url={url} autoPlay={false} />
      )}
      {type === "loops" && !deleted && url && (
        <PostLoopsEmbed url={url} thumbnail={thumbnail} autoPlay={false} />
      )}
      {type === "youtube" && !deleted && <YouTubeVideoEmbed url={url} />}

      {crossPostEncodedApId && crossPostCommunitySlug && (
        <Link
          href={`${linkCtx.root}c/${crossPostCommunitySlug}/posts/${crossPostEncodedApId}`}
          asChild
        >
          <XStack gap="$1" mt="$2">
            <Repeat2 color="$accentColor" size={16} />
            <Text fontSize={13} color="$accentColor">
              Cross posted from {crossPostCommunitySlug}
            </Text>
          </XStack>
        </Link>
      )}

      {body && !deleted && (
        <View pt="$2">
          <Markdown markdown={body} />
        </View>
      )}
    </YStack>
  );
}

export function FeedPostCard(props: PostProps) {
  const media = useMedia();

  const {
    apId,
    read,
    deleted,
    name,
    type,
    url,
    thumbnail,
    aspectRatio,
    myVote,
    score,
    communitySlug,
    nsfw,
    encodedApId,
    commentsCount,
  } = props;

  const [pressed, setPressed] = useState(false);

  const linkCtx = useLinkContext();

  const showNsfw = useSettingsStore((s) => s.setShowNsfw);
  const filterKeywords = useSettingsStore((s) => s.filterKeywords);

  if (nsfw && !showNsfw) {
    return null;
  }

  for (const keyword of filterKeywords) {
    if (name.toLowerCase().includes(keyword.toLowerCase())) {
      return null;
    }
  }

  const postDetailsLink =
    `${linkCtx.root}c/${communitySlug}/posts/${encodedApId}` as const;

  return (
    <YStack
      pt="$4"
      pb="$4"
      bbc="$color3"
      bbw={1}
      mx="auto"
      flex={1}
      $md={{
        px: "$3",
        bbw: 0.5,
      }}
      gap="$2"
      opacity={pressed ? 0.8 : 1}
      animation="100ms"
      w="100%"
    >
      <PostByline {...props} />

      <Link
        href={postDetailsLink}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onLongPress={thumbnail ? () => shareImage(thumbnail) : undefined}
        asChild
      >
        <YStack tag="a" gap="$2">
          <Text
            fontWeight={500}
            fontSize="$6"
            lineHeight="$4"
            col={read ? "$color10" : "$color"}
            fontStyle={deleted ? "italic" : undefined}
          >
            {deleted ? "deleted" : name}
          </Text>

          {thumbnail && type === "image" && !deleted && (
            <View br="$5" $md={{ mx: "$-3", br: 0 }}>
              <Image
                imageUrl={thumbnail}
                aspectRatio={aspectRatio}
                borderRadius={media.gtMd ? 10 : 0}
                priority
              />
            </View>
          )}
        </YStack>
      </Link>

      {type === "article" && !deleted && url && (
        <PostArticleEmbed url={url} thumbnail={thumbnail} />
      )}
      {type === "video" && !deleted && url && (
        <PostVideoEmbed url={url} autoPlay={false} />
      )}
      {type === "loops" && !deleted && url && (
        <PostLoopsEmbed url={url} thumbnail={thumbnail} autoPlay={false} />
      )}
      {type === "youtube" && !deleted && <YouTubeVideoEmbed url={url} />}

      <XStack jc="flex-end" gap="$2">
        <Link href={postDetailsLink} asChild>
          <PostCommentsButton commentsCount={commentsCount} />
        </Link>
        <Voting apId={apId} score={score} myVote={myVote} />
      </XStack>
    </YStack>
  );
}

export function PostBottomBar({
  apId,
  commentsCount,
}: {
  apId: string;
  commentsCount: number;
}) {
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
      <CommentSortSelect />

      <View flex={1} />

      <PostCommentsButton
        commentsCount={commentsCount}
        onPress={replyCtx.focus}
      />
      {postView && <Voting {...getPostProps(postView)} />}
    </XStack>
  );
}
