import { useMemo } from "react";
import { subDays, subYears, isAfter } from "date-fns";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";

export function useFilteredCatches() {
  const { catches } = useCatchStore();
  const { dateRange, species, hasPhoto } = useFilterStore();

  return useMemo(() => {
    return catches.filter((catchItem) => {
      // 1. Filter by Date Range
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

      // 2. Filter by Species
      if (species.length > 0) {
        // If species is not recorded, only show if we aren't filtering strictly?
        // Usually if I select "Bass", I only want "Bass".
        // If catch has no species, it shouldn't show if species filter is active.
        if (!catchItem.species || !species.includes(catchItem.species)) {
          return false;
        }
      }

      // 3. Filter by Photo
      if (hasPhoto !== "all") {
        const hasUri = !!catchItem.photoUri;
        if (hasPhoto === "yes" && !hasUri) return false;
        if (hasPhoto === "no" && hasUri) return false;
      }

      return true;
    });
  }, [catches, dateRange, species, hasPhoto]);
}
