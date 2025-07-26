import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButtons,
} from "@ionic/react";
import { ContentGutters } from "../components/gutters";
import { UserDropdown } from "../components/nav";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";

export function NotFound() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle>Not found</ToolbarTitle>
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <ContentGutters className="py-6">
          <h1 className="font-bold text-4xl">Not found</h1>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

export default NotFound;
