import { useCommunity } from "@/src/lib/lemmy/index";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { MarkdownRenderer } from "../markdown/renderer";
import { abbriviateNumber } from "@/src/lib/format";
import { CommunityJoinButton } from "./community-join-button";
import { useLinkContext } from "../../routing/link-context";
import { useCommunitiesStore } from "@/src/stores/communities";
import { LuCakeSlice } from "react-icons/lu";
import { Link, resolveRoute } from "@/src/routing/index";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/src/stores/auth";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { openUrl } from "@/src/lib/linking";
import { useMemo, useState } from "react";
import { useCommunityCreatePost } from "./create-post";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { PersonCard } from "../person/person-card";
import { shareRoute } from "@/src/lib/share";

dayjs.extend(localizedFormat);

export const COMMUNITY_SIDEBAR_WIDTH = 300;

export function CommunitySidebar({
  communityName,
  actorId,
  hideDescription = false,
  asPage,
}: {
  communityName: string;
  actorId: string | undefined;
  hideDescription?: boolean;
  asPage?: boolean;
}) {
  useCommunity({
    name: communityName,
  });

  const linkCtx = useLinkContext();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const data = useCommunitiesStore(
    (s) => s.communities[getCachePrefixer()(communityName)]?.data,
  );

  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const createPost = useCommunityCreatePost({
    communityName,
  });

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      ...(isLoggedIn
        ? [
            {
              text: "Create post",
              onClick: createPost,
            },
          ]
        : []),
      {
        text: "Share",
        onClick: () =>
          shareRoute(
            resolveRoute(`${linkCtx.root}c/:communityName`, {
              communityName,
            }),
          ),
      },
      ...(actorId
        ? [
            {
              text: "View source",
              onClick: async () => {
                try {
                  openUrl(actorId);
                } catch {
                  // TODO: handle error
                }
              },
            },
          ]
        : []),
    ],
    [openSignal],
  );

  if (!data) {
    return null;
  }

  const communityView = data.communityView;
  const community = communityView.community;
  const counts = communityView.counts;

  return (
    <div
      className={cn(
        "gap-3 flex flex-col py-4 md:pr-4",
        asPage
          ? "px-2.5"
          : "absolute inset-x-0 h-[calc(100vh-60px)] overflow-auto",
      )}
    >
      <div className="gap-3 flex flex-col">
        <div className="flex flex-row items-start justify-between flex-1">
          <Avatar className="h-13 w-13">
            <AvatarImage src={community.icon} className="object-cover" />
            <AvatarFallback className="text-xl">
              {communityName.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <ActionMenu
            header="Community"
            align="end"
            actions={actions}
            trigger={
              <IoEllipsisHorizontal className="text-muted-foreground mt-0.5" />
            }
            onOpen={() => setOpenSignal((s) => s + 1)}
          />
        </div>

        <span className="font-bold line-clamp-1">{community.title}</span>

        <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <LuCakeSlice />
          <span>Created {dayjs(community.published).format("ll")}</span>
        </div>

        <div className="grid grid-cols-3 text-sm">
          <span className="font-semibold h-5">
            {counts ? (
              abbriviateNumber(counts.subscribers)
            ) : (
              <Skeleton className="w-2/3 h-full" />
            )}
          </span>
          <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
            Members
          </span>

          <span className="font-semibold h-5">
            {counts ? (
              abbriviateNumber(counts.posts)
            ) : (
              <Skeleton className="w-2/3 h-full" />
            )}
          </span>
          <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
            Posts
          </span>

          <span className="font-semibold h-5">
            {counts ? (
              abbriviateNumber(counts.comments)
            ) : (
              <Skeleton className="w-2/3 h-full" />
            )}
          </span>
          <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
            Comments
          </span>
        </div>

        {community.description && !hideDescription && (
          <MarkdownRenderer
            markdown={community.description}
            className="text-muted-foreground pt-3"
          />
        )}

        <span className="font-bold">Mods</span>

        <div className="flex flex-col gap-2">
          {data.mods?.map((m) => (
            <PersonCard
              key={m.moderator.actor_id}
              actorId={m.moderator.actor_id}
              size="sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SmallScreenSidebar({
  communityName,
  actorId,
}: {
  communityName: string;
  actorId?: string;
}) {
  const linkCtx = useLinkContext();

  useCommunity({
    name: communityName,
  });
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const data = useCommunitiesStore(
    (s) => s.communities[getCachePrefixer()(communityName)]?.data,
  );

  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const createPost = useCommunityCreatePost({
    communityName,
  });

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      ...(isLoggedIn
        ? [
            {
              text: "Create post",
              onClick: createPost,
            },
          ]
        : []),
      {
        text: "Share",
        onClick: () =>
          shareRoute(
            resolveRoute(`${linkCtx.root}c/:communityName`, {
              communityName,
            }),
          ),
      },
      ...(actorId
        ? [
            {
              text: "View source",
              onClick: async () => {
                try {
                  openUrl(actorId);
                } catch {
                  // TODO: handle error
                }
              },
            },
          ]
        : []),
    ],
    [openSignal],
  );

  if (!data) {
    return null;
  }

  const communityView = data.communityView;
  const community = communityView.community;
  const counts = communityView.counts;

  return (
    <div className="md:hidden flex flex-col gap-3 py-4 flex-1 border-b-[.5px] px-2.5">
      <div className="flex flex-row items-center flex-1 -mb-1 gap-4">
        <span className="font-bold">{community.title}</span>

        <div className="flex-1" />

        <ActionMenu
          header="Community"
          align="end"
          actions={actions}
          trigger={<IoEllipsisHorizontal className="text-muted-foreground" />}
          onOpen={() => setOpenSignal((s) => s + 1)}
        />

        <CommunityJoinButton communityName={communityName} />
      </div>

      <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <LuCakeSlice />
        <span>Created {dayjs(community.published).format("ll")}</span>
      </div>

      <div className="grid grid-cols-3 text-sm">
        <span className="font-semibold h-5">
          {counts ? (
            abbriviateNumber(counts.subscribers)
          ) : (
            <Skeleton className="w-2/3 h-full" />
          )}
        </span>
        <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
          Members
        </span>

        <span className="font-semibold h-5">
          {counts ? (
            abbriviateNumber(counts.posts)
          ) : (
            <Skeleton className="w-2/3 h-full" />
          )}
        </span>
        <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
          Posts
        </span>

        <span className="font-semibold h-5">
          {counts ? (
            abbriviateNumber(counts.comments)
          ) : (
            <Skeleton className="w-2/3 h-full" />
          )}
        </span>
        <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
          Comments
        </span>
      </div>

      <Link
        to={`${linkCtx.root}c/:communityName/sidebar`}
        params={{
          communityName,
        }}
        className="text-brand"
      >
        Show more
      </Link>
    </div>
  );
}
