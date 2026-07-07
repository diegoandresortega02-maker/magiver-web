import { useState } from "react";
import isotipo from "@/imports/isotipo_azul_verde_para_redes_-_verde_oficial.png";
import { config } from "@/lib/config";
import {
  ChevronLeft, Eye, EyeOff, Clock, BadgeCheck, XCircle, Loader2, AlertCircle,
} from "lucide-react";
import type { JobStatus, Professional } from "../types.local";

// ─── Design tokens ─────────────────────────────────────────────────────────
export const NAVY = "#0F172A";
export const LIME = "#84CC16";
export const LIGHT = "#F8FAFC";

// ─── Dev status bar ──────────────────────────────────────────────────────────
// Solo visible en desarrollo. Muestra qué servicios están conectados vs mock.
// Desaparece automáticamente en producción (VITE_MOCK_MODE=false + build).
export function DevStatus() {
  const [open, setOpen] = useState(false);
  if (!import.meta.env.DEV) return null;

  const services = [
    { name: "API REST",        mock: config.MOCK_MODE,                        todo: config.API_BASE_URL },
    { name: "WebSocket",       mock: !config.FEATURES.REAL_TIME_TRACKING,     todo: config.WS_URL },
    { name: "Push / FCM",      mock: !config.FEATURES.PUSH_NOTIFICATIONS,     todo: "Firebase config" },
    { name: "Google Maps",     mock: !config.MAPS_API_KEY,                    todo: "VITE_MAPS_API_KEY" },
    { name: "Pagos (Stripe)",  mock: !config.FEATURES.STRIPE_PAYMENTS,        todo: "feature flag" },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-[9999]" style={{ fontFamily: "Inter, monospace" }}>
      {open ? (
        <div className="rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "#0F172A", borderColor: "rgba(132,204,22,0.3)", width: 280 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-ping" style={{ background: "#84CC16" }} />
              <span className="text-xs font-bold text-white">MAGIVER Dev Tools</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">×</button>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            {services.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  {s.mock
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>MOCK</span>
                    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.2)", color: "#4ADE80" }}>LIVE</span>
                  }
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Para conectar: <span style={{ color: "#84CC16" }}>VITE_MOCK_MODE=false</span> en .env
            </p>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: "#0F172A", borderColor: "rgba(132,204,22,0.4)", color: "#84CC16" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
          Dev · MOCK
        </button>
      )}
    </div>
  );
}

// ─── Logo ────────────────────────────────────────────────────────────────────
export function LogoIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  return (
    <img src={isotipo} alt="MAGIVER" width={px} height={px}
      className="rounded-xl object-cover flex-shrink-0"
      style={{ width: px, height: px }} />
  );
}

// ─── Shared primitives ──────────────────────────────────────────────────────
export function LimeBtn({ children, onClick, className = "", type = "button", disabled = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
  type?: "button" | "submit"; disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: LIME, color: NAVY }}>
      {children}
    </button>
  );
}

export function DangerBtn({ children, onClick, className = "", disabled = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all duration-150 hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ borderColor: "#FECACA", color: "#EF4444" }}>
      {children}
    </button>
  );
}

// Panel inferior reusable para pedir un motivo antes de rechazar/cancelar una
// solicitud: chips predefinidos + "Otro" con texto libre (obligatorio solo
// para "Otro"). Un solo componente para los 3 usos: rechazar (profesional),
// cancelar (profesional), cancelar (cliente) — cada uno con su propia lista
// de motivos.
export function ReasonPickerSheet({ title, reasons, confirmLabel, loading, error, onConfirm, onClose }: {
  title: string; reasons: { code: string; label: string }[]; confirmLabel: string;
  loading: boolean; error?: string;
  onConfirm: (reasonCode: string, reasonText?: string) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const canConfirm = selected != null && (selected !== "other" || text.trim().length > 0);
  return (
    <div className="absolute inset-0 bg-black/40 z-20 flex items-end" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />
        <h3 className="font-black text-lg mb-4" style={{ color: NAVY }}>{title}</h3>
        <div className="flex flex-col gap-2 mb-4">
          {reasons.map(r => (
            <button key={r.code} type="button" onClick={() => setSelected(r.code)}
              className="text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all"
              style={{ borderColor: selected === r.code ? LIME : "#E5E7EB", background: selected === r.code ? "#F7FEE7" : "#fff", color: NAVY }}>
              {r.label}
            </button>
          ))}
        </div>
        {selected === "other" && (
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Cuéntanos brevemente por qué..." rows={3}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none mb-4" style={{ borderColor: "#E5E7EB", color: NAVY }} />
        )}
        {error && (
          <p className="text-xs font-medium flex items-center gap-1.5 mb-3" style={{ color: "#EF4444" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </p>
        )}
        <DangerBtn onClick={() => canConfirm && onConfirm(selected!, text.trim() || undefined)} disabled={!canConfirm || loading} className="w-full py-3.5 mb-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : confirmLabel}
        </DangerBtn>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors text-center py-2">Volver</button>
      </div>
    </div>
  );
}

export function AppHeader({ title, onBack, right, dark = true }: {
  title: string; onBack?: () => void; right?: React.ReactNode; dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b flex-shrink-0"
      style={{ background: dark ? NAVY : "#fff", borderColor: dark ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
      {onBack && (
        <button onClick={onBack} className="p-1.5 rounded-lg transition-colors hover:opacity-70">
          <ChevronLeft className="w-5 h-5" style={{ color: dark ? "#fff" : NAVY }} />
        </button>
      )}
      <div className="flex items-center gap-2 flex-1">
        <LogoIcon size="sm" />
        <span className="font-bold text-sm" style={{ color: dark ? "#fff" : NAVY }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

export function ScreenWrap({ children, bg = LIGHT }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: bg, fontFamily: "Inter, sans-serif" }}>
      {children}
    </div>
  );
}

export function InputField({ label, type = "text", placeholder, value, onChange, icon, readOnly = false }: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; icon?: React.ReactNode; readOnly?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 bg-white"
          style={{ borderColor: "#E5E7EB", paddingLeft: icon ? "2.5rem" : undefined, color: NAVY, opacity: readOnly ? 0.7 : 1 }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Card({ children, className = "", onClick }: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl border p-5 transition-all duration-150 ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""} ${className}`}
      style={{ borderColor: "#E5E7EB" }}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; color: string; bg: string }> = {
    idle: { label: "Sin solicitud", color: "#6B7280", bg: "#F3F4F6" },
    searching: { label: "Buscando...", color: "#F59E0B", bg: "#FEF3C7" },
    matched: { label: "Asignado", color: "#3B82F6", bg: "#EFF6FF" },
    en_camino: { label: "En camino", color: "#8B5CF6", bg: "#EDE9FE" },
    en_sitio: { label: "En sitio", color: "#F59E0B", bg: "#FEF3C7" },
    completado: { label: "Completado", color: "#16A34A", bg: "#F0FDF4" },
  };
  const s = map[status];
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

export function ProAvatar({ pro, size = "md" }: { pro: Professional; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-9 h-9 text-xs" : size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12 text-sm";
  return <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ background: pro.color }}>{pro.initials}</div>;
}

export function VerifBadge({ status }: { status: "pending" | "active" | "rejected" }) {
  const map = {
    pending: { label: "En revisión", color: "#D97706", bg: "#FEF3C7", icon: <Clock className="w-3 h-3" /> },
    active: { label: "Verificado", color: "#16A34A", bg: "#F0FDF4", icon: <BadgeCheck className="w-3 h-3" /> },
    rejected: { label: "Rechazado", color: "#EF4444", bg: "#FEF2F2", icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status];
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{s.icon}{s.label}</span>;
}
