import {
  db,
  type Catch,
  type InsertCatch,
  type UserProfile,
  type InsertUserProfile,
  type Follow,
  type Like,
  type Notification,
  type Comment,
  type Conversation,
  type Message,
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

export interface LikeWithProfile {
  like: Like;
  userProfile: UserProfile | null;
}

export const likeRepository = {
  like: async (
    catchId: string,
    userId: string,
    catchOwnerId: string,
  ): Promise<string> => {
    const id = `${catchId}_${userId}`;
    const existing = await db.likes.get(id);
    if (existing) {
      return id;
    }
    const like: Like = {
      id,
      catchId,
      userId,
      catchOwnerId,
      createdAt: new Date(),
    };
    await db.likes.add(like);
    return id;
  },

  unlike: async (catchId: string, userId: string): Promise<void> => {
    const id = `${catchId}_${userId}`;
    await db.likes.delete(id);
  },

  isLiked: async (catchId: string, userId: string): Promise<boolean> => {
    const id = `${catchId}_${userId}`;
    const like = await db.likes.get(id);
    return !!like;
  },

  getLikeCount: async (catchId: string): Promise<number> => {
    return await db.likes.where("catchId").equals(catchId).count();
  },

  getLikesForCatch: async (catchId: string): Promise<LikeWithProfile[]> => {
    const likes = await db.likes
      .where("catchId")
      .equals(catchId)
      .reverse()
      .sortBy("createdAt");

    const results: LikeWithProfile[] = [];
    for (const like of likes) {
      const profile = await profileRepository.get(like.userId);
      results.push({
        like,
        userProfile: profile?.isPublic ? profile : null,
      });
    }
    return results;
  },

  getLikeCountsBatch: async (
    catchIds: string[],
  ): Promise<Map<string, number>> => {
    const counts = new Map<string, number>();
    for (const catchId of catchIds) {
      counts.set(catchId, 0);
    }

    const likes = await db.likes.where("catchId").anyOf(catchIds).toArray();

    for (const like of likes) {
      const current = counts.get(like.catchId) || 0;
      counts.set(like.catchId, current + 1);
    }

    return counts;
  },

  getUserLikesBatch: async (
    catchIds: string[],
    userId: string,
  ): Promise<Set<string>> => {
    const likedSet = new Set<string>();

    for (const catchId of catchIds) {
      const id = `${catchId}_${userId}`;
      const like = await db.likes.get(id);
      if (like) {
        likedSet.add(catchId);
      }
    }

    return likedSet;
  },
};

export const notificationRepository = {
  create: async (
    userId: string,
    type: Notification["type"],
    actorId: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> => {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      userId,
      type,
      actorId,
      targetId,
      metadata,
      read: false,
      createdAt: new Date(),
    };
    await db.notifications.add(notification);
    return id;
  },

  getForUser: async (
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> => {
    return await db.notifications
      .where("userId")
      .equals(userId)
      .reverse()
      .sortBy("createdAt")
      .then((notifications) => notifications.slice(0, limit));
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    return await db.notifications
      .where("userId")
      .equals(userId)
      .filter((n) => !n.read)
      .count();
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await db.notifications.update(notificationId, { read: true });
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await db.notifications
      .where("userId")
      .equals(userId)
      .modify({ read: true });
  },

  deleteOlderThan: async (days: number): Promise<void> => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await db.notifications.filter((n) => n.createdAt < cutoff).delete();
  },
};

export interface CommentWithProfile {
  comment: Comment;
  userProfile: UserProfile | null;
}

export const commentRepository = {
  add: async (
    catchId: string,
    userId: string,
    catchOwnerId: string,
    content: string,
  ): Promise<string> => {
    const id = crypto.randomUUID();
    const comment: Comment = {
      id,
      catchId,
      userId,
      catchOwnerId,
      content: content.slice(0, 500),
      createdAt: new Date(),
    };
    await db.comments.add(comment);
    return id;
  },

  delete: async (commentId: string): Promise<void> => {
    await db.comments.delete(commentId);
  },

  get: async (commentId: string): Promise<Comment | undefined> => {
    return await db.comments.get(commentId);
  },

  getForCatch: async (catchId: string): Promise<CommentWithProfile[]> => {
    const comments = await db.comments
      .where("catchId")
      .equals(catchId)
      .sortBy("createdAt");

    const results: CommentWithProfile[] = [];
    for (const comment of comments) {
      const profile = await profileRepository.get(comment.userId);
      results.push({
        comment,
        userProfile: profile ?? null,
      });
    }
    return results;
  },

  getCommentCount: async (catchId: string): Promise<number> => {
    return await db.comments.where("catchId").equals(catchId).count();
  },

  getCommentCountsBatch: async (
    catchIds: string[],
  ): Promise<Map<string, number>> => {
    const counts = new Map<string, number>();
    for (const catchId of catchIds) {
      counts.set(catchId, 0);
    }

    const comments = await db.comments
      .where("catchId")
      .anyOf(catchIds)
      .toArray();

    for (const comment of comments) {
      const current = counts.get(comment.catchId) || 0;
      counts.set(comment.catchId, current + 1);
    }

    return counts;
  },

  canDelete: async (commentId: string, userId: string): Promise<boolean> => {
    const comment = await db.comments.get(commentId);
    if (!comment) return false;
    return comment.userId === userId || comment.catchOwnerId === userId;
  },
};

export interface ConversationWithProfile {
  conversation: Conversation;
  otherUser: UserProfile | null;
  unreadCount: number;
}

export const conversationRepository = {
  getOrCreate: async (
    currentUserId: string,
    otherUserId: string,
  ): Promise<Conversation> => {
    const existing = await db.conversations
      .filter(
        (c) =>
          c.participantIds.includes(currentUserId) &&
          c.participantIds.includes(otherUserId),
      )
      .first();

    if (existing) return existing;

    const isFollowing = await followRepository.isFollowing(
      otherUserId,
      currentUserId,
    );

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      participantIds: [currentUserId, otherUserId].sort(),
      isRequest: !isFollowing,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.conversations.add(conversation);
    return conversation;
  },

  get: async (conversationId: string): Promise<Conversation | undefined> => {
    return await db.conversations.get(conversationId);
  },

  getForUser: async (
    userId: string,
    includeRequests: boolean = false,
  ): Promise<ConversationWithProfile[]> => {
    let conversations = await db.conversations
      .filter((c) => c.participantIds.includes(userId) && !c.blockedBy)
      .toArray();

    if (!includeRequests) {
      conversations = conversations.filter((c) => !c.isRequest);
    } else {
      conversations = conversations.filter((c) => c.isRequest);
    }

    conversations.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
      const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });

    const results: ConversationWithProfile[] = [];

    for (const conversation of conversations) {
      const otherUserId = conversation.participantIds.find(
        (id) => id !== userId,
      );
      const otherUser = otherUserId
        ? ((await profileRepository.get(otherUserId)) ?? null)
        : null;

      const unreadCount = await db.messages
        .where("conversationId")
        .equals(conversation.id)
        .filter((m) => m.senderId !== userId && !m.read)
        .count();

      results.push({ conversation, otherUser, unreadCount });
    }

    return results;
  },

  updateLastMessage: async (
    conversationId: string,
    messageId: string,
    messageText: string,
  ): Promise<void> => {
    await db.conversations.update(conversationId, {
      lastMessageId: messageId,
      lastMessageText: messageText.slice(0, 100),
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    });
  },

  acceptRequest: async (conversationId: string): Promise<void> => {
    await db.conversations.update(conversationId, {
      isRequest: false,
      updatedAt: new Date(),
    });
  },

  block: async (conversationId: string, userId: string): Promise<void> => {
    await db.conversations.update(conversationId, {
      blockedBy: userId,
      updatedAt: new Date(),
    });
  },

  unblock: async (conversationId: string): Promise<void> => {
    await db.conversations.update(conversationId, {
      blockedBy: undefined,
      updatedAt: new Date(),
    });
  },

  getTotalUnreadCount: async (userId: string): Promise<number> => {
    const conversations = await db.conversations
      .filter((c) => c.participantIds.includes(userId) && !c.blockedBy)
      .toArray();

    let total = 0;
    for (const conversation of conversations) {
      const count = await db.messages
        .where("conversationId")
        .equals(conversation.id)
        .filter((m) => m.senderId !== userId && !m.read)
        .count();
      total += count;
    }
    return total;
  },
};

export const messageRepository = {
  send: async (
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> => {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      content: content.slice(0, 1000),
      read: false,
      createdAt: new Date(),
    };

    await db.messages.add(message);
    await conversationRepository.updateLastMessage(
      conversationId,
      message.id,
      content,
    );

    return message;
  },

  getForConversation: async (
    conversationId: string,
    limit: number = 50,
    beforeTimestamp?: Date,
  ): Promise<Message[]> => {
    let messages = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .toArray();

    if (beforeTimestamp) {
      messages = messages.filter(
        (m) => m.createdAt.getTime() < beforeTimestamp.getTime(),
      );
    }

    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return messages.slice(0, limit).reverse();
  },

  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    await db.messages
      .where("conversationId")
      .equals(conversationId)
      .filter((m) => m.senderId !== userId && !m.read)
      .modify({ read: true });
  },

  delete: async (messageId: string): Promise<void> => {
    await db.messages.delete(messageId);
  },
};
