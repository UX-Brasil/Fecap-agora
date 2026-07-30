import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { storage } from "@/src/utils/storage";
import { ColorPalette, ThemeMode, palette, radius, shadows, spacing, typography } from "./tokens";

const THEME_KEY = "asa_theme_mode";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ColorPalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: ReturnType<typeof shadows>;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(system === "light" ? "light" : "dark");

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<string>(THEME_KEY, "");
      if (stored === "light" || stored === "dark") setModeState(stored);
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.setItem(THEME_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      storage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    colors: palette[mode],
    spacing,
    radius,
    typography,
    shadows: shadows(mode),
    toggleTheme,
    setMode,
  }), [mode, toggleTheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
