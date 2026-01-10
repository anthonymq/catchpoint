import { format, isToday, isYesterday, isThisYear } from "date-fns";

export const formatCatchDate = (date: Date): string => {
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  if (isThisYear(date)) {
    return format(date, "MMM d 'at' h:mm a");
  }
  return format(date, "MMM d, yyyy");
};

export const formatCoordinates = (lat: number, lon: number): string => {
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W`;
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
