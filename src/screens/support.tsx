import { ContentGutters } from "@/src/components/gutters";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { PageTitle } from "../components/page-title";

export default function Support() {
  return (
    <IonPage>
      <PageTitle>Privacy</PageTitle>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Support</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <ContentGutters>
          <div className="flex flex-col flex-1 py-8 prose dark:prose-invert">
            <h2>Need Help? We're Here for You!</h2>

            <p>
              If you have any questions, need assistance, or encounter issues
              with the app, please don't hesitate to contact us. Our support
              team is ready to help you—no account or login required.
            </p>

            <section>
              <h2>Email Support (Recommended)</h2>

              <p>
                For the fastest response, please email us directly using the
                link below:
              </p>

              <a
                className="text-brand"
                href="mailto:support@blorpblorp.xyz"
                rel="noopener noreferrer"
              >
                Email support!
              </a>
            </section>

            <section>
              <h2>GitHub (optional)</h2>

              <p>
                For those who use GitHub, you can also track the status of known
                issues or report bugs here:
              </p>

              <div className="flex gap-3">
                <a
                  className="text-brand"
                  href="https://github.com/christianjuth/blorp/issues"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Known issues
                </a>
                <span className="text-border">|</span>
                <a
                  className="text-brand"
                  href="https://github.com/christianjuth/blorp/issues/new"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Report issue [1]
                </a>
              </div>

              <span>[1] Report issue requires GitHub account</span>
            </section>
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
