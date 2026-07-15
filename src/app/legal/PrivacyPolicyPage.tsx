import { useNavigate } from "react-router";
import { NAVY, LIME, AppHeader, ScreenWrap } from "../ui/primitives";

// ─── PAGE: Política de Privacidad (/privacidad) ────────────────────────────
// Página pública standalone (no un modal) — necesaria porque Google Play
// Console y la App Store exigen una URL de política de privacidad accesible
// sin iniciar sesión ni instalar la app.
const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Quiénes somos",
    paragraphs: [
      "MAGIVER es una plataforma tecnológica boliviana (Santa Cruz de la Sierra) que conecta a personas que necesitan un servicio técnico o de mano de obra con profesionales independientes cercanos. Esta política explica qué datos recopilamos a través de la web y la app de MAGIVER, para qué los usamos y qué derechos tenés sobre ellos.",
    ],
  },
  {
    title: "2. Qué datos recopilamos",
    paragraphs: [
      "Si te registrás como cliente: nombre, teléfono, correo electrónico y contraseña (gestionada de forma segura, nunca almacenada en texto plano). Cuando solicitás un servicio: tu ubicación GPS (para mostrar profesionales cercanos y para el seguimiento en el mapa mientras dura el trabajo), la dirección del servicio, la descripción del problema, las fotos que decidas adjuntar, los mensajes que envíes por el chat con el profesional, y la calificación que dejes al finalizar.",
      "Si te registrás como profesional: nombre, teléfono, correo electrónico, contraseña, tus especialidades, años de experiencia, biografía, y los documentos de verificación de identidad (carnet de identidad anverso y reverso, y una selfie sosteniendo el carnet). Mientras estás \"En línea\", recopilamos tu ubicación GPS en tiempo real para poder mostrarte solicitudes cercanas y para que el cliente vea tu posición mientras vas en camino. Al finalizar un trabajo, las fotos y notas que subas quedan asociadas a esa solicitud.",
      "Datos técnicos: si activás las notificaciones, guardamos un identificador de tu dispositivo o navegador (token push) únicamente para poder enviarte avisos. También usamos una herramienta de monitoreo de errores (Sentry) que puede recibir información técnica del dispositivo y del error ocurrido, para poder detectar y corregir fallas de la app.",
    ],
  },
  {
    title: "3. Para qué usamos estos datos",
    paragraphs: [
      "Para crear y administrar tu cuenta, verificar la identidad de los profesionales antes de activarlos en la plataforma, mostrarte profesionales o solicitudes cercanas según tu ubicación, permitir la comunicación por chat entre cliente y profesional, enviarte notificaciones relevantes (una solicitud nueva, un mensaje, un cambio de estado del trabajo), calcular y mostrar calificaciones, prevenir fraude y mal uso de la plataforma, y brindarte soporte cuando lo necesites.",
    ],
  },
  {
    title: "4. Con quién compartimos tus datos",
    paragraphs: [
      "Entre cliente y profesional: solo compartimos lo necesario para coordinar el servicio puntual (nombre, ubicación aproximada, descripción del trabajo, fotos adjuntas y los mensajes del chat de esa solicitud). Un profesional nunca ve tus datos de contacto completos ni tu historial con otros profesionales, y viceversa.",
      "Con proveedores de infraestructura que procesan datos en nuestro nombre, bajo sus propias políticas de seguridad: Supabase (base de datos, autenticación y almacenamiento de archivos), Vercel (alojamiento del sitio web), Google (Firebase, para el envío de notificaciones push, y Google Maps, para geolocalización y mapas), y Sentry (monitoreo de errores técnicos).",
      "MAGIVER no vende ni alquila tus datos personales a terceros con fines publicitarios.",
    ],
  },
  {
    title: "5. Pagos",
    paragraphs: [
      "MAGIVER no procesa pagos dentro de la aplicación. El precio del servicio se acuerda directamente entre cliente y profesional por el chat, y el pago se realiza fuera de la plataforma (efectivo, transferencia, etc.). Por lo tanto, no recopilamos ni almacenamos datos de tarjetas ni de cuentas bancarias.",
    ],
  },
  {
    title: "6. Permisos del dispositivo (app Android/iOS)",
    paragraphs: [
      "Ubicación: para mostrarte profesionales o solicitudes cercanas, y para el seguimiento en tiempo real durante un servicio activo.",
      "Cámara y galería: para subir los documentos de verificación (profesionales) y las fotos del trabajo terminado.",
      "Notificaciones: para avisarte de solicitudes nuevas, mensajes y cambios de estado. Podés desactivarlas en cualquier momento desde los ajustes de tu dispositivo.",
      "Podés negar cualquiera de estos permisos; algunas funciones de la app (como ver profesionales cercanos) van a funcionar de forma limitada sin ellos.",
    ],
  },
  {
    title: "7. Seguridad de tus datos",
    paragraphs: [
      "Las contraseñas se gestionan mediante Supabase Auth y nunca se almacenan en texto plano. El acceso a los datos está restringido por reglas de seguridad a nivel de fila (Row Level Security), de forma que cada usuario solo puede ver la información que le corresponde. Los documentos de verificación de los profesionales se guardan en un almacenamiento privado, accesible únicamente por el propio profesional y por los administradores de MAGIVER durante la revisión.",
    ],
  },
  {
    title: "8. Cuánto tiempo conservamos tus datos",
    paragraphs: [
      "Conservamos tus datos mientras tu cuenta esté activa, y el tiempo adicional necesario para cumplir obligaciones legales, resolver disputas entre usuarios y hacer valer nuestros términos y condiciones.",
    ],
  },
  {
    title: "9. Tus derechos",
    paragraphs: [
      "Podés pedirnos acceder a tus datos, corregirlos, o solicitar la eliminación de tu cuenta y de tus datos personales, escribiéndonos a contacto@magiver.com.bo. Vamos a responder tu solicitud dentro de un plazo razonable, salvo que exista una obligación legal u operativa que nos exija conservar cierta información.",
    ],
  },
  {
    title: "10. Menores de edad",
    paragraphs: [
      "MAGIVER no está dirigida a menores de 18 años. No recopilamos intencionalmente datos de menores de edad.",
    ],
  },
  {
    title: "11. Cambios a esta política",
    paragraphs: [
      "Si hacemos cambios importantes a esta política, te lo vamos a notificar dentro de la app. La fecha de la última actualización figura al final de esta página.",
    ],
  },
  {
    title: "12. Contacto",
    paragraphs: [
      "Si tenés dudas sobre esta política o sobre cómo tratamos tus datos, escribinos a contacto@magiver.com.bo.",
    ],
  },
];

export function PrivacyPolicyPage() {
  const navigate = useNavigate();
  return (
    <ScreenWrap>
      <AppHeader title="Política de Privacidad" onBack={() => navigate("/")} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: LIME }}>
            Última actualización: 15 de julio de 2026
          </p>
          {SECTIONS.map((s, i) => (
            <div key={i} className="mb-7">
              <h2 className="font-bold text-base mb-2" style={{ color: NAVY }}>{s.title}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j} className="text-slate-600 text-sm leading-relaxed mb-3 last:mb-0">{p}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}
