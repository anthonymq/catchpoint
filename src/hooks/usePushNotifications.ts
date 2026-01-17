import { useState, useEffect, useCallback } from "react";
import { pushNotificationService } from "@/services/push";
import { useSettingsStore } from "@/stores/settingsStore";
import { useNotificationStore } from "@/stores/notificationStore";

export function usePushNotifications() {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    pushEnabled,
    setPushEnabled,
    notificationPreferences,
    setNotificationPreference,
  } = useSettingsStore();

  const { unreadCount } = useNotificationStore();

  useEffect(() => {
    const init = async () => {
      const supported = pushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const initialized = await pushNotificationService.init();
        setIsInitialized(initialized);
        setPermissionStatus(pushNotificationService.getPermissionStatus());
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (pushEnabled && isInitialized) {
      pushNotificationService.setBadgeCount(unreadCount);
    }
  }, [unreadCount, pushEnabled, isInitialized]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const permission = await pushNotificationService.requestPermission();
    setPermissionStatus(permission);

    if (permission === "granted") {
      setPushEnabled(true);
      return true;
    }

    setPushEnabled(false);
    return false;
  }, [setPushEnabled]);

  const togglePush = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    if (pushEnabled) {
      setPushEnabled(false);
      await pushNotificationService.clearBadge();
      return false;
    }

    if (permissionStatus === "granted") {
      setPushEnabled(true);
      return true;
    }

    return requestPermission();
  }, [
    isSupported,
    pushEnabled,
    permissionStatus,
    setPushEnabled,
    requestPermission,
  ]);

  const toggleCategory = useCallback(
    (category: keyof typeof notificationPreferences) => {
      setNotificationPreference(category, !notificationPreferences[category]);
    },
    [notificationPreferences, setNotificationPreference],
  );

  return {
    isSupported,
    isInitialized,
    pushEnabled,
    permissionStatus,
    notificationPreferences,
    togglePush,
    toggleCategory,
    requestPermission,
  };
}
