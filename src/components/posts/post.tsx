import { usePostsStore } from "@/src/stores/posts";
import { useLinkContext } from "../nav/link-context";
import { useSettingsStore } from "@/src/stores/settings";
import { getPostEmbed } from "@/src/lib/post";
import { createSlug, encodeApId, FlattenedPost } from "@/src/lib/lemmy/utils";

import { Link } from "react-router-dom";
import { PostArticleEmbed } from "./post-article-embed";
import { PostByline } from "./post-byline";
import { PostCommentsButton, PostReplyButton, Voting } from "./post-buttons";
import { MarkdownRenderer } from "../markdown/renderer";
import { twMerge } from "tailwind-merge";
import { PostLoopsEmbed } from "./post-loops-embed";
import { YouTubeVideoEmbed } from "../youtube";
import { PostVideoEmbed } from "./post-video-embed";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useRef } from "react";
import { CommentSortSelect } from "../lemmy-sort";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useLongPress } from "use-long-press";
import _ from "lodash";
import { shareImage } from "@/src/lib/share";
import { useAuth } from "@/src/stores/auth";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <span className="italic text-muted-foreground text-sm pt-3">
      {children}
    </span>
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

  let url = postView.post.url;
  if (url && url.startsWith("https://i.imgur.com/") && url.endsWith(".gifv")) {
    url = url.replace(/gifv$/, "mp4");
  }

  let displayUrl = url;
  if (displayUrl) {
    const parsedUrl = new URL(displayUrl);
    displayUrl = `${parsedUrl.host.replace(/^www\./, "")}${parsedUrl.pathname.replace(/\/$/, "")}`;
  }

  return {
    ...embed,
    id: postView.post.id,
    apId: postView.post.ap_id,
    encodedApId: encodeApId(postView.post.ap_id),
    read: postView.optimisticRead ?? postView.read,
    deleted: postView.optimisticDeleted ?? postView.post.deleted,
    name: postView.post.name,
    url,
    displayUrl,
    aspectRatio,
    myVote,
    score,
    pinned,
    saved: postView.optimisticSaved ?? postView.saved,
    creatorId: postView.creator.id,
    creatorApId: postView.creator.actor_id,
    creatorSlug: createSlug(postView.creator),
    encodedCreatorApId: encodeApId(postView.creator.actor_id),
    creatorName: postView.creator.name,
    creatorAvatar: postView.creator.avatar,
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

export interface PostProps extends ReturnType<typeof getPostProps> {
  detailView?: boolean;
  onNavigate?: () => any;
}

export function PostCardSkeleton(props: { hideImage?: boolean }) {
  const hideImage = useRef(Math.random()).current < 0.4;
  return (
    <div className="flex-1 pt-4 gap-2 flex flex-col max-md:px-2.5 pb-4">
      <div className="flex flex-row items-center gap-2 h-9">
        <Skeleton className="h-8 w-8 rounded-full" />

        <div className="flex flex-col gap-1">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-2.5 w-44" />
        </div>
      </div>

      <Skeleton className="h-7" />

      {(!hideImage || props.hideImage === false) && (
        <Skeleton className="aspect-video max-md:-mx-2.5 max-md:rounded-none" />
      )}

      <div className="flex flex-row justify-end gap-2">
        <Skeleton className="h-7 w-10 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>

      <Skeleton className="h-[.5px] w-full rounded-full max-md:-mx-2.5" />
    </div>
  );
}

export function FeedPostCard(props: PostProps) {
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
    displayUrl,
    body,
    detailView,
    onNavigate,
  } = props;

  const linkCtx = useLinkContext();

  const showNsfw = useSettingsStore((s) => s.setShowNsfw);
  const filterKeywords = useSettingsStore((s) => s.filterKeywords);

  const postDetailsLink =
    `${linkCtx.root}c/${communitySlug}/posts/${encodedApId}` as const;

  const showImage = type === "image" && thumbnail && !deleted;
  const showArticle = type === "article" && !deleted;

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const patchPost = usePostsStore((s) => s.patchPost);

  const handlers = useLongPress(
    async () => {
      if (thumbnail) {
        Haptics.impact({ style: ImpactStyle.Heavy });
        shareImage(name, thumbnail);
      }
    },
    {
      cancelOnMovement: 15,
      onStart: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
    },
  );

  if (nsfw && !showNsfw) {
    return detailView ? <Notice>Hidden due to NSFW</Notice> : null;
  }

  for (const keyword of filterKeywords) {
    if (name.toLowerCase().includes(keyword.toLowerCase())) {
      return detailView ? (
        <Notice>Hidden due to keyword filter "{keyword}"</Notice>
      ) : null;
    }
  }

  return (
    <div
      data-testid="post-card"
      className={cn(
        "flex-1 pt-4 gap-2 flex flex-col dark:border-zinc-800 overflow-hidden max-md:px-2.5",
        detailView ? "pb-2" : "border-b-[0.5px] pb-4",
      )}
    >
      <PostByline {...props} />

      <Link
        to={postDetailsLink}
        onClickCapture={onNavigate}
        className="gap-2 flex flex-col"
      >
        <span
          className={twMerge(
            "text-xl font-medium",
            !detailView && read && "text-muted-foreground",
          )}
        >
          {deleted ? "deleted" : name}
        </span>
        {showImage && (
          <div className="max-md:-mx-3 flex flex-col">
            <img
              src={thumbnail}
              className="md:rounded-lg object-cover"
              onLoad={(e) => {
                if (!aspectRatio) {
                  patchPost(apId, getCachePrefixer(), {
                    imageDetails: {
                      height: e.currentTarget.naturalHeight,
                      width: e.currentTarget.naturalWidth,
                    },
                  });
                }
              }}
              style={{
                aspectRatio,
              }}
              onContextMenu={(e) => e.preventDefault()}
              {...handlers()}
            />
          </div>
        )}
      </Link>

      {showArticle && (
        <PostArticleEmbed
          url={showArticle ? url : undefined}
          displayUrl={showArticle ? displayUrl : undefined}
          thumbnail={showArticle ? thumbnail : undefined}
        />
      )}

      {type === "video" && !deleted && url && (
        <PostVideoEmbed url={url} autoPlay={detailView} />
      )}
      {type === "loops" && !deleted && url && (
        <PostLoopsEmbed url={url} thumbnail={thumbnail} autoPlay={detailView} />
      )}
      {type === "youtube" && !deleted && <YouTubeVideoEmbed url={url} />}

      {detailView && body && !deleted && <MarkdownRenderer markdown={body} />}

      {!detailView && (
        <div className="flex flex-row justify-end gap-2">
          <PostCommentsButton
            commentsCount={commentsCount}
            href={postDetailsLink}
          />
          <Voting apId={apId} score={score} myVote={myVote} />
        </div>
      )}
    </div>
  );
}

export function PostBottomBar({
  apId,
  commentsCount,
  onReply,
}: {
  apId: string;
  commentsCount: number;
  onReply: () => void;
}) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const postView = usePostsStore(
    (s) => s.posts[getCachePrefixer()(apId)]?.data,
  );

  if (!postView) {
    return null;
  }

  const diff =
    typeof postView?.optimisticMyVote === "number"
      ? postView?.optimisticMyVote - (postView?.myVote ?? 0)
      : 0;
  const score = postView?.counts.score + diff;

  const myVote = postView?.optimisticMyVote ?? postView?.myVote ?? 0;

  return (
    <div className="pb-1.5 md:py-2 flex flex-row gap-2 bg-background">
      <CommentSortSelect />
      <div className="flex-1" />
      <PostReplyButton onClick={onReply} className="mr-1 md:hidden" />
      <PostCommentsButton commentsCount={commentsCount} onClick={onReply} />
      <Voting apId={apId} score={score} myVote={myVote} />
    </div>
  );
}
