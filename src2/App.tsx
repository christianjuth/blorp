import { IonApp } from "@ionic/react";

import { setupIonicReact } from "@ionic/react";

import _ from "lodash";
import Router from "./Router";

import { Providers } from "~/src/components/providers";
import { SplashScreen } from "@capacitor/splash-screen";
import { useEffect } from "react";

setupIonicReact({
  mode: "ios",
  statusTap: true,
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
