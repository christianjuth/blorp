import { createThemeBuilder } from "@tamagui/theme-builder";
import {
  darkColors,
  darkShadowColor,
  darkShadowColorStrong,
  lightColors,
  lightShadowColor,
  lightShadowColorStrong,
  palettes,
} from "./colors";

const shadows = {
  light: {
    shadowColor: lightShadowColor,
    shadowColorStrong: lightShadowColorStrong,
  },
  dark: {
    shadowColor: darkShadowColor,
    shadowColorStrong: darkShadowColorStrong,
  },
};

const nonInherited = {
  light: {
    ...lightColors,
    ...shadows.light,
  },
  dark: {
    ...darkColors,
    ...shadows.dark,
  },
};

// --- themeBuilder ---

const templates = {
  base: {
    accentBackground: 0,
    accentColor: -0,

    background0: 1,
    background025: 2,
    background05: 3,
    background075: 4,
    color1: 6,
    color2: 7,
    color3: 8,
    color4: 9,
    color5: 10,
    color6: 11,
    color7: 12,
    color8: 13,
    color9: 14,
    color10: 15,
    color11: 16,
    color12: 17,
    color13: 18,
    color0: -1,
    color025: -2,
    color05: -3,
    color075: -4,

    color: 17,
    background: 5,
    borderColor: 7,
  },
};

const themeBuilder = createThemeBuilder()
  .addPalettes(palettes)
  .addTemplates(templates)
  .addThemes({
    light: {
      template: "base",
      palette: "light",
      nonInheritedValues: nonInherited.light,
    },
    dark: {
      template: "base",
      palette: "dark",
      nonInheritedValues: nonInherited.dark,
    },
  })
  .addChildThemes({
    gray: {
      palette: "gray",
      template: "base",
    },
    yellow: {
      palette: "yellow",
      template: "base",
    },
  });
// no need for componet themes for us
// .addComponentThemes(defaultComponentThemes, {
//   avoidNestingWithin: ['alt1', 'alt2'],
// })

// --- themes ---

const themesIn = themeBuilder.build();

type ThemeKeys = keyof typeof templates.base | keyof typeof nonInherited.light;

export type Theme = Record<ThemeKeys, string>;

export type ThemesOut = Record<keyof typeof themesIn, Theme>;

export const themes = themesIn as any as ThemesOut;
