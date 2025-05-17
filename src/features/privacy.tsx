import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "../components/markdown/renderer";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { PageTitle } from "../components/page-title";
import { env } from "../env";

const POLICY = `
**Updated:** April 19, 2025

**Introduction**  
${env.REACT_APP_NAME} is a decentralized social media client that allows users to interact with Lemmy servers of their choice. We prioritize your privacy and are committed to being transparent about how your data is handled (or not handled). This Privacy Policy explains what information we collect, how we use it, and your rights.

---

#### 1. Information We Collect  
**We do not collect any information.**  
${env.REACT_APP_NAME} does not gather crash logs, diagnostics, analytics data, or any personally identifiable information (PII).

---

#### 2. How We Use Your Information  
Since we collect no data, there is nothing to use. Your activity within ${env.REACT_APP_NAME} remains private and confined to your device and the Lemmy server you choose to connect with.

---

#### 3. Third‑Party Services  
- **Lemmy SDK:**  
  ${env.REACT_APP_NAME} connects directly to Lemmy servers you select. While some data (such as post and comment content) is cached locally on your device to improve performance, **no data from your device is sent to us**. All network communication is directly between your device and the chosen Lemmy instance, which is not hosted or controlled by ${env.REACT_APP_NAME}.  
  
  For details on how your chosen Lemmy server handles your data, please refer to its privacy policy.

---

#### 4. Data Sharing  
We do not share any data with third parties. Because we do not collect or store any information, there is nothing to share.

---

#### 5. Data Retention  
No data is collected or stored by ${env.REACT_APP_NAME}, so there is no data retention policy needed.

---

#### 6. Your Rights  
- There is no personal data collected by ${env.REACT_APP_NAME}, so there are no personal data rights to exercise with us.  
- If you have questions about the handling of data by the Lemmy server you connect to, please contact the administrator of that server.

---

#### 7. Contact Us  
If you have any questions or concerns about this Privacy Policy or how ${env.REACT_APP_NAME} interacts with Lemmy servers, please [contact us](/support).

---

**Updates to This Policy**  
We may update this Privacy Policy from time to time. Any changes will be posted in the app or on our website to keep you informed.
`;

export default function Privacy() {
  return (
    <IonPage>
      <PageTitle>Privacy</PageTitle>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Privacy Policy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <ContentGutters>
          <MarkdownRenderer markdown={POLICY} className="flex-1 py-8" />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
