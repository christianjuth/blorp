import {
  useBlockPerson,
  useDeletePost,
  useFeaturePost,
  useSavePost,
} from "@/src/lib/lemmy/index";
import { useLinkContext } from "../../routing/link-context";
import { useRequireAuth } from "../auth-context";
import { useShowPostReportModal } from "./post-report";
import { useAuth, getAccountActorId } from "@/src/stores/auth";
import { openUrl } from "@/src/lib/linking";
import { useMemo, useState } from "react";
import { Link, resolveRoute } from "@/src/routing/index";
import { RelativeTime } from "../relative-time";
import { ActionMenu, ActionMenuProps } from "../action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { BsFillPinAngleFill } from "react-icons/bs";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { Deferred } from "@/src/lib/deferred";
import { Slug } from "@/src/lib/lemmy/utils";
import { CommunityHoverCard } from "../communities/community-hover-card";
import { PersonHoverCard } from "../person/person-hover-card";
import { Share } from "@capacitor/share";
import { FaBookmark } from "react-icons/fa";
import { Badge } from "@/src/components/ui/badge";
import { postToDraft, useCreatePostStore } from "@/src/stores/create-post";
import { usePostsStore } from "@/src/stores/posts";
import { cn } from "@/src/lib/utils";
import { shareRoute } from "@/src/lib/share";

export function PostByline({
  id,
  apId,
  encodedApId,
  pinned,
  featuredCommunity,
  saved,
  deleted,
  creatorId,
  creatorApId,
  creatorSlug,
  encodedCreatorApId,
  creatorName,
  communitySlug,
  communityIcon,
  published,
  onNavigate,
  isMod,
  detailView,
}: {
  id: number;
  apId: string;
  encodedApId: string;
  pinned: boolean;
  featuredCommunity: boolean;
  saved: boolean;
  deleted: boolean;
  creatorId: number;
  creatorApId: string;
  creatorSlug: Slug | null;
  encodedCreatorApId: string;
  creatorName: string;
  communitySlug: string;
  communityIcon?: string;
  published: string;
  onNavigate?: () => any;
  isMod?: boolean;
  detailView?: boolean;
}) {
  const [alrt] = useIonAlert();

  const showReportModal = useShowPostReportModal();
  const requireAuth = useRequireAuth();
  const blockPerson = useBlockPerson();
  const deletePost = useDeletePost(apId);
  const featurePost = useFeaturePost(apId);
  const savePost = useSavePost(apId);

  const router = useIonRouter();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) => s.posts[getCachePrefixer()(apId)]?.data);
  const updateDraft = useCreatePostStore((s) => s.updateDraft);

  const linkCtx = useLinkContext();

  const myUserId = useAuth((s) => getAccountActorId(s.getSelectedAccount()));
  const isMyPost = creatorApId === myUserId;

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      {
        text: "Share",
        onClick: () =>
          shareRoute(
            resolveRoute(`${linkCtx.root}c/:communityName/posts/:post`, {
              communityName: communitySlug,
              post: encodedApId,
            }),
          ),
      },
      {
        text: saved ? "Unsave" : "Save",
        onClick: () =>
          requireAuth().then(() => {
            savePost.mutateAsync({
              post_id: id,
              save: !saved,
            });
          }),
      },
      ...(isMyPost && isMod
        ? [
            {
              text: featuredCommunity
                ? "Unpin in community"
                : "Pin in community",
              onClick: () =>
                featurePost.mutate({
                  feature_type: "Community",
                  post_id: id,
                  featured: !featuredCommunity,
                }),
            },
          ]
        : []),
      {
        text: "View source",
        onClick: async () => {
          try {
            openUrl(apId);
          } catch {
            // TODO: handle error
          }
        },
      },
      ...(isMyPost
        ? [
            {
              text: "Edit",
              onClick: () => {
                if (post && communityName) {
                  updateDraft(apId, postToDraft(post));
                  router.push(`/create?id=${encodedApId}`);
                }
              },
            },
            {
              text: deleted ? "Restore" : "Delete",
              onClick: () =>
                deletePost.mutate({
                  post_id: id,
                  deleted: !deleted,
                }),
              danger: true,
            },
          ]
        : [
            {
              text: "Report",
              onClick: () =>
                requireAuth().then(() => {
                  showReportModal(apId);
                }),
              danger: true,
            },
            {
              text: "Block person",
              onClick: async () => {
                try {
                  await requireAuth();
                  const deferred = new Deferred();
                  alrt({
                    message: `Block ${creatorName}`,
                    buttons: [
                      {
                        text: "Cancel",
                        role: "cancel",
                        handler: () => deferred.reject(),
                      },
                      {
                        text: "OK",
                        role: "confirm",
                        handler: () => deferred.resolve(),
                      },
                    ],
                  });
                  await deferred.promise;
                  blockPerson.mutate({
                    person_id: creatorId,
                    block: true,
                  });
                } catch {}
              },
              danger: true,
            },
          ]),
    ],
    [openSignal],
  );

  const [communityName, communityHost] = communitySlug.split("@");

  const community = (
    <>
      <span className="font-medium text-foreground">c/{communityName}</span>
      <i>@{communityHost}</i>
      <RelativeTime prefix=" • " time={published} />
    </>
  );

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 h-6",
        detailView && "h-9",
      )}
    >
      <Avatar
        className={cn("h-6 w-6 text-xs", detailView && "text-md h-8 w-8")}
      >
        <AvatarImage src={communityIcon} className="object-cover" />
        <AvatarFallback>
          {communityName?.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col text-muted-foreground">
        <CommunityHoverCard communityName={communitySlug}>
          {communityName ? (
            <Link
              to={`${linkCtx.root}c/:communityName`}
              params={{
                communityName: communitySlug,
              }}
              className="text-xs"
              onClickCapture={onNavigate}
            >
              {community}
            </Link>
          ) : (
            <div className="text-xs">{community}</div>
          )}
        </CommunityHoverCard>
        {detailView && (
          <div className="flex flex-row text-xs text-muted-foreground gap-1 items-center h-5">
            <PersonHoverCard actorId={creatorApId}>
              <Link
                to={`${linkCtx.root}u/:userId`}
                params={{
                  userId: encodedCreatorApId,
                }}
                onClickCapture={onNavigate}
              >
                {creatorSlug?.name}
                <i>@{creatorSlug?.host}</i>
              </Link>
            </PersonHoverCard>
            {isMod && <Badge>Mod</Badge>}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {saved && <FaBookmark className="text-lg text-brand" />}
      {pinned && <BsFillPinAngleFill className="text-xl text-[#17B169]" />}

      <ActionMenu
        header="Post"
        align="end"
        actions={actions}
        trigger={<IoEllipsisHorizontal className="text-muted-foreground" />}
        onOpen={() => setOpenSignal((s) => s + 1)}
      />
    </div>
  );
}
