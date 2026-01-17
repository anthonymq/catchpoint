import { create } from "zustand";
import {
  likeRepository,
  notificationRepository,
  type LikeWithProfile,
} from "../db/repository";

interface LikeState {
  likeCounts: Map<string, number>;
  userLikes: Set<string>;
  likers: LikeWithProfile[];
  likersLoading: boolean;
  likersModalCatchId: string | null;

  initializeLikes: (catchIds: string[], userId: string) => Promise<void>;
  toggleLike: (
    catchId: string,
    userId: string,
    catchOwnerId: string,
  ) => Promise<void>;
  getLikeCount: (catchId: string) => number;
  isLiked: (catchId: string) => boolean;
  openLikersModal: (catchId: string) => Promise<void>;
  closeLikersModal: () => void;
  reset: () => void;
}

export const useLikeStore = create<LikeState>((set, get) => ({
  likeCounts: new Map(),
  userLikes: new Set(),
  likers: [],
  likersLoading: false,
  likersModalCatchId: null,

  initializeLikes: async (catchIds: string[], userId: string) => {
    if (catchIds.length === 0) return;

    const [counts, liked] = await Promise.all([
      likeRepository.getLikeCountsBatch(catchIds),
      likeRepository.getUserLikesBatch(catchIds, userId),
    ]);

    set((state) => {
      const newCounts = new Map(state.likeCounts);
      const newLikes = new Set(state.userLikes);

      counts.forEach((count, catchId) => {
        newCounts.set(catchId, count);
      });

      liked.forEach((catchId) => {
        newLikes.add(catchId);
      });

      return {
        likeCounts: newCounts,
        userLikes: newLikes,
      };
    });
  },

  toggleLike: async (catchId: string, userId: string, catchOwnerId: string) => {
    const { userLikes, likeCounts } = get();
    const isCurrentlyLiked = userLikes.has(catchId);
    const currentCount = likeCounts.get(catchId) || 0;

    set((state) => {
      const newLikes = new Set(state.userLikes);
      const newCounts = new Map(state.likeCounts);

      if (isCurrentlyLiked) {
        newLikes.delete(catchId);
        newCounts.set(catchId, Math.max(0, currentCount - 1));
      } else {
        newLikes.add(catchId);
        newCounts.set(catchId, currentCount + 1);
      }

      return {
        userLikes: newLikes,
        likeCounts: newCounts,
      };
    });

    try {
      if (isCurrentlyLiked) {
        await likeRepository.unlike(catchId, userId);
      } else {
        await likeRepository.like(catchId, userId, catchOwnerId);
        if (userId !== catchOwnerId) {
          await notificationRepository.create(
            catchOwnerId,
            "like",
            userId,
            catchId,
          );
        }
      }
    } catch (error) {
      set((state) => {
        const revertedLikes = new Set(state.userLikes);
        const revertedCounts = new Map(state.likeCounts);

        if (isCurrentlyLiked) {
          revertedLikes.add(catchId);
          revertedCounts.set(catchId, currentCount);
        } else {
          revertedLikes.delete(catchId);
          revertedCounts.set(catchId, currentCount);
        }

        return {
          userLikes: revertedLikes,
          likeCounts: revertedCounts,
        };
      });
      console.error("[LikeStore] Toggle like failed:", error);
    }
  },

  getLikeCount: (catchId: string) => {
    return get().likeCounts.get(catchId) || 0;
  },

  isLiked: (catchId: string) => {
    return get().userLikes.has(catchId);
  },

  openLikersModal: async (catchId: string) => {
    set({ likersModalCatchId: catchId, likersLoading: true, likers: [] });

    try {
      const likers = await likeRepository.getLikesForCatch(catchId);
      set({ likers, likersLoading: false });
    } catch (error) {
      console.error("[LikeStore] Failed to fetch likers:", error);
      set({ likersLoading: false });
    }
  },

  closeLikersModal: () => {
    set({ likersModalCatchId: null, likers: [], likersLoading: false });
  },

  reset: () => {
    set({
      likeCounts: new Map(),
      userLikes: new Set(),
      likers: [],
      likersLoading: false,
      likersModalCatchId: null,
    });
  },
}));
