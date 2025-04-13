import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonContent,
  IonIcon,
  IonRouterOutlet,
  IonSplitPane,
  IonMenu,
  useIonRouter,
  IonBadge,
  IonLabel,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { pencil, cog, notifications, people, home } from "ionicons/icons";
import { Route, Redirect, Link } from "react-router-dom";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { useMedia } from "@/src/lib/hooks";

import { Logo } from "@/src/components/logo";
import { useRecentCommunitiesStore } from "@/src/stores/recent-communities";
import { useAuth } from "@/src/stores/auth";
import { useListCommunities, useNotificationCount } from "@/src/lib/lemmy";
import { SentryAddCtx } from "./components/sentry";

import { lazy } from "react";
import * as routes from "@/src/lib/routes";
import { dispatchScrollEvent } from "./lib/scroll-events";
import { isTauri } from "./lib/tauri";
import { CommunityCard } from "./components/communities/community-card";

const Inbox = lazy(() => import("@/src/features/inbox"));
const Privacy = lazy(() => import("@/src/features/privacy"));
const HomeFeed = lazy(() => import("@/src/features/home-feed"));
const Post = lazy(() => import("@/src/features/post"));
const SettingsPage = lazy(() => import("@/src/features/settings"));
const CommunityFeed = lazy(() => import("@/src/features/community-feed"));
const CommunitySidebar = lazy(() => import("@/src/features/community-sidebar"));
const CommunitiesFeed = lazy(() => import("@/src/features/communities-feed"));
const User = lazy(() => import("@/src/features/user"));
const SavedFeed = lazy(() => import("@/src/features/saved-feed"));
const Search = lazy(() => import("@/src/features/search"));
const CreatePost = lazy(() => import("@/src/features/create-post"));

const HOME_STACK = [
  <Route exact path="/home" component={HomeFeed} />,
  <Route exact path="/home/s" component={Search} />,
  <Route exact path="/home/c/:communityName" component={CommunityFeed} />,
  <Route exact path="/home/c/:communityName/s" component={Search} />,
  <Route
    exact
    path="/home/c/:communityName/sidebar"
    component={CommunitySidebar}
  />,
  <Route exact path="/home/c/:communityName/posts/:post" component={Post} />,
  <Route
    exact
    path="/home/c/:communityName/posts/:post/comments/:comment"
    component={Post}
  />,
  <Route exact path="/home/u/:userId" component={User} />,
  <Route exact path="/home/saved" component={SavedFeed} />,
];

const CREATE_POST_STACK = [
  <Route exact path="/create" component={CreatePost} />,
];

const COMMUNITIES_STACK = [
  <Route exact path="/communities/" component={CommunitiesFeed} />,
  <Route exact path="/communities/s">
    <Search defaultType="communities" />
  </Route>,
  <Route
    exact
    path="/communities/c/:communityName"
    component={CommunityFeed}
  />,
  <Route exact path="/communities/c/:communityName/s" component={Search} />,
  <Route
    exact
    path="/communities/c/:communityName/sidebar"
    component={CommunitySidebar}
  />,
  <Route
    exact
    path="/communities/c/:communityName/posts/:post"
    component={Post}
  />,
  <Route
    exact
    path="/communities/c/:communityName/posts/:post/comment/:comment"
    component={Post}
  />,
  <Route exact path="/communities/u/:userId" component={User} />,
];

const INBOX_STACK = [
  <Route exact path="/inbox" component={Inbox} />,
  <Route exact path="/inbox/s" component={Search} />,
  <Route exact path="/inbox/c/:communityName" component={CommunityFeed} />,
  <Route exact path="/inbox/c/:communityName/s" component={Search} />,
  <Route
    exact
    path="/inbox/c/:communityName/sidebar"
    component={CommunitySidebar}
  />,
  <Route exact path="/inbox/c/:communityName/posts/:post" component={Post} />,
  <Route
    exact
    path="/inbox/c/:communityName/posts/:post/comments/:comment"
    component={Post}
  />,
  <Route exact path="/inbox/u/:userId" component={User} />,
];

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
              ? "bg-secondary text-brand"
              : "text-muted-foreground",
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

      <div className="h-[0.5px] w-full bg-border my-2" />

      {recentCommunities.length > 0 && (
        <>
          <span className="px-4 py-1 text-sm text-muted-foreground">
            RECENT
          </span>
          {recentCommunities.map((c) => (
            <div key={c.id} className="px-4 py-0.75 flex flex-row">
              <CommunityCard communityView={c} size="sm" />
            </div>
          ))}

          <div className="h-[0.5px] w-full bg-border my-2" />
        </>
      )}

      {isLoggedIn && sortedCommunities.length > 0 && (
        <>
          <span className="px-4 py-1 text-sm text-muted-foreground">
            COMMUNITIES
          </span>
          {sortedCommunities.map(({ community: c }) => (
            <div key={c.id} className="px-4 py-0.75 flex flex-row">
              <CommunityCard communityView={c} size="sm" />
            </div>
          ))}

          <div className="h-[0.5px] w-full bg-border my-2" />
        </>
      )}

      <Link to={routes.privacy} className="px-4 text-muted-foreground">
        Privacy Policy
      </Link>
    </>
  );
}

function Tabs() {
  const count = useNotificationCount();
  const media = useMedia();
  const router = useIonRouter();
  const pathname = router.routeInfo.pathname;

  return (
    <IonSplitPane when="lg" contentId="main">
      <IonMenu
        contentId="main"
        style={{
          "--side-max-width": "270px",
        }}
        className="border-r-[0.5px] border-border"
      >
        <IonContent>
          {isTauri() && (
            <div
              className="h-12 -mb-6 w-full top-0 sticky bg-gradient-to-b from-background to-transparent from-30% z-10"
              data-tauri-drag-region
            />
          )}
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
            {...CREATE_POST_STACK}
            {...INBOX_STACK}
            {...SETTINGS}
            <Route exact path="/privacy" component={Privacy} />
            <Redirect exact from="/" to="/home" />
          </IonRouterOutlet>

          <IonTabBar slot="bottom" className="lg:hidden">
            {TABS.map((t) => (
              <IonTabButton
                key={t.id}
                tab={t.id}
                href={t.to}
                onClick={() => {
                  const isRoot = pathname === t.to;
                  if (isRoot) {
                    dispatchScrollEvent(pathname);
                  }
                }}
              >
                <IonIcon icon={t.icon} />
                <IonLabel>{t.label}</IonLabel>
                {t.id === "inbox" && (
                  <IonBadge
                    className="bg-destructive px-1.5 -mt"
                    hidden={!count.data}
                  >
                    {count.data}
                  </IonBadge>
                )}
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
    to: "/create",
    label: "Post",
    id: "create",
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
      <SentryAddCtx />
      <Tabs />
    </IonReactRouter>
  );
}
