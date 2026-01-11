import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageSetting } from "@/i18n/types";

interface SettingsState {
  theme: "light" | "dark" | "system";
  language: LanguageSetting;
  weightUnit: "lbs" | "kg";
  lengthUnit: "in" | "cm";

  setTheme: (theme: "light" | "dark" | "system") => void;
  setLanguage: (language: LanguageSetting) => void;
  setWeightUnit: (unit: "lbs" | "kg") => void;
  setLengthUnit: (unit: "in" | "cm") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "system",
      weightUnit: "lbs",
      lengthUnit: "in",

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setLengthUnit: (lengthUnit) => set({ lengthUnit }),
    }),
    {
      name: "catchpoint-settings",
    },
  ),
);
