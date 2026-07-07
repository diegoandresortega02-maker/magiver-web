import { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { NAVY, LIME, LogoIcon } from "../ui/primitives";

// ─── Legal modal ─────────────────────────────────────────────────────────────
export type LegalTab = "cliente" | "profesional" | "privacidad";

export const LEGAL_CONTENT: Record<LegalTab, { title: string; paragraphs: string[] }> = {
  cliente: {
    title: "Términos y Condiciones — Clientes",
    paragraphs: [
      "MAGIVER es una plataforma tecnológica que conecta personas que necesitan servicios técnicos, mantenimiento, mano de obra o asistencia bajo demanda con profesionales independientes cercanos a su ubicación.",
      "MAGIVER no presta directamente los servicios. Los servicios son realizados por profesionales independientes registrados en la plataforma.",
      "El cliente puede usar MAGIVER para buscar profesionales, solicitar servicios, enviar información del problema, compartir ubicación aproximada, adjuntar fotografías, comunicarse con profesionales y calificar el servicio recibido.",
      "El cliente debe proporcionar información verdadera, clara y suficiente sobre el servicio requerido, incluyendo tipo de servicio, ubicación, urgencia, descripción del problema y condiciones de acceso.",
      "El precio, alcance, materiales, tiempos y condiciones del trabajo deben ser acordados entre cliente y profesional antes de iniciar el servicio.",
      "El cliente se compromete a tratar con respeto al profesional, no solicitar trabajos ilegales o peligrosos, facilitar acceso seguro al lugar del servicio y pagar el monto acordado si el servicio fue aceptado y realizado.",
      "El cliente puede cancelar una solicitud antes de que el profesional inicie el traslado o el trabajo, según las reglas vigentes de la plataforma.",
      "El cliente puede calificar al profesional después de un servicio completado. Las calificaciones deben ser reales, respetuosas y relacionadas con la experiencia del servicio.",
      "El cliente puede reportar incidentes, mala conducta, fraude, cobros indebidos o problemas con el servicio mediante los canales oficiales de MAGIVER.",
    ],
  },
  profesional: {
    title: "Términos y Condiciones — Profesionales",
    paragraphs: [
      "MAGIVER permite que profesionales independientes ofrezcan servicios a clientes cercanos según categoría, ubicación, disponibilidad y reputación.",
      "El profesional actúa por cuenta propia y no existe relación laboral, dependencia, sociedad, agencia ni representación con MAGIVER.",
      "El profesional es responsable de sus herramientas, materiales, seguridad, impuestos, licencias, permisos, calidad técnica y cumplimiento de normas aplicables.",
      "Para registrarse, el profesional debe proporcionar información verdadera, incluyendo nombre, teléfono, fotografía, oficio principal, oficios secundarios, años de experiencia, ubicación aproximada y documentos de verificación.",
      "MAGIVER puede solicitar carnet de identidad, certificados, licencias, referencias u otros documentos según la categoría del servicio.",
      "El profesional puede activar o desactivar su disponibilidad. Cuando esté disponible, podrá recibir solicitudes de clientes cercanos.",
      "Antes de iniciar un trabajo, el profesional debe explicar al cliente el alcance, precio, materiales, tiempos aproximados y condiciones necesarias.",
      "El profesional debe prestar el servicio con respeto, honestidad, diligencia, cuidado del lugar y buenas prácticas del oficio.",
      "El profesional no debe cobrar montos no acordados, realizar trabajos fuera de su capacidad técnica, entregar información falsa, cometer fraude, acosar, discriminar o usar la plataforma para actividades ilegales.",
      "MAGIVER puede revisar, aprobar, rechazar, suspender o desactivar perfiles profesionales cuando existan documentos falsos, información incorrecta, reportes graves, baja reputación, incumplimientos o riesgos para usuarios.",
    ],
  },
  privacidad: {
    title: "Política de Privacidad",
    paragraphs: [
      "MAGIVER puede recopilar y tratar datos personales necesarios para operar la plataforma, incluyendo nombre, teléfono, correo electrónico, fotografía, ubicación, documentos de verificación, historial de solicitudes, calificaciones, reportes y comunicaciones dentro de la plataforma.",
      "Estos datos se utilizan para crear cuentas, verificar identidad, conectar clientes con profesionales, mostrar profesionales cercanos, gestionar solicitudes, mejorar la seguridad, prevenir fraude, brindar soporte y mejorar el servicio.",
      "MAGIVER puede compartir información necesaria entre cliente y profesional únicamente para coordinar el servicio solicitado, como nombre, ubicación aproximada, descripción del trabajo, fotografías adjuntas y datos de contacto permitidos por la plataforma.",
      "MAGIVER podrá conservar información relacionada con servicios, reportes, verificaciones y calificaciones para fines de seguridad, soporte, cumplimiento legal y mejora de la plataforma.",
      "Los usuarios deben mantener segura su cuenta y no compartir credenciales con terceros.",
      "El usuario puede solicitar actualización, corrección o eliminación de sus datos mediante los canales oficiales de contacto de MAGIVER, sujeto a obligaciones legales u operativas aplicables.",
    ],
  },
};

export function LegalModal({ defaultTab = "cliente", onClose }: {
  defaultTab?: LegalTab; onClose: () => void;
}) {
  const [tab, setTab] = useState<LegalTab>(defaultTab);
  const { title, paragraphs } = LEGAL_CONTENT[tab];

  const tabs: { key: LegalTab; label: string }[] = [
    { key: "cliente",      label: "Clientes" },
    { key: "profesional",  label: "Profesionales" },
    { key: "privacidad",   label: "Privacidad" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-2.5">
            <LogoIcon size="sm" />
            <span className="text-white font-bold text-sm">Documentos legales</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 3 tabs */}
        <div className="flex border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: "#E5E7EB" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              style={{
                color: tab === t.key ? NAVY : "#94A3B8",
                borderBottom: tab === t.key ? `2px solid ${LIME}` : "2px solid transparent",
                background: "#fff",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="px-6 pt-5 pb-2 flex-shrink-0">
          <h3 className="font-black text-base" style={{ color: NAVY }}>{title}</h3>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-slate-600 text-sm leading-relaxed mb-4 last:mb-0">{p}</p>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "#E5E7EB", background: "#F8FAFC" }}>
          <p className="text-xs text-slate-400 text-center mb-3">
            Borrador para prototipo. Antes del lanzamiento comercial, estos documentos serán revisados por un abogado conforme a la normativa vigente en Bolivia.
          </p>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:brightness-110"
            style={{ background: LIME, color: NAVY }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// Checkbox con label y links legales
export function LegalCheckbox({ checked, onChange, error, onOpen, hideMessage = false }: {
  checked: boolean; onChange: (v: boolean) => void; error: boolean;
  onOpen: (tab: LegalTab) => void; hideMessage?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => onChange(!checked)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${checked ? "border-transparent" : error ? "border-red-400" : "border-slate-300 group-hover:border-slate-400"}`}
          style={{ background: checked ? LIME : "#fff", minWidth: 20 }}>
          {checked && <Check className="w-3 h-3" style={{ color: NAVY }} />}
        </div>
        <span className="text-xs text-slate-600 leading-relaxed">
          He leído y acepto los{" "}
          <button type="button" onClick={e => { e.stopPropagation(); onOpen("cliente"); }}
            className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
            style={{ color: NAVY }}>
            Términos y Condiciones
          </button>
          {" "}y la{" "}
          <button type="button" onClick={e => { e.stopPropagation(); onOpen("privacidad"); }}
            className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
            style={{ color: NAVY }}>
            Política de Privacidad
          </button>
          {" "}de MAGIVER.
        </span>
      </label>
      {error && !hideMessage && (
        <p className="text-xs font-medium flex items-center gap-1.5 pl-8" style={{ color: "#EF4444" }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Debes aceptar los Términos y Condiciones para crear tu cuenta.
        </p>
      )}
    </div>
  );
}
