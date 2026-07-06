/// <reference lib="webworker" />
// Service worker propio (estrategia injectManifest de vite-plugin-pwa) para
// poder agregar el manejo de notificaciones push reales, además del precache
// normal de la PWA. Con la estrategia generateSW (la que había antes) no hay
// forma de agregar un listener de "push" propio.
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// SPA con react-router: cualquier navegación que no matchee un asset cae a
// index.html (equivalente al navigateFallback que generateSW hacía solo).
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "MAGIVER", {
      body: data.body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: data.data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestId = event.notification.data?.requestId;
  event.waitUntil(
    self.clients.openWindow(requestId ? `/cliente?trackingId=${requestId}` : "/cliente"),
  );
});
