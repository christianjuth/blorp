import _ from "lodash";
import { useAuth } from "@/src/stores/auth";
import { MarkdownRenderer } from "@/src/components/markdown/renderer";
import { Separator } from "@/src/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { PersonCard } from "@/src/components/person/person-card";
import { Sidebar, SidebarContent } from "@/src/components/sidebar";
import { useSidebarStore } from "@/src/stores/sidebars";
import { AggregateBadges } from "../aggregates";
import { PersonHoverCard } from "../person/person-hover-card";

function InstanceSidebar({ asPage }: { asPage?: boolean }) {
  const site = useAuth((s) => s.getSelectedAccount().site);
  const sidebar = site?.site_view.site.sidebar;

  const instance = useAuth((s) => s.getSelectedAccount().instance);

  let instanceHost = "";
  try {
    const url = new URL(instance);
    instanceHost = url.host;
  } catch {}

  const open = useSidebarStore((s) => s.siteAboutExpanded);
  const setOpen = useSidebarStore((s) => s.setSiteAboutExpanded);

  const counts = site?.site_view.counts;

  if (!sidebar) {
    return null;
  }

  if (asPage) {
    return (
      <>
        <section className="p-3 flex flex-col gap-3">
          <h2 className="text-muted-foreground uppercase">
            ABOUT {instanceHost}
          </h2>

          <MarkdownRenderer dim className="text-sm" markdown={sidebar} />

          {counts && (
            <AggregateBadges
              aggregates={{
                "Daily users": counts.users_active_day,
                "Weekly users": counts.users_active_week,
                "Monthly users": counts.users_active_month,
                Posts: counts.posts,
                Users: counts.users,
                Communities: counts.communities,
                Comments: counts.comments,
              }}
            />
          )}
        </section>
        <Separator />
      </>
    );
  }

  return (
    <>
      <Collapsible className="p-3" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
          <span>ABOUT {instanceHost}</span>
          <ChevronsUpDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-5 pb-2">
          <MarkdownRenderer dim markdown={sidebar} />

          {counts && (
            <AggregateBadges
              className="mt-4"
              aggregates={{
                "users / day": counts.users_active_day,
                "users / week": counts.users_active_week,
                "users / month": counts.users_active_month,
                "users / 6 months": counts.users_active_half_year,
                Users: counts.users,
                Communities: counts.communities,
                Posts: counts.posts,
                Comments: counts.comments,
              }}
            />
          )}
        </CollapsibleContent>
      </Collapsible>
      <Separator />
    </>
  );
}

function InstanceAdmins({ asPage }: { asPage?: boolean }) {
  const site = useAuth((s) => s.getSelectedAccount().site);
  const admins = site?.admins;

  const instance = useAuth((s) => s.getSelectedAccount().instance);

  const open = useSidebarStore((s) => s.siteAdminsExpanded);
  const setOpen = useSidebarStore((s) => s.setSiteAdminsExpanded);

  let instanceHost = "";
  try {
    const url = new URL(instance);
    instanceHost = url.host;
  } catch {}

  if (!admins) {
    return null;
  }

  if (asPage) {
    return (
      <section className="p-3 flex flex-col gap-2">
        <span className="text-muted-foreground uppercase">
          {instanceHost} ADMINS
        </span>

        {admins.map(({ person }) => (
          <PersonHoverCard key={person.actor_id} actorId={person.actor_id}>
            <PersonCard actorId={person.actor_id} size="sm" />
          </PersonHoverCard>
        ))}
      </section>
    );
  }

  return (
    <Collapsible className="p-3" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
        <span>{instanceHost} ADMINS</span>
        <ChevronsUpDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 flex flex-col gap-1">
        {admins.map(({ person }) => (
          <PersonHoverCard key={person.actor_id} actorId={person.actor_id}>
            <PersonCard actorId={person.actor_id} size="sm" />
          </PersonHoverCard>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function LocalSererSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <InstanceSidebar />
        <InstanceAdmins />
      </SidebarContent>
    </Sidebar>
  );
}

export function LocalSererSidebarPage() {
  return (
    <div className="flex-1">
      <InstanceSidebar asPage />
      <InstanceAdmins asPage />
    </div>
  );
}
