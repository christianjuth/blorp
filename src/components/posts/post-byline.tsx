import {
  useBlockPerson,
  useDeletePost,
  useSavePost,
} from "@/src/lib/lemmy/index";
import { useLinkContext } from "../nav/link-context";
import { useRequireAuth } from "../auth-context";
import { useShowPostReportModal } from "./post-report";
import { useAuth } from "@/src/stores/auth";
import { openUrl } from "@/src/lib/linking";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RelativeTime } from "../relative-time";
import { ActionMenu, ActionMenuProps } from "../action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { BsFillPinAngleFill } from "react-icons/bs";
import { useIonAlert } from "@ionic/react";
import { Deferred } from "@/src/lib/deferred";
import { Slug } from "@/src/lib/lemmy/utils";
import { CommunityHoverCard } from "../communities/community-hover-card";
import { PersonHoverCard } from "../person/person-hover-card";
import { toast } from "sonner";
import { Share } from "@capacitor/share";
import { FaBookmark } from "react-icons/fa";

export function PostByline({
  id,
  apId,
  encodedApId,
  pinned,
  saved,
  deleted,
  creatorId,
  creatorApId,
  creatorSlug,
  encodedCreatorApId,
  creatorName,
  creatorAvatar,
  communitySlug,
  published,
  onNavigate,
}: {
  id: number;
  apId: string;
  encodedApId: string;
  pinned: boolean;
  saved: boolean;
  deleted: boolean;
  creatorId: number;
  creatorApId: string;
  creatorSlug: Slug | null;
  creatorAvatar?: string;
  encodedCreatorApId: string;
  creatorName: string;
  communitySlug: string;
  published: string;
  onNavigate?: () => any;
}) {
  const [alrt] = useIonAlert();

  const showReportModal = useShowPostReportModal();
  const requireAuth = useRequireAuth();
  const blockPerson = useBlockPerson();
  const deletePost = useDeletePost(apId);
  const savePost = useSavePost(apId);

  const linkCtx = useLinkContext();

  const myUserId = useAuth(
    (s) =>
      s.getSelectedAccount().site?.my_user?.local_user_view.person.actor_id,
  );
  const isMyPost = creatorApId === myUserId;

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      {
        text: "Share",
        onClick: () =>
          Share.share({
            url: `https://blorpblorp.xyz/c/${communitySlug}/posts/${encodedApId}`,
          }),
      },
      {
        text: saved ? "Unsave" : "Save",
        onClick: () =>
          requireAuth().then(() => {
            savePost
              .mutateAsync({
                post_id: id,
                save: !saved,
              })
              .then(() => {
                toast.success(saved ? "Unsaved post" : "Saved post");
              });
          }),
      },
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

  return (
    <div className="flex flex-row items-center gap-2 h-9">
      <Avatar className="h-8 w-8">
        <AvatarImage src={creatorAvatar} />
        <AvatarFallback>
          {creatorName?.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5">
        <CommunityHoverCard communityName={communitySlug}>
          <Link
            to={`${linkCtx.root}c/${communitySlug}`}
            className="text-xs"
            onClickCapture={onNavigate}
          >
            {communityName}
            <span className="text-muted-foreground italic">
              @{communityHost}
            </span>
          </Link>
        </CommunityHoverCard>
        <div className="flex flex-row text-xs text-muted-foreground gap-1">
          <PersonHoverCard actorId={creatorApId}>
            <Link
              to={`${linkCtx.root}u/${encodedCreatorApId}`}
              onClickCapture={onNavigate}
            >
              {creatorSlug?.name}
              <span className="italic">@{creatorSlug?.host}</span>
            </Link>
          </PersonHoverCard>
          <RelativeTime prefix=" • " time={published} />
        </div>
      </div>

      <div className="flex-1" />

      {saved && <FaBookmark className="text-lg text-brand" />}
      {pinned && <BsFillPinAngleFill className="text-xl text-[#17B169]" />}

      <ActionMenu
        align="end"
        actions={actions}
        trigger={<IoEllipsisHorizontal className="text-muted-foreground" />}
        onOpen={() => setOpenSignal((s) => s + 1)}
      />
    </div>
  );
}
