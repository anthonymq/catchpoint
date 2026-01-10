import Dexie, { type EntityTable } from "dexie";

export interface Catch {
  id: string; // UUID
  timestamp: Date; // When caught
  latitude: number; // GPS lat
  longitude: number; // GPS lon
  species?: string; // Fish species
  weight?: number; // In user's preferred unit (stored as lbs)
  length?: number; // In user's preferred unit (stored as inches)
  photoUri?: string; // Base64 or blob URL
  notes?: string; // Free text
  weatherData?: Record<string, any>; // Flexible storage for weather API response
  pendingWeatherFetch: boolean; // True if weather needs sync
  createdAt: Date;
  updatedAt: Date;
}

// Minimal type for insertion
export type InsertCatch = Omit<Catch, "createdAt" | "updatedAt">;

const db = new Dexie("CatchpointDatabase") as Dexie & {
  catches: EntityTable<Catch, "id">;
};

// Schema declaration:
db.version(1).stores({
  catches: "id, timestamp, species, pendingWeatherFetch",
});

export { db };
