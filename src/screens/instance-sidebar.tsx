import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { ContentGutters } from "../components/gutters";
import { LocalSererSidebarPage } from "../components/local-server/local-server-sidebar";

export default function InstanceSidebar() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle>Instance Sidebar</IonTitle>
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
