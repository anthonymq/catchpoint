import { create } from "zustand";
import { followRepository } from "../db/repository";

interface FollowState {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  loading: boolean;

  fetchFollowStatus: (
    currentUserId: string,
    targetUserId: string,
  ) => Promise<void>;
  fetchCounts: (userId: string) => Promise<void>;
  follow: (currentUserId: string, targetUserId: string) => Promise<void>;
  unfollow: (currentUserId: string, targetUserId: string) => Promise<void>;
  reset: () => void;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  isFollowing: false,
  followersCount: 0,
  followingCount: 0,
  loading: false,

  fetchFollowStatus: async (currentUserId: string, targetUserId: string) => {
    if (!currentUserId || !targetUserId) return;
    const isFollowing = await followRepository.isFollowing(
      currentUserId,
      targetUserId,
    );
    set({ isFollowing });
  },

  fetchCounts: async (userId: string) => {
    if (!userId) return;
    set({ loading: true });
    const [followersCount, followingCount] = await Promise.all([
      followRepository.getFollowersCount(userId),
      followRepository.getFollowingCount(userId),
    ]);
    set({ followersCount, followingCount, loading: false });
  },

  follow: async (currentUserId: string, targetUserId: string) => {
    const prevState = get();
    set({
      isFollowing: true,
      followersCount: prevState.followersCount + 1,
    });

    try {
      await followRepository.follow(currentUserId, targetUserId);
    } catch (error) {
      set({
        isFollowing: prevState.isFollowing,
        followersCount: prevState.followersCount,
      });
      console.error("[FollowStore] Follow failed:", error);
    }
  },

  unfollow: async (currentUserId: string, targetUserId: string) => {
    const prevState = get();
    set({
      isFollowing: false,
      followersCount: Math.max(0, prevState.followersCount - 1),
    });

    try {
      await followRepository.unfollow(currentUserId, targetUserId);
    } catch (error) {
      set({
        isFollowing: prevState.isFollowing,
        followersCount: prevState.followersCount,
      });
      console.error("[FollowStore] Unfollow failed:", error);
    }
  },

  reset: () => {
    set({
      isFollowing: false,
      followersCount: 0,
      followingCount: 0,
      loading: false,
    });
  },
}));
