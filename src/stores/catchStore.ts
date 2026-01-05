import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { db } from '../db/client';
import { catches, InsertCatch, Catch } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

interface CatchState {
  catches: Catch[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCatches: () => Promise<void>;
  createCatch: (catchData: Omit<InsertCatch, 'id' | 'createdAt'>) => Promise<Catch>;
  getCatchById: (id: string) => Promise<Catch | null>;
  updateCatch: (id: string, updates: Partial<InsertCatch>) => Promise<void>;
  deleteCatch: (id: string) => Promise<void>;
  getPendingWeatherFetches: () => Promise<Catch[]>;
  markWeatherFetched: (id: string, weatherData: {
    temperature: number;
    temperatureUnit: string;
    weatherCondition: string | null;
    pressure: number;
    pressureUnit: string;
    humidity: number;
    windSpeed: number;
    weatherFetchedAt: Date;
  }) => Promise<void>;
}

export const useCatchStore = create<CatchState>((set, get) => ({
  catches: [],
  loading: false,
  error: null,

  fetchCatches: async () => {
    set({ loading: true, error: null });
    try {
      const result = await db.select().from(catches).orderBy(desc(catches.createdAt));
      set({ catches: result, loading: false });
    } catch (error) {
      console.error('[Store] Failed to fetch catches:', error);
      set({ error: 'Failed to fetch catches', loading: false });
    }
  },

  createCatch: async (catchData) => {
    set({ loading: true, error: null });
    try {
      const newCatch: InsertCatch = {
        ...catchData,
        id: Crypto.randomUUID(),
        createdAt: new Date(),
        isDraft: true,
        pendingWeatherFetch: true,
      };

      const result = await db.insert(catches).values(newCatch).returning();
      
      if (result.length === 0) {
        throw new Error('Failed to create catch');
      }

      const createdCatch = result[0];
      
      set((state) => ({
        catches: [createdCatch, ...state.catches],
        loading: false,
      }));

      return createdCatch;
    } catch (error) {
      console.error('[Store] Failed to create catch:', error);
      set({ error: 'Failed to create catch', loading: false });
      throw error;
    }
  },

  getCatchById: async (id) => {
    try {
      const result = await db.select().from(catches).where(eq(catches.id, id)).limit(1);
      return result[0] ?? null;
    } catch (error) {
      console.error('[Store] Failed to get catch by id:', error);
      return null;
    }
  },

  updateCatch: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await db.update(catches)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(catches.id, id));

      // Update local state
      set((state) => ({
        catches: state.catches.map((c) => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('[Store] Failed to update catch:', error);
      set({ error: 'Failed to update catch', loading: false });
      throw error;
    }
  },

  deleteCatch: async (id) => {
    set({ loading: true, error: null });
    try {
      await db.delete(catches).where(eq(catches.id, id));

      set((state) => ({
        catches: state.catches.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('[Store] Failed to delete catch:', error);
      set({ error: 'Failed to delete catch', loading: false });
      throw error;
    }
  },

  getPendingWeatherFetches: async () => {
    try {
      const result = await db
        .select()
        .from(catches)
        .where(eq(catches.pendingWeatherFetch, true));
      return result;
    } catch (error) {
      console.error('[Store] Failed to get pending weather fetches:', error);
      return [];
    }
  },

  markWeatherFetched: async (id, weatherData) => {
    try {
      await db.update(catches)
        .set({
          temperature: weatherData.temperature,
          temperatureUnit: weatherData.temperatureUnit,
          weatherCondition: weatherData.weatherCondition,
          pressure: weatherData.pressure,
          pressureUnit: weatherData.pressureUnit,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          weatherFetchedAt: weatherData.weatherFetchedAt,
          pendingWeatherFetch: false,
          updatedAt: new Date(),
        })
        .where(eq(catches.id, id));

      // Update local state
      set((state) => ({
        catches: state.catches.map((c) =>
          c.id === id
            ? {
                ...c,
                temperature: weatherData.temperature,
                temperatureUnit: weatherData.temperatureUnit,
                weatherCondition: weatherData.weatherCondition,
                pressure: weatherData.pressure,
                pressureUnit: weatherData.pressureUnit,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                weatherFetchedAt: weatherData.weatherFetchedAt,
                pendingWeatherFetch: false,
                updatedAt: new Date(),
              }
            : c
        ),
      }));
    } catch (error) {
      console.error('[Store] Failed to mark weather fetched:', error);
      throw error;
    }
  },
}));
