import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { LuCakeSlice } from "react-icons/lu";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { MarkdownRenderer } from "../markdown/renderer";
import { ActionMenu, ActionMenuProps } from "../adaptable/action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useMemo, useState } from "react";
import { useLinkContext } from "../../routing/link-context";
import { encodeApId } from "@/src/lib/api/utils";
import { openUrl } from "@/src/lib/linking";
import { Deferred } from "@/src/lib/deferred";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { useRequireAuth } from "../auth-context";
import { useBlockPerson } from "@/src/lib/api";
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
import { Schemas } from "@/src/lib/api/adapters/api-blueprint";
import { useTagUser, useTagUserStore } from "@/src/stores/user-tags";
import { Badge } from "../ui/badge";

dayjs.extend(localizedFormat);

export function PersonSidebar({ person }: { person?: Schemas.Person }) {
  const [alrt] = useIonAlert();

  const router = useIonRouter();
  const myUserId = useAuth((s) => getAccountActorId(s.getSelectedAccount()));

  const linkCtx = useLinkContext();

  const requireAuth = useRequireAuth();

  const slug = person ? person.slug : undefined;

  const blockPerson = useBlockPerson();

  const open = useSidebarStore((s) => s.personBioExpanded);
  const setOpen = useSidebarStore((s) => s.setPersonBioExpanded);

  const tag = useTagUserStore((s) =>
    person ? s.userTags[person.slug] : undefined,
  );
  const tagUser = useTagUser();

  const [openSignal, setOpenSignal] = useState(0);
  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      ...(person
        ? [
            {
              text: "Message user",
              onClick: () =>
                router.push(
                  resolveRoute("/messages/chat/:userId", {
                    userId: encodeApId(person?.apId),
                  }),
                ),
            },
            {
              text: "Share user",
              onClick: () =>
                shareRoute(
                  resolveRoute(`${linkCtx.root}u/:userId`, {
                    userId: encodeApId(person?.apId),
                  }),
                ),
            },
            {
              text: "Tag user",
              onClick: async () => {
                tagUser(person.slug, tag);
              },
            },
            {
              text: "View user source",
              onClick: async () => {
                try {
                  openUrl(person.apId);
                } catch {
                  // TODO: handle error
                }
              },
            },
          ]
        : []),
      ...(person && person.apId !== myUserId
        ? [
            {
              text: "Block user",
              onClick: async () => {
                try {
                  await requireAuth();
                  const deferred = new Deferred();
                  alrt({
                    message: `Block ${slug ?? "person"}`,
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
                    personId: person?.id,
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

  const [name, host] = person ? person.slug.split("@") : [];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-row items-start justify-between flex-1">
            <Avatar className="h-13 w-13">
              <AvatarImage
                src={person?.avatar ?? undefined}
                className="object-cover"
              />
              <AvatarFallback className="text-xl">
                {person?.slug?.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <ActionMenu
              header="User"
              align="end"
              actions={actions}
              trigger={
                <IoEllipsisHorizontal className="text-muted-foreground mt-0.5" />
              }
              onOpen={() => setOpenSignal((s) => s + 1)}
            />
          </div>

          <span className="flex items-center text-ellipsis overflow-hidden">
            <b>{name}</b>
            {tag ? (
              <Badge size="sm" variant="brand" className="ml-2">
                {tag}
              </Badge>
            ) : (
              <i className="text-muted-foreground">@{host}</i>
            )}
          </span>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LuCakeSlice />
            <span>
              Created {person ? dayjs(person.createdAt).format("ll") : ""}
            </span>
          </div>

          <AggregateBadges
            className="mt-1"
            aggregates={{
              Posts: person?.postCount,
              Comments: person?.commentCount,
            }}
          />
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
                <MarkdownRenderer markdown={person.bio} dim className="mt-3" />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
