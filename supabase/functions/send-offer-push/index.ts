import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import { GoogleAuth } from "npm:google-auth-library@9";

// Avisa a TODOS los profesionales activos/en línea que coincidan con la
// categoría de una solicitud recién creada — a diferencia de
// send-accept-push/send-message-push (un solo destinatario fijo conocido de
// antemano), esta función hace un abanico a varios profesionales. Llamada
// desde el trigger notify_new_offer vía pg_net, mismo secreto compartido de
// Vault que las otras dos.

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const TRIGGER_SECRET = Deno.env.get("PUSH_TRIGGER_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL");
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY");

webpush.setVapidDetails("mailto:soporte@magiver.com.bo", VAPID_PUBLIC, VAPID_PRIVATE);

// Deno no comparte código con el bundle de React (specialtyLabel vive del
// otro lado), así que se repite acá una tabla chica de etiquetas.
const CATEGORY_LABELS: Record<string, string> = {
  electricista: "Electricista",
  plomero: "Plomero",
  aire_acondicionado: "Aire acondicionado",
  albanil: "Albañil",
  pintor: "Pintor",
  mecanico_moto: "Mecánico de motos",
  mecanico_auto: "Mecánico de autos",
  lavado_autos: "Lavado de autos",
  termotanques: "Termotanques",
  jardineria: "Jardinería",
  fumigacion: "Fumigación",
  profesor_matematicas: "Profesor de Matemáticas",
  profesor_quimica: "Profesor de Química",
  profesor_fisica: "Profesor de Física",
  profesor_ingles: "Profesor de Inglés",
};

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
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: "high", notification: { channel_id: "default_high" } },
      },
    }),
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

  const { request_id, category } = await req.json();
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: pros }, { data: request }] = await Promise.all([
    supabase.from("professionals").select("id").eq("status", "active").eq("is_online", true).contains("specialties", [category]),
    supabase.from("service_requests").select("address_street, address_zone").eq("id", request_id).single(),
  ]);

  if (!pros || pros.length === 0) return new Response("ok", { status: 200 });

  const proIds = pros.map((p: any) => p.id);
  const { data: subs } = await supabase.from("push_subscriptions").select("*").in("user_id", proIds);

  const title = `Nueva solicitud de ${CATEGORY_LABELS[category] ?? category}`;
  const addressPart = [request?.address_street, request?.address_zone].filter(Boolean).join(", ");
  const body = addressPart ? `Cerca de ${addressPart}` : "Hay una solicitud nueva disponible cerca tuyo.";

  const webSubs = (subs ?? []).filter((s: any) => s.platform === "web");
  const nativeSubs = (subs ?? []).filter((s: any) => s.platform === "android" || s.platform === "ios");

  const webPushPayload = JSON.stringify({ title, body, data: { type: "new_offer", request_id } });
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
          sendFcmPush(accessToken, s.fcm_token, title, body, { type: "new_offer", request_id }).catch(async (err: any) => {
            if (err?.unregistered) {
              await supabase.from("push_subscriptions").delete().eq("fcm_token", s.fcm_token);
            }
          }),
        ),
      );
    } catch {
      // Firebase no configurado o credenciales inválidas — no debe romper Web Push.
    }
  })();

  await Promise.allSettled([sendWeb, sendNative]);

  return new Response("ok", { status: 200 });
});
