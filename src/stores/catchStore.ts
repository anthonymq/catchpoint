import { create } from "zustand";
import { type Catch, type InsertCatch } from "../db";
import { catchRepository } from "../db/repository";

interface CatchState {
  catches: Catch[];
  loading: boolean;
  error: string | null;

  fetchCatches: () => Promise<void>;
  addCatch: (catchData: InsertCatch) => Promise<void>;
  updateCatch: (id: string, updates: Partial<Catch>) => Promise<void>;
  deleteCatch: (id: string) => Promise<void>;
}

export const useCatchStore = create<CatchState>((set, get) => ({
  catches: [],
  loading: false,
  error: null,

  fetchCatches: async () => {
    set({ loading: true, error: null });
    try {
      const catches = await catchRepository.getAll();
      set({ catches, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addCatch: async (catchData) => {
    // Optimistic update
    const now = new Date();
    const optimisticCatch: Catch = {
      ...catchData,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      catches: [optimisticCatch, ...state.catches],
    }));

    try {
      await catchRepository.add(catchData);
    } catch (err) {
      // Revert on failure
      set((state) => ({
        catches: state.catches.filter((c) => c.id !== catchData.id),
        error: (err as Error).message,
      }));
    }
  },

  updateCatch: async (id, updates) => {
    const prevCatches = get().catches;

    // Optimistic update
    set((state) => ({
      catches: state.catches.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c,
      ),
    }));

    try {
      await catchRepository.update(id, updates);
    } catch (err) {
      set({ catches: prevCatches, error: (err as Error).message });
    }
  },

  deleteCatch: async (id) => {
    const prevCatches = get().catches;

    // Optimistic update
    set((state) => ({
      catches: state.catches.filter((c) => c.id !== id),
    }));

    try {
      await catchRepository.delete(id);
    } catch (err) {
      set({ catches: prevCatches, error: (err as Error).message });
    }
  },
}));
