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
import { Route, Redirect, Link, Switch } from "react-router-dom";
import _ from "lodash";
import { twMerge } from "tailwind-merge";

import { Inbox } from "../src/features/inbox";
import { Privacy } from "../src/features/privacy";
import { HomeFeed } from "../src/features/home-feed";
import { Post } from "../src/features/post";
import { SettingsPage } from "~/src/features/settings";
import { Logo } from "~/src/components/logo";

const HOME_STACK = [
  <Route exact path="/home" component={HomeFeed} />,
  <Route exact path="/home/c/:community/posts/:post" component={Post} />,
];

const COMMUNITIES_STACK = [
  // <Route exact path="/communities/" component={Feed} />,
  // <Route exact path="/communities/post" component={Post} />,
];

const INBOX_STACK = [<Route exact path="/inbox" component={Inbox} />];

const SETTINGS = [<Route exact path="/settings" component={SettingsPage} />];

function Tabs() {
  const router = useIonRouter();

  const pathname = router.routeInfo.pathname;

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
          <div className="px-3 py-2 gap-0.5 flex flex-col">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  const tab = document.querySelector(
                    `ion-tab-button[tab=${t.id}]`,
                  );
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
          </div>
        </IonContent>
      </IonMenu>

      <IonContent id="main" scrollY={false}>
        <IonTabs>
          <IonRouterOutlet
          // animated={false}
          >
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
