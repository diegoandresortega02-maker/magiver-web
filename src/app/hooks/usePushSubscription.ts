import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { config } from "@/lib/config";
import { savePushSubscription, saveFcmToken } from "@/lib/api";

// Notificaciones push reales (funcionan con el navegador/app cerrada). Se
// llama en un momento con contexto claro para el usuario (justo al enviar
// su primera solicitud, o al ponerse "Online" por primera vez), no al
// cargar la página — los navegadores penalizan pedir el permiso sin esa
// razón. En Android/iOS (Capacitor) el WebView nativo no soporta la Push
// API del navegador, así que ahí se usa FCM en vez de Web Push.
export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function subscribeToPushNotifications() {
  if (Capacitor.isNativePlatform()) {
    return subscribeNativePush();
  }
  return subscribeWebPush();
}

async function subscribeWebPush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !config.VAPID_PUBLIC_KEY) return;
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.VAPID_PUBLIC_KEY),
    });
    await savePushSubscription(sub.toJSON());
  } catch {
    // Falla silenciosa: es una mejora, no debe romper el flujo principal.
  }
}

async function subscribeNativePush() {
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;
    await PushNotifications.register();
    PushNotifications.addListener("registration", async (token) => {
      await saveFcmToken(token.value, Capacitor.getPlatform() === "ios" ? "ios" : "android");
    });
    PushNotifications.addListener("registrationError", () => {});
  } catch {
    // Falla silenciosa, igual que la rama web.
  }
}
