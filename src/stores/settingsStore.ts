import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  theme: "light" | "dark" | "system";
  weightUnit: "lbs" | "kg";
  lengthUnit: "in" | "cm";

  setTheme: (theme: "light" | "dark" | "system") => void;
  setWeightUnit: (unit: "lbs" | "kg") => void;
  setLengthUnit: (unit: "in" | "cm") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      weightUnit: "lbs",
      lengthUnit: "in",

      setTheme: (theme) => set({ theme }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setLengthUnit: (lengthUnit) => set({ lengthUnit }),
    }),
    {
      name: "catchpoint-settings",
    },
  ),
);
