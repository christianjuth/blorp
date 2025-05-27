import type { Person } from "lemmy-js-client";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useMemo, useState } from "react";
import { useLinkContext } from "../../routing/link-context";
import { createSlug, encodeApId } from "@/src/lib/lemmy/utils";
import { openUrl } from "@/src/lib/linking";
import { Deferred } from "@/src/lib/deferred";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { useRequireAuth } from "../auth-context";
import { useBlockPerson } from "@/src/lib/lemmy";
import { getAccountActorId, useAuth } from "@/src/stores/auth";
import { shareRoute } from "@/src/lib/share";
import { resolveRoute } from "../../routing/index";

dayjs.extend(localizedFormat);

export function PersonActionMenu({ person }: { person?: Person }) {
  const [alrt] = useIonAlert();

  const router = useIonRouter();
  const myUserId = useAuth((s) => getAccountActorId(s.getSelectedAccount()));

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
              text: "Message",
              onClick: () =>
                router.push(
                  resolveRoute("/messages/chat/:userId", {
                    userId: encodeApId(person?.actor_id),
                  }),
                ),
            },
            {
              text: "Share",
              onClick: () =>
                shareRoute(
                  resolveRoute(`${linkCtx.root}u/:userId`, {
                    userId: encodeApId(person?.actor_id),
                  }),
                ),
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
    <ActionMenu
      header="User actions"
      align="end"
      actions={actions}
      trigger={
        <IoEllipsisHorizontal className="text-muted-foreground mt-0.5" />
      }
      onOpen={() => setOpenSignal((s) => s + 1)}
    />
  );
}
