import React, { createContext, useContext, useEffect, useState } from "react";

export interface BackgroundOption {
  id: string;
  label: string;
  thumbnail: string; // URL for the thumbnail preview
  url: string; // Full URL for the background
}

const DAY_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-day-L5iDZ7EiwgNVQfD5ihnqAL.webp";
const NIGHT_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-night-TGrHgM2B6Cr3AosUR4maEJ.webp";

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: "noturna", label: "Noturna", thumbnail: NIGHT_IMAGE, url: NIGHT_IMAGE },
  { id: "diurna", label: "Diurna", thumbnail: DAY_IMAGE, url: DAY_IMAGE },
  { id: "balada", label: "Balada", thumbnail: "/manus-storage/balada-category-cover-new_ed3d8dab.jpg", url: "/manus-storage/balada-category-cover-new_ed3d8dab.jpg" },
  { id: "coquetelaria", label: "Coquetelaria", thumbnail: "/manus-storage/coquetelaria-new_f91b0ec6.png", url: "/manus-storage/coquetelaria-new_f91b0ec6.png" },
  { id: "pub", label: "Pub", thumbnail: "/manus-storage/pub_f0bce0fc.jpg", url: "/manus-storage/pub_f0bce0fc.jpg" },
  { id: "cervejaria", label: "Cervejaria", thumbnail: "/manus-storage/cervejaria_63a913e9.jpg", url: "/manus-storage/cervejaria_63a913e9.jpg" },
  { id: "cafeteria", label: "Cafeteria", thumbnail: "/manus-storage/cafeteria_22b87b10.jpg", url: "/manus-storage/cafeteria_22b87b10.jpg" },
  { id: "hamburgueria", label: "Hamburgueria", thumbnail: "/manus-storage/hamburgueria_0fce64e3.jpg", url: "/manus-storage/hamburgueria_0fce64e3.jpg" },
  { id: "pizzaria", label: "Pizzaria", thumbnail: "/manus-storage/pizzaria_5e6621ea.jpg", url: "/manus-storage/pizzaria_5e6621ea.jpg" },
  { id: "confeitaria", label: "Confeitaria", thumbnail: "/manus-storage/confeitaria_0e72f9c5.jpg", url: "/manus-storage/confeitaria_0e72f9c5.jpg" },
  { id: "bar-musical", label: "Bar Musical", thumbnail: "/manus-storage/bar-musical_b029535e.jpg", url: "/manus-storage/bar-musical_b029535e.jpg" },
  { id: "cozinha-brasileira", label: "Cozinha Brasileira", thumbnail: "/manus-storage/cozinha-brasileira_edf2edac.jpg", url: "/manus-storage/cozinha-brasileira_edf2edac.jpg" },
];

interface BackgroundContextType {
  background: string;
  setBackground: (id: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBackgroundState] = useState<string>(() => {
    const stored = localStorage.getItem("avalia-background");
    if (stored && BACKGROUND_OPTIONS.some(b => b.id === stored)) return stored;
    return "noturna";
  });

  const setBackground = (id: string) => {
    setBackgroundState(id);
    localStorage.setItem("avalia-background", id);
  };

  // Apply background dynamically
  useEffect(() => {
    const option = BACKGROUND_OPTIONS.find(b => b.id === background);
    if (!option) return;

    const root = document.documentElement;
    root.style.setProperty("--app-background-url", `url('${option.url}')`);
  }, [background]);

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
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
