import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { LuCakeSlice } from "react-icons/lu";
import { abbriviateNumber } from "@/src/lib/format";
import { Skeleton } from "@/src/components/ui/skeleton";
import type { Person, PersonAggregates } from "lemmy-js-client";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { MarkdownRenderer } from "../markdown/renderer";
import { ActionMenu, ActionMenuProps } from "../action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useMemo, useState } from "react";
import { useLinkContext } from "../nav/link-context";
import { Share } from "@capacitor/share";
import { createSlug, encodeApId } from "@/src/lib/lemmy/utils";
import { openUrl } from "@/src/lib/linking";
import { Deferred } from "@/src/lib/deferred";
import { useIonAlert } from "@ionic/react";
import { useRequireAuth } from "../auth-context";
import { useBlockPerson } from "@/src/lib/lemmy";
import { getAccountActorId, useAuth } from "@/src/stores/auth";

dayjs.extend(localizedFormat);

export function PersonSidebar({
  personView,
}: {
  personView?: {
    person: Person;
    counts?: PersonAggregates;
  };
}) {
  const [alrt] = useIonAlert();

  const myUserId = useAuth((s) => getAccountActorId(s.getSelectedAccount()));
  const person = personView?.person;
  const counts = personView?.counts;

  const linkCtx = useLinkContext();

  const requireAuth = useRequireAuth();

  const slug = person ? createSlug(person) : undefined;

  const blockPerson = useBlockPerson();

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      ...(person
        ? [
            {
              text: "Share",
              onClick: () =>
                Share.share({
                  url: `https://blorpblorp.xyz${linkCtx.root}u/${encodeApId(person?.actor_id)}`,
                }),
            },
            {
              text: "View source",
              onClick: async () => {
                try {
                  openUrl(person.actor_id);
                } catch {
                  // TODO: handle error
                }
              },
            },
          ]
        : []),
      ...(person && person.actor_id !== myUserId
        ? [
            {
              text: "Block person",
              onClick: async () => {
                try {
                  await requireAuth();
                  const deferred = new Deferred();
                  alrt({
                    message: `Block ${slug?.slug ?? "person"}`,
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
                    person_id: person?.id,
                    block: true,
                  });
                } catch {}
              },
              danger: true,
            },
          ]
        : []),
    ],
    [openSignal],
  );

  return (
    <div className="absolute py-4 flex flex-col gap-3 w-full md:pr-4">
      <div className="flex flex-row items-start justify-between flex-1">
        <Avatar className="h-13 w-13">
          <AvatarImage src={person?.avatar} className="object-cover" />
          <AvatarFallback className="text-xl">
            {person?.name?.substring(0, 1).toUpperCase()}
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

      <span className="font-bold">
        {personView?.person.display_name ?? personView?.person.name}
      </span>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <LuCakeSlice />
        <span>
          Created{" "}
          {personView ? dayjs(personView.person.published).format("ll") : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 grid-flow-dense text-sm">
        <span className="font-semibold col-start-1 h-5">
          {counts ? (
            abbriviateNumber(counts.post_count)
          ) : (
            <Skeleton className="w-1/4 h-full" />
          )}
        </span>
        <span className="col-start-1 text-sm text-muted-foreground">Posts</span>

        <span className="font-semibold col-start-2 h-5">
          {counts ? (
            abbriviateNumber(counts.comment_count)
          ) : (
            <Skeleton className="w-1/4 h-full" />
          )}
        </span>
        <span className="col-start-2 text-sm text-muted-foreground">
          Comments
        </span>
      </div>

      {person?.bio && (
        <MarkdownRenderer
          markdown={person.bio}
          className="text-muted-foreground"
        />
      )}
    </div>
  );
}
