export type NotificationCategory =
  | "likes"
  | "comments"
  | "follows"
  | "messages"
  | "leaderboard";

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  leaderboard: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  category: NotificationCategory;
  data?: {
    url?: string;
    catchId?: string;
    userId?: string;
    conversationId?: string;
  };
}

const DEFAULT_ICON = "/icons/pwa-192x192.png";
const DEFAULT_BADGE = "/icons/pwa-192x192.png";

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      console.log("[Push] Service workers not supported");
      return false;
    }

    if (!("PushManager" in window)) {
      console.log("[Push] Push notifications not supported");
      return false;
    }

    if (!("Notification" in window)) {
      console.log("[Push] Notifications not supported");
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      console.log("[Push] Service worker ready");
      return true;
    } catch (error) {
      console.error("[Push] Failed to get service worker registration:", error);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.log("[Push] Notifications not supported");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      console.log("[Push] Permission previously denied");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      console.log("[Push] Permission result:", permission);
      return permission;
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
      return "denied";
    }
  }

  async showNotification(payload: PushNotificationPayload): Promise<void> {
    if (Notification.permission !== "granted") {
      console.log("[Push] Permission not granted, cannot show notification");
      return;
    }

    if (!this.swRegistration) {
      console.log("[Push] No service worker registration");
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || DEFAULT_ICON,
      badge: payload.badge || DEFAULT_BADGE,
      tag: payload.tag || `catchpoint-${payload.category}-${Date.now()}`,
      data: payload.data,
      requireInteraction: false,
      silent: false,
    };

    try {
      await this.swRegistration.showNotification(payload.title, options);
      console.log("[Push] Notification shown:", payload.title);
    } catch (error) {
      console.error("[Push] Failed to show notification:", error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    if ("setAppBadge" in navigator) {
      try {
        if (count > 0) {
          await navigator.setAppBadge(count);
          console.log("[Push] Badge set to:", count);
        } else {
          await navigator.clearAppBadge();
          console.log("[Push] Badge cleared");
        }
      } catch (error) {
        console.error("[Push] Failed to set badge:", error);
      }
    } else {
      console.log("[Push] Badge API not supported");
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  isBadgeSupported(): boolean {
    return "setAppBadge" in navigator;
  }

  buildDeepLink(
    category: NotificationCategory,
    data?: PushNotificationPayload["data"],
  ): string {
    const base = window.location.origin;

    switch (category) {
      case "likes":
        if (data?.catchId) {
          return `${base}/catch/${data.catchId}`;
        }
        return `${base}/notifications`;

      case "comments":
        if (data?.catchId) {
          return `${base}/catch/${data.catchId}`;
        }
        return `${base}/notifications`;

      case "follows":
        if (data?.userId) {
          return `${base}/profile/${data.userId}`;
        }
        return `${base}/notifications`;

      case "messages":
        if (data?.conversationId) {
          return `${base}/messages/${data.conversationId}`;
        }
        return `${base}/messages`;

      case "leaderboard":
        return `${base}/leaderboards`;

      default:
        return `${base}/notifications`;
    }
  }
}

export const pushNotificationService = new PushNotificationService();

declare global {
  interface Navigator {
    setAppBadge(count?: number): Promise<void>;
    clearAppBadge(): Promise<void>;
  }
}
