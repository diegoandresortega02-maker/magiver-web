// ─── MAGIVER — Configuración central ─────────────────────────────────────────
// Todos los valores sensibles vienen de variables de entorno.
// En producción crear un archivo .env con las variables VITE_*

export const config = {
  // API REST del backend MAGIVER
  // TODO: apuntar a la URL real cuando el backend esté desplegado
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1",

  // WebSocket para tiempo real (chat, tracking, notificaciones)
  // TODO: cambiar a wss:// en producción
  WS_URL: import.meta.env.VITE_WS_URL ?? "ws://localhost:3000",

  // Google Maps / Mapbox para el mapa real
  // TODO: agregar clave de Google Maps Platform
  MAPS_API_KEY: import.meta.env.VITE_MAPS_API_KEY ?? "",

  // Web Push (notificaciones reales, funcionan con el navegador cerrado).
  // Clave pública VAPID — segura de exponer en el cliente.
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "",

  // Firebase Cloud Messaging (push web + bridge con la app móvil)
  // TODO: configurar proyecto Firebase y agregar VAPID key
  FCM_VAPID_KEY: import.meta.env.VITE_FCM_VAPID_KEY ?? "",
  FIREBASE_CONFIG: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID ?? "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  },

  // Deep links para abrir la app móvil desde el sitio web
  APP_SCHEME: "magiver://",          // URI scheme de la app nativa
  APP_STORE_URL: "https://apps.apple.com/app/magiver",
  PLAY_STORE_URL: "https://play.google.com/store/apps/details?id=com.magiver",

  // Toggles de feature flags
  // TODO: conectar a un servicio de feature flags (LaunchDarkly, GrowthBook, etc.)
  FEATURES: {
    REAL_TIME_TRACKING: false,       // mapa en vivo con WebSocket
    PUSH_NOTIFICATIONS: false,       // notificaciones push web
    STRIPE_PAYMENTS: false,          // pagos integrados (cuando se agregue)
    AI_MATCHING: false,              // asignación inteligente de profesionales
  },

  // Modo mock: true = usa datos falsos, false = llama al API real
  MOCK_MODE: import.meta.env.VITE_MOCK_MODE !== "false",
} as const;

export type AppConfig = typeof config;
