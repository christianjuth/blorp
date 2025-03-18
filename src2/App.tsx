import { IonApp } from "@ionic/react";

import { setupIonicReact } from "@ionic/react";

import _ from "lodash";
import Router from "./Router";

import { Providers } from "~/src/components/providers";

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <Providers>
        <Router />
      </Providers>
    </IonApp>
  );
}
