import Plausible from "plausible-tracker";

const isProd = import.meta.env.MODE === "production";

export function setPlausibleEnabled(enabled: boolean) {
  // See: https://plausible.io/docs/excluding-localstorage
  if (!enabled) {
    localStorage.setItem("plausible_ignore", "true");
  } else {
    localStorage.removeItem("plausible_ignore");
  }
}

export function initAnalytics() {
  const { enableAutoPageviews } = Plausible({
    domain: "blorpblorp.xyz",
    trackLocalhost: isProd,
  });
  enableAutoPageviews();
}
