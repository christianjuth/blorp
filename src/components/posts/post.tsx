import { usePostsStore } from "@/src/stores/posts";
import { useLinkContext } from "../../routing/link-context";
import { useSettingsStore } from "@/src/stores/settings";
import { getPostEmbed } from "@/src/lib/post";
import { createSlug, encodeApId, FlattenedPost } from "@/src/lib/lemmy/utils";
import { Link } from "@/src/routing/index";
import { PostArticleEmbed } from "./post-article-embed";
import { PostByline } from "./post-byline";
import { PostCommentsButton, Voting } from "./post-buttons";
import { MarkdownRenderer } from "../markdown/renderer";
import { twMerge } from "tailwind-merge";
import { PostLoopsEmbed } from "./post-loops-embed";
import { YouTubeVideoEmbed } from "../youtube";
import { PostVideoEmbed } from "./post-video-embed";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useRef, useState } from "react";
import { CommentSortSelect } from "../lemmy-sort";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useLongPress } from "use-long-press";
import _ from "lodash";
import { shareImage } from "@/src/lib/share";
import { useAuth } from "@/src/stores/auth";
import removeMd from "remove-markdown";
import { LuRepeat2 } from "react-icons/lu";
import { Schemas } from "@/src/lib/lemmy/adapters/adapter";

function Notice({ children }: { children: React.ReactNode }) {
  return <i className="text-muted-foreground text-sm pt-3">{children}</i>;
}

export function getPostProps(
  postView: Schemas.Post,
  config?: {
    featuredContext?: "community" | "home";
    adminApIds?: string[];
    modApIds?: string[];
    detailView?: boolean;
  },
) {
  const { featuredContext, modApIds, adminApIds } = config ?? {};

  const embed = getPostEmbed(
    postView,
    config?.detailView ? "full-resolution" : "optimized",
  );

  const aspectRatio = postView.thumbnailAspectRatio;

  const myVote = postView?.optimisticMyVote ?? postView?.myVote ?? 0;
  const diff =
    typeof postView?.optimisticMyVote === "number"
      ? postView?.optimisticMyVote - (postView?.myVote ?? 0)
      : 0;
  const score = postView.upvotes - postView.downvotes + diff;

  let pinned = false;
  if (featuredContext === "community") {
    pinned = postView.optimisticFeaturedCommunity ?? postView.featuredCommunity;
  }
  if (featuredContext === "home") {
    pinned = postView.featuredLocal;
  }

  const crossPosts = postView.crossPosts?.map((cp) => ({
    encodedApId: encodeApId(cp.apId),
    communitySlug: cp.communitySlug,
  }));

  let url = postView.url;
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
    isMod: modApIds?.includes(postView.creatorApId),
    isAdmin: adminApIds?.includes(postView.creatorApId),
    id: postView.id,
    apId: postView.apId,
    encodedApId: encodeApId(postView.apId),
    read: postView.optimisticRead ?? postView.read,
    deleted: postView.optimisticDeleted ?? postView.deleted,
    name: postView.title,
    url,
    displayUrl,
    aspectRatio,
    myVote,
    score,
    pinned,
    featuredCommunity:
      postView.optimisticFeaturedCommunity ?? postView.featuredCommunity,
    saved: postView.optimisticSaved ?? postView.saved,
    creatorId: postView.creatorId,
    creatorApId: postView.creatorApId,
    creatorSlug: createSlug({ ap_id: postView.creatorApId }),
    encodedCreatorApId: encodeApId(postView.creator.actor_id),
    creatorName: postView.creator.name,
    communitySlug: postView.community.slug,
    communityIcon: postView.community.icon,
    published: postView.post.published,
    body: postView.post.body,
    nsfw: postView.post.nsfw,
    commentsCount: postView.counts.comments,
    crossPosts,
  };
}

export interface PostProps {
  apId: string;
  detailView?: boolean;
  onNavigate?: () => any;
  featuredContext?: "community" | "home";
}

export function PostCardSkeleton(props: {
  hideImage?: boolean;
  detailView?: boolean;
}) {
  const hideImage = useRef(Math.random()).current < 0.4;
  return (
    <div className="flex-1 pt-4 gap-2 flex flex-col max-md:px-3 pb-4">
      {props.detailView ? (
        <div className="flex flex-row items-center gap-2 h-9">
          <Skeleton className="h-8 w-8 rounded-full" />

          <div className="flex flex-col gap-1">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-2.5 w-44" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2 h-6">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      )}

      <Skeleton className="h-7" />

      {(!hideImage || props.hideImage === false) && (
        <Skeleton className="aspect-video max-md:-mx-3 max-md:rounded-none" />
      )}

      <div className="flex flex-row justify-end gap-2">
        <Skeleton className="h-7 w-10 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>

      <Skeleton className="h-[.5px] w-full rounded-full max-md:-mx-3" />
    </div>
  );
}

export function FeedPostCard(props: PostProps) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore(
    (s) => s.posts[getCachePrefixer()(props.apId)]?.data,
  );

  const [imageLoaded, setImageLoaded] = useState(false);

  const linkCtx = useLinkContext();

  const showNsfw = useSettingsStore((s) => s.setShowNsfw);
  const filterKeywords = useSettingsStore((s) => s.filterKeywords);

  const patchPost = usePostsStore((s) => s.patchPost);

  const handlers = useLongPress(
    async () => {
      if (post?.thumbnailUrl) {
        Haptics.impact({ style: ImpactStyle.Heavy });
        shareImage(post.title, post.thumbnailUrl);
      }
    },
    {
      cancelOnMovement: 15,
      onStart: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      filterEvents: (event) => {
        if ("button" in event) {
          // Ignore mouse right click
          return event.button !== 2;
        }
        return true;
      },
    },
  );

  /* if (nsfw && !showNsfw) { */
  /*   return props.detailView ? <Notice>Hidden due to NSFW</Notice> : null; */
  /* } */

  if (!post) {
    return <PostCardSkeleton />;
  }

  let displayUrl = post.url;
  if (displayUrl) {
    const parsedUrl = new URL(displayUrl);
    displayUrl = `${parsedUrl.host.replace(/^www\./, "")}${parsedUrl.pathname.replace(/\/$/, "")}`;
  }

  const embed = post
    ? getPostEmbed(post, props.detailView ? "full-resolution" : "optimized")
    : null;

  const showImage = embed?.type === "image" && embed.thumbnail && !post.deleted;
  const showArticle = embed?.type === "article" && !post?.deleted;

  const encodedApId = encodeApId(post.apId);

  const featuredCommunity =
    post.optimisticFeaturedCommunity ?? post.featuredCommunity;
  const featuredLocal = post.optimisticFeaturedLocal ?? post.featuredLocal;
  const pinned =
    props.featuredContext === "community"
      ? featuredCommunity
      : props.featuredContext === "home"
        ? featuredLocal
        : false;

  for (const keyword of filterKeywords) {
    if (post?.title.toLowerCase().includes(keyword.toLowerCase())) {
      return props.detailView ? (
        <Notice>Hidden due to keyword filter "{keyword}"</Notice>
      ) : null;
    }
  }

  return (
    <div
      data-testid="post-card"
      className={cn(
        "flex-1 pt-4 gap-2 flex flex-col dark:border-zinc-800 max-md:px-3 overflow-x-hidden",
        props.detailView ? "pb-2" : "border-b pb-4",
      )}
    >
      <PostByline
        post={post}
        pinned={pinned}
        showCreator={props.featuredContext !== "home"}
        showCommunity={props.featuredContext === "home" ? true : false}
      />

      {props.detailView && post.crossPosts && post.crossPosts.length > 0 && (
        <CrossPosts key={post.apId} crossPosts={post.crossPosts} />
      )}

      <Link
        to={`${linkCtx.root}c/:communityName/posts/:post`}
        params={{
          communityName: post.communitySlug,
          post: encodedApId,
        }}
        onClickCapture={props.onNavigate}
        className="gap-2 flex flex-col"
      >
        <span
          className={twMerge(
            "text-xl font-medium",
            !props.detailView && post.read && "text-muted-foreground",
          )}
        >
          {post.deleted ? "deleted" : post.title}
        </span>
        {showImage && (
          <div className="max-md:-mx-3 flex flex-col relative">
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 rounded-none md:rounded-lg" />
            )}
            <img
              src={embed.thumbnail ?? undefined}
              className="md:rounded-lg object-cover relative"
              onLoad={(e) => {
                setImageLoaded(true);
                if (!post.thumbnailAspectRatio) {
                  patchPost(post.apId, getCachePrefixer(), {
                    thumbnailAspectRatio:
                      e.currentTarget.naturalWidth /
                      e.currentTarget.naturalHeight,
                  });
                }
              }}
              style={{
                aspectRatio: post.thumbnailAspectRatio ?? undefined,
              }}
              {...handlers()}
            />
          </div>
        )}
        {!props.detailView &&
          post.body &&
          !post.deleted &&
          embed?.type === "text" && (
            <p
              className={cn(
                "text-sm line-clamp-3 leading-relaxed",
                post.read && "text-muted-foreground",
              )}
            >
              {removeMd(post.body)}
            </p>
          )}
      </Link>

      {showArticle && (
        <PostArticleEmbed
          name={post.title}
          url={showArticle ? post.url : undefined}
          displayUrl={showArticle ? displayUrl : undefined}
          thumbnail={showArticle ? embed.thumbnail : null}
        />
      )}

      {embed?.type === "video" && !post.deleted && post.url && (
        <PostVideoEmbed url={post.url} autoPlay={props.detailView} />
      )}
      {embed?.type === "loops" && !post.deleted && post.url && (
        <PostLoopsEmbed
          url={post.url}
          thumbnail={embed.thumbnail}
          autoPlay={props.detailView}
        />
      )}
      {embed?.type === "youtube" && !post.deleted && (
        <YouTubeVideoEmbed url={post.url} />
      )}

      {props.detailView && post.body && !post.deleted && (
        <MarkdownRenderer markdown={post.body} className="pt-2" />
      )}
      {!props.detailView && (
        <div className="flex flex-row items-center justify-end gap-1">
          <PostCommentsButton
            commentsCount={post.commentsCount}
            communityName={post.communitySlug}
            postApId={encodedApId}
          />
          <Voting
            apId={post.apId}
            score={post.upvotes - post.downvotes}
            myVote={post.myVote ?? 0}
            className="-mr-2.5"
          />
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
  const score = postView.upvotes - postView.downvotes + diff;

  const myVote = postView?.optimisticMyVote ?? postView?.myVote ?? 0;

  return (
    <div className="py-1 md:py-2 flex flex-row items-center gap-1 bg-background border-b-[.5px] max-md:px-3">
      <CommentSortSelect className="-ml-2.5" />
      <div className="flex-1" />
      <PostCommentsButton commentsCount={commentsCount} onClick={onReply} />
      <Voting apId={apId} score={score} myVote={myVote} className="-mr-2.5" />
    </div>
  );
}

function CrossPosts({
  crossPosts,
}: {
  crossPosts: Schemas.Post["crossPosts"];
}) {
  const linkCtx = useLinkContext();
  return (
    <span className="text-brand text-sm flex flex-row items-center gap-x-2 gap-y-1 flex-wrap">
      <LuRepeat2 />
      {crossPosts?.map(({ apId, communitySlug }) => (
        <Link
          key={apId}
          to={`${linkCtx.root}c/:communityName/posts/:post`}
          params={{
            post: encodeApId(apId),
            communityName: communitySlug,
          }}
          className="hover:underline line-clamp-1"
        >
          {communitySlug}
        </Link>
      ))}
    </span>
  );
}
