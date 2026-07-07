import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import { GoogleAuth } from "npm:google-auth-library@9";

// Envía una notificacion push real (funciona incluso con el navegador/app
// cerrada) al cliente cuando un profesional acepta su solicitud. Se llama
// desde un trigger de Postgres (notify_request_accepted) via pg_net,
// autenticado con un secreto compartido guardado en Supabase Vault (no un
// JWT de usuario, ya que el trigger no tiene sesion de ningun usuario).
//
// Dos rutas de envío según la plataforma de cada suscripción guardada:
// - platform='web'          -> Web Push (VAPID), como siempre.
// - platform='android'/'ios' -> FCM HTTP v1 (el WebView nativo de Android
//   no soporta la Push API del navegador; iOS entrega vía APNs a través
//   de FCM sin código adicional acá).

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const TRIGGER_SECRET = Deno.env.get("PUSH_TRIGGER_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL");
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY");

webpush.setVapidDetails("mailto:soporte@magiver.com.bo", VAPID_PUBLIC, VAPID_PRIVATE);

async function getFcmAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: {
      client_email: FIREBASE_CLIENT_EMAIL,
      private_key: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token as string;
}

async function sendFcmPush(accessToken: string, fcmToken: string, title: string, body: string, data: Record<string, string>) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token: fcmToken, notification: { title, body }, data } }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const errorCode = errBody?.error?.details?.find((d: any) => d.errorCode)?.errorCode;
    const unregistered = res.status === 404 || errorCode === "UNREGISTERED";
    throw { unregistered };
  }
}

Deno.serve(async (req) => {
  if (req.headers.get("x-trigger-secret") !== TRIGGER_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const { client_id, professional_id } = await req.json();
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: subs }, { data: pro }] = await Promise.all([
    supabase.from("push_subscriptions").select("*").eq("user_id", client_id),
    supabase.from("professionals").select("name").eq("id", professional_id).single(),
  ]);

  const title = "¡Un profesional aceptó tu solicitud!";
  const body = `${pro?.name ?? "Un profesional"} está en camino.`;
  const webSubs = (subs ?? []).filter((s: any) => s.platform === "web");
  const nativeSubs = (subs ?? []).filter((s: any) => s.platform === "android" || s.platform === "ios");

  const webPushPayload = JSON.stringify({ title, body, data: { type: "request_accepted" } });
  const sendWeb = Promise.allSettled(
    webSubs.map((s: any) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } }, webPushPayload)
        .catch(async (err: any) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }),
    ),
  );

  const sendNative = (async () => {
    if (nativeSubs.length === 0 || !FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) return;
    try {
      const accessToken = await getFcmAccessToken();
      await Promise.allSettled(
        nativeSubs.map((s: any) =>
          sendFcmPush(accessToken, s.fcm_token, title, body, { type: "request_accepted" }).catch(async (err: any) => {
            if (err?.unregistered) {
              await supabase.from("push_subscriptions").delete().eq("fcm_token", s.fcm_token);
            }
          }),
        ),
      );
    } catch {
      // Firebase aún no configurado o credenciales inválidas — no debe romper
      // el envío de Web Push, que sigue funcionando igual.
    }
  })();

  await Promise.allSettled([sendWeb, sendNative]);

  return new Response("ok", { status: 200 });
});
