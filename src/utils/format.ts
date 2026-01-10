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

export const formatWeight = (weight?: number): string => {
  if (weight === undefined || weight === null) return "—";
  return `${weight.toFixed(1)} lbs`; // TODO: Support units
};
