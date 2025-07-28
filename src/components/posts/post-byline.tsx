import {
  useBlockPerson,
  useDeletePost,
  useFeaturePost,
  useSavePost,
} from "@/src/lib/api/index";
import { useLinkContext } from "../../routing/link-context";
import { useRequireAuth } from "../auth-context";
import { useShowPostReportModal } from "./post-report";
import { useAuth, getAccountActorId } from "@/src/stores/auth";
import { openUrl } from "@/src/lib/linking";
import { useMemo, useState } from "react";
import { Link } from "@/src/routing/index";
import { RelativeTime } from "../relative-time";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { BsFillPinAngleFill } from "react-icons/bs";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { Deferred } from "@/src/lib/deferred";
import { encodeApId } from "@/src/lib/api/utils";
import { CommunityHoverCard } from "../communities/community-hover-card";
import { PersonHoverCard } from "../person/person-hover-card";
import { FaBookmark } from "react-icons/fa";
import { postToDraft, useCreatePostStore } from "@/src/stores/create-post";
import { Shield, ShieldCheckmark } from "../icons";
import { cn } from "@/src/lib/utils";
import { Schemas } from "@/src/lib/api/adapters/api-blueprint";
import { useProfilesStore } from "@/src/stores/profiles";
import { useCommunitiesStore } from "@/src/stores/communities";
import { CakeDay } from "../cake-day";

export function PostByline({
  post,
  pinned,
  showCommunity,
  showCreator,
  onNavigate,
  isMod = false,
  isAdmin = false,
}: {
  post: Schemas.Post;
  pinned: boolean;
  showCommunity?: boolean;
  showCreator?: boolean;
  onNavigate?: () => void;
  isMod?: boolean;
  isAdmin?: boolean;
}) {
  const [alrt] = useIonAlert();

  const showReportModal = useShowPostReportModal();
  const requireAuth = useRequireAuth();
  const blockPerson = useBlockPerson();
  const deletePost = useDeletePost(post.apId);
  const featurePost = useFeaturePost(post.apId);
  const savePost = useSavePost(post.apId);

  const router = useIonRouter();
  const updateDraft = useCreatePostStore((s) => s.updateDraft);

  const linkCtx = useLinkContext();

  const myUserId = useAuth((s) => getAccountActorId(s.getSelectedAccount()));
  const isMyPost = post.creatorApId === myUserId;

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const creator = useProfilesStore(
    (s) => s.profiles[getCachePrefixer()(post.creatorApId)]?.data,
  );
  const community = useCommunitiesStore(
    (s) => s.communities[getCachePrefixer()(post.communitySlug)]?.data,
  );

  const encodedApId = encodeApId(post.apId);
  const encodedCreatorApId = encodeApId(post.creatorApId);

  const saved = post.optimisticSaved ?? post.saved;

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      {
        text: saved ? "Unsave" : "Save",
        onClick: () =>
          requireAuth().then(() => {
            savePost.mutateAsync({
              postId: post.id,
              save: !saved,
            });
          }),
      },
      ...(isMyPost && isMod
        ? [
            {
              text: post.featuredCommunity
                ? "Unpin in community"
                : "Pin in community",
              onClick: () =>
                featurePost.mutate({
                  featureType: "Community",
                  postId: post.id,
                  featured: !post.featuredCommunity,
                }),
            },
          ]
        : []),
      {
        text: "View source",
        onClick: async () => {
          try {
            openUrl(post.apId);
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
                  updateDraft(post.apId, postToDraft(post));
                  router.push(`/create?id=${encodedApId}`);
                }
              },
            },
            {
              text: post.deleted ? "Restore" : "Delete",
              onClick: () =>
                deletePost.mutate({
                  postId: post.id,
                  deleted: !post.deleted,
                }),
              danger: true,
            },
          ]
        : [
            {
              text: "Report",
              onClick: () =>
                requireAuth().then(() => {
                  showReportModal(post.apId);
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
                    message: `Block ${creator?.slug}`,
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
                    personId: post.creatorId,
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

  const [communityName, communityHost] = post.communitySlug.split("@");
  const [creatorName, creatorHost] = post.creatorSlug.split("@");

  const communityPart = (
    <>
      <span className="font-medium text-foreground">c/{communityName}</span>
      <i>@{communityHost}</i>
      <RelativeTime time={post.createdAt} className="ml-2" />
    </>
  );

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 h-7",
        showCommunity && showCreator && "h-9",
      )}
    >
      <Avatar
        className={cn(
          "h-6 w-6 text-sm",
          showCommunity && showCreator && "h-8 w-8 text-md",
        )}
      >
        <AvatarImage
          src={community?.communityView.icon ?? undefined}
          className="object-cover"
        />
        <AvatarFallback>
          {communityName?.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col text-muted-foreground">
        {showCommunity && (
          <CommunityHoverCard communityName={post.communitySlug}>
            {communityName ? (
              <Link
                to={`${linkCtx.root}c/:communityName`}
                params={{
                  communityName: post.communitySlug,
                }}
                className="text-xs"
                onClickCapture={onNavigate}
              >
                {communityPart}
              </Link>
            ) : (
              <div className="text-xs">{communityPart}</div>
            )}
          </CommunityHoverCard>
        )}
        {showCreator && (
          <div
            className={cn(
              "flex flex-row text-xs text-muted-foreground gap-1 items-center h-5",
              !showCommunity && "text-foreground",
            )}
          >
            <PersonHoverCard actorId={post.creatorApId} asChild>
              <Link
                to={`${linkCtx.root}u/:userId`}
                params={{
                  userId: encodedCreatorApId,
                }}
                onClickCapture={onNavigate}
              >
                {creatorName}
                <i className="text-muted-foreground">@{creatorHost}</i>
              </Link>
            </PersonHoverCard>
            {isMod && !isAdmin && (
              <>
                <Shield className="text-green-500 ml-2 text-base" />
                <span className="text-xs ml-1 text-green-500">MOD</span>
              </>
            )}
            {isAdmin && (
              <>
                <ShieldCheckmark className="text-brand ml-2 text-base" />
                <span className="text-xs ml-1 text-brand">ADMIN</span>
              </>
            )}
            {creator && (
              <CakeDay date={creator.createdAt} className="text-brand" />
            )}
            {!showCommunity && (
              <RelativeTime
                time={post.createdAt}
                className="ml-2 text-muted-foreground"
              />
            )}
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
