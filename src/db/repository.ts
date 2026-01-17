import {
  db,
  type Catch,
  type InsertCatch,
  type UserProfile,
  type InsertUserProfile,
  type Follow,
} from "./index";

export const catchRepository = {
  /**
   * Add a new catch to the database
   */
  add: async (catchData: InsertCatch): Promise<string> => {
    const now = new Date();
    const newCatch: Catch = {
      ...catchData,
      createdAt: now,
      updatedAt: now,
    };
    await db.catches.add(newCatch);
    return newCatch.id;
  },

  /**
   * Get a single catch by ID
   */
  get: async (id: string): Promise<Catch | undefined> => {
    return await db.catches.get(id);
  },

  /**
   * Get all catches, ordered by timestamp (newest first)
   */
  getAll: async (): Promise<Catch[]> => {
    return await db.catches.orderBy("timestamp").reverse().toArray();
  },

  /**
   * Update an existing catch
   */
  update: async (id: string, updates: Partial<Catch>): Promise<void> => {
    await db.catches.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  /**
   * Delete a catch by ID
   */
  delete: async (id: string): Promise<void> => {
    await db.catches.delete(id);
  },

  /**
   * Get all catches that are waiting for weather data
   */
  getPendingWeather: async (): Promise<Catch[]> => {
    return await db.catches
      .filter((c) => c.pendingWeatherFetch === true)
      .toArray();
  },

  /**
   * Clear all data (for settings/debug)
   */
  clearAll: async (): Promise<void> => {
    await db.catches.clear();
  },
};

export const profileRepository = {
  get: async (userId: string): Promise<UserProfile | undefined> => {
    return await db.userProfiles.get(userId);
  },

  create: async (profileData: InsertUserProfile): Promise<string> => {
    const now = new Date();
    const newProfile: UserProfile = {
      ...profileData,
      createdAt: now,
      updatedAt: now,
    };
    await db.userProfiles.add(newProfile);
    return newProfile.userId;
  },

  update: async (
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<void> => {
    await db.userProfiles.update(userId, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  upsert: async (profileData: InsertUserProfile): Promise<string> => {
    const existing = await db.userProfiles.get(profileData.userId);
    if (existing) {
      await db.userProfiles.update(profileData.userId, {
        ...profileData,
        updatedAt: new Date(),
      });
      return profileData.userId;
    }
    return await profileRepository.create(profileData);
  },

  delete: async (userId: string): Promise<void> => {
    await db.userProfiles.delete(userId);
  },
};

export const followRepository = {
  follow: async (followerId: string, followedId: string): Promise<string> => {
    const id = `${followerId}_${followedId}`;
    const existing = await db.follows.get(id);
    if (existing) {
      return id;
    }
    const follow: Follow = {
      id,
      followerId,
      followedId,
      createdAt: new Date(),
    };
    await db.follows.add(follow);
    return id;
  },

  unfollow: async (followerId: string, followedId: string): Promise<void> => {
    const id = `${followerId}_${followedId}`;
    await db.follows.delete(id);
  },

  isFollowing: async (
    followerId: string,
    followedId: string,
  ): Promise<boolean> => {
    const id = `${followerId}_${followedId}`;
    const follow = await db.follows.get(id);
    return !!follow;
  },

  getFollowersCount: async (userId: string): Promise<number> => {
    return await db.follows.where("followedId").equals(userId).count();
  },

  getFollowingCount: async (userId: string): Promise<number> => {
    return await db.follows.where("followerId").equals(userId).count();
  },

  getFollowers: async (userId: string): Promise<Follow[]> => {
    return await db.follows.where("followedId").equals(userId).toArray();
  },

  getFollowing: async (userId: string): Promise<Follow[]> => {
    return await db.follows.where("followerId").equals(userId).toArray();
  },
};
