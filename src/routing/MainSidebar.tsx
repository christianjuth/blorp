import { IonIcon, useIonRouter, IonMenuToggle } from "@ionic/react";
import { Link, ParamsFor } from "@/src/routing/index";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { useRecentCommunitiesStore } from "@/src/stores/recent-communities";
import { useAuth } from "@/src/stores/auth";
import {
  useModeratingCommunities,
  useNotificationCount,
  usePrivateMessagesCount,
  useSubscribedCommunities,
} from "@/src/lib/lemmy";
import { CommunityCard } from "@/src/components/communities/community-card";
import { LEFT_SIDEBAR_MENU_ID, TABS } from "./config";
import { Separator } from "../components/ui/separator";
import {
  DocumentsOutline,
  LockClosedOutline,
  ScrollTextOutline,
  SidebarOutline,
} from "../components/icons";
import { useLinkContext } from "./link-context";
import { RoutePath } from "./routes";
import { BadgeCount } from "../components/badge-count";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { useSidebarStore } from "../stores/sidebars";
import { IoSettingsOutline } from "react-icons/io5";

function SidebarTabs() {
  const selectedAccountIndex = useAuth((s) => s.accountIndex);
  const pmCount = usePrivateMessagesCount()[selectedAccountIndex];
  const count = useNotificationCount()[selectedAccountIndex];
  const pathname = useIonRouter().routeInfo.pathname;

  return (
    <>
      {TABS.map((t) => {
        const isActive = pathname.startsWith(t.to);
        return (
          <button
            key={t.id}
            onClick={() => {
              const tab = document.querySelector(`ion-tab-button[tab=${t.id}]`);
              if (tab && "click" in tab && _.isFunction(tab.click)) {
                tab.click();
              }
            }}
            className={twMerge(
              "relative max-md:hidden text-md flex flex-row items-center py-2 px-3 rounded-xl",
              isActive ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            <BadgeCount
              showBadge={
                t.id === "inbox"
                  ? !!count
                  : t.id === "messages"
                    ? !!pmCount
                    : false
              }
            >
              <IonIcon
                icon={t.icon(isActive)}
                key={isActive ? "active" : "inactive"}
                className="text-2xl"
              />
            </BadgeCount>
            <span className="text-sm ml-2">{t.label}</span>
          </button>
        );
      })}

      <Separator className="max-md:hidden my-2" />
    </>
  );
}

export function MainSidebar() {
  const recentCommunities = useRecentCommunitiesStore((s) => s.recentlyVisited);
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const instance = useAuth((s) => s.getSelectedAccount().instance);
  const linkCtx = useLinkContext();

  const subscribedCommunities = useSubscribedCommunities();
  const moderatingCommunities = useModeratingCommunities();

  const recentOpen = useSidebarStore((s) => s.mainSidebarRecent);
  const setRecentOpen = useSidebarStore((s) => s.setMainSidebarRecent);
  const subscribedOpen = useSidebarStore((s) => s.mainSidebarSubscribed);
  const setSubscribedOpen = useSidebarStore((s) => s.setMainSidebarSubscribed);
  const moderatingOpen = useSidebarStore((s) => s.mainSidebarModerating);
  const setModeratingOpen = useSidebarStore((s) => s.setMainSidebarModerating);

  return (
    <>
      <SidebarTabs />

      <Collapsible
        className="px-4 py-1"
        open={recentOpen}
        onOpenChange={setRecentOpen}
      >
        <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
          <span>RECENT</span>
          <ChevronsUpDown className="h-4 w-4" />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-2 flex flex-col gap-1.5">
          {recentCommunities.slice(0, 5).map((c) => (
            <IonMenuToggle
              key={c.id}
              menu={LEFT_SIDEBAR_MENU_ID}
              autoHide={false}
            >
              <CommunityCard communityView={c} size="sm" />
            </IonMenuToggle>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="my-2" />

      {isLoggedIn && moderatingCommunities.length > 0 && (
        <>
          <Collapsible
            className="px-4 py-1"
            open={moderatingOpen}
            onOpenChange={setModeratingOpen}
          >
            <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
              <span>MODERATING</span>
              <ChevronsUpDown className="h-4 w-4" />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2 flex flex-col gap-1.5">
              {moderatingCommunities.map(({ community: c }) => (
                <IonMenuToggle
                  key={c.id}
                  menu={LEFT_SIDEBAR_MENU_ID}
                  autoHide={false}
                >
                  <CommunityCard communityView={c} size="sm" />
                </IonMenuToggle>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />
        </>
      )}

      {isLoggedIn && subscribedCommunities.length > 0 && (
        <>
          <Collapsible
            className="px-4 py-1"
            open={subscribedOpen}
            onOpenChange={setSubscribedOpen}
          >
            <CollapsibleTrigger className="uppercase text-xs font-medium text-muted-foreground flex items-center justify-between w-full">
              <span>SUBSCRIBED</span>
              <ChevronsUpDown className="h-4 w-4" />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2 flex flex-col gap-1.5">
              {subscribedCommunities.map(({ community: c }) => (
                <IonMenuToggle
                  key={c.id}
                  menu={LEFT_SIDEBAR_MENU_ID}
                  autoHide={false}
                >
                  <CommunityCard communityView={c} size="sm" />
                </IonMenuToggle>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />
        </>
      )}

      <section className="md:hidden">
        <h2 className="px-4 pt-1 pb-3 text-sm text-muted-foreground uppercase">
          {new URL(instance).host}
        </h2>

        <SidebarLink icon={<SidebarOutline />} to={`${linkCtx.root}sidebar`}>
          Sidebar
        </SidebarLink>

        <Separator className="mt-3" />
      </section>

      <SidebarLink icon={<IoSettingsOutline />} to="/settings">
        Settings
      </SidebarLink>

      <SidebarLink icon={<LockClosedOutline />} to="/privacy">
        Privacy Policy
      </SidebarLink>

      <SidebarLink icon={<ScrollTextOutline />} to="/terms">
        Terms of Use
      </SidebarLink>

      <SidebarLink icon={<DocumentsOutline />} to="/licenses">
        OSS Licenses
      </SidebarLink>
    </>
  );
}

function SidebarLink<T extends RoutePath>({
  to,
  params,
  icon,
  children,
}: {
  to: T;
  params?: ParamsFor<T>;
  icon: React.ReactNode;
  children: string;
}) {
  return (
    <IonMenuToggle
      className="mt-3"
      menu={LEFT_SIDEBAR_MENU_ID}
      autoHide={false}
    >
      <Link
        to={to}
        params={params as any}
        className="px-4 text-muted-foreground flex flex-row items-center gap-2"
      >
        {icon} {children}
      </Link>
    </IonMenuToggle>
  );
}
