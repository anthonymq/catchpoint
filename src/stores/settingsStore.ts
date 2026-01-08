import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsData {
  // Unit preferences
  temperatureUnit: 'C' | 'F';
  pressureUnit: 'hPa' | 'inHg';
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  
  // Theme preferences
  themeMode: 'system' | 'light' | 'dark';
  
  // Sync preferences
  cloudSyncEnabled: boolean;
  autoSyncPhotos: boolean;
}

interface SettingsState extends SettingsData {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Actions
  setTemperatureUnit: (unit: 'C' | 'F') => void;
  setPressureUnit: (unit: 'hPa' | 'inHg') => void;
  setWeightUnit: (unit: 'kg' | 'lb') => void;
  setLengthUnit: (unit: 'cm' | 'in') => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  setAutoSyncPhotos: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsData = {
  temperatureUnit: 'C',
  pressureUnit: 'hPa',
  weightUnit: 'kg',
  lengthUnit: 'cm',
  themeMode: 'system',
  cloudSyncEnabled: false,
  autoSyncPhotos: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      _hasHydrated: false,
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setPressureUnit: (unit) => set({ pressureUnit: unit }),
      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setLengthUnit: (unit) => set({ lengthUnit: unit }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),
      setAutoSyncPhotos: (enabled) => set({ autoSyncPhotos: enabled }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'catchpoint-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        temperatureUnit: state.temperatureUnit,
        pressureUnit: state.pressureUnit,
        weightUnit: state.weightUnit,
        lengthUnit: state.lengthUnit,
        themeMode: state.themeMode,
        cloudSyncEnabled: state.cloudSyncEnabled,
        autoSyncPhotos: state.autoSyncPhotos,
      }),
    }
  )
);

// Hook to check if settings have been hydrated from storage
export const useSettingsHydrated = () => useSettingsStore((state) => state._hasHydrated);
