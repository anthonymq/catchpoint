/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === "https://api.openweathermap.org",
  new NetworkFirst({
    cacheName: "weather-api",
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.origin === "https://api.mapbox.com",
  new CacheFirst({
    cacheName: "mapbox-api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) =>
    url.hostname === "tiles.mapbox.com" ||
    url.hostname.match(/^[a-d]\.tiles\.mapbox\.com$/),
  new CacheFirst({
    cacheName: "mapbox-tiles",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 2000,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: { url?: string };
  };

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Catchpoint",
      body: event.data.text(),
    };
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || "/icons/pwa-192x192.png",
    badge: payload.badge || "/icons/pwa-192x192.png",
    tag: payload.tag || `catchpoint-${Date.now()}`,
    data: payload.data,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen =
    event.notification.data?.url || self.registration.scope + "notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (
            client.url.includes(self.registration.scope) &&
            "focus" in client
          ) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        return self.clients.openWindow(urlToOpen);
      }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_BADGE") {
    const count = event.data.count || 0;
    if ("setAppBadge" in self.navigator) {
      if (count > 0) {
        (
          self.navigator as Navigator & {
            setAppBadge: (n: number) => Promise<void>;
          }
        ).setAppBadge(count);
      } else {
        (
          self.navigator as Navigator & { clearAppBadge: () => Promise<void> }
        ).clearAppBadge();
      }
    }
  }
});
