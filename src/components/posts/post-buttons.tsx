import { useLikePost } from "@/src/lib/api/index";
import { voteHaptics } from "@/src/lib/voting";
import { useRequireAuth } from "../auth-context";

import { Link, resolveRoute } from "@/src/routing/index";

import {
  PiArrowFatUpBold,
  PiArrowFatDownBold,
  PiArrowFatDownFill,
  PiArrowFatUpFill,
} from "react-icons/pi";
import { TbMessageCircle, TbMessageCirclePlus } from "react-icons/tb";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";
import { useId, useMemo } from "react";
import { abbriviateNumber } from "@/src/lib/format";
import { useLinkContext } from "../../routing/link-context";
import { getAccountSite, useAuth } from "@/src/stores/auth";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { Share } from "../icons";
import { usePostsStore } from "@/src/stores/posts";
import {
  copyRouteToClipboard,
  shareImage,
  shareRoute,
  useCanShare,
} from "@/src/lib/share";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { encodeApId } from "@/src/lib/api/utils";
import { getPostEmbed } from "@/src/lib/post";
import { isWeb } from "@/src/lib/device";

export function Voting({
  apId,
  myVote,
  score,
  className,
}: {
  apId: string;
  myVote: number;
  score: number;
  className?: string;
}) {
  const enableDownvotes =
    useAuth(
      (s) => getAccountSite(s.getSelectedAccount())?.enablePostDownvotes,
    ) ?? true;

  const id = useId();
  const requireAuth = useRequireAuth();

  const vote = useLikePost(apId);

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  if (!enableDownvotes) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        className={cn("text-md font-normal", isUpvoted && "text-brand")}
      >
        {isUpvoted ? <FaHeart /> : <FaRegHeart />}
        {abbriviateNumber(score)}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-row items-center border rounded-full",
        className,
      )}
    >
      <Button
        id={id}
        size="icon"
        variant="ghost"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-brand hover:bg-brand/10",
          "flex items-center space-x-1 text-left",
          isUpvoted && "text-brand",
        )}
      >
        {isUpvoted ? (
          <PiArrowFatUpFill className="scale-115" />
        ) : (
          <PiArrowFatUpBold className="scale-115" />
        )}
      </Button>
      <label
        htmlFor={id}
        className={cn(
          "-mx-px cursor-pointer text-md",
          isUpvoted && "text-brand",
          isDownvoted && "text-brand-secondary",
        )}
      >
        {abbriviateNumber(score)}
      </label>
      <Button
        size="icon"
        variant="ghost"
        onClick={async () => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-brand-secondary hover:bg-brand-secondary/10",
          isDownvoted && "text-brand-secondary",
        )}
      >
        {isDownvoted ? (
          <PiArrowFatDownFill className="scale-115" />
        ) : (
          <PiArrowFatDownBold className="scale-115" />
        )}
      </Button>
    </div>
  );
}

export function PostCommentsButton({
  communityName,
  postApId,
  commentsCount,
}: {
  communityName: string;
  postApId: string;
  commentsCount: number;
}): React.ReactNode;
export function PostCommentsButton({
  onClick,
  commentsCount,
}: {
  onClick?: () => void;
  commentsCount: number;
}): React.ReactNode;
export function PostCommentsButton({
  communityName,
  postApId,
  commentsCount,
  onClick,
}: {
  communityName?: string;
  postApId?: string;
  commentsCount: number;
  onClick?: () => void;
}): React.ReactNode {
  const linkCtx = useLinkContext();
  if (!onClick && communityName && postApId) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-md font-normal"
        asChild
      >
        <Link
          to={`${linkCtx.root}c/:communityName/posts/:post`}
          params={{
            communityName,
            post: postApId,
          }}
        >
          <TbMessageCircle className="scale-115" />
          <span>{abbriviateNumber(commentsCount)}</span>
        </Link>
      </Button>
    );
  }
  if (onClick) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onClick}
        className="text-md font-normal"
      >
        <TbMessageCirclePlus className="scale-115" />
        {commentsCount}
      </Button>
    );
  }
  return null;
}

export function PostShareButton({
  postApId,
}: {
  postApId: string;
}): React.ReactNode {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore(
    (s) => s.posts[getCachePrefixer()(postApId)]?.data,
  );

  const embed = post ? getPostEmbed(post, "full-resolution") : null;

  const linkCtx = useLinkContext();

  const canShare = useCanShare();

  const actions: ActionMenuProps<string>["actions"] = useMemo(() => {
    if (post) {
      const route = resolveRoute(
        `${linkCtx.root}c/:communityName/posts/:post`,
        {
          communityName: post.communitySlug,
          post: encodeApId(post.apId),
        },
      );

      const thumbnailUrl = embed?.thumbnail;
      return [
        ...(canShare
          ? [
              {
                text: "Share link to post",
                onClick: () => shareRoute(route),
              },
            ]
          : []),
        {
          text: "Copy link to post",
          onClick: () => copyRouteToClipboard(route),
        },
        ...(thumbnailUrl && embed.type === "image" && !isWeb()
          ? [
              {
                text: "Share image",
                onClick: () => shareImage(post.title, thumbnailUrl),
              },
            ]
          : []),
      ];
    }

    return [];
  }, [post, canShare]);

  return (
    <ActionMenu
      align="start"
      header="Share"
      actions={actions}
      trigger={
        <Button
          size="sm"
          variant="outline"
          //onClick={() => {
          //  if (post && post.thumbnailUrl) {
          //    shareImage(post.title, post.thumbnailUrl);
          //  }
          //}}
          className="text-md font-normal"
          asChild
        >
          <div>
            <Share className="scale-110" />
            Share
          </div>
        </Button>
      }
    />
  );
}
