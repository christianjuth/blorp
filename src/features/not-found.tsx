import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import { ContentGutters } from "../components/gutters";
import { UserDropdown } from "../components/nav";

export function NotFound() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Not found</IonTitle>
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
