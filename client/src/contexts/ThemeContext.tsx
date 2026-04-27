import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "escuro" | "claro" | "azul-gelo" | "azul-cinza" | "rosa";

export const THEME_OPTIONS: { id: ThemeName; label: string; preview: string; description: string }[] = [
  { id: "escuro", label: "Escuro", preview: "#0f0f0f", description: "Noturno e elegante" },
  { id: "claro", label: "Claro", preview: "#ffffff", description: "Limpo e minimalista" },
  { id: "azul-gelo", label: "Azul Gelo", preview: "#DEE6F3", description: "Suave e refrescante" },
  { id: "azul-cinza", label: "Azul Cinza", preview: "#7181A5", description: "Sofisticado e neutro" },
  { id: "rosa", label: "Rosa Suave", preview: "#F5D6E0", description: "Elegante e acolhedor" },
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

export function ThemeProvider({ children, defaultTheme = "escuro" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem("avalia-theme");
    if (stored && THEME_OPTIONS.some(t => t.id === stored)) return stored as ThemeName;
    return defaultTheme;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("avalia-theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    THEME_OPTIONS.forEach(t => root.classList.remove(`theme-${t.id}`));
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    // Also toggle dark class for shadcn compatibility
    if (theme === "escuro" || theme === "azul-cinza") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
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
