import { IonContent, IonHeader, IonPage, IonToolbar } from "@ionic/react";
import { ContentGutters } from "../components/gutters";
import { UserDropdown } from "../components/nav";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";
import { ToolbarButtons } from "../components/toolbar/toolbar-buttons";

export function NotFound() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <ToolbarButtons side="left">
            <ToolbarBackButton />
            <ToolbarTitle>Not found</ToolbarTitle>
          </ToolbarButtons>
          <ToolbarButtons side="right">
            <UserDropdown />
          </ToolbarButtons>
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
