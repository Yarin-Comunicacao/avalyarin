import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "creme";

export const THEME_OPTIONS: { id: ThemeName; label: string; preview: string; description: string }[] = [
  { id: "creme", label: "Creme", preview: "#FDF8F0", description: "Elegância Gastronômica" },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme = "creme" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return "creme";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    THEME_OPTIONS.forEach(t => root.classList.remove(`theme-${t.id}`));
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    // Light theme only - remove dark class
    root.classList.remove("dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, sidebarOpen, setSidebarOpen }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
