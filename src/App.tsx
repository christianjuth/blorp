import { IonApp } from "@ionic/react";

import { setupIonicReact } from "@ionic/react";

import _ from "lodash";
import Router from "./routing/Router";

import { Providers } from "@/src/components/providers";
import { registerSafeArea } from "./lib/android";

import "remove-focus-outline";

registerSafeArea();

setupIonicReact({
  mode: "ios",
  statusTap: false,
  swipeBackEnabled: true,
});

export default function App() {
  return (
    <IonApp>
      <Providers>
        <Router />
      </Providers>
    </IonApp>
  );
}
