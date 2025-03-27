import {
  useBlockPerson,
  useDeletePost,
  useSavePost,
} from "~/src/lib/lemmy/index";
// import { Link } from "one";
import { useLinkContext } from "../nav/link-context";
import { ActionMenu } from "../ui/action-menu";
// import { Ellipsis, Pin } from "@tamagui/lucide-icons";
import { useRequireAuth } from "../auth-context";
// import { useShowPostReportModal } from "./post-report";
import { useAuth } from "~/src/stores/auth";
import { openUrl } from "~/src/lib/linking";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RelativeTime } from "../relative-time";

export function PostByline({
  id,
  encodedApId,
  apId,
  pinned,
  saved,
  deleted,
  creatorId,
  creatorApId,
  encodedCreatorApId,
  creatorName,
  communitySlug,
  published,
}: {
  id: number;
  apId: string;
  encodedApId: string;
  pinned: boolean;
  saved: boolean;
  deleted: boolean;
  creatorId: number;
  creatorApId: string;
  encodedCreatorApId: string;
  creatorName: string;
  communitySlug: string;
  published: string;
}) {
  // const showReportModal = useShowPostReportModal();
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
  const actions = useMemo(
    () => [
      // {
      //   label: "Share",
      //   onClick: () =>
      //     Share.share({
      //       url: `https://blorpblorp.xyz/c/${communitySlug}/posts/${encodedApId}`,
      //     }),
      // },
      {
        label: saved ? "Unsave" : "Save",
        onClick: () =>
          requireAuth().then(() => {
            savePost.mutate({
              post_id: id,
              save: !saved,
            });
          }),
      },
      {
        label: "View source",
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
              label: deleted ? "Restore" : "Delete",
              onClick: () =>
                deletePost.mutate({
                  post_id: id,
                  deleted: !deleted,
                }),
              danger: true,
            },
          ]
        : [
            // {
            //   label: "Report",
            //   onClick: () =>
            //     requireAuth().then(() => {
            //       showReportModal(apId);
            //     }),
            //   danger: true,
            // },
            {
              label: "Block person",
              onClick: async () => {
                try {
                  await requireAuth();
                  // await alrt(`Block ${creatorName}`);
                  blockPerson.mutate({
                    person_id: creatorId,
                    block: true,
                  });
                } catch (err) {}
              },
              danger: true,
            },
          ]),
    ],
    [openSignal],
  );

  return (
    <div className="flex flex-row items-center gap-2">
      <div className="h-8 w-8 bg-zinc-300 dark:bg-zinc-700 flex items-center rounded-full">
        <span className="text-center mx-auto">
          {creatorName?.substring(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col">
        <Link to={`${linkCtx.root}c/${communitySlug}`} className="text-xs">
          c/{communitySlug}
        </Link>
        <div className="flex flex-row text-xs text-muted-foreground">
          <Link to={`${linkCtx.root}u/${encodedCreatorApId}`}>
            u/{creatorName}
          </Link>

          <RelativeTime
            prefix=" • "
            time={published}
            // color="$color11"
            // fontSize="$3"
          />
        </div>
      </div>

      {/* <View flex={1} /> */}

      {/* {pinned && ( */}
      {/*   <Pin fill="#17B169" color="#17B169" size="$1" rotate="45deg" /> */}
      {/* )} */}

      {/* <ActionMenu */}
      {/*   placement="bottom-end" */}
      {/*   actions={actions} */}
      {/*   onOpenChange={() => setOpenSignal((s) => s + 1)} */}
      {/*   trigger={ */}
      {/*     <View p="$2" pr={0}> */}
      {/*       <Ellipsis size={16} /> */}
      {/*     </View> */}
      {/*   } */}
      {/* /> */}
    </div>
  );
}
