import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firestore, storage } from "../lib/firebase";
import { db, type Catch, type SyncStatus } from "../db";

const CATCHES_COLLECTION = "catches";
const PHOTOS_PATH = "catch-photos";

interface FirestoreCatch {
  userId: string;
  timestamp: Timestamp;
  latitude: number;
  longitude: number;
  species?: string;
  weight?: number;
  length?: number;
  photoCloudUrl?: string;
  notes?: string;
  weatherData?: Catch["weatherData"];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function catchToFirestore(
  localCatch: Catch,
  userId: string,
): Omit<FirestoreCatch, "createdAt"> {
  return {
    userId,
    timestamp: Timestamp.fromDate(localCatch.timestamp),
    latitude: localCatch.latitude,
    longitude: localCatch.longitude,
    species: localCatch.species,
    weight: localCatch.weight,
    length: localCatch.length,
    photoCloudUrl: localCatch.photoCloudUrl,
    notes: localCatch.notes,
    weatherData: localCatch.weatherData,
    updatedAt: Timestamp.now(),
  };
}

function firestoreToCatch(
  firestoreData: FirestoreCatch,
  id: string,
  localCatch?: Catch,
): Partial<Catch> {
  return {
    id,
    userId: firestoreData.userId,
    timestamp: firestoreData.timestamp.toDate(),
    latitude: firestoreData.latitude,
    longitude: firestoreData.longitude,
    species: firestoreData.species,
    weight: firestoreData.weight,
    length: firestoreData.length,
    photoCloudUrl: firestoreData.photoCloudUrl,
    notes: firestoreData.notes,
    weatherData: firestoreData.weatherData,
    pendingWeatherFetch: localCatch?.pendingWeatherFetch ?? false,
    syncStatus: "synced" as SyncStatus,
    createdAt: firestoreData.createdAt?.toDate() ?? new Date(),
    updatedAt: firestoreData.updatedAt.toDate(),
  };
}

async function uploadPhoto(
  catchId: string,
  userId: string,
  photoUri: string,
): Promise<string> {
  const photoRef = ref(storage, `${PHOTOS_PATH}/${userId}/${catchId}`);

  if (photoUri.startsWith("data:")) {
    await uploadString(photoRef, photoUri, "data_url");
  } else {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    await uploadString(photoRef, base64, "data_url");
  }

  return await getDownloadURL(photoRef);
}

async function deletePhoto(catchId: string, userId: string): Promise<void> {
  try {
    const photoRef = ref(storage, `${PHOTOS_PATH}/${userId}/${catchId}`);
    await deleteObject(photoRef);
  } catch (error: unknown) {
    if ((error as { code?: string }).code !== "storage/object-not-found") {
      throw error;
    }
  }
}

async function updateLocalSyncStatus(
  catchId: string,
  status: SyncStatus,
  error?: string,
): Promise<void> {
  await db.catches.update(catchId, {
    syncStatus: status,
    lastSyncError: error,
    updatedAt: new Date(),
  });
}

export const cloudSyncService = {
  async syncCatch(
    localCatch: Catch,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateLocalSyncStatus(localCatch.id, "syncing");

      let photoCloudUrl = localCatch.photoCloudUrl;
      if (localCatch.photoUri && !localCatch.photoCloudUrl) {
        try {
          photoCloudUrl = await uploadPhoto(
            localCatch.id,
            userId,
            localCatch.photoUri,
          );
          await db.catches.update(localCatch.id, { photoCloudUrl });
        } catch (photoError) {
          console.warn(
            `[CloudSync] Photo upload failed for ${localCatch.id}:`,
            photoError,
          );
        }
      }

      const catchRef = doc(
        firestore,
        CATCHES_COLLECTION,
        `${userId}_${localCatch.id}`,
      );
      const existingDoc = await getDoc(catchRef);

      if (existingDoc.exists()) {
        const remoteData = existingDoc.data() as FirestoreCatch;
        const remoteUpdatedAt = remoteData.updatedAt.toDate();
        const localUpdatedAt = localCatch.updatedAt;

        if (remoteUpdatedAt > localUpdatedAt) {
          const mergedData = firestoreToCatch(
            remoteData,
            localCatch.id,
            localCatch,
          );
          await db.catches.update(localCatch.id, mergedData);
          console.log(`[CloudSync] Remote wins for ${localCatch.id}`);
          return { success: true };
        }
      }

      const firestoreData = catchToFirestore(
        { ...localCatch, photoCloudUrl },
        userId,
      );
      await setDoc(
        catchRef,
        {
          ...firestoreData,
          createdAt: existingDoc.exists()
            ? existingDoc.data().createdAt
            : serverTimestamp(),
        },
        { merge: true },
      );

      await updateLocalSyncStatus(localCatch.id, "synced");
      console.log(`[CloudSync] Synced catch ${localCatch.id}`);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";
      await updateLocalSyncStatus(localCatch.id, "failed", errorMessage);
      console.error(`[CloudSync] Failed to sync ${localCatch.id}:`, error);
      return { success: false, error: errorMessage };
    }
  },

  async deleteCatchFromCloud(
    catchId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const catchRef = doc(
        firestore,
        CATCHES_COLLECTION,
        `${userId}_${catchId}`,
      );
      await deleteDoc(catchRef);

      try {
        await deletePhoto(catchId, userId);
      } catch {
        console.warn(`[CloudSync] Photo deletion failed for ${catchId}`);
      }

      console.log(`[CloudSync] Deleted catch ${catchId} from cloud`);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown delete error";
      console.error(`[CloudSync] Failed to delete ${catchId}:`, error);
      return { success: false, error: errorMessage };
    }
  },

  async syncPendingCatches(userId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] };

    const pendingCatches = await db.catches
      .filter(
        (c) =>
          c.syncStatus === "pending" ||
          c.syncStatus === "failed" ||
          c.syncStatus === undefined,
      )
      .toArray();

    if (pendingCatches.length === 0) {
      return result;
    }

    console.log(
      `[CloudSync] Processing ${pendingCatches.length} pending catches...`,
    );

    for (const catchItem of pendingCatches) {
      const syncResult = await this.syncCatch(catchItem, userId);
      if (syncResult.success) {
        result.synced++;
      } else {
        result.failed++;
        if (syncResult.error) {
          result.errors.push(`${catchItem.id}: ${syncResult.error}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return result;
  },

  async retryFailedSync(userId: string): Promise<void> {
    const failedCatches = await db.catches
      .filter((c) => c.syncStatus === "failed")
      .toArray();

    for (const catchItem of failedCatches) {
      await db.catches.update(catchItem.id, { syncStatus: "pending" });
    }

    if (failedCatches.length > 0) {
      await this.syncPendingCatches(userId);
    }
  },
};
