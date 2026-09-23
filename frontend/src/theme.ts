// Design tokens for Ascend90 - dark-first gamified fitness app.
// Values sourced from /app/design_guidelines.json

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces
  surface: "#0D0E12",
  onSurface: "#F1F2F6",
  surfaceSecondary: "#1A1B22",
  onSurfaceSecondary: "#D8DCE5",
  surfaceTertiary: "#252731",
  onSurfaceTertiary: "#A0A6B5",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#0D0E12",
  muted: "#787D8E",

  // Brand
  brand: "#FF5A36",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF5A36",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF7A00",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FF5A361A",
  onBrandTertiary: "#FF5A36",

  // Status
  success: "#00E676",
  onSuccess: "#00331A",
  warning: "#FFC107",
  onWarning: "#332600",
  error: "#FF3B30",
  onError: "#FFFFFF",
  info: "#787D8E",
  onInfo: "#FFFFFF",

  // Lines
  border: "#252731",
  borderStrong: "#3A3D4A",
  divider: "#1A1B22",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.light ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export const colors = themes.dark;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors: c } = useTheme();
    return useMemo(() => StyleSheet.create(factory(c)), [c]);
  };
}
