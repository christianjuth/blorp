import { ContentGutters } from "@/src/components/gutters";
import { IonContent, IonHeader, IonPage, IonToolbar } from "@ionic/react";
import { PageTitle } from "../components/page-title";
import z from "zod";
import { useConfirmationAlert, useUrlSearchState } from "../lib/hooks";
import { useSite } from "../lib/api";
import { useEffect } from "react";
import { useAuth } from "../stores/auth";
import { useHistory } from "react-router";
import { resolveRoute } from "../routing";
import { env } from "../env";
import NotFound from "./not-found";

function compareHosts(a: string, b: string) {
  try {
    const aUrl = new URL(a);
    const bUrl = new URL(b);
    return aUrl.host === bUrl.host;
  } catch {
    return false;
  }
}

export default function Instance() {
  const history = useHistory();

  const [instance] = useUrlSearchState("q", "", z.string());
  const site = useSite({
    instance,
  });

  const alrt = useConfirmationAlert();
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);
  const addAccount = useAuth((s) => s.addAccount);
  const updateSelectedAccount = useAuth((s) => s.updateSelectedAccount);

  useEffect(() => {
    if (env.REACT_APP_LOCK_TO_DEFAULT_INSTANCE) {
      return;
    }

    const siteInstance = site.data?.instance;
    if (site.error) {
      const id = setTimeout(() => {
        history.replace(resolveRoute("/home"));
      }, 5000);
      return () => clearTimeout(id);
    } else if (siteInstance) {
      const notLoggedIn = accounts.length <= 1 && !accounts[0]?.jwt;

      if (notLoggedIn) {
        updateSelectedAccount({
          instance: siteInstance,
        });
        history.replace(resolveRoute("/home"));
        return;
      }

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        if (account && compareHosts(siteInstance, account.instance)) {
          setAccountIndex(i);
          history.replace(resolveRoute("/home"));
          return;
        }
      }

      alrt({
        header: `Add ${siteInstance}?`,
        message: "It will be added to your existing accounts",
        cancelText: "No",
        confirmText: "Yes",
      })
        .then(() => {
          addAccount({
            instance: siteInstance,
          });
        })
        .finally(() => {
          history.replace(resolveRoute("/home"));
        });
    }
  }, [
    env.REACT_APP_LOCK_TO_DEFAULT_INSTANCE,
    accounts,
    site.data,
    site.error,
    addAccount,
    updateSelectedAccount,
  ]);

  if (env.REACT_APP_LOCK_TO_DEFAULT_INSTANCE) {
    return <NotFound />;
  }

  return (
    <IonPage>
      <PageTitle />
      <IonHeader>
        <IonToolbar />
      </IonHeader>
      <IonContent>
        <ContentGutters>
          <div className="p-5">
            {site.error && (
              <span>
                Failed to load instance {instance}. You will be redirected home
                in 5 seconds.
              </span>
            )}
            {site.isPending && site.failureCount === 0 && <span>Loading</span>}
            {!site.error && site.failureCount > 0 && (
              <span>This is taking longer than expected</span>
            )}
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
