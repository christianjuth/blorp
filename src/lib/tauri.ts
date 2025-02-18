import _ from "lodash";

export function isTauri() {
  return _.isObject(window) && "isTauri" in window && window.isTauri;
}
