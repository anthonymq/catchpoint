import Dexie, { type EntityTable } from "dexie";
import type { WeatherData } from "../services/weather";

export interface Catch {
  id: string; // UUID
  userId?: string; // Firebase user ID (for multi-user support)
  timestamp: Date; // When caught
  latitude: number; // GPS lat
  longitude: number; // GPS lon
  species?: string; // Fish species
  weight?: number; // In user's preferred unit (stored as lbs)
  length?: number; // In user's preferred unit (stored as inches)
  photoUri?: string; // Base64 or blob URL
  notes?: string; // Free text
  weatherData?: WeatherData; // Weather data from OpenWeatherMap API
  pendingWeatherFetch: boolean; // True if weather needs sync
  pendingLocationRefresh?: boolean; // True if location needs async GPS refresh
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

const db = new Dexie("CatchpointDatabase") as Dexie & {
  catches: EntityTable<Catch, "id">;
  userProfiles: EntityTable<UserProfile, "userId">;
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

export { db };
