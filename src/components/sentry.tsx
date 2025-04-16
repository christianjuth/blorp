import * as Sentry from "@sentry/react";
import { useAuth } from "../stores/auth";
import pkgJson from "@/package.json";
import _ from "lodash";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isProd = import.meta.env.PROD;

const version =
  _.isObject(pkgJson) && "version" in pkgJson ? pkgJson.version : undefined;

const LOCAL_STORAGE_KEY = "sentry_ignore";

export function setSentryEnabled(enabled: boolean) {
  if (!enabled) {
    localStorage.setItem(LOCAL_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  initSentry();
}

function isSentryEnabled() {
  return localStorage.getItem(LOCAL_STORAGE_KEY) !== "true";
}

export function initSentry() {
  if (typeof SENTRY_DSN === "string" && isSentryEnabled()) {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: isProd,
      integrations: [Sentry.browserTracingIntegration()],
      release: version,
    });
  } else {
    Sentry.close();
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
