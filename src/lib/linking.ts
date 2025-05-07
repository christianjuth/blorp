import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "./device";

export function shouldOpenInNewTab(url: string) {
  try {
    const urlObject = new URL(url, window.location.origin);
    return !!urlObject.host && !url.startsWith("/");
  } catch {
    return false; // Treat invalid URLs as relative
  }
}

export async function openUrl(url: string) {
  if (isTauri()) {
    return await tauriOpenUrl(url);
  }
  window.open(url, "_blank");
}
