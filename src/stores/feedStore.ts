import { create } from "zustand";
import { feedRepository, type FeedItem } from "../db/repository";

interface FeedState {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;

  fetchFeed: (userId: string) => Promise<void>;
  refreshFeed: (userId: string) => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  reset: () => void;
}

const FEED_PAGE_SIZE = 20;

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  loading: false,
  refreshing: false,
  hasMore: true,
  error: null,

  fetchFeed: async (userId: string) => {
    if (get().loading) return;

    set({ loading: true, error: null });

    try {
      const items = await feedRepository.getFeed(userId, FEED_PAGE_SIZE);
      set({
        items,
        loading: false,
        hasMore: items.length >= FEED_PAGE_SIZE,
      });
    } catch (error) {
      console.error("[FeedStore] fetchFeed error:", error);
      set({ error: "Failed to load feed", loading: false });
    }
  },

  refreshFeed: async (userId: string) => {
    set({ refreshing: true, error: null });

    try {
      const items = await feedRepository.getFeed(userId, FEED_PAGE_SIZE);
      set({
        items,
        refreshing: false,
        hasMore: items.length >= FEED_PAGE_SIZE,
      });
    } catch (error) {
      console.error("[FeedStore] refreshFeed error:", error);
      set({ error: "Failed to refresh feed", refreshing: false });
    }
  },

  loadMore: async (userId: string) => {
    const { items, loading, hasMore } = get();
    if (loading || !hasMore || items.length === 0) return;

    set({ loading: true });

    try {
      const lastItem = items[items.length - 1];
      const beforeTimestamp = lastItem.catch.timestamp;

      const newItems = await feedRepository.getFeed(
        userId,
        FEED_PAGE_SIZE,
        beforeTimestamp,
      );

      set({
        items: [...items, ...newItems],
        loading: false,
        hasMore: newItems.length >= FEED_PAGE_SIZE,
      });
    } catch (error) {
      console.error("[FeedStore] loadMore error:", error);
      set({ error: "Failed to load more", loading: false });
    }
  },

  reset: () => {
    set({
      items: [],
      loading: false,
      refreshing: false,
      hasMore: true,
      error: null,
    });
  },
}));
