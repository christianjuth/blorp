import * as Sentry from "@sentry/react";
import { useAuth } from "../stores/auth";
import pkgJson from "@/package.json";
import _ from "lodash";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isProd = import.meta.env.PROD;

const version =
  _.isObject(pkgJson) && "version" in pkgJson ? pkgJson.version : undefined;

export function initSentry() {
  if (typeof SENTRY_DSN === "string") {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: isProd,
      integrations: [Sentry.browserTracingIntegration()],
      release: version,
    });
  }
}

export function SentryAddCtx() {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const numAccounts = useAuth((s) => s.accounts.length);
  const instance = useAuth((s) => s.getSelectedAccount().instance);

  // Intentionally omit any information that could
  // be used to trace back to a specific user
  Sentry.setContext("appState", {
    isLoggedIn,
    numAccounts,
    lemmyInstance: instance,
  });

  return null;
}
