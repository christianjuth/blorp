import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "./device";

export const privilegedFetch: typeof fetch = async (...args) => {
  if (isTauri()) {
    return tauriFetch(...args);
  }
  return fetch(...args);
};
