// ─── MAGIVER — Notificaciones push ────────────────────────────────────────────
// Bridge entre la web y las notificaciones nativas de la app móvil.
//
// Flujo en producción:
//   Web:     Firebase Web SDK (FCM) → token FCM → backend → envía push
//   App iOS: APNs via Firebase → app recibe notificación nativa
//   App Android: FCM → app recibe notificación nativa
//
// El backend necesita guardar el FCM token de cada dispositivo y enviar
// la notificación cuando ocurra un evento (nueva solicitud, mensaje, etc.)
//
// TODO:
//   1. npm install firebase
//   2. Configurar proyecto en Firebase Console
//   3. Agregar las variables VITE_FIREBASE_* en .env
//   4. Descomentar el código de Firebase abajo

import { config } from "./config";
import type { PushNotification } from "./types";

// ─── Solicitar permiso de notificaciones ──────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("[Notifications] Este navegador no soporta notificaciones");
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  const permission = await Notification.requestPermission();
  console.info(`[Notifications] Permiso: ${permission}`);
  return permission;
}

// ─── Obtener FCM token (para enviar al backend) ───────────────────────────────

export async function getFCMToken(): Promise<string | null> {
  if (!config.FEATURES.PUSH_NOTIFICATIONS || !config.FCM_VAPID_KEY) {
    console.info("[Notifications] Push deshabilitado — feature flag OFF o VAPID key faltante");
    return null;
  }

  // TODO: descomentar cuando Firebase esté configurado
  // import { initializeApp } from "firebase/app";
  // import { getMessaging, getToken } from "firebase/messaging";
  //
  // const app = initializeApp(config.FIREBASE_CONFIG);
  // const messaging = getMessaging(app);
  // try {
  //   const token = await getToken(messaging, { vapidKey: config.FCM_VAPID_KEY });
  //   console.info("[Notifications] FCM token obtenido");
  //   return token;
  // } catch (err) {
  //   console.error("[Notifications] Error obteniendo FCM token:", err);
  //   return null;
  // }

  return null;
}

// ─── Registrar token en el backend ───────────────────────────────────────────

export async function registerDeviceToken(
  userId: string,
  fcmToken: string,
  platform: "web" | "ios" | "android",
): Promise<void> {
  // TODO: POST /devices { userId, fcmToken, platform }
  console.info(`[Notifications] Token ${platform} registrado para usuario ${userId}`);
}

// ─── Escuchar mensajes en foreground ─────────────────────────────────────────

export function onForegroundMessage(
  handler: (notification: PushNotification) => void,
): () => void {
  if (!config.FEATURES.PUSH_NOTIFICATIONS) return () => {};

  // TODO: descomentar cuando Firebase esté configurado
  // import { getMessaging, onMessage } from "firebase/messaging";
  // const messaging = getMessaging();
  // const unsubscribe = onMessage(messaging, (payload) => {
  //   handler({
  //     title: payload.notification?.title ?? "MAGIVER",
  //     body: payload.notification?.body ?? "",
  //     data: payload.data,
  //   });
  // });
  // return unsubscribe;

  return () => {};
}

// ─── Mostrar notificación local (sin servidor) ────────────────────────────────
// Útil para notificaciones in-app cuando el usuario está usando la web

export function showLocalNotification(notification: PushNotification): void {
  if (Notification.permission !== "granted") return;

  const n = new Notification(notification.title, {
    body: notification.body,
    icon: "/isotipo.png", // TODO: agregar el isotipo al directorio public/
    badge: "/isotipo.png",
    data: notification.data,
  });

  // Navegar a la pantalla correcta al hacer clic
  n.onclick = () => {
    window.focus();
    n.close();
    // TODO: mapear notification.data.type → ruta de la app
    // "new_request" → pantalla de solicitudes del profesional
    // "request_accepted" → pantalla de seguimiento del cliente
    // "new_message" → pantalla de chat
  };
}

// ─── Deep link hacia la app móvil ────────────────────────────────────────────
// Si el usuario tiene la app instalada, la abre en la pantalla correcta.
// Si no, redirige a la tienda de apps.

export function openInApp(screen: "home" | "request" | "chat", params?: Record<string, string>): void {
  const queryStr = params ? "?" + new URLSearchParams(params).toString() : "";
  const deepLink = `${config.APP_SCHEME}${screen}${queryStr}`;

  // Intentar abrir la app nativa
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = deepLink;
  document.body.appendChild(iframe);

  // Si no se abre en 1.5s, redirigir a la tienda
  setTimeout(() => {
    document.body.removeChild(iframe);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    window.location.href = isIOS ? config.APP_STORE_URL : config.PLAY_STORE_URL;
  }, 1500);
}

// ─── Detectar si el usuario viene de la app móvil ────────────────────────────
// La app puede abrir la web con ?source=app para identificar el contexto

export function isOpenedFromApp(): boolean {
  return new URLSearchParams(window.location.search).get("source") === "app";
}
