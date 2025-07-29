import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import { ContentGutters } from "../components/gutters";
import { LocalSererSidebarPage } from "../components/local-server/local-server-sidebar";
import { UserDropdown } from "../components/nav";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";

export default function InstanceSidebar() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle>Instance Sidebar</ToolbarTitle>
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <ContentGutters className="px-0">
          <LocalSererSidebarPage />
          <></>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
