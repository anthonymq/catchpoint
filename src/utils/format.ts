import { isToday, isYesterday, isThisYear } from "date-fns";
import type { Language } from "@/i18n/types";

/**
 * Format catch date with locale support.
 * Uses Intl.DateTimeFormat for proper localization.
 */
export const formatCatchDate = (date: Date, locale?: Language): string => {
  const lang = locale ?? "en";

  const timeFormat = new Intl.DateTimeFormat(lang, {
    hour: "numeric",
    minute: "2-digit",
    hour12: lang === "en",
  });

  const time = timeFormat.format(date);

  if (isToday(date)) {
    return lang === "fr" ? `Aujourd'hui à ${time}` : `Today at ${time}`;
  }
  if (isYesterday(date)) {
    return lang === "fr" ? `Hier à ${time}` : `Yesterday at ${time}`;
  }
  if (isThisYear(date)) {
    const dateFormat = new Intl.DateTimeFormat(lang, {
      month: "short",
      day: "numeric",
    });
    const dateStr = dateFormat.format(date);
    return lang === "fr" ? `${dateStr} à ${time}` : `${dateStr} at ${time}`;
  }

  const fullFormat = new Intl.DateTimeFormat(lang, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return fullFormat.format(date);
};

export const formatCoordinates = (lat: number, lon: number): string => {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
};

export const formatWeight = (
  weight?: number,
  unit: "lbs" | "kg" = "lbs",
): string => {
  if (weight === undefined || weight === null) return "—";
  if (unit === "kg") {
    return `${(weight * 0.453592).toFixed(2)} kg`;
  }
  return `${weight.toFixed(2)} lbs`;
};

export const formatLength = (
  length?: number,
  unit: "in" | "cm" = "in",
): string => {
  if (length === undefined || length === null) return "—";
  if (unit === "cm") {
    return `${(length * 2.54).toFixed(1)} cm`;
  }
  return `${length.toFixed(1)} in`;
};

export const toBaseWeight = (value: number, fromUnit: "lbs" | "kg"): number => {
  if (fromUnit === "kg") return value / 0.453592;
  return value;
};

export const toDisplayWeight = (
  value: number,
  toUnit: "lbs" | "kg",
): number => {
  if (toUnit === "kg") return value * 0.453592;
  return value;
};

export const toBaseLength = (value: number, fromUnit: "in" | "cm"): number => {
  if (fromUnit === "cm") return value / 2.54;
  return value;
};

export const toDisplayLength = (value: number, toUnit: "in" | "cm"): number => {
  if (toUnit === "cm") return value * 2.54;
  return value;
};

/**
 * Format a number with locale-appropriate separators.
 */
export const formatNumber = (num: number, locale?: Language): string => {
  const lang = locale ?? "en";
  return new Intl.NumberFormat(lang).format(num);
};
