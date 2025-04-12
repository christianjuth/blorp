import * as React from "react";
import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import type { Preview } from "@storybook/react";
import { Providers } from "../src/components/providers";
import "../src/index.css";

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
