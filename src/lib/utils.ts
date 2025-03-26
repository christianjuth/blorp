import _ from "lodash";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function isNotNull<T extends Record<any, any>>(obj: T | null): obj is T {
  return !_.isNull(obj);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
