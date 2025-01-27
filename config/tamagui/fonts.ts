import type { FillInFont, GenericFont } from "@tamagui/core";
import { createFont, isWeb } from "tamagui";
import { scale } from "./scale";

const defaultSizes = {
  1: 11 * scale,
  2: 12 * scale,
  3: 13 * scale,
  4: 14 * scale,
  true: 14 * scale,
  5: 16 * scale,
  6: 18 * scale,
  7: 20 * scale,
  8: 23 * scale,
  9: 30 * scale,
  10: 46 * scale,
  11: 55 * scale,
  12: 62 * scale,
  13: 72 * scale,
  14: 92 * scale,
  15: 114 * scale,
  16: 134 * scale,
} as const;

const body = createMainFont(
  {
    weight: {
      1: "400",
      7: "600",
    },
  },
  {
    sizeSize: (size) => Math.round(size),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size >= 12 ? 10 : 4)),
  },
);

export const fonts = {
  body,
};

function createMainFont<A extends GenericFont>(
  font: Partial<A> = {},
  {
    sizeLineHeight = (size) => size + 10,
    sizeSize = (size) => size * 1,
  }: {
    sizeLineHeight?: (fontSize: number) => number;
    sizeSize?: (size: number) => number;
  } = {},
): FillInFont<A, keyof typeof defaultSizes> {
  // merge to allow individual overrides
  const size = Object.fromEntries(
    Object.entries({
      ...defaultSizes,
      ...font.size,
    }).map(([k, v]) => [k, sizeSize(+v)]),
  );
  return createFont({
    family: isWeb
      ? '-apple-system, Inter, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      : "System",
    lineHeight: Object.fromEntries(
      Object.entries(size).map(([k, v]) => [k, sizeLineHeight(v)]),
    ),
    weight: {
      4: "300",
    },
    letterSpacing: {
      4: 0,
    },
    ...(font as any),
    size,
  });
}
