import _ from "lodash";

export function isTauri(): boolean {
  try {
    return _.isObject(window) && "isTauri" in window && Boolean(window.isTauri);
  } catch {
    return false;
  }
}
