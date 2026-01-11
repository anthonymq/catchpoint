import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  type Language,
  type I18nContextType,
  type TranslateFunction,
  resolveLanguage,
} from "./types";
import en from "./en.json";
import fr from "./fr.json";

// Translations lookup
const translations: Record<Language, typeof en> = { en, fr };

// Create context with null default (will throw if used outside provider)
const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Get a nested value from an object using dot notation.
 * e.g., getNestedValue(obj, 'a.b.c') returns obj.a.b.c
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof value === "string" ? value : undefined;
}

/**
 * Create a translation function for the given language.
 */
function createTranslator(language: Language): TranslateFunction {
  return (key: string, params?: Record<string, string | number>): string => {
    // Get translation from current language
    let value = getNestedValue(translations[language], key);

    // Fallback to English if not found
    if (value === undefined && language !== "en") {
      value = getNestedValue(translations.en, key);
    }

    // Fallback to key if still not found
    if (value === undefined) {
      return key;
    }

    // Replace interpolation params: {{param}} -> value
    if (params) {
      value = value.replace(/\{\{(\w+)\}\}/g, (_, paramKey: string) => {
        return String(params[paramKey] ?? `{{${paramKey}}}`);
      });
    }

    return value;
  };
}

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app and provides translation context.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const languageSetting = useSettingsStore((state) => state.language);

  // Resolve 'system' to actual language
  const language = resolveLanguage(languageSetting);

  // Create translation function
  const t = createTranslator(language);

  // Update document lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access translations.
 * Must be used within I18nProvider.
 */
export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}

// Re-export types for convenience
export type { Language, LanguageSetting, TranslateFunction } from "./types";
