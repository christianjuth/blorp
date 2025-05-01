import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export async function getPermission() {
  console.log("I AM HERE");

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const { display } = await LocalNotifications.checkPermissions();

  if (display === "denied" || display === "granted") {
    return;
  }

  LocalNotifications.requestPermissions();
}
