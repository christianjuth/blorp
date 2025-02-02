import * as Sentry from "@sentry/react-native";
import { usePathname } from "one";
import { useAuth } from "../stores/auth";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isProd = import.meta.env.PROD;

export function initSentry() {
  if (typeof SENTRY_DSN === "string") {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: isProd,
    });
  }
}

export function SentryAddCtx() {
  const pathname = usePathname();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const numAccounts = useAuth((s) => s.accounts.length);
  const instance = useAuth((s) => s.getSelectedAccount().instance);

  // Intentionally omit any information that could
  // be used to trace back to a specific user
  Sentry.setContext("appState", {
    pathname,
    isLoggedIn,
    numAccounts,
    lemmyInstance: instance,
  });

  return null;
}
