import {
  IonTabs,
  IonTab,
  IonToolbar,
  IonTabBar,
  IonTabButton,
  IonHeader,
  IonTitle,
  IonContent,
  IonIcon,
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  IonMenu,
  IonPage,
  useIonRouter,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { pencil, cog, notifications, people, home } from "ionicons/icons";
import { Route, Redirect, Link } from "react-router-dom";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { useMedia } from "~/src/lib/hooks";

import { Logo } from "~/src/components/logo";
import { useRecentCommunitiesStore } from "~/src/stores/recent-communities";
import { useAuth } from "~/src/stores/auth";
import { useListCommunities } from "~/src/lib/lemmy";
import { SmallCommunityCard } from "~/src/components/communities/community-card";

import * as routes from "~/src/lib/routes";

import { Inbox } from "../src/features/inbox";
import { Privacy } from "../src/features/privacy";
import { HomeFeed } from "../src/features/home-feed";
import { Post } from "../src/features/post";
import { SettingsPage } from "~/src/features/settings";
import { CommunityFeed } from "~/src/features/community-feed";

const HOME_STACK = [
  <Route exact path="/home" component={HomeFeed} />,
  <Route exact path="/home/c/:communityName" component={CommunityFeed} />,
  <Route exact path="/home/c/:communityName/posts/:post" component={Post} />,
];

const COMMUNITIES_STACK = [
  // <Route exact path="/communities/" component={Feed} />,
  // <Route exact path="/communities/post" component={Post} />,
];

const INBOX_STACK = [<Route exact path="/inbox" component={Inbox} />];

const SETTINGS = [<Route exact path="/settings" component={SettingsPage} />];

function SidebarTabs() {
  const router = useIonRouter();
  const pathname = router.routeInfo.pathname;

  return (
    <>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            const tab = document.querySelector(`ion-tab-button[tab=${t.id}]`);
            if (tab && "click" in tab && _.isFunction(tab.click)) {
              tab.click();
            }
          }}
          className={twMerge(
            "text-md flex flex-row items-center gap-2 py-2 px-3 rounded-xl",
            pathname.startsWith(t.to)
              ? "bg-zinc-200 dark:bg-zinc-800"
              : "text-zinc-500",
          )}
        >
          <IonIcon icon={t.icon} className="text-2xl" />
          <span className="text-sm">{t.label}</span>
        </button>
      ))}
    </>
  );
}

function Sidebar() {
  const recentCommunities = useRecentCommunitiesStore((s) => s.recentlyVisited);
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const subscribedCommunities = useListCommunities({
    type_: "Subscribed",
    limit: 50,
  });

  const sortedCommunities = _.sortBy(
    subscribedCommunities.data?.pages.flatMap((p) => p.communities),
    (c) => c.community.name,
  );

  return (
    <>
      <SidebarTabs />

      <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2" />

      {recentCommunities.length > 0 && (
        <>
          <span className="px-4 py-1 text-sm dark:text-zinc-500">RECENT</span>
          {recentCommunities.map((c) => (
            <div key={c.id} className="px-4 py-0.75 flex flex-row">
              <SmallCommunityCard community={c} />
            </div>
          ))}

          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2" />
        </>
      )}

      {isLoggedIn && sortedCommunities.length > 0 && (
        <>
          <span className="px-4 py-1 text-sm dark:text-zinc-500">
            COMMUNITIES
          </span>
          {sortedCommunities.map(({ community: c }) => (
            <div key={c.id} className="px-4 py-0.75 flex flex-row">
              <SmallCommunityCard community={c} />
            </div>
          ))}

          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2" />
        </>
      )}

      <Link to={routes.privacy} className="px-4 dark:text-zinc-500">
        Privacy Policy
      </Link>
    </>
  );
}

function Tabs() {
  const media = useMedia();

  return (
    <IonSplitPane when="md" contentId="main">
      <IonMenu
        contentId="main"
        style={{
          "--side-max-width": "270px",
        }}
        className="border-r-1 border-zinc-200 dark:border-zinc-800"
      >
        <IonContent>
          <button
            className="h-[60px] px-6 flex items-center"
            onClick={() => {
              const tab = document.querySelector(`ion-tab-button[tab="home"]`);
              if (tab && "click" in tab && _.isFunction(tab.click)) {
                tab.click();
              }
            }}
          >
            <Logo />
          </button>
          <div className="px-3 pt-2 pb-4 gap-0.5 flex flex-col">
            <Sidebar />
          </div>
        </IonContent>
      </IonMenu>

      <IonContent id="main" scrollY={false}>
        <IonTabs>
          <IonRouterOutlet animated={media.maxMd}>
            {...HOME_STACK}
            {...COMMUNITIES_STACK}
            {...INBOX_STACK}
            {...SETTINGS}
            <Route exact path="/privacy" component={Privacy} />
            <Redirect exact from="/" to="/home" />
          </IonRouterOutlet>

          <IonTabBar slot="bottom" className="md:hidden">
            {TABS.map((t) => (
              <IonTabButton key={t.id} tab={t.id} href={t.to}>
                <IonIcon icon={t.icon} />
                {t.label}
              </IonTabButton>
            ))}
          </IonTabBar>
        </IonTabs>
      </IonContent>
    </IonSplitPane>
  );
}

const TABS: {
  icon: string;
  to: string;
  label: string;
  id: string;
}[] = [
  {
    icon: home,
    to: "/home",
    label: "Home",
    id: "home",
  },
  {
    icon: people,
    to: "/communities",
    label: "Communities",
    id: "communities",
  },
  {
    icon: pencil,
    to: "/post",
    label: "Post",
    id: "post",
  },
  {
    icon: notifications,
    to: "/inbox",
    label: "Inbox",
    id: "inbox",
  },
  {
    icon: cog,
    to: "/settings",
    label: "Settings",
    id: "settings",
  },
];

export default function Router() {
  return (
    <IonReactRouter>
      <Tabs />
    </IonReactRouter>
  );
}
