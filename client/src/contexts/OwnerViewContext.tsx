import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppRole } from "@shared/role-visibility";
import { useQueryClient } from "@tanstack/react-query";

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
  const [viewingAs, setViewingAsState] = useState<AppRole | null>(null);
  const queryClient = useQueryClient();

  const setViewingAs = (role: AppRole | null) => {
    setViewingAsState(role);
    // Sync to window for tRPC headers (main.tsx reads this)
    (window as any).__ownerViewingAs = role;
    // Invalidate all queries so they re-fetch with the new x-viewing-as header
    queryClient.invalidateQueries();
  };

  return (
    <OwnerViewContext.Provider value={{ viewingAs, setViewingAs }}>
      {children}
    </OwnerViewContext.Provider>
  );
}

export function useOwnerView() {
  return useContext(OwnerViewContext);
}
