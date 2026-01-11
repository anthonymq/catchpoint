import { useState, useEffect, useCallback } from "react";
import { getStorageQuota } from "@/utils/storage";
import type { StorageQuota } from "@/utils/storage";

interface UseStorageQuotaReturn {
  /** Storage quota info, null if not available or loading */
  quota: StorageQuota | null;
  /** True while fetching quota */
  loading: boolean;
  /** Refresh the quota (call after data operations) */
  refresh: () => void;
}

/**
 * Hook to get and refresh storage quota information.
 *
 * Usage:
 * ```tsx
 * const { quota, loading, refresh } = useStorageQuota();
 * // After adding data:
 * refresh();
 * ```
 */
export function useStorageQuota(): UseStorageQuotaReturn {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStorageQuota();
      setQuota(result);
    } catch (error) {
      console.error("[useStorageQuota] Failed to fetch quota:", error);
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    quota,
    loading,
    refresh,
  };
}
