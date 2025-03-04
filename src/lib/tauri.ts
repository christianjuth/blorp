import _ from "lodash";
import { check } from "@tauri-apps/plugin-updater";
import { confirm } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

export function isTauri(): boolean {
  try {
    return _.isObject(window) && "isTauri" in window && Boolean(window.isTauri);
  } catch {
    return false;
  }
}

export async function tauriCheckUpdate() {
  if (isTauri()) {
    return;
  }
  try {
    return await check();
  } catch {
    return;
  }
}

export async function updateTauri() {
  try {
    if (isTauri()) {
      const update = await check();
      if (update) {
        await update.download();
        const shouldInstall = await confirm(
          `Blorp version ${update.version} is available. You may be prompted for a password if you choose to update.`,
          {
            okLabel: "Update",
          },
        );
        if (shouldInstall) {
          await update.install();
          const shouldRelaunch = await confirm(
            "Update successful! You can restart now or later to apply the update.",
            {
              okLabel: "Relaunch",
              cancelLabel: "Later",
            },
          );
          if (shouldRelaunch) {
            await relaunch();
          }
        }
      }
    }
  } catch (err) {
    console.log("failed to update blorp", err);
  }
}
