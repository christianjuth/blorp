import {
  useListCommunities,
  useModeratingCommunities,
  useSubscribedCommunities,
} from "@/src/lib/lemmy/index";
import { useFiltersStore } from "@/src/stores/filters";
import _ from "lodash";
import { CommunityCard } from "../components/communities/community-card";
import { useAuth } from "../stores/auth";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { Separator } from "../components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { PersonCard } from "../components/person/person-card";
import { Sidebar, SidebarContent } from "../components/sidebar";
import { useSidebarStore } from "../stores/sidebars";

function PopularCommunitiesSidebar() {
  const listingType = useFiltersStore((s) => s.listingType);

  const subscribedCommunities = useSubscribedCommunities();
  const moderatingCommunities = useModeratingCommunities();

  const open = useSidebarStore((s) => s.siteCommunitiesExpanded);
  const setOpen = useSidebarStore((s) => s.setSiteCommunitiesExpanded);

  const { data } = useListCommunities({
    sort: "TopWeek",
    limit: 10,
    type_: listingType,
  });

  let communities = data?.pages.map((p) => p.communities).flat();

  if (listingType === "Subscribed") {
    communities = _.sortBy(communities, (c) => c.community.name);
  }

  return (
    <>
      <Collapsible className="p-4" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
          <span>
            {listingType === "All" && "POPULAR ON LEMMY"}
            {listingType === "Local" && "POPULAR LOCALLY"}
            {listingType === "Subscribed" && "SUBSCRIBED"}
            {listingType === "ModeratorView" && "MODERATING"}
          </span>
          <ChevronsUpDown className="h-4 w-4" />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 flex flex-col gap-1">
          {listingType === "Subscribed" &&
            subscribedCommunities?.map((view) => (
              <CommunityCard
                key={view.community.id}
                communityView={view}
                size="sm"
              />
            ))}

          {listingType === "ModeratorView" &&
            moderatingCommunities?.map((view) => (
              <CommunityCard
                key={view.community.id}
                communityView={view}
                size="sm"
              />
            ))}

          {listingType !== "Subscribed" &&
            listingType !== "ModeratorView" &&
            communities?.map((view) => (
              <CommunityCard
                key={view.community.id}
                communityView={view}
                size="sm"
              />
            ))}
        </CollapsibleContent>
      </Collapsible>
      <Separator />
    </>
  );
}

function InstanceSidebar() {
  const site = useAuth((s) => s.getSelectedAccount().site);
  const sidebar = site?.site_view.site.sidebar;

  const instance = useAuth((s) => s.getSelectedAccount().instance);
  const instanceName = new URL(instance).host;

  const open = useSidebarStore((s) => s.siteAboutExpanded);
  const setOpen = useSidebarStore((s) => s.setSiteAboutExpanded);

  if (!sidebar) {
    return null;
  }

  return (
    <>
      <Collapsible className="p-4" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
          <span>ABOUT {instanceName}</span>
          <ChevronsUpDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-5 pb-2">
          <MarkdownRenderer
            className="text-muted-foreground"
            markdown={sidebar}
          />
        </CollapsibleContent>
      </Collapsible>
      <Separator />
    </>
  );
}

function InstanceAdmins() {
  const site = useAuth((s) => s.getSelectedAccount().site);
  const admins = site?.admins;

  const instance = useAuth((s) => s.getSelectedAccount().instance);
  const instanceName = new URL(instance).host;

  const open = useSidebarStore((s) => s.siteAdminsExpanded);
  const setOpen = useSidebarStore((s) => s.setSiteAdminsExpanded);

  if (!admins) {
    return null;
  }

  return (
    <Collapsible className="p-4" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
        <span>{instanceName} ADMINS</span>
        <ChevronsUpDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 flex flex-col gap-1">
        {admins.map(({ person }) => (
          <PersonCard
            key={person.actor_id}
            actorId={person.actor_id}
            size="sm"
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RightSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <InstanceSidebar />
        <PopularCommunitiesSidebar />
        <InstanceAdmins />
      </SidebarContent>
    </Sidebar>
  );
}
