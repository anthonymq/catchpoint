import { useMemo } from "react";
import { subDays, subYears, isAfter } from "date-fns";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";

export function useFilteredCatches() {
  const { catches } = useCatchStore();
  const { dateRange, species, hasPhoto, sortBy, sortOrder } = useFilterStore();

  return useMemo(() => {
    // 1. Filter catches
    const filtered = catches.filter((catchItem) => {
      // 1a. Filter by Date Range
      if (dateRange !== "all") {
        const catchDate = new Date(catchItem.timestamp);
        let cutoffDate: Date;

        switch (dateRange) {
          case "7d":
            cutoffDate = subDays(new Date(), 7);
            break;
          case "30d":
            cutoffDate = subDays(new Date(), 30);
            break;
          case "1y":
            cutoffDate = subYears(new Date(), 1);
            break;
          default:
            cutoffDate = new Date(0); // Beginning of time
        }

        if (!isAfter(catchDate, cutoffDate)) {
          return false;
        }
      }

      // 1b. Filter by Species
      if (species.length > 0) {
        if (!catchItem.species || !species.includes(catchItem.species)) {
          return false;
        }
      }

      // 1c. Filter by Photo
      if (hasPhoto !== "all") {
        const hasUri = !!catchItem.photoUri;
        if (hasPhoto === "yes" && !hasUri) return false;
        if (hasPhoto === "no" && hasUri) return false;
      }

      return true;
    });

    // 2. Sort catches
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date": {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          comparison = dateA - dateB;
          break;
        }
        case "weight": {
          // Put catches without weight at the end
          const weightA = a.weight ?? -Infinity;
          const weightB = b.weight ?? -Infinity;
          comparison = weightA - weightB;
          break;
        }
        case "species": {
          // Put catches without species at the end
          const speciesA = a.species ?? "";
          const speciesB = b.species ?? "";
          comparison = speciesA.localeCompare(speciesB);
          break;
        }
      }

      // Apply sort order
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [catches, dateRange, species, hasPhoto, sortBy, sortOrder]);
}
