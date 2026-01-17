import { useEffect, useCallback, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { cloudSyncService } from "../services/cloudSync";
import { useAuthStore } from "../stores/authStore";
import { db, type Catch } from "../db";
import { useCatchStore } from "../stores/catchStore";

interface CloudSyncState {
  syncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
}

export const useCloudSync = () => {
  const isOnline = useNetworkStatus();
  const { user } = useAuthStore();
  const { catches, fetchCatches } = useCatchStore();
  const syncingRef = useRef(false);
  const lastSyncRef = useRef<Date | null>(null);

  const syncPending = useCallback(async () => {
    if (!user?.uid || syncingRef.current || !isOnline) return;

    syncingRef.current = true;
    try {
      const result = await cloudSyncService.syncPendingCatches(user.uid);
      if (result.synced > 0 || result.failed > 0) {
        lastSyncRef.current = new Date();
        await fetchCatches();
      }
      console.log(
        `[CloudSync] Sync complete: ${result.synced} synced, ${result.failed} failed`,
      );
    } finally {
      syncingRef.current = false;
    }
  }, [user?.uid, isOnline, fetchCatches]);

  const syncCatch = useCallback(
    async (catchData: Catch) => {
      if (!user?.uid) return;

      if (isOnline) {
        await cloudSyncService.syncCatch(catchData, user.uid);
        await fetchCatches();
      } else {
        await db.catches.update(catchData.id, { syncStatus: "pending" });
      }
    },
    [user?.uid, isOnline, fetchCatches],
  );

  const deleteCatchFromCloud = useCallback(
    async (catchId: string) => {
      if (!user?.uid) return;

      if (isOnline) {
        await cloudSyncService.deleteCatchFromCloud(catchId, user.uid);
      }
    },
    [user?.uid, isOnline],
  );

  useEffect(() => {
    if (isOnline && user?.uid) {
      syncPending();
    }
  }, [isOnline, user?.uid, syncPending]);

  useEffect(() => {
    if (!isOnline || !user?.uid) return;

    const interval = setInterval(syncPending, 60000);
    return () => clearInterval(interval);
  }, [isOnline, user?.uid, syncPending]);

  const getState = (): CloudSyncState => ({
    syncing: syncingRef.current,
    lastSyncTime: lastSyncRef.current,
    pendingCount: catches.filter(
      (c) => c.syncStatus === "pending" || c.syncStatus === "failed",
    ).length,
  });

  return {
    syncPending,
    syncCatch,
    deleteCatchFromCloud,
    getState,
    isOnline,
  };
};
