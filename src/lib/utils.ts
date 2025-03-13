import _ from "lodash";

export function isNotNull<T extends Record<any, any>>(obj: T | null): obj is T {
  return !_.isNull(obj);
}
