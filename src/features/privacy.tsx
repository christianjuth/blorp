import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "../components/markdown/renderer";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Title } from "../components/title";

const POLICY = `
**Updated:** Apr 15th, 2025

**Introduction**  
Blorp is a decentralized social media client that allows users to interact with the Lemmy platform. We prioritize your privacy and are committed to being transparent about how your data is handled. This Privacy Policy explains what information we collect, how we use it, and your rights.

---

#### **1. Information We Collect**
We only collect limited data for app functionality, diagnostics, and performance insights:

- **Crash Data:**  
  We use Sentry to collect crash logs and diagnostics. This data includes:
  - Device type (e.g., Android, iPhone)
  - Operating system version
  - App version
  - Crash stack traces (technical details about the error)
  
  **Note:** This data does not include any personally identifiable information (PII) unless you voluntarily provide it (e.g., in a crash report description).

- **Analytics Data:**  
  We use [Plausible](https://plausible.io/privacy), an EU-based and privacy-focused analytics provider, to collect anonymous, aggregated analytics data. This information includes:
  - Page views and visitor interactions
  - Referring websites and traffic sources
  - Aggregate usage statistics
  
  The data collected through Plausible is designed to remain privacy-focused and does not include any personal information. 

  **For transparency, we provide a public link to our [real-time Plausible stats page](https://plausible.io/blorpblorp.xyz) where you can view the current analytics data that is being recorded. This page allows you to verify for yourself exactly what data is being collected.**

---

#### **2. How We Use Your Information**
The data we collect is used strictly for maintaining and improving the app:
- **Crash Data:**  
  Used to identify and resolve bugs, enhancing app stability and performance.
- **Analytics Data:**  
  Used to gain insights into overall app usage and to drive improvements in functionality and user experience.

We do not use your data for tracking, advertising, marketing, or any other purpose beyond improving the app’s performance and user experience.

---

#### **3. Third-Party Services**
We employ the following third-party services to assist with app functionality and improvement:

- **Sentry:**  
  A crash reporting service that helps us identify and fix app issues.  
  Please refer to Sentry’s privacy policy for more details: [Sentry Privacy Policy](https://sentry.io/privacy/).

- **Plausible Analytics:**  
  An EU-based, privacy-focused analytics service used to collect non-personal, aggregated data regarding app usage. For complete transparency on the types of data collected by Plausible, please visit their privacy page here: [Plausible Privacy Policy](https://plausible.io/privacy). Additionally, you can see our current analytics metrics on our [public Plausible stats page](https://plausible.io/blorpblorp.xyz).

- **Lemmy SDK:**  
  Blorp connects directly to Lemmy servers chosen by you. While some data from Lemmy is processed locally for caching purposes (to improve performance and reduce latency), this data never leaves your device aside from the necessary communications with your selected Lemmy server—which is not hosted or controlled by us. All other data remains solely on your device.

---

#### **4. Data Sharing**
We do not share your data with third parties, except as required to provide the crash reporting and analytics services through Sentry and Plausible. All data shared with these services is used only for their specified functions and remains anonymous.

---

#### **5. Data Retention**
- **Crash Data:**  
  Crash logs are retained as long as necessary for debugging purposes. Once issues are resolved, these logs are deleted from our systems.
  
- **Analytics Data:**  
  Analytics data is maintained in aggregated and anonymized form for performance monitoring and improving user experience. This data is not tied to your personal identity and is handled with strict privacy measures.

---

#### **6. Your Rights**
Since we do not collect personally identifiable information, there are no additional personal data rights to manage. However, to further support your privacy:
- You can opt out of crash reporting and analytics tracking by adjusting your settings in the app.

---

#### **7. Contact Us**
If you have any questions or concerns about this Privacy Policy or how your data is handled, please [contact us](/support).

---

**Updates to This Policy**  
We may update this Privacy Policy from time to time. Any changes will be posted in the app or on our website to keep you informed.
`;

export default function Privacy() {
  return (
    <IonPage>
      <Title>Privacy</Title>
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
