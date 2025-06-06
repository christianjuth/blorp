import { Capacitor } from "@capacitor/core";
import Bowser from "bowser";
import _ from "lodash";

const browser = Bowser.getParser(window.navigator.userAgent);

export function isAndroid() {
  return browser.is("android");
}

export function isTauri(): boolean {
  try {
    return _.isObject(window) && "isTauri" in window && Boolean(window.isTauri);
  } catch {
    return false;
  }
}

const MODE = import.meta.env.MODE;
export function isDev() {
  return MODE === "development";
}

export function isNative() {
  return Capacitor.isNativePlatform();
}
