/**
 * Supported languages in the app.
 * 'system' means detect from browser/OS.
 */
export type Language = "en" | "fr";
export type LanguageSetting = Language | "system";

/**
 * Type for the translation function.
 * Supports dot notation keys and parameter interpolation.
 */
export type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/**
 * Shape of the i18n context.
 */
export interface I18nContextType {
  /** Current resolved language (never 'system') */
  language: Language;
  /** Translation function */
  t: TranslateFunction;
}

/**
 * Helper to detect system language.
 * Returns 'fr' if French, otherwise 'en'.
 */
export function detectSystemLanguage(): Language {
  const systemLang = navigator.language || "en";
  const langCode = systemLang.split("-")[0].toLowerCase();
  return langCode === "fr" ? "fr" : "en";
}

/**
 * Resolve language setting to actual language.
 */
export function resolveLanguage(setting: LanguageSetting): Language {
  if (setting === "system") {
    return detectSystemLanguage();
  }
  return setting;
}
