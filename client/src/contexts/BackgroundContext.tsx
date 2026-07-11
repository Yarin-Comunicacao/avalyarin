import React, { createContext, useContext, useEffect, useState } from "react";

export interface BackgroundOption {
  id: string;
  label: string;
  thumbnail: string;
  url: string;
}

const DAY_IMAGE = "/storage/age-gate-day-L5iDZ7EiwgNVQfD5ihnqAL.webp";
const NIGHT_IMAGE = "/storage/age-gate-night-TGrHgM2B6Cr3AosUR4maEJ.webp";

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: "noturna", label: "Noturna", thumbnail: NIGHT_IMAGE, url: NIGHT_IMAGE },
  { id: "diurna", label: "Diurna", thumbnail: DAY_IMAGE, url: DAY_IMAGE },
];

interface BackgroundContextType {
  background: string;
  setBackground: (id: string) => void;
  customBackgroundUrl: string | null;
  setCustomBackground: (url: string | null) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBackgroundState] = useState<string>(() => {
    const stored = localStorage.getItem("avalia-background");
    if (stored === "custom") return "custom";
    if (stored && BACKGROUND_OPTIONS.some(b => b.id === stored)) return stored;
    return "noturna";
  });

  const [customBackgroundUrl, setCustomBackgroundUrlState] = useState<string | null>(() => {
    return localStorage.getItem("avalia-background-custom-url");
  });

  const setBackground = (id: string) => {
    setBackgroundState(id);
    localStorage.setItem("avalia-background", id);
  };

  const setCustomBackground = (url: string | null) => {
    setCustomBackgroundUrlState(url);
    if (url) {
      localStorage.setItem("avalia-background-custom-url", url);
      setBackgroundState("custom");
      localStorage.setItem("avalia-background", "custom");
    } else {
      localStorage.removeItem("avalia-background-custom-url");
      setBackgroundState("noturna");
      localStorage.setItem("avalia-background", "noturna");
    }
  };

  // Apply background dynamically
  useEffect(() => {
    const root = document.documentElement;
    if (background === "custom" && customBackgroundUrl) {
      root.style.setProperty("--app-background-url", `url('${customBackgroundUrl}')`);
    } else {
      const option = BACKGROUND_OPTIONS.find(b => b.id === background);
      if (option) {
        root.style.setProperty("--app-background-url", `url('${option.url}')`);
      }
    }
  }, [background, customBackgroundUrl]);

  return (
    <BackgroundContext.Provider value={{ background, setBackground, customBackgroundUrl, setCustomBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error("useBackground must be used within BackgroundProvider");
  }
  return context;
}
