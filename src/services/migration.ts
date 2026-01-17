import { db, type Catch, type SyncStatus } from "../db";
import { cloudSyncService } from "./cloudSync";

const MIGRATION_KEY = "catchpoint_migration_completed_for";

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  current: string | null;
  status: "idle" | "preparing" | "migrating" | "completed" | "error";
  error?: string;
}

export type MigrationProgressCallback = (progress: MigrationProgress) => void;

function getMigrationKey(userId: string): string {
  return `${MIGRATION_KEY}_${userId}`;
}

export const migrationService = {
  /**
   * Check if migration has been completed for a user
   */
  isMigrationCompleted(userId: string): boolean {
    const key = getMigrationKey(userId);
    return localStorage.getItem(key) === "true";
  },

  /**
   * Mark migration as completed for a user
   */
  markMigrationCompleted(userId: string): void {
    const key = getMigrationKey(userId);
    localStorage.setItem(key, "true");
  },

  /**
   * Get all local catches that need migration (no userId or different userId)
   */
  async getUnmigratedCatches(userId: string): Promise<Catch[]> {
    const allCatches = await db.catches.toArray();
    return allCatches.filter(
      (c) =>
        !c.userId ||
        c.userId !== userId ||
        c.syncStatus === undefined ||
        c.syncStatus === "pending",
    );
  },

  /**
   * Prepare catches for migration by setting syncStatus to pending
   */
  async prepareCatchesForMigration(
    catches: Catch[],
    userId: string,
  ): Promise<void> {
    const updates = catches.map((c) => ({
      key: c.id,
      changes: {
        userId,
        syncStatus: "pending" as SyncStatus,
        updatedAt: new Date(),
      },
    }));

    await Promise.all(
      updates.map(({ key, changes }) => db.catches.update(key, changes)),
    );

    console.log(`[Migration] Prepared ${catches.length} catches for migration`);
  },

  /**
   * Run the migration with progress updates
   */
  async runMigration(
    userId: string,
    onProgress?: MigrationProgressCallback,
  ): Promise<{ success: boolean; synced: number; failed: number }> {
    const progress: MigrationProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: null,
      status: "preparing",
    };

    const updateProgress = (updates: Partial<MigrationProgress>) => {
      Object.assign(progress, updates);
      onProgress?.(progress);
    };

    try {
      const catchesToMigrate = await this.getUnmigratedCatches(userId);

      if (catchesToMigrate.length === 0) {
        updateProgress({ status: "completed", total: 0, completed: 0 });
        this.markMigrationCompleted(userId);
        return { success: true, synced: 0, failed: 0 };
      }

      updateProgress({ total: catchesToMigrate.length, status: "preparing" });

      await this.prepareCatchesForMigration(catchesToMigrate, userId);

      updateProgress({ status: "migrating" });

      let synced = 0;
      let failed = 0;

      for (const catchItem of catchesToMigrate) {
        updateProgress({ current: catchItem.species || catchItem.id });

        try {
          const freshCatch = await db.catches.get(catchItem.id);
          if (freshCatch) {
            const result = await cloudSyncService.syncCatch(freshCatch, userId);
            if (result.success) {
              synced++;
            } else {
              failed++;
            }
          }
        } catch (error) {
          console.error(`[Migration] Failed to sync ${catchItem.id}:`, error);
          failed++;
        }

        updateProgress({
          completed: synced + failed,
          failed,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      updateProgress({
        status: "completed",
        current: null,
      });

      this.markMigrationCompleted(userId);

      console.log(`[Migration] Completed: ${synced} synced, ${failed} failed`);

      return { success: failed === 0, synced, failed };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Migration failed";
      updateProgress({
        status: "error",
        error: errorMessage,
      });
      console.error("[Migration] Error:", error);
      return {
        success: false,
        synced: progress.completed,
        failed: progress.failed,
      };
    }
  },

  /**
   * Skip migration and mark as completed
   */
  skipMigration(userId: string): void {
    this.markMigrationCompleted(userId);
    console.log("[Migration] Skipped by user");
  },
};
