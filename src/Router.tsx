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
  IonMenuToggle,
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

import { lazy } from "react";
import * as routes from "@/src/lib/routes";
import { dispatchScrollEvent } from "./lib/scroll-events";
import { isTauri } from "./lib/tauri";
import { CommunityCard } from "./components/communities/community-card";

const CSAE = lazy(() => import("@/src/features/csae"));
const NotFound = lazy(() => import("@/src/features/not-found"));
const Download = lazy(() => import("@/src/features/download"));
const Inbox = lazy(() => import("@/src/features/inbox"));
const Privacy = lazy(() => import("@/src/features/privacy"));
const Terms = lazy(() => import("@/src/features/terms"));
const Support = lazy(() => import("@/src/features/support"));
const HomeFeed = lazy(() => import("@/src/features/home-feed"));
const Post = lazy(() => import("@/src/features/post"));
const SettingsPage = lazy(() => import("@/src/features/settings"));
const CommunityFeed = lazy(() => import("@/src/features/community-feed"));
const CommunitySidebar = lazy(() => import("@/src/features/community-sidebar"));
const CommunitiesFeed = lazy(() => import("@/src/features/communities-feed"));
const User = lazy(() => import("@/src/features/user"));
const SavedFeed = lazy(() => import("@/src/features/saved-feed"));
const Search = lazy(() => import("@/src/features/search"));
import { CreatePost } from "@/src/features/create-post";

const HOME_STACK = [
  <Route path="/home/*" component={NotFound} />,
  <Route key="/home" exact path="/home" component={HomeFeed} />,
  <Route key="/home/s" exact path="/home/s" component={Search} />,
  <Route
    key="/home/c/:communityName"
    exact
    path="/home/c/:communityName"
    component={CommunityFeed}
  />,
  <Route
    key="/home/c/:communityName/s"
    exact
    path="/home/c/:communityName/s"
    component={Search}
  />,
  <Route
    key="/home/c/:communityName/sidebar"
    exact
    path="/home/c/:communityName/sidebar"
    component={CommunitySidebar}
  />,
  <Route
    key="/home/c/:communityName/posts/:post"
    exact
    path="/home/c/:communityName/posts/:post"
    component={Post}
  />,
  <Route
    key="/home/c/:communityName/posts/:post/comments/:comment"
    exact
    path="/home/c/:communityName/posts/:post/comments/:comment"
    component={Post}
  />,
  <Route key="/home/u/:userId" exact path="/home/u/:userId" component={User} />,
  <Route key="/home/saved" exact path="/home/saved" component={SavedFeed} />,
];

const CREATE_POST_STACK = [
  <Route path="/create/*" component={NotFound} />,
  <Route key="/create" exact path="/create" component={CreatePost} />,
];

const COMMUNITIES_STACK = [
  <Route path="/communities/*" component={NotFound} />,
  <Route
    key="/communities/"
    exact
    path="/communities/"
    component={CommunitiesFeed}
  />,
  <Route key="/communities/s" exact path="/communities/s">
    <Search defaultType="communities" />
  </Route>,
  <Route
    key="/communities/c/:communityName"
    exact
    path="/communities/c/:communityName"
    component={CommunityFeed}
  />,
  <Route
    key="/communities/c/:communityName/s"
    exact
    path="/communities/c/:communityName/s"
    component={Search}
  />,
  <Route
    key="/communities/c/:communityName/sidebar"
    exact
    path="/communities/c/:communityName/sidebar"
    component={CommunitySidebar}
  />,
  <Route
    key="/communities/c/:communityName/posts/:post"
    exact
    path="/communities/c/:communityName/posts/:post"
    component={Post}
  />,
  <Route
    key="/communities/c/:communityName/posts/:post/comment/:comment"
    exact
    path="/communities/c/:communityName/posts/:post/comment/:comment"
    component={Post}
  />,
  <Route
    key="/communities/u/:userId"
    exact
    path="/communities/u/:userId"
    component={User}
  />,
];

const INBOX_STACK = [
  <Route path="/inbox/*" component={NotFound} />,
  <Route key="/inbox" exact path="/inbox" component={Inbox} />,
  <Route key="/inbox/s" exact path="/inbox/s" component={Search} />,
  <Route
    key="/inbox/c/:communityName"
    exact
    path="/inbox/c/:communityName"
    component={CommunityFeed}
  />,
  <Route
    key="/inbox/c/:communityName/s"
    exact
    path="/inbox/c/:communityName/s"
    component={Search}
  />,
  <Route
    key="/inbox/c/:communityName/sidebar"
    exact
    path="/inbox/c/:communityName/sidebar"
    component={CommunitySidebar}
  />,
  <Route
    key="/inbox/c/:communityName/posts/:post"
    exact
    path="/inbox/c/:communityName/posts/:post"
    component={Post}
  />,
  <Route
    key="/inbox/c/:communityName/posts/:post/comments/:comment"
    exact
    path="/inbox/c/:communityName/posts/:post/comments/:comment"
    component={Post}
  />,
  <Route
    key="/inbox/u/:userId"
    exact
    path="/inbox/u/:userId"
    component={User}
  />,
];

const SETTINGS = [
  <Route path="/settings/*" component={NotFound} />,
  <Route key="/settings" exact path="/settings" component={SettingsPage} />,
];

function SidebarTabs() {
  const count = useNotificationCount();
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
            "relative max-md:hidden text-md flex flex-row items-center py-2 px-3 rounded-xl",
            pathname.startsWith(t.to)
              ? "bg-secondary text-brand"
              : "text-muted-foreground",
          )}
        >
          <IonIcon icon={t.icon} className="text-2xl" />
          <span className="text-sm ml-2">{t.label}</span>
          {t.id === "inbox" && (
            <IonBadge
              className="bg-destructive px-1 -mt-3 py-0.5"
              hidden={!count.data}
            >
              {count.data}
            </IonBadge>
          )}
        </button>
      ))}

      <div className="max-md:hidden h-[0.5px] w-full bg-border my-2" />
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

      {recentCommunities.length > 0 && (
        <>
          <span className="px-4 py-1 text-sm text-muted-foreground">
            RECENT
          </span>
          {recentCommunities.slice(0, 5).map((c) => (
            <IonMenuToggle key={c.id} className="px-4 py-0.75 flex flex-row">
              <CommunityCard communityView={c} size="sm" />
            </IonMenuToggle>
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
            <IonMenuToggle key={c.id} className="px-4 py-0.75 flex flex-row">
              <CommunityCard communityView={c} size="sm" />
            </IonMenuToggle>
          ))}

          <div className="h-[0.5px] w-full bg-border my-2" />
        </>
      )}

      <Link
        to={routes.privacy}
        className="px-4 text-sm mt-2 text-muted-foreground"
      >
        Privacy Policy
      </Link>

      <Link
        to={routes.terms}
        className="px-4 text-sm mt-3 text-muted-foreground"
      >
        Terms of Use
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
        type="push"
        contentId="main"
        style={{
          "--side-max-width": "270px",
        }}
        className="border-r-[0.5px] border-border"
      >
        <div className="h-[var(--ion-safe-area-top)]" />

        <IonContent scrollY={false}>
          <div className="overflow-y-auto h-full">
            {isTauri() && (
              <div
                className="h-12 -mb-6 w-full top-0 sticky bg-gradient-to-b from-background to-transparent from-30% z-10"
                data-tauri-drag-region
              />
            )}
            <button
              className="h-[60px] mt-3 md:mt-1 px-4 md:px-6 flex items-center"
              onClick={() => {
                const tab = document.querySelector(
                  `ion-tab-button[tab="home"]`,
                );
                if (tab && "click" in tab && _.isFunction(tab.click)) {
                  tab.click();
                }
              }}
            >
              <Logo />
            </button>

            <div className="md:px-3 pt-2 pb-4 gap-0.5 flex flex-col">
              <Sidebar />
            </div>
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
            <Redirect
              key="/c/:communityName"
              exact
              path="/c/:communityName"
              to="/home/c/:communityName"
            />
            <Redirect
              key="/u/:userId"
              exact
              path="/u/:userId"
              to="/home/u/:userId"
            />

            <Route exact path="/download" component={Download} />
            <Route exact path="/support" component={Support} />
            <Route exact path="/privacy" component={Privacy} />
            <Route exact path="/terms" component={Terms} />
            <Route exact path="/csae" component={CSAE} />
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
      <Tabs />
    </IonReactRouter>
  );
}
