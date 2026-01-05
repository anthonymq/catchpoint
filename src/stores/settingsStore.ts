import { create } from 'zustand';

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

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultSettings,

  setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
  setPressureUnit: (unit) => set({ pressureUnit: unit }),
  setWeightUnit: (unit) => set({ weightUnit: unit }),
  setLengthUnit: (unit) => set({ lengthUnit: unit }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),
  setAutoSyncPhotos: (enabled) => set({ autoSyncPhotos: enabled }),
  resetSettings: () => set(defaultSettings),
}));
