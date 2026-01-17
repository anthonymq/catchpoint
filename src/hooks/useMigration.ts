import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { migrationService, type MigrationProgress } from "@/services/migration";
import { db } from "@/db";

interface UseMigrationReturn {
  showMigrationModal: boolean;
  unmigratedCount: number;
  progress: MigrationProgress | null;
  startMigration: () => Promise<void>;
  skipMigration: () => void;
  closeMigrationModal: () => void;
}

export function useMigration(): UseMigrationReturn {
  const { user } = useAuthStore();
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [unmigratedCount, setUnmigratedCount] = useState(0);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    async function checkMigration() {
      if (!user?.uid || hasChecked) return;

      setHasChecked(true);

      if (migrationService.isMigrationCompleted(user.uid)) {
        return;
      }

      const localCatches = await db.catches.toArray();
      const unmigratedLocalCatches = localCatches.filter(
        (c) =>
          !c.userId || c.syncStatus === undefined || c.syncStatus === "pending",
      );

      if (unmigratedLocalCatches.length > 0) {
        setUnmigratedCount(unmigratedLocalCatches.length);
        setShowMigrationModal(true);
      } else {
        migrationService.markMigrationCompleted(user.uid);
      }
    }

    checkMigration();
  }, [user?.uid, hasChecked]);

  const startMigration = useCallback(async () => {
    if (!user?.uid) return;

    setProgress({
      total: unmigratedCount,
      completed: 0,
      failed: 0,
      current: null,
      status: "preparing",
    });

    await migrationService.runMigration(user.uid, (newProgress) => {
      setProgress({ ...newProgress });
    });
  }, [user, unmigratedCount]);

  const skipMigration = useCallback(() => {
    if (user?.uid) {
      migrationService.skipMigration(user.uid);
    }
    setShowMigrationModal(false);
    setProgress(null);
  }, [user]);

  const closeMigrationModal = useCallback(() => {
    setShowMigrationModal(false);
    setProgress(null);
  }, []);

  return {
    showMigrationModal,
    unmigratedCount,
    progress,
    startMigration,
    skipMigration,
    closeMigrationModal,
  };
}
