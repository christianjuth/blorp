import { Link } from "one";
import { ScrollView, Text, YStack } from "tamagui";
import { ContentGutters } from "~/src/components/gutters";
import { Markdown } from "~/src/components/markdown";

const POLICY = `
### **Privacy Policy for Blorp**

**Effective Date:** Jan 16th, 2025

**Introduction**  
Blorp is a decentralized social media client that allows users to interact with the Lemmy platform. We prioritize your privacy and are committed to being transparent about how your data is handled. This Privacy Policy explains what information we collect, how we use it, and your rights.

---

#### **1. Information We Collect**
We only collect limited data for app functionality and diagnostics:

- **Crash Data**:  
  We use Sentry to collect crash logs and diagnostics. This data includes:
  - Device type (e.g., Android, iPhone)
  - Operating system version
  - App version
  - Crash stack traces (technical details about the error)

  **Note**: This data does not include any personally identifiable information (PII) unless you voluntarily provide it (e.g., in a crash report description).

---

#### **2. How We Use Your Information**
The crash data we collect is used solely for:
- Identifying and resolving bugs
- Improving app performance and user experience

We do not use your data for tracking, marketing, or any other purpose.

---

#### **3. Third-Party Services**
We use the following third-party services:

- **Sentry**: A crash reporting service that helps us identify and fix app issues.  
  You can view Sentry’s privacy policy [here](https://sentry.io/privacy/).

- **Lemmy SDK**: This app connects directly to Lemmy servers chosen by you. We do not control or process any data stored on or retrieved from Lemmy servers. Please review the privacy policy of the Lemmy server you choose to connect to.

---

#### **4. Data Sharing**
We do not share your data with third parties, except as required to provide the crash reporting service through Sentry.

---

#### **5. Data Retention**
Crash data is retained as long as necessary for debugging purposes. Once resolved, crash logs are deleted from our systems.

---

#### **6. Your Rights**
Since we do not collect PII, there are no additional personal data rights to manage. However:
- You can opt out of crash reporting by disabling analytics in the app settings.

---

#### **7. Contact Us**
If you have any questions about this Privacy Policy or your data, please contact us at [Your Email Address].

---

**Updates to This Policy**  
We may update this Privacy Policy occasionally. Updates will be posted in the app or on our website.
`;

export default function Page() {
  const content = (
    <ContentGutters>
      <YStack flex={1} py="$10" gap="$8">
        <Link href="/" asChild>
          <Text tag="a" color="$accentColor">
            Return home
          </Text>
        </Link>

        <Markdown markdown={POLICY} />

        <Link href="/" asChild>
          <Text tag="a" color="$accentColor">
            Return home
          </Text>
        </Link>
      </YStack>
    </ContentGutters>
  );

  return <ScrollView bg="$background">{content}</ScrollView>;
}
