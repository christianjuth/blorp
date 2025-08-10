import { IonContent, IonHeader, IonPage, IonToolbar } from "@ionic/react";
import { ContentGutters } from "../components/gutters";
import { LocalSererSidebarPage } from "../components/local-server/local-server-sidebar";
import { UserDropdown } from "../components/nav";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";
import { ToolbarButtons } from "../components/toolbar/toolbar-buttons";

export default function InstanceSidebar() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <ToolbarButtons side="left">
            <ToolbarBackButton />
            <ToolbarTitle numRightIcons={1}>Instance Sidebar</ToolbarTitle>
          </ToolbarButtons>
          <ToolbarButtons side="right">
            <UserDropdown />
          </ToolbarButtons>
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
