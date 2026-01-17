import { create } from "zustand";
import {
  discoverRepository,
  type FeedItem,
  type TrendingSpecies,
  type SuggestedUser,
} from "../db/repository";
import type { UserProfile } from "../db/index";

interface DiscoverState {
  publicCatches: FeedItem[];
  searchResults: UserProfile[];
  suggestedUsers: SuggestedUser[];
  trendingSpecies: TrendingSpecies[];
  searchQuery: string;
  loading: boolean;
  refreshing: boolean;
  searchLoading: boolean;
  hasMore: boolean;
  error: string | null;

  fetchPublicCatches: () => Promise<void>;
  refreshPublicCatches: () => Promise<void>;
  loadMoreCatches: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  fetchSuggestedUsers: (userId: string) => Promise<void>;
  fetchTrendingSpecies: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const DISCOVER_PAGE_SIZE = 20;

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  publicCatches: [],
  searchResults: [],
  suggestedUsers: [],
  trendingSpecies: [],
  searchQuery: "",
  loading: false,
  refreshing: false,
  searchLoading: false,
  hasMore: true,
  error: null,

  fetchPublicCatches: async () => {
    if (get().loading) return;

    set({ loading: true, error: null });

    try {
      const catches =
        await discoverRepository.getPublicCatches(DISCOVER_PAGE_SIZE);
      set({
        publicCatches: catches,
        loading: false,
        hasMore: catches.length >= DISCOVER_PAGE_SIZE,
      });
    } catch (error) {
      console.error("[DiscoverStore] fetchPublicCatches error:", error);
      set({ error: "Failed to load catches", loading: false });
    }
  },

  refreshPublicCatches: async () => {
    set({ refreshing: true, error: null });

    try {
      const catches =
        await discoverRepository.getPublicCatches(DISCOVER_PAGE_SIZE);
      set({
        publicCatches: catches,
        refreshing: false,
        hasMore: catches.length >= DISCOVER_PAGE_SIZE,
      });
    } catch (error) {
      console.error("[DiscoverStore] refreshPublicCatches error:", error);
      set({ error: "Failed to refresh", refreshing: false });
    }
  },

  loadMoreCatches: async () => {
    const { publicCatches, loading, hasMore } = get();
    if (loading || !hasMore || publicCatches.length === 0) return;

    set({ loading: true });

    try {
      const lastItem = publicCatches[publicCatches.length - 1];
      const beforeTimestamp = lastItem.catch.timestamp;

      const newCatches = await discoverRepository.getPublicCatches(
        DISCOVER_PAGE_SIZE,
        beforeTimestamp,
      );

      set({
        publicCatches: [...publicCatches, ...newCatches],
        loading: false,
        hasMore: newCatches.length >= DISCOVER_PAGE_SIZE,
      });
    } catch (error) {
      console.error("[DiscoverStore] loadMoreCatches error:", error);
      set({ error: "Failed to load more", loading: false });
    }
  },

  searchUsers: async (query: string) => {
    set({ searchLoading: true, searchQuery: query });

    try {
      const results = await discoverRepository.searchUsers(query);
      set({ searchResults: results, searchLoading: false });
    } catch (error) {
      console.error("[DiscoverStore] searchUsers error:", error);
      set({ searchResults: [], searchLoading: false });
    }
  },

  fetchSuggestedUsers: async (userId: string) => {
    try {
      const suggested = await discoverRepository.getSuggestedUsers(userId);
      set({ suggestedUsers: suggested });
    } catch (error) {
      console.error("[DiscoverStore] fetchSuggestedUsers error:", error);
    }
  },

  fetchTrendingSpecies: async () => {
    try {
      const trending = await discoverRepository.getTrendingSpecies();
      set({ trendingSpecies: trending });
    } catch (error) {
      console.error("[DiscoverStore] fetchTrendingSpecies error:", error);
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
    }
  },

  reset: () => {
    set({
      publicCatches: [],
      searchResults: [],
      suggestedUsers: [],
      trendingSpecies: [],
      searchQuery: "",
      loading: false,
      refreshing: false,
      searchLoading: false,
      hasMore: true,
      error: null,
    });
  },
}));
