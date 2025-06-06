import { useBlockCommunity, useCommunity } from "@/src/lib/lemmy/index";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { MarkdownRenderer } from "../markdown/renderer";
import { CommunityJoinButton } from "./community-join-button";
import { useLinkContext } from "../../routing/link-context";
import { useCommunitiesStore } from "@/src/stores/communities";
import { LuCakeSlice } from "react-icons/lu";
import { Link, resolveRoute } from "@/src/routing/index";
import { useAuth } from "@/src/stores/auth";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { openUrl } from "@/src/lib/linking";
import { useMemo, useState } from "react";
import { useCommunityCreatePost } from "./community-create-post";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { PersonCard } from "../person/person-card";
import { shareRoute } from "@/src/lib/share";
import { Sidebar, SidebarContent } from "../sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Separator } from "../ui/separator";
import { useSidebarStore } from "@/src/stores/sidebars";
import { cn } from "@/src/lib/utils";
import { AggregateBadges } from "../aggregates";
import { useConfirmationAlert } from "@/src/lib/hooks/index";

dayjs.extend(localizedFormat);

export function SmallScreenSidebar({
  communityName,
  actorId,
  expanded,
}: {
  communityName: string;
  actorId?: string;
  expanded?: boolean;
}) {
  const getConfirmation = useConfirmationAlert();
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

  const blockCommunity = useBlockCommunity();

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
      ...(isLoggedIn
        ? [
            {
              text: "Block community",
              danger: true,
              onClick: () =>
                getConfirmation({
                  message: `Block ${communityName}`,
                }).then(() =>
                  blockCommunity.mutate({
                    community_id: community.id,
                    block: true,
                  }),
                ),
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
    <div>
      <div
        className={cn(
          "flex flex-col gap-3 py-4 flex-1 px-3",
          !expanded && "md:hidden",
        )}
      >
        <div className="flex flex-row items-center flex-1 -mb-1 gap-4">
          <span className="font-bold">{community.title}</span>

          <div className="flex-1" />

          <CommunityJoinButton communityName={communityName} />

          <ActionMenu
            header="Community"
            align="end"
            actions={actions}
            trigger={<IoEllipsisHorizontal className="text-muted-foreground" />}
            onOpen={() => setOpenSignal((s) => s + 1)}
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <LuCakeSlice />
          <span>Created {dayjs(community.published).format("ll")}</span>
        </div>

        {counts && (
          <AggregateBadges
            className="mt-1"
            aggregates={{
              ...(expanded
                ? {
                    "users / day": counts.users_active_day,
                    "users / week": counts.users_active_week,
                    "users / month": counts.users_active_month,
                    "users / 6 months": counts.users_active_half_year,
                    "Local subscribers": counts.subscribers_local,
                  }
                : {}),
              Subscribers: counts.subscribers,
              Posts: counts.posts,
              Comments: counts.comments,
            }}
          />
        )}

        {!expanded && (
          <Link
            to={`${linkCtx.root}c/:communityName/sidebar`}
            params={{
              communityName,
            }}
            className="text-brand"
          >
            Show more
          </Link>
        )}
      </div>

      <Separator className={cn(!expanded && "md:hidden")} />

      {expanded && (
        <>
          <section className="p-3">
            <h2>ABOUT</h2>
            {community.description && (
              <MarkdownRenderer
                markdown={community.description}
                dim
                className="pt-3"
              />
            )}
          </section>

          <Separator />

          <section className="p-3 flex flex-col gap-2">
            <h2>MODS</h2>
            {data.mods?.map((m) => (
              <PersonCard
                key={m.moderator.actor_id}
                actorId={m.moderator.actor_id}
                size="sm"
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export function CommunitySidebar({
  communityName,
  actorId,
  hideDescription = false,
}: {
  communityName: string;
  actorId: string | undefined;
  hideDescription?: boolean;
  asPage?: boolean;
}) {
  const getConfirmation = useConfirmationAlert();

  useCommunity({
    name: communityName,
  });

  const linkCtx = useLinkContext();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const data = useCommunitiesStore(
    (s) => s.communities[getCachePrefixer()(communityName)]?.data,
  );

  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const aboutOpen = useSidebarStore((s) => s.communityAboutExpanded);
  const setAboutOpen = useSidebarStore((s) => s.setCommunityAboutExpanded);

  const modsOpen = useSidebarStore((s) => s.communityModsExpanded);
  const setModsOpen = useSidebarStore((s) => s.setCommunityModsExpanded);

  const createPost = useCommunityCreatePost({
    communityName,
  });

  const blockCommunity = useBlockCommunity();

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
      ...(isLoggedIn
        ? [
            {
              text: "Block community",
              danger: true,
              onClick: () =>
                getConfirmation({
                  message: `Block ${communityName}`,
                }).then(() =>
                  blockCommunity.mutate({
                    community_id: community.id,
                    block: true,
                  }),
                ),
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
    <Sidebar>
      <SidebarContent>
        <div className="p-4 flex flex-col gap-3">
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
        </div>

        <Separator />

        {community.description && (
          <Collapsible
            className="p-4"
            open={aboutOpen}
            onOpenChange={setAboutOpen}
          >
            <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
              <span>ABOUT</span>
              <ChevronsUpDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="py-1">
              {community.description && !hideDescription && (
                <MarkdownRenderer
                  markdown={community.description}
                  dim
                  className="pt-3"
                />
              )}

              {counts && (
                <AggregateBadges
                  className="mt-4"
                  aggregates={{
                    "users / day": counts.users_active_day,
                    "users / week": counts.users_active_week,
                    "users / month": counts.users_active_month,
                    "users / 6 months": counts.users_active_half_year,
                    "Local subscribers": counts.subscribers_local,
                    Subscribers: counts.subscribers,
                    Posts: counts.posts,
                    Comments: counts.comments,
                  }}
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator />

        <Collapsible className="p-4" open={modsOpen} onOpenChange={setModsOpen}>
          <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
            <span>MODS</span>
            <ChevronsUpDown className="h-4 w-4" />
          </CollapsibleTrigger>

          <CollapsibleContent className="flex flex-col gap-2 pt-3">
            {data.mods?.map((m) => (
              <PersonCard
                key={m.moderator.actor_id}
                actorId={m.moderator.actor_id}
                size="sm"
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
