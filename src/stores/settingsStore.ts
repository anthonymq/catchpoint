import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageSetting } from "@/i18n/types";
import type { NotificationPreferences } from "@/services/push";

interface SettingsState {
  theme: "light" | "dark" | "system";
  language: LanguageSetting;
  weightUnit: "lbs" | "kg";
  lengthUnit: "in" | "cm";

  pushEnabled: boolean;
  notificationPreferences: NotificationPreferences;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setLanguage: (language: LanguageSetting) => void;
  setWeightUnit: (unit: "lbs" | "kg") => void;
  setLengthUnit: (unit: "in" | "cm") => void;
  setPushEnabled: (enabled: boolean) => void;
  setNotificationPreference: (
    category: keyof NotificationPreferences,
    enabled: boolean,
  ) => void;
  setAllNotificationPreferences: (preferences: NotificationPreferences) => void;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  likes: true,
  comments: true,
  follows: true,
  messages: true,
  leaderboard: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "system",
      weightUnit: "lbs",
      lengthUnit: "in",

      pushEnabled: false,
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setLengthUnit: (lengthUnit) => set({ lengthUnit }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setNotificationPreference: (category, enabled) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [category]: enabled,
          },
        })),
      setAllNotificationPreferences: (notificationPreferences) =>
        set({ notificationPreferences }),
    }),
    {
      name: "catchpoint-settings",
    },
  ),
);
