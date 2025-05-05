import Bowser from "bowser";

const browser = Bowser.getParser(window.navigator.userAgent);

export function isAndroid() {
  return browser.is("android");
}
