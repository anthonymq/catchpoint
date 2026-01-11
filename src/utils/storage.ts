export interface StorageQuota {
  /** Bytes used */
  used: number;
  /** Total bytes available */
  quota: number;
  /** Percentage of quota used (0-100) */
  percentUsed: number;
  /** Human-readable formatted string, e.g. "12.5 MB of 100 MB" */
  formatted: string;
}

/**
 * Format bytes to human-readable string (KB, MB, GB)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Show 1 decimal place for MB and GB, none for smaller
  const decimals = i >= 2 ? 1 : 0;

  return `${value.toFixed(decimals)} ${units[i]}`;
}

/**
 * Get current storage quota and usage using the Storage API.
 * Falls back gracefully if API not available.
 */
export async function getStorageQuota(): Promise<StorageQuota | null> {
  // Check if Storage API is available
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn("[Storage] navigator.storage.estimate not available");
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();

    const used = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

    const formatted = `${formatBytes(used)} of ${formatBytes(quota)}`;

    return {
      used,
      quota,
      percentUsed,
      formatted,
    };
  } catch (error) {
    console.error("[Storage] Failed to get quota estimate:", error);
    return null;
  }
}

/**
 * Request persistent storage (prevents browser from clearing IndexedDB under storage pressure).
 * Returns true if granted, false if denied or not available.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    console.warn("[Storage] navigator.storage.persist not available");
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    console.log(
      `[Storage] Persistent storage: ${isPersisted ? "granted" : "denied"}`,
    );
    return isPersisted;
  } catch (error) {
    console.error("[Storage] Failed to request persistence:", error);
    return false;
  }
}

/**
 * Check if persistent storage is already granted.
 */
export async function isPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}
