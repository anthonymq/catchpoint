import React, { createContext, useContext, useEffect } from "react";
import { useCloudSync } from "../hooks/useCloudSync";
import { useAuthStore } from "../stores/authStore";
import type { Catch } from "../db";

interface CloudSyncContextValue {
  syncPending: () => Promise<void>;
  syncCatch: (catchData: Catch) => Promise<void>;
  deleteCatchFromCloud: (catchId: string) => Promise<void>;
  isOnline: boolean;
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

export function useCloudSyncContext() {
  const context = useContext(CloudSyncContext);
  if (!context) {
    throw new Error(
      "useCloudSyncContext must be used within CloudSyncProvider",
    );
  }
  return context;
}

interface CloudSyncProviderProps {
  children: React.ReactNode;
}

export const CloudSyncProvider: React.FC<CloudSyncProviderProps> = ({
  children,
}) => {
  const { user } = useAuthStore();
  const { syncPending, syncCatch, deleteCatchFromCloud, isOnline } =
    useCloudSync();

  useEffect(() => {
    if (user?.uid && isOnline) {
      syncPending();
    }
  }, [user?.uid, isOnline, syncPending]);

  return (
    <CloudSyncContext.Provider
      value={{
        syncPending,
        syncCatch,
        deleteCatchFromCloud,
        isOnline,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
};
