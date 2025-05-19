import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { LuCakeSlice } from "react-icons/lu";
import type { Person, PersonAggregates } from "lemmy-js-client";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { MarkdownRenderer } from "../markdown/renderer";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useMemo, useState } from "react";
import { useLinkContext } from "../../routing/link-context";
import { createSlug, encodeApId } from "@/src/lib/lemmy/utils";
import { openUrl } from "@/src/lib/linking";
import { Deferred } from "@/src/lib/deferred";
import { useIonAlert } from "@ionic/react";
import { useRequireAuth } from "../auth-context";
import { useBlockPerson } from "@/src/lib/lemmy";
import { getAccountActorId, useAuth } from "@/src/stores/auth";
import { shareRoute } from "@/src/lib/share";
import { resolveRoute } from "../../routing/index";
import { Sidebar, SidebarContent } from "../sidebar";
import { Separator } from "../ui/separator";
import { Collapsible } from "../ui/collapsible";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronsUpDown } from "lucide-react";
import { useSidebarStore } from "@/src/stores/sidebars";
import { AggregateBadges } from "../aggregates";

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

  const open = useSidebarStore((s) => s.personBioExpanded);
  const setOpen = useSidebarStore((s) => s.setPersonBioExpanded);

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      ...(person
        ? [
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
    <Sidebar>
      <SidebarContent>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-row items-start justify-between flex-1">
            <Avatar className="h-13 w-13">
              <AvatarImage src={person?.avatar} className="object-cover" />
              <AvatarFallback className="text-xl">
                {person?.name?.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <ActionMenu
              header="User actions"
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
              {personView
                ? dayjs(personView.person.published).format("ll")
                : ""}
            </span>
          </div>

          {counts && (
            <AggregateBadges
              className="mt-1"
              aggregates={{
                Posts: counts.post_count,
                Comments: counts.comment_count,
              }}
            />
          )}
        </div>

        {person?.bio && (
          <>
            <Separator />
            <Collapsible className="p-4" open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
                <span>BIO</span>
                <ChevronsUpDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <MarkdownRenderer
                  markdown={person.bio}
                  className="text-muted-foreground mt-3"
                />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
