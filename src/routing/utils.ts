import z from "zod";

export function buildRoute<P extends string>(
  path: P,
): Record<P, { path: P; schema: never }>;
export function buildRoute<P extends string, S extends z.ZodObject<any>>(
  path: P,
  schema: S,
): Record<P, { path: P; schema: S }>;
export function buildRoute<P extends string, S extends z.ZodObject<any>>(
  path: P,
  schema?: S,
): Record<P, { path: P; schema: S | never }> {
  return {
    [path]: {
      path,
      schema,
    },
  } as any;
}

export const LEFT_SIDEBAR_MENU_ID = "left-sidebar-menu";
export const RIGHT_SIDEBAR_MENU_ID = "right-sidebar-menu";
