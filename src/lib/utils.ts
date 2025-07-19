import _ from "lodash";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function isNotNull<T extends Record<any, any>>(obj: T | null): obj is T {
  return !_.isNull(obj);
}

export function isNotNil<T extends Record<any, any> | string | number>(
  obj: T | null | undefined,
): obj is T {
  return !_.isNil(obj);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeInstance(instance: string) {
  // Trim whitespace
  let url = instance.trim();

  // Prepend http:// if no protocol is found
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  // Use the URL API for parsing and formatting
  try {
    const urlObj = new URL(url);
    // toString() will include protocol, host, pathname, search, and hash
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    throw new Error(`Invalid URL: "${instance}"`);
  }
}
