import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DateRange = "all" | "7d" | "30d" | "1y";

export interface FilterState {
  dateRange: DateRange;
  species: string[];
  hasPhoto: "all" | "yes" | "no";

  setDateRange: (range: DateRange) => void;
  setSpecies: (species: string[]) => void;
  toggleSpecies: (species: string) => void;
  setHasPhoto: (value: "all" | "yes" | "no") => void;
  resetFilters: () => void;
  activeFilterCount: () => number;
}

const initialState = {
  dateRange: "all" as DateRange,
  species: [] as string[],
  hasPhoto: "all" as const,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDateRange: (dateRange) => set({ dateRange }),

      setSpecies: (species) => set({ species }),

      toggleSpecies: (speciesItem) =>
        set((state) => {
          const current = state.species;
          if (current.includes(speciesItem)) {
            return { species: current.filter((s) => s !== speciesItem) };
          } else {
            return { species: [...current, speciesItem] };
          }
        }),

      setHasPhoto: (hasPhoto) => set({ hasPhoto }),

      resetFilters: () => set(initialState),

      activeFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.dateRange !== "all") count++;
        if (state.species.length > 0) count++;
        if (state.hasPhoto !== "all") count++;
        return count;
      },
    }),
    {
      name: "catchpoint-filters",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
