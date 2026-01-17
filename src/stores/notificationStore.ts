import { create } from "zustand";
import { notificationRepository, profileRepository } from "../db/repository";
import type { Notification, UserProfile } from "../db/index";

export interface NotificationWithProfile {
  notification: Notification;
  actor: UserProfile | null;
}

interface NotificationState {
  notifications: NotificationWithProfile[];
  loading: boolean;
  unreadCount: number;

  fetchNotifications: (userId: string) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async (userId: string) => {
    set({ loading: true });
    try {
      const rawNotifications = await notificationRepository.getForUser(userId);

      const notificationsWithProfiles: NotificationWithProfile[] = [];
      for (const notification of rawNotifications) {
        const actor =
          notification.actorId !== "system"
            ? await profileRepository.get(notification.actorId)
            : null;
        notificationsWithProfiles.push({
          notification,
          actor: actor ?? null,
        });
      }

      set({ notifications: notificationsWithProfiles, loading: false });
    } catch (error) {
      console.error(
        "[NotificationStore] Failed to fetch notifications:",
        error,
      );
      set({ loading: false });
    }
  },

  fetchUnreadCount: async (userId: string) => {
    try {
      const unreadCount = await notificationRepository.getUnreadCount(userId);
      set({ unreadCount });
    } catch (error) {
      console.error("[NotificationStore] Failed to fetch unread count:", error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationRepository.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.notification.id === notificationId
            ? { ...n, notification: { ...n.notification, read: true } }
            : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("[NotificationStore] Failed to mark as read:", error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await notificationRepository.markAllAsRead(userId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          notification: { ...n.notification, read: true },
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("[NotificationStore] Failed to mark all as read:", error);
    }
  },

  reset: () => {
    set({
      notifications: [],
      loading: false,
      unreadCount: 0,
    });
  },
}));
