import _ from "lodash";

export function isTauri() {
  try {
    return _.isObject(window) && "isTauri" in window && window.isTauri;
  } catch {
    return false;
  }
}
