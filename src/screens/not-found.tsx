import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { ContentGutters } from "../components/gutters";

export function NotFound() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Not found</IonTitle>
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
