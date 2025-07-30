import { IonApp } from "@ionic/react";

import { setupIonicReact } from "@ionic/react";

import _ from "lodash";
import Router from "./routing/Router";

import { Providers } from "@/src/components/providers";
import { applyCapacitorFixes } from "./lib/capacitor";

import "remove-focus-outline";
import { InstanceFavicon } from "./components/instance-favicon";

applyCapacitorFixes();

setupIonicReact({
  mode: "ios",
  statusTap: false,
  swipeBackEnabled: true,
});

export default function App() {
  return (
    <IonApp>
      <Providers>
        <InstanceFavicon />
        <Router />
      </Providers>
    </IonApp>
  );
}
