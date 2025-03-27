import { IonApp } from "@ionic/react";

import { setupIonicReact } from "@ionic/react";
import type { IonicConfig } from "@ionic/core";

import _ from "lodash";
import Router from "./Router";

import { Providers } from "~/src/components/providers";
import { SplashScreen } from "@capacitor/splash-screen";
import { useEffect } from "react";
import Bowser from "bowser";
import { initSentry } from "./components/sentry";
import { initAnalytics } from "./lib/analytics";

initSentry();
initAnalytics();

const browser = Bowser.getParser(window.navigator.userAgent);

let mode: IonicConfig["mode"] = undefined;

switch (browser.getOS().name?.toLowerCase()) {
  case "macos":
    mode = "ios";
    break;
  case "windows":
    mode = "md";
    break;
}

setupIonicReact({
  mode,
  statusTap: false,
  swipeBackEnabled: true,
});

export default function App() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <IonApp>
      <Providers>
        <Router />
      </Providers>
    </IonApp>
  );
}
