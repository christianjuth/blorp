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

import { HomeFeed } from "../src/features/home-feed";

function Feed() {
  return (
    <IonPage>
      <Link to={"/communities/post"}>Open Post</Link>
    </IonPage>
  );
}
function Post() {
  return (
    <IonPage>
      <span>Post</span>
    </IonPage>
  );
}

const HOME_STACK = [
  <Route exact path="/home" component={HomeFeed} />,
  <Route exact path="/home/post" component={Post} />,
];

const COMMUNITIES_STACK = [
  <Route exact path="/communities/" component={Feed} />,
  <Route exact path="/communities/post" component={Post} />,
];

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
          <div className="p-4 gap-1 flex flex-col">
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
                  "text-lg flex flex-row items-center gap-2 p-2",
                  pathname.startsWith(t.to) && "",
                )}
              >
                <IonIcon icon={t.icon} className="text-2xl" />
                <span className="text-zinc-600 text-md">{t.label}</span>
              </button>
            ))}
          </div>
        </IonContent>
      </IonMenu>

      <div className="ion-page" id="main">
        <IonTabs>
          <IonRouterOutlet animated={false}>
            <Switch>
              {...HOME_STACK}
              {...COMMUNITIES_STACK}
              <Redirect exact from="/" to="/home" />
            </Switch>
          </IonRouterOutlet>

          <IonTabBar
            slot="bottom"
            className="border-t-1 border-zinc-200 md:hidden"
          >
            {TABS.map((t) => (
              <IonTabButton key={t.id} tab={t.id} href={t.to}>
                <IonIcon icon={t.icon} />
              </IonTabButton>
            ))}
          </IonTabBar>
        </IonTabs>
      </div>
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
