// Design tokens for Fecap Ágora — Emerald / Mint palette, iOS Native + Glass/Luxe personality.
// Values are the source of truth for all styles.

export const palette = {
  light: {
    surface: "#F9F9FA",
    onSurface: "#111112",
    surfaceSecondary: "#FFFFFF",
    onSurfaceSecondary: "#3A3A3C",
    surfaceTertiary: "#F0F0F2",
    onSurfaceTertiary: "#5C5C60",
    surfaceInverse: "#111112",
    onSurfaceInverse: "#F9F9FA",
    brand: "#047857",
    brandPrimary: "#059669",
    onBrandPrimary: "#FFFFFF",
    brandSecondary: "#D1FAE5",
    onBrandSecondary: "#065F46",
    brandTertiary: "#A7F3D0",
    onBrandTertiary: "#064E3B",
    success: "#16A34A",
    onSuccess: "#FFFFFF",
    warning: "#F59E0B",
    onWarning: "#FFFFFF",
    error: "#EF4444",
    onError: "#FFFFFF",
    info: "#6B7280",
    onInfo: "#FFFFFF",
    border: "#E4E4E7",
    borderStrong: "#D4D4D8",
    divider: "#F4F4F5",
    like: "#22C55E",
    pass: "#EF4444",
    superMatch: "#3B82F6",
  },
  dark: {
    surface: "#0A0A0C",
    onSurface: "#F9F9FA",
    surfaceSecondary: "#141416",
    onSurfaceSecondary: "#EBEBEF",
    surfaceTertiary: "#1C1C1E",
    onSurfaceTertiary: "#98989F",
    surfaceInverse: "#F9F9FA",
    onSurfaceInverse: "#111112",
    brand: "#34D399",
    brandPrimary: "#10B981",
    onBrandPrimary: "#022C22",
    brandSecondary: "#065F46",
    onBrandSecondary: "#D1FAE5",
    brandTertiary: "#064E3B",
    onBrandTertiary: "#A7F3D0",
    success: "#22C55E",
    onSuccess: "#022C22",
    warning: "#FBBF24",
    onWarning: "#451A03",
    error: "#F87171",
    onError: "#450A0A",
    info: "#9CA3AF",
    onInfo: "#111827",
    border: "#27272A",
    borderStrong: "#3F3F46",
    divider: "#18181B",
    like: "#22C55E",
    pass: "#F87171",
    superMatch: "#60A5FA",
  },
};

export type ThemeMode = "light" | "dark";
export type ColorPalette = typeof palette.light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
  },
  letter: {
    tight: -0.4,
    normal: 0,
    wide: 0.5,
  },
};

export const shadows = (mode: ThemeMode) => ({
  sm: mode === "dark"
    ? { shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }
    : { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: mode === "dark"
    ? { shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 }
    : { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  lg: mode === "dark"
    ? { shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 }
    : { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
});
