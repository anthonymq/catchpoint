import { create } from "zustand";
import type { UserProfile, InsertUserProfile } from "../db";
import { profileRepository } from "../db/repository";

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  fetchProfile: (userId: string) => Promise<void>;
  createProfile: (profileData: InsertUserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updatePhoto: (photoUrl: string) => Promise<void>;
  toggleVisibility: () => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const profile = await profileRepository.get(userId);
      set({ profile: profile ?? null, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createProfile: async (profileData: InsertUserProfile) => {
    set({ loading: true, error: null });
    try {
      await profileRepository.upsert(profileData);
      const profile = await profileRepository.get(profileData.userId);
      set({ profile: profile ?? null, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) return;

    const prevProfile = profile;
    set({ profile: { ...profile, ...updates, updatedAt: new Date() } });

    try {
      await profileRepository.update(profile.userId, updates);
    } catch (err) {
      set({ profile: prevProfile, error: (err as Error).message });
    }
  },

  updateDisplayName: async (displayName: string) => {
    await get().updateProfile({ displayName });
  },

  updatePhoto: async (photoUrl: string) => {
    await get().updateProfile({ photoUrl });
  },

  toggleVisibility: async () => {
    const { profile } = get();
    if (!profile) return;
    await get().updateProfile({ isPublic: !profile.isPublic });
  },

  clearProfile: () => {
    set({ profile: null, loading: false, error: null });
  },
}));
