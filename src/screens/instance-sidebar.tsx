import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { useAuth } from "../stores/auth";
import { ContentGutters } from "../components/gutters";

export default function InstanceSidebar() {
  const site = useAuth((s) => s.getSelectedAccount().site);

  const sidebar = site?.site_view.site.sidebar;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Instance Sidebar</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <ContentGutters className="py-6">
          {sidebar && <MarkdownRenderer markdown={sidebar} />}
          <div>
            {site?.site_view.site.name}
            {site?.site_view.site.description}
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
