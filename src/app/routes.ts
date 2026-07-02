// ─── MAGIVER — Route map ──────────────────────────────────────────────────────
// The router is defined inline at the bottom of App.tsx (see createBrowserRouter).
// This file documents the public URL structure for reference.
//
// Public landing
//   /                    → LandingPage  (one-page scroll, hash tracking for GA4)
//   /#servicios          → Sección Servicios
//   /#clientes           → Sección Clientes
//   /#profesionales      → Sección Profesionales
//   /#seguridad          → Sección Seguridad
//   /#ayuda              → Sección Ayuda / FAQ
//   /#contacto           → Sección Contacto
//
// Portales (flujo interno gestionado con screen state dentro de cada portal)
//   /cliente             → ClientePortal   (auth → servicios → mapa → solicitud → tracking → calificar)
//   /profesional         → ProfesionalPortal (auth → registro → documentos → dashboard → trabajo)
//   /admin               → AdminPortal     (auth → dashboard → revisar solicitudes)
//
// Errors
//   /*                   → NotFoundPage
//
// Analytics events esperados (Google Analytics 4 / GTM):
//   page_view  /                    → visita al landing
//   page_view  /#servicios          → sección servicios vista
//   page_view  /#contacto           → sección contacto vista
//   page_view  /cliente             → usuario abrió el portal de cliente
//   page_view  /profesional         → usuario abrió el portal de profesional
//   page_view  /admin               → admin accedió al panel
//
// TODO: cuando los portales tengan sub-rutas reales (con auth middleware),
// migrar el screen-state de cada portal a rutas hijas de React Router:
//   /cliente/servicios, /cliente/solicitar, /cliente/seguimiento, etc.

export {};
