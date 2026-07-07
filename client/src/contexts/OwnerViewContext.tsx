import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppRole } from "@shared/role-visibility";

type OwnerViewContextType = {
  /** The role the owner is currently viewing as (null = default owner view) */
  viewingAs: AppRole | null;
  setViewingAs: (role: AppRole | null) => void;
};

const OwnerViewContext = createContext<OwnerViewContextType>({
  viewingAs: null,
  setViewingAs: () => {},
});

export function OwnerViewProvider({ children }: { children: ReactNode }) {
  const [viewingAs, setViewingAs] = useState<AppRole | null>(null);
  return (
    <OwnerViewContext.Provider value={{ viewingAs, setViewingAs }}>
      {children}
    </OwnerViewContext.Provider>
  );
}

export function useOwnerView() {
  return useContext(OwnerViewContext);
}
