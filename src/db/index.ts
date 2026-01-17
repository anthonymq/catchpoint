import Dexie, { type EntityTable } from "dexie";
import type { WeatherData } from "../services/weather";

export type SyncStatus = "synced" | "syncing" | "pending" | "failed";

export interface Catch {
  id: string; // UUID
  userId?: string; // Firebase user ID (for multi-user support)
  timestamp: Date; // When caught
  latitude: number; // GPS lat (exact, stored locally only)
  longitude: number; // GPS lon (exact, stored locally only)
  waterBodyName?: string; // Optional water body name (lake, river, etc.)
  species?: string; // Fish species
  weight?: number; // In user's preferred unit (stored as lbs)
  length?: number; // In user's preferred unit (stored as inches)
  photoUri?: string; // Base64 or blob URL
  photoCloudUrl?: string; // Cloud Storage URL after upload
  notes?: string; // Free text
  weatherData?: WeatherData; // Weather data from OpenWeatherMap API
  pendingWeatherFetch: boolean; // True if weather needs sync
  pendingLocationRefresh?: boolean; // True if location needs async GPS refresh
  syncStatus: SyncStatus; // Cloud sync status
  lastSyncError?: string; // Last sync error message
  createdAt: Date;
  updatedAt: Date;
}

// Minimal type for insertion
export type InsertCatch = Omit<Catch, "createdAt" | "updatedAt">;

export interface UserProfile {
  userId: string; // Firebase user ID (primary key)
  displayName: string; // User's display name
  photoUrl?: string; // Base64 or blob URL for profile photo
  isPublic: boolean; // Profile visibility (public/private)
  createdAt: Date;
  updatedAt: Date;
}

// Minimal type for insertion
export type InsertUserProfile = Omit<UserProfile, "createdAt" | "updatedAt">;

export interface Follow {
  id: string; // Composite key: `${followerId}_${followedId}`
  followerId: string; // User who is following
  followedId: string; // User being followed
  createdAt: Date;
}

// Minimal type for insertion
export type InsertFollow = Omit<Follow, "createdAt">;

export interface Like {
  id: string; // Composite key: `${catchId}_${userId}`
  catchId: string; // The catch being liked
  userId: string; // User who liked
  catchOwnerId: string; // Owner of the catch (for notifications)
  createdAt: Date;
}

// Minimal type for insertion
export type InsertLike = Omit<Like, "createdAt">;

export interface Notification {
  id: string; // UUID
  userId: string; // User who receives the notification
  type: "like" | "follow" | "comment"; // Notification type
  actorId: string; // User who triggered the notification
  targetId?: string; // Related entity (catchId for likes, etc.)
  read: boolean;
  createdAt: Date;
}

// Minimal type for insertion
export type InsertNotification = Omit<Notification, "createdAt">;

const db = new Dexie("CatchpointDatabase") as Dexie & {
  catches: EntityTable<Catch, "id">;
  userProfiles: EntityTable<UserProfile, "userId">;
  follows: EntityTable<Follow, "id">;
  likes: EntityTable<Like, "id">;
  notifications: EntityTable<Notification, "id">;
};

// Schema declaration:
db.version(1).stores({
  catches: "id, timestamp, species, pendingWeatherFetch",
});

// Version 2: Add userProfiles table and userId index to catches
db.version(2).stores({
  catches: "id, timestamp, species, pendingWeatherFetch, userId",
  userProfiles: "userId",
});

// Version 3: Add syncStatus index for cloud sync
db.version(3).stores({
  catches: "id, timestamp, species, pendingWeatherFetch, userId, syncStatus",
  userProfiles: "userId",
});

// Version 4: Add follows table for follow/unfollow feature
db.version(4).stores({
  catches: "id, timestamp, species, pendingWeatherFetch, userId, syncStatus",
  userProfiles: "userId",
  follows: "id, followerId, followedId",
});

// Version 5: Add likes and notifications tables
db.version(5).stores({
  catches: "id, timestamp, species, pendingWeatherFetch, userId, syncStatus",
  userProfiles: "userId",
  follows: "id, followerId, followedId",
  likes: "id, catchId, userId, catchOwnerId, createdAt",
  notifications: "id, userId, type, read, createdAt",
});

export { db };
