import Plausible from "plausible-tracker";

const isProd = import.meta.env.MODE === "production";

export function initAnalytics() {
  const { enableAutoPageviews } = Plausible({
    domain: "blorpblorp.xyz",
    trackLocalhost: isProd,
  });
  enableAutoPageviews();
}
