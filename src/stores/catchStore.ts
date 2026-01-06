import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
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

// Helper to check if we're on web
const isWeb = Platform.OS === 'web';

// Mock data for web platform
const MOCK_CATCHES: Catch[] = [
  {
    id: '1',
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:35:00'),
    latitude: 37.7749,
    longitude: -122.4194,
    temperature: 18,
    temperatureUnit: 'C',
    weatherCondition: 'Partly Cloudy',
    pressure: 1013,
    pressureUnit: 'hPa',
    humidity: 65,
    windSpeed: 12,
    weatherFetchedAt: new Date('2024-01-15T14:31:00'),
    species: 'Bass',
    weight: 2.5,
    weightUnit: 'kg',
    length: 45,
    lengthUnit: 'cm',
    lure: 'Spinnerbait',
    notes: 'Great fight! Caught near the old pier.',
    photoUri: null,
    isDraft: false,
    pendingWeatherFetch: false,
    syncedAt: null,
  },
  {
    id: '2',
    createdAt: new Date('2024-01-14T09:15:00'),
    updatedAt: new Date('2024-01-14T09:20:00'),
    latitude: 37.8044,
    longitude: -122.2711,
    temperature: 16,
    temperatureUnit: 'C',
    weatherCondition: 'Sunny',
    pressure: 1015,
    pressureUnit: 'hPa',
    humidity: 55,
    windSpeed: 8,
    weatherFetchedAt: new Date('2024-01-14T09:16:00'),
    species: 'Trout',
    weight: 1.8,
    weightUnit: 'kg',
    length: 38,
    lengthUnit: 'cm',
    lure: 'Fly - Woolly Bugger',
    notes: 'Beautiful rainbow trout in the morning light',
    photoUri: null,
    isDraft: false,
    pendingWeatherFetch: false,
    syncedAt: null,
  },
  {
    id: '3',
    createdAt: new Date('2024-01-13T16:45:00'),
    updatedAt: new Date('2024-01-13T16:50:00'),
    latitude: 37.7599,
    longitude: -122.5148,
    temperature: 20,
    temperatureUnit: 'C',
    weatherCondition: 'Clear',
    pressure: 1012,
    pressureUnit: 'hPa',
    humidity: 70,
    windSpeed: 15,
    weatherFetchedAt: new Date('2024-01-13T16:46:00'),
    species: 'Salmon',
    weight: 5.2,
    weightUnit: 'kg',
    length: 65,
    lengthUnit: 'cm',
    lure: 'Herring',
    notes: 'Big salmon! Took 20 minutes to reel in.',
    photoUri: null,
    isDraft: false,
    pendingWeatherFetch: false,
    syncedAt: null,
  },
  {
    id: '4',
    createdAt: new Date('2024-01-12T07:00:00'),
    updatedAt: null,
    latitude: 37.7833,
    longitude: -122.4167,
    temperature: 15,
    temperatureUnit: 'C',
    weatherCondition: 'Cloudy',
    pressure: 1010,
    pressureUnit: 'hPa',
    humidity: 75,
    windSpeed: 10,
    weatherFetchedAt: new Date('2024-01-12T07:01:00'),
    species: 'Perch',
    weight: 0.8,
    weightUnit: 'kg',
    length: 25,
    lengthUnit: 'cm',
    lure: 'Worm',
    notes: 'Early morning catch',
    photoUri: null,
    isDraft: false,
    pendingWeatherFetch: false,
    syncedAt: null,
  },
  {
    id: '5',
    createdAt: new Date('2024-01-10T12:20:00'),
    updatedAt: null,
    latitude: 37.7694,
    longitude: -122.4862,
    temperature: 19,
    temperatureUnit: 'C',
    weatherCondition: 'Sunny',
    pressure: 1014,
    pressureUnit: 'hPa',
    humidity: 60,
    windSpeed: 5,
    weatherFetchedAt: new Date('2024-01-10T12:21:00'),
    species: 'Catfish',
    weight: 3.1,
    weightUnit: 'kg',
    length: 52,
    lengthUnit: 'cm',
    lure: 'Cut Bait',
    notes: 'Bottom fishing success',
    photoUri: null,
    isDraft: false,
    pendingWeatherFetch: false,
    syncedAt: null,
  },
];

export const useCatchStore = create<CatchState>((set, get) => ({
  catches: [],
  loading: false,
  error: null,

  fetchCatches: async () => {
    if (isWeb) {
      console.log('[Store] Loading mock data for web platform');
      set({ catches: MOCK_CATCHES, loading: false });
      return;
    }

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
    if (isWeb) {
      console.warn('[Store] Database operations not available on web');
      throw new Error('Database not available on web platform');
    }

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
    if (isWeb) {
      console.log('[Store] Fetching mock catch by id:', id);
      const catch_ = MOCK_CATCHES.find(c => c.id === id);
      return catch_ || null;
    }

    try {
      const result = await db.select().from(catches).where(eq(catches.id, id)).limit(1);
      return result[0] ?? null;
    } catch (error) {
      console.error('[Store] Failed to get catch by id:', error);
      return null;
    }
  },

  updateCatch: async (id, updates) => {
    if (isWeb) {
      console.warn('[Store] Database operations not available on web');
      return;
    }

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
    if (isWeb) {
      console.warn('[Store] Database operations not available on web');
      return;
    }

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
    if (isWeb) {
      console.warn('[Store] Database operations not available on web');
      return [];
    }

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
    if (isWeb) {
      console.warn('[Store] Database operations not available on web');
      return;
    }

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
