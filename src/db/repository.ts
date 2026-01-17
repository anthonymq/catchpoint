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

  getFollowingIds: async (userId: string): Promise<string[]> => {
    const follows = await db.follows
      .where("followerId")
      .equals(userId)
      .toArray();
    return follows.map((f) => f.followedId);
  },
};

export interface FeedItem {
  catch: Catch;
  userProfile: UserProfile | null;
}

export const feedRepository = {
  getFeed: async (
    currentUserId: string,
    limit: number = 20,
    beforeTimestamp?: Date,
  ): Promise<FeedItem[]> => {
    const followedIds = await followRepository.getFollowingIds(currentUserId);

    if (followedIds.length === 0) {
      return [];
    }

    const query = db.catches.where("userId").anyOf(followedIds);
    let catches = await query.toArray();

    catches = catches.filter((c) => c.syncStatus === "synced");

    if (beforeTimestamp) {
      catches = catches.filter(
        (c) => c.timestamp.getTime() < beforeTimestamp.getTime(),
      );
    }

    catches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    catches = catches.slice(0, limit);

    const userIds = [...new Set(catches.map((c) => c.userId).filter(Boolean))];
    const profileMap = new Map<string, UserProfile | null>();

    for (const uid of userIds) {
      if (uid) {
        const profile = await profileRepository.get(uid);
        if (profile?.isPublic) {
          profileMap.set(uid, profile);
        } else {
          profileMap.set(uid, null);
        }
      }
    }

    const feedItems: FeedItem[] = catches
      .filter((c) => c.userId && profileMap.get(c.userId) !== null)
      .map((c) => ({
        catch: c,
        userProfile: c.userId ? (profileMap.get(c.userId) ?? null) : null,
      }));

    return feedItems;
  },
};

export interface TrendingSpecies {
  species: string;
  count: number;
}

export interface SuggestedUser {
  profile: UserProfile;
  catchCount: number;
  commonSpecies: string[];
}

export const discoverRepository = {
  getPublicCatches: async (
    limit: number = 20,
    beforeTimestamp?: Date,
  ): Promise<FeedItem[]> => {
    let catches = await db.catches.toArray();

    catches = catches.filter((c) => c.syncStatus === "synced" && c.userId);

    if (beforeTimestamp) {
      catches = catches.filter(
        (c) => c.timestamp.getTime() < beforeTimestamp.getTime(),
      );
    }

    catches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    catches = catches.slice(0, limit);

    const userIds = [...new Set(catches.map((c) => c.userId).filter(Boolean))];
    const profileMap = new Map<string, UserProfile | null>();

    for (const uid of userIds) {
      if (uid) {
        const profile = await profileRepository.get(uid);
        if (profile?.isPublic) {
          profileMap.set(uid, profile);
        } else {
          profileMap.set(uid, null);
        }
      }
    }

    const feedItems: FeedItem[] = catches
      .filter((c) => c.userId && profileMap.get(c.userId) !== null)
      .map((c) => ({
        catch: c,
        userProfile: c.userId ? (profileMap.get(c.userId) ?? null) : null,
      }));

    return feedItems;
  },

  searchUsers: async (query: string): Promise<UserProfile[]> => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const allProfiles = await db.userProfiles.toArray();

    return allProfiles
      .filter(
        (p) =>
          p.isPublic && p.displayName.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 20);
  },

  getTrendingSpecies: async (): Promise<TrendingSpecies[]> => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const catches = await db.catches.toArray();

    const recentCatches = catches.filter(
      (c) =>
        c.syncStatus === "synced" &&
        c.species &&
        c.timestamp.getTime() >= oneWeekAgo.getTime(),
    );

    const speciesCount = new Map<string, number>();
    for (const catchItem of recentCatches) {
      if (catchItem.species) {
        const current = speciesCount.get(catchItem.species) || 0;
        speciesCount.set(catchItem.species, current + 1);
      }
    }

    return Array.from(speciesCount.entries())
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  getSuggestedUsers: async (
    currentUserId: string,
  ): Promise<SuggestedUser[]> => {
    const followingIds = await followRepository.getFollowingIds(currentUserId);
    const excludeIds = new Set([currentUserId, ...followingIds]);

    const allProfiles = await db.userProfiles.toArray();
    const publicProfiles = allProfiles.filter(
      (p) => p.isPublic && !excludeIds.has(p.userId),
    );

    const catches = await db.catches.toArray();
    const userCatchData = new Map<
      string,
      { count: number; species: Set<string> }
    >();

    for (const catchItem of catches) {
      if (catchItem.userId && catchItem.syncStatus === "synced") {
        const data = userCatchData.get(catchItem.userId) || {
          count: 0,
          species: new Set<string>(),
        };
        data.count++;
        if (catchItem.species) {
          data.species.add(catchItem.species);
        }
        userCatchData.set(catchItem.userId, data);
      }
    }

    const suggestions: SuggestedUser[] = publicProfiles
      .map((profile) => {
        const data = userCatchData.get(profile.userId) || {
          count: 0,
          species: new Set<string>(),
        };
        return {
          profile,
          catchCount: data.count,
          commonSpecies: Array.from(data.species).slice(0, 3),
        };
      })
      .filter((s) => s.catchCount > 0)
      .sort((a, b) => b.catchCount - a.catchCount)
      .slice(0, 10);

    return suggestions;
  },
};
