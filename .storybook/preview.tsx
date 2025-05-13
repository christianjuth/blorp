import * as React from "react";
import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import type { Preview } from "@storybook/react";
import { Providers } from "../src/components/providers";
import { setupIonicReact } from "@ionic/react";
import "../src/styles/index.css";

setupIonicReact();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: (Story) => (
    <IonApp>
      <IonReactRouter>
        <Providers>
          <Story />
        </Providers>
      </IonReactRouter>
    </IonApp>
  ),
};

export default preview;
