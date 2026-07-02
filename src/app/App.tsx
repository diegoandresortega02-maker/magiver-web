import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from "react-router";
import isotipo from "@/imports/isotipo_azul_verde_para_redes_-_verde_oficial.png";
import { config } from "@/lib/config";
import { realtime } from "@/lib/realtime";
import { loginClient, registerClient, loginPro, loginAdmin } from "@/lib/auth";
import {
  registerProfessional as apiRegisterProfessional,
  uploadDocument as apiUploadDocument,
  getPendingVerifications, approveVerification, rejectVerification,
  getNearbyProfessionals, createServiceRequest, updateJobStatus, submitReview,
  uploadJobPhoto,
} from "@/lib/api";
import type { PendingVerification, ProUser as ApiProUser } from "@/lib/types";
import {
  MapPin, Shield, Star, CheckCircle, ChevronDown, Menu, X,
  Zap, Droplets, Wind, Wrench, Paintbrush, MoreHorizontal,
  MessageSquare, Navigation, Clock, Phone, Mail, FileCheck,
  BadgeCheck, AlertTriangle, BarChart3, Smartphone, Monitor,
  Globe, Send, ArrowRight, Briefcase, Bell, Loader2, Car,
  DollarSign, UserCheck, Award, LogOut, User, Eye, EyeOff,
  ChevronLeft, ToggleLeft, ToggleRight, ThumbsUp, Camera,
  Upload, Trash2, Edit3, Settings, Image, FilePlus, Check,
  Users, TrendingUp, XCircle, AlertCircle, ChevronRight,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────
const NAVY = "#0F172A";
const LIME = "#84CC16";
const LIGHT = "#F8FAFC";

// ─── Dev status bar ──────────────────────────────────────────────────────────
// Solo visible en desarrollo. Muestra qué servicios están conectados vs mock.
// Desaparece automáticamente en producción (VITE_MOCK_MODE=false + build).
function DevStatus() {
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
function LogoIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  return (
    <img src={isotipo} alt="MAGIVER" width={px} height={px}
      className="rounded-xl object-cover flex-shrink-0"
      style={{ width: px, height: px }} />
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface ClientUser { name: string; phone: string; email: string }

interface ProUser {
  id?: string;
  name: string; phone: string; email: string;
  specialty: string; ci: string;
  yearsExp: number; bio: string;
  status: "pending" | "active" | "rejected";
}

interface DocumentSet {
  ciFront: string; ciBack: string; selfie: string;
  certificates: string[];
}

interface Professional {
  id: string; name: string; specialty: string; rating: number;
  reviews: number; distance: number; eta: number;
  initials: string; color: string; verified: boolean; jobs: number; bio: string;
}

interface Message { id: string; from: "client" | "pro"; text: string; time: string }
interface ServiceRequest {
  service: string; description: string; address: string;
  id?: string; professionalId?: string; agreedPrice?: number; completionPhotoUrl?: string;
}

type JobStatus = "idle" | "searching" | "matched" | "en_camino" | "en_sitio" | "completado";
type Screen =
  | "landing"
  | "client-auth" | "client-profile" | "client-services" | "client-map"
  | "client-request" | "client-searching" | "client-tracking" | "client-rate" | "client-done"
  | "pro-auth" | "pro-register" | "pro-documents" | "pro-docview" | "pro-verify"
  | "pro-dashboard" | "pro-profile" | "pro-request" | "pro-job" | "pro-done"
  | "admin-auth" | "admin-dashboard" | "admin-pro-review";

// ─── Mock data ──────────────────────────────────────────────────────────────
const PROFESSIONALS: Professional[] = [
  { id: "1", name: "Carlos Rojas", specialty: "Electricista", rating: 4.9, reviews: 47, distance: 1.0, eta: 12, initials: "CR", color: "#3B82F6", verified: true, jobs: 134, bio: "Técnico eléctrico con 8 años de experiencia en instalaciones residenciales y comerciales." },
  { id: "2", name: "Ana Mendoza", specialty: "Plomera", rating: 4.8, reviews: 32, distance: 1.4, eta: 15, initials: "AM", color: "#8B5CF6", verified: true, jobs: 89, bio: "Especialista en instalaciones sanitarias, reparación de tuberías y gasfitería." },
  { id: "3", name: "Roberto Vaca", specialty: "Pintor", rating: 4.7, reviews: 28, distance: 2.1, eta: 22, initials: "RV", color: "#F59E0B", verified: true, jobs: 67, bio: "Pintor profesional con acabados de alta calidad, interior y exterior." },
  { id: "4", name: "Luis Fernández", specialty: "Albañil", rating: 4.6, reviews: 53, distance: 2.8, eta: 28, initials: "LF", color: "#EF4444", verified: true, jobs: 201, bio: "Maestro constructor con experiencia en remodelaciones, revoque, pisos y trabajos civiles." },
];

const SERVICES = [
  { id: "electricista", label: "Electricista", icon: Zap, color: "#F59E0B" },
  { id: "plomero", label: "Plomero", icon: Droplets, color: "#3B82F6" },
  { id: "aire_acondicionado", label: "Aire acond.", icon: Wind, color: "#06B6D4" },
  { id: "albanil", label: "Albañil", icon: Wrench, color: "#8B5CF6" },
  { id: "pintor", label: "Pintor", icon: Paintbrush, color: "#EC4899" },
  { id: "otro", label: "Otro", icon: MoreHorizontal, color: "#6B7280" },
];

// Convierte el id técnico guardado en la base (ej. "aire_acondicionado")
// al label en español para mostrar en pantalla. Si ya viene un label
// (dato viejo/mock), lo devuelve tal cual.
function specialtyLabel(value: string): string {
  return SERVICES.find(s => s.id === value)?.label ?? value;
}

// Convierte un profesional real (de getNearbyProfessionals) a la forma que
// espera la UI del marketplace. distance/eta quedan como valores fijos —
// el cálculo real por GPS todavía está pendiente (ver notas del proyecto).
const PRO_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];
function proUserToProfessional(u: ApiProUser, index: number): Professional {
  return {
    id: u.id, name: u.name, specialty: specialtyLabel(u.specialty), rating: u.rating,
    reviews: u.reviewCount, distance: 1.2, eta: 15,
    initials: u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    color: PRO_COLORS[index % PRO_COLORS.length], verified: true, jobs: u.completedJobs, bio: u.bio,
  };
}

function nowStr() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── App Context (shared marketplace simulation state) ────────────────────────
interface AppCtx {
  jobStatus: JobStatus;
  setJobStatus: (s: JobStatus) => void;
  messages: Message[];
  addMessage: (from: "client" | "pro", text: string) => void;
  activeRequest: ServiceRequest | null;
  setActiveRequest: (r: ServiceRequest | null) => void;
  selectedPro: Professional | null;
  setSelectedPro: (p: Professional | null) => void;
  clientRating: number | null;
  setClientRating: (r: number | null) => void;
  resetMarketplace: () => void;
}

const AppContext = createContext<AppCtx | null>(null);

function useAppCtx() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppCtx must be used inside AppContextProvider");
  return ctx;
}

function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [clientRating, setClientRating] = useState<number | null>(null);

  const addMessage = (from: "client" | "pro", text: string) =>
    setMessages(prev => [...prev, { id: String(Date.now() + Math.random()), from, text, time: nowStr() }]);

  const resetMarketplace = () => {
    setJobStatus("idle"); setMessages([]); setActiveRequest(null);
    setSelectedPro(null); setClientRating(null);
  };

  return (
    <AppContext.Provider value={{
      jobStatus, setJobStatus, messages, addMessage,
      activeRequest, setActiveRequest, selectedPro, setSelectedPro,
      clientRating, setClientRating, resetMarketplace,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Shared primitives ──────────────────────────────────────────────────────
function LimeBtn({ children, onClick, className = "", type = "button", disabled = false }: {
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

function DangerBtn({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all duration-150 hover:bg-red-50 active:scale-[0.98] ${className}`}
      style={{ borderColor: "#FECACA", color: "#EF4444" }}>
      {children}
    </button>
  );
}

function AppHeader({ title, onBack, right, dark = true }: {
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

function ScreenWrap({ children, bg = LIGHT }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: bg, fontFamily: "Inter, sans-serif" }}>
      {children}
    </div>
  );
}

function InputField({ label, type = "text", placeholder, value, onChange, icon, readOnly = false }: {
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

function Card({ children, className = "", onClick }: {
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

function StatusBadge({ status }: { status: JobStatus }) {
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

function ProAvatar({ pro, size = "md" }: { pro: Professional; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-9 h-9 text-xs" : size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12 text-sm";
  return <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ background: pro.color }}>{pro.initials}</div>;
}

function VerifBadge({ status }: { status: "pending" | "active" | "rejected" }) {
  const map = {
    pending: { label: "En revisión", color: "#D97706", bg: "#FEF3C7", icon: <Clock className="w-3 h-3" /> },
    active: { label: "Verificado", color: "#16A34A", bg: "#F0FDF4", icon: <BadgeCheck className="w-3 h-3" /> },
    rejected: { label: "Rechazado", color: "#EF4444", bg: "#FEF2F2", icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status];
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{s.icon}{s.label}</span>;
}

// ─── Map ────────────────────────────────────────────────────────────────────
const PRO_POS = [{ id: "1", x: 68, y: 30 }, { id: "2", x: 75, y: 55 }, { id: "3", x: 30, y: 65 }, { id: "4", x: 20, y: 35 }];

function MapView({ selectedProId, onSelectPro, animate = false, jobStatus }: {
  selectedProId?: string; onSelectPro?: (id: string) => void;
  animate?: boolean; jobStatus?: JobStatus;
}) {
  const [dotPos, setDotPos] = useState({ x: 68, y: 30 });
  useEffect(() => {
    if (!animate) return;
    const t = { en_camino: { x: 55, y: 45 }, en_sitio: { x: 50, y: 50 }, completado: { x: 50, y: 50 } };
    const p = t[jobStatus as keyof typeof t];
    if (p) setDotPos(p);
  }, [jobStatus, animate]);
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "#E8F5E9", aspectRatio: "16/9" }}>
      <svg className="absolute inset-0 w-full h-full opacity-25">
        <defs><pattern id="mg" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2d6a4f" strokeWidth="0.6" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#mg)" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#2d6a4f" strokeWidth="1.5" opacity="0.4" />
        <line x1="30%" y1="0" x2="20%" y2="100%" stroke="#2d6a4f" strokeWidth="1.5" opacity="0.4" />
        <line x1="65%" y1="0" x2="70%" y2="100%" stroke="#2d6a4f" strokeWidth="1.5" opacity="0.4" />
      </svg>
      {animate && jobStatus && jobStatus !== "idle" && (
        <svg className="absolute inset-0 w-full h-full">
          <line x1={`${dotPos.x}%`} y1={`${dotPos.y}%`} x2="50%" y2="50%" stroke={LIME} strokeWidth="2" strokeDasharray="5,3" opacity="0.7" />
        </svg>
      )}
      {PRO_POS.map(pos => {
        const pro = PROFESSIONALS.find(p => p.id === pos.id);
        if (!pro) return null;
        const isSel = selectedProId === pos.id;
        const isActive = animate && pos.id === "1";
        return (
          <div key={pos.id} onClick={() => onSelectPro?.(pos.id)}
            className={`absolute flex items-center justify-center rounded-full font-bold text-xs text-white cursor-pointer shadow-md transition-all duration-700 ${isSel ? "ring-2 ring-offset-1" : ""}`}
            style={{ left: `${isActive ? dotPos.x : pos.x}%`, top: `${isActive ? dotPos.y : pos.y}%`, transform: "translate(-50%,-50%)", width: isSel ? "42px" : "36px", height: isSel ? "42px" : "36px", background: isSel ? NAVY : pro.color }}>
            {isSel ? "★" : pro.initials}
          </div>
        );
      })}
      <div className="absolute flex items-center justify-center w-11 h-11 rounded-full font-bold text-sm shadow-lg" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: LIME, color: NAVY }}>Tú</div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(255,255,255,0.9)", color: NAVY }}>
        <MapPin className="w-3 h-3" style={{ color: LIME }} />Equipetrol, SCZ
      </div>
    </div>
  );
}

// ─── Legal modal ─────────────────────────────────────────────────────────────
type LegalTab = "cliente" | "profesional" | "privacidad";

const LEGAL_CONTENT: Record<LegalTab, { title: string; paragraphs: string[] }> = {
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

function LegalModal({ defaultTab = "cliente", onClose }: {
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
function LegalCheckbox({ checked, onChange, error, onOpen, hideMessage = false }: {
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

// ─── LANDING ────────────────────────────────────────────────────────────────
function LandingHeader({ onClient, onPro, onAdmin }: { onClient: () => void; onPro: () => void; onAdmin: () => void }) {
  const [open, setOpen] = useState(false);
  const scrollTo = (id: string) => { setOpen(false); document.querySelector(id)?.scrollIntoView({ behavior: "smooth" }); };
  const links = [
    { l: "Servicios", h: "#servicios" }, { l: "Clientes", h: "#clientes" },
    { l: "Profesionales", h: "#profesionales" }, { l: "Seguridad", h: "#seguridad" },
    { l: "Ayuda", h: "#ayuda" }, { l: "Contacto", h: "#contacto" },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <LogoIcon size="md" />
            <span className="text-white font-bold text-lg">MAGIVER</span>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            {links.map(({ l, h }) => (
              <button key={h} onClick={() => scrollTo(h)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{l}</button>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={onPro} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Panel Pro</button>
            <LimeBtn onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })}>Empezar</LimeBtn>
          </div>
          {/* Cambio 1: botón Menú con label accesible */}
          <button
            aria-label="Menú"
            aria-expanded={open}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-xs font-semibold">{open ? "Cerrar" : "Menú"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t px-4 pb-5" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Sección: navegación */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 px-3 pt-4 pb-2">Secciones</p>
          <nav className="flex flex-col gap-1">
            {links.map(({ l, h }) => (
              <button key={h} onClick={() => scrollTo(h)}
                className="text-left text-sm font-medium text-slate-300 hover:text-white px-3 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between">
                {l}
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            ))}
          </nav>
          {/* Sección: acciones */}
          <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <LimeBtn onClick={() => { setOpen(false); onClient(); }} className="w-full py-3.5">
              <MapPin className="w-4 h-4" />Solicitar servicio
            </LimeBtn>
            <button onClick={() => { setOpen(false); onPro(); }}
              className="w-full py-3.5 rounded-xl border text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}>
              Soy profesional
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function LandingHero({ onClient, onPro, onAdmin }: { onClient: () => void; onPro: () => void; onAdmin: () => void }) {
  const scrollToContact = () => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="pt-16 min-h-screen flex items-center" style={{ background: NAVY }}>
      {/* Cambio 3: padding inferior extra para separar del siguiente bloque */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-5" style={{ color: LIME }}>Servicios bajo demanda en Bolivia</span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6" style={{ letterSpacing: "-0.02em" }}>
              Conectamos{" "}
              <span className="block">personas que </span>
              <span className="block" style={{ color: LIME }}>resuelven.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Encuentra profesionales verificados cerca de ti para trabajos técnicos, mantenimiento, mano de obra y soluciones del día a día.
            </p>
            {/* Cambio 8: botones principales llevan a Contacto o acción clara */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <LimeBtn onClick={scrollToContact} className="text-base px-8 py-3.5">
                <MapPin className="w-4 h-4" />Solicitar servicio
              </LimeBtn>
              <button onClick={scrollToContact}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base border-2 transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
                Soy profesional
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {[["15+", "categorías"], ["GPS", "cercano"], ["24/7", "emergencias"]].map(([v, l]) => (
                <div key={v} className="flex items-center gap-2 px-4 py-2 rounded-full border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" }}>
                  <span className="font-bold text-sm" style={{ color: LIME }}>{v}</span>
                  <span className="text-slate-400 text-sm">{l}</span>
                </div>
              ))}
            </div>
            {/* Cambio 2: bloque admin eliminado del hero — movido al footer */}
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="flex items-center gap-2">
                  <LogoIcon size="sm" />
                  <span className="text-white font-bold text-sm">MAGIVER</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: LIME, color: NAVY }}>Disponible</span>
              </div>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E7EB" }}>
                <p className="text-xs text-slate-400 mb-1">¿Qué servicio necesitas?</p>
                <p className="font-semibold text-slate-800 text-sm">Electricista cerca de Equipetrol</p>
              </div>
              <div className="relative h-44 overflow-hidden" style={{ background: "#EEF7EE" }}>
                <svg className="absolute inset-0 w-full h-full opacity-25"><defs><pattern id="g2" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#4CAF50" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#g2)" /></svg>
                <svg className="absolute inset-0 w-full h-full"><line x1="48%" y1="72%" x2="76%" y2="28%" stroke={LIME} strokeWidth="2.5" strokeLinecap="round" /></svg>
                <div className="absolute flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs shadow-lg" style={{ background: LIME, color: NAVY, left: "44%", top: "62%", transform: "translate(-50%,-50%)" }}>Tú</div>
                <div className="absolute flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs shadow-lg text-white" style={{ background: NAVY, left: "72%", top: "22%", transform: "translate(-50%,-50%)" }}>4.9</div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#3B82F6" }}>CR</div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Carlos Rojas</p>
                    <p className="text-xs text-slate-500">Electricista verificado · 1.0 km</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-green-600">12 min</p>
                  <div className="flex items-center gap-0.5 justify-end"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs text-slate-500">4.9</span></div>
                </div>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={onClient} className="flex-1 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all" style={{ background: LIME, color: NAVY }}>Solicitar ahora</button>
                <button onClick={onPro} className="flex-1 py-2 rounded-xl text-xs font-bold border hover:bg-slate-50" style={{ borderColor: "#E5E7EB", color: NAVY }}>Soy profesional</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingServices({ onClient }: { onClient: () => void }) {
  const cats = [
    { icon: Zap, title: "Electricista", desc: "Instalaciones, reparaciones y mantenimiento eléctrico." },
    { icon: Droplets, title: "Plomero", desc: "Tuberías, filtraciones e instalación sanitaria." },
    { icon: Wind, title: "Aire acondicionado", desc: "Instalación, limpieza y reparación de equipos." },
    { icon: Wrench, title: "Albañil", desc: "Construcción, remodelación y trabajos civiles." },
    { icon: Paintbrush, title: "Pintor", desc: "Pintura interior, exterior y decorativa." },
    { icon: MoreHorizontal, title: "Otros servicios", desc: "Carpintería, cerrajería, jardinería y más." },
  ];
  return (
    <section id="servicios" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Categorías</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            Todo lo que necesitas,{" "}
            <span className="block">en un solo lugar.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {cats.map(c => (
            <div key={c.title} onClick={onClient} className="bg-white rounded-2xl p-6 border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#F0FDF4" }}><c.icon className="w-6 h-6" style={{ color: "#16A34A" }} /></div>
              <h3 className="font-bold text-lg mb-1.5" style={{ color: NAVY }}>{c.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">{c.desc}</p>
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}>Ver profesionales <ArrowRight className="w-3 h-3" /></div>
            </div>
          ))}
        </div>
        {/* Cambio 4: CTA general después de las categorías */}
        <div className="text-center">
          <LimeBtn onClick={onClient} className="text-base px-10 py-4">
            <MapPin className="w-4 h-4" />Solicitar un servicio ahora
          </LimeBtn>
          <p className="text-slate-400 text-sm mt-3">Sin registro previo · Profesionales verificados · GPS cercano</p>
        </div>
      </div>
    </section>
  );
}

function LandingClients({ onClient }: { onClient: () => void }) {
  const steps = [
    { n: "01", title: "Elige tu servicio", desc: "Selecciona la categoría. MAGIVER detecta tu ubicación y busca profesionales disponibles." },
    { n: "02", title: "Notificamos al profesional", desc: "En segundos, los profesionales cercanos verificados reciben tu solicitud." },
    { n: "03", title: "Contrata, chatea y califica", desc: "Coordina el trabajo y precio en el chat, sigue el trabajo en tiempo real y califica." },
  ];
  return (
    <section id="clientes" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Para clientes</span>
            <h2 className="text-4xl sm:text-5xl font-black mb-6" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Tres pasos.{" "}
              <span className="block">Un profesional.</span>
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">Sin llamadas interminables. MAGIVER conecta con el profesional indicado en minutos.</p>
            <LimeBtn onClick={onClient} className="text-base px-8 py-3.5">Solicitar servicio ahora</LimeBtn>
          </div>
          <div className="flex flex-col gap-5">
            {steps.map(s => (
              <div key={s.n} className="flex gap-5 p-5 rounded-2xl border hover:shadow-md transition-all" style={{ borderColor: "#E5E7EB" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: NAVY, color: LIME }}>{s.n}</div>
                <div><h3 className="font-bold text-base mb-1" style={{ color: NAVY }}>{s.title}</h3><p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingPros({ onPro }: { onPro: () => void }) {
  // Cambio 5: mensaje reforzado sobre solicitudes reales cercanas
  const benefits = [
    { icon: BadgeCheck, title: "Perfil verificado", desc: "Tu identidad y documentos validados dan confianza real a los clientes." },
    { icon: Navigation, title: "Solicitudes reales cerca tuyo", desc: "Recibe notificaciones de trabajos disponibles en tu zona según tu GPS." },
    { icon: BarChart3, title: "Panel de control", desc: "Gestiona tu agenda, historial de trabajos y calificaciones desde un solo lugar." },
    { icon: MessageSquare, title: "Chat directo", desc: "Coordina el trabajo y el precio de forma segura con el cliente." },
  ];
  return (
    <section id="profesionales" className="py-24" style={{ background: NAVY }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Para profesionales</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            Recibe solicitudes reales{" "}
            <span className="block">cerca de tu zona.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Únete a la red de profesionales verificados de MAGIVER y accede a clientes que ya están buscando tu servicio cerca de ti, sin intermediarios y sin cuotas.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {benefits.map(b => (
            <div key={b.title} className="p-6 rounded-2xl border hover:border-lime-400/40 hover:-translate-y-0.5 transition-all" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(132,204,22,0.15)" }}><b.icon className="w-5 h-5" style={{ color: LIME }} /></div>
              <h3 className="font-bold text-white mb-2">{b.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center"><LimeBtn onClick={onPro} className="text-base px-8 py-3.5"><Briefcase className="w-4 h-4" />Registrarme como profesional</LimeBtn></div>
      </div>
    </section>
  );
}

function LandingSecurity() {
  // Cambio 6: agregada tarjeta de presupuesto confirmado
  const items = [
    { icon: FileCheck, title: "Carnet verificado", desc: "CI presentado y validado antes de activar el perfil.", bg: "#EFF6FF", color: "#3B82F6" },
    { icon: BadgeCheck, title: "Certificados y licencias", desc: "Validación de certificaciones técnicas opcionales.", bg: "#F0FDF4", color: "#16A34A" },
    { icon: DollarSign, title: "Presupuesto antes de empezar", desc: "El cliente y el profesional acuerdan el precio por chat antes de iniciar cualquier trabajo. Sin sorpresas.", bg: "#F7FEE7", color: "#65A30D" },
    { icon: Star, title: "Calificaciones reales", desc: "Solo clientes con servicio completado pueden dejar reseña.", bg: "#FFFBEB", color: "#D97706" },
    { icon: AlertTriangle, title: "Sistema de reportes", desc: "Reporte de conductas con revisión humana garantizada.", bg: "#FEF2F2", color: "#EF4444" },
    { icon: Shield, title: "Historial transparente", desc: "Historial completo de servicios, calificaciones y antecedentes.", bg: "#F5F3FF", color: "#7C3AED" },
    { icon: Clock, title: "Soporte 24/7", desc: "Atención disponible para emergencias urgentes.", bg: "#FFF1F2", color: "#E11D48" },
    { icon: MessageSquare, title: "Chat seguro", desc: "Las conversaciones quedan registradas dentro de la plataforma para respaldo de ambas partes.", bg: "#F0FDFA", color: "#0891B2" },
  ];
  return (
    <section id="seguridad" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Seguridad</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            Confianza verificada{" "}
            <span className="block">en cada servicio.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Cada profesional es verificado, cada precio es acordado y cada trabajo queda registrado.
          </p>
        </div>
        {/* Banner destacado de presupuesto */}
        <div className="flex items-start gap-4 p-5 rounded-2xl border-2 mb-10"
          style={{ borderColor: "#84CC16", background: "#F7FEE7" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#ECFCCB" }}>
            <DollarSign className="w-6 h-6" style={{ color: "#65A30D" }} />
          </div>
          <div>
            <p className="font-bold text-base mb-1" style={{ color: NAVY }}>Presupuesto acordado antes de empezar</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              En MAGIVER el cliente y el profesional conversan y acuerdan el precio por chat <strong>antes</strong> de que comience cualquier trabajo. Sin costos ocultos, sin sorpresas al final.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-5 border hover:shadow-md hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: item.bg }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1.5" style={{ color: NAVY }}>{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "¿Cómo funciona el modelo marketplace?", a: "Los clientes publican una solicitud y profesionales verificados cercanos la reciben. El cliente elige con quién trabajar según perfil, calificación y distancia." },
    { q: "¿Cómo se coordina el precio del trabajo?", a: "El precio se coordina directamente entre el cliente y el profesional a través del chat de MAGIVER. Cada trabajo es único y el acuerdo es libre entre las partes." },
    { q: "¿Cómo se verifica a los profesionales?", a: "Cada profesional sube su CI (anverso, reverso y selfie) y certificados opcionales. Un administrador MAGIVER revisa y aprueba manualmente cada solicitud." },
    { q: "¿Qué pasa en caso de emergencia?", a: "MAGIVER tiene disponibilidad 24/7 con soporte humano en todo momento." },
    { q: "¿Hay costo para registrarme como profesional?", a: "El registro básico es gratuito. MAGIVER opera bajo comisión por servicio completado, sin cuotas mensuales." },
  ];
  return (
    <section id="ayuda" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Ayuda</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            Preguntas{" "}
            <span className="block">frecuentes.</span>
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="font-semibold text-sm pr-4" style={{ color: NAVY }}>{f.q}</span>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} style={{ color: open === i ? LIME : "#94A3B8" }} />
              </button>
              {open === i && <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t" style={{ borderColor: "#F1F5F9" }}>{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Cambio 7: dos caminos claros en contacto
function LandingContact() {
  const [path, setPath] = useState<"" | "cliente" | "profesional">("");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const pathConfig = {
    cliente: {
      label: "Quiero solicitar servicios",
      color: LIME,
      textColor: NAVY,
      placeholder: "¿Qué servicio necesitas? Cuéntanos brevemente.",
      icon: <MapPin className="w-5 h-5" />,
    },
    profesional: {
      label: "Quiero trabajar como profesional",
      color: NAVY,
      textColor: "#fff",
      placeholder: "¿Cuál es tu especialidad y años de experiencia?",
      icon: <Briefcase className="w-5 h-5" />,
    },
  };

  return (
    <section id="contacto" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Contacto</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            ¿Cómo podemos{" "}
            <span className="block">ayudarte?</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">Elige tu camino y nos ponemos en contacto contigo.</p>
        </div>

        {/* Selector de camino */}
        {!path && !sent && (
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-10">
            <button onClick={() => setPath("cliente")}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ borderColor: LIME, background: "#F7FEE7" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors" style={{ background: LIME }}>
                <MapPin className="w-8 h-8" style={{ color: NAVY }} />
              </div>
              <p className="font-black text-lg mb-2" style={{ color: NAVY }}>Necesito un servicio</p>
              <p className="text-slate-500 text-sm leading-relaxed">Quiero encontrar un profesional verificado cerca de mí para un trabajo.</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: "#65A30D" }}>
                Empezar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button onClick={() => setPath("profesional")}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ borderColor: NAVY, background: "#F8FAFC" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: NAVY }}>
                <Briefcase className="w-8 h-8" style={{ color: LIME }} />
              </div>
              <p className="font-black text-lg mb-2" style={{ color: NAVY }}>Soy profesional</p>
              <p className="text-slate-500 text-sm leading-relaxed">Quiero registrarme, verificar mi perfil y recibir solicitudes de trabajo cerca de mi zona.</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: NAVY }}>
                Registrarme <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Formulario según camino elegido */}
        {path && !sent && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setPath("")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
              <ChevronLeft className="w-4 h-4" />Volver
            </button>
            <div className="p-5 rounded-2xl mb-6 flex items-center gap-3"
              style={{ background: path === "cliente" ? "#F7FEE7" : "#F8FAFC", border: `2px solid ${path === "cliente" ? LIME : "#E5E7EB"}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: path === "cliente" ? LIME : NAVY }}>
                {path === "cliente"
                  ? <MapPin className="w-5 h-5" style={{ color: NAVY }} />
                  : <Briefcase className="w-5 h-5" style={{ color: LIME }} />
                }
              </div>
              <p className="font-bold text-sm" style={{ color: NAVY }}>{pathConfig[path].label}</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="flex flex-col gap-4">
              <InputField label="Nombre completo" placeholder="Ej. María López" value={form.name} onChange={v => setForm({ ...form, name: v })} icon={<User className="w-4 h-4" />} />
              <InputField label="Teléfono / WhatsApp" type="tel" placeholder="+591 7xxxxxxx" value={form.phone} onChange={v => setForm({ ...form, phone: v })} icon={<Phone className="w-4 h-4" />} />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Cuéntanos un poco</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder={pathConfig[path].placeholder} rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none"
                  style={{ borderColor: "#E5E7EB", color: NAVY }} />
              </div>
              <LimeBtn type="submit" className="w-full py-4 text-base mt-1">
                Enviar mensaje <Send className="w-4 h-4" />
              </LimeBtn>
            </form>
          </div>
        )}

        {sent && (
          <div className="max-w-sm mx-auto text-center py-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "#F0FDF4" }}>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-black text-2xl mb-2" style={{ color: NAVY }}>¡Mensaje enviado!</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              {path === "cliente"
                ? "Nos ponemos en contacto muy pronto para ayudarte a encontrar el profesional ideal."
                : "Revisaremos tu solicitud y te contactamos para completar el proceso de verificación."}
            </p>
            <button onClick={() => { setSent(false); setPath(""); setForm({ name: "", phone: "", message: "" }); }}
              className="text-sm font-semibold underline underline-offset-2 hover:opacity-70 transition-colors"
              style={{ color: LIME }}>
              Enviar otro mensaje
            </button>
          </div>
        )}

        {/* Info de contacto al pie */}
        <div className="flex flex-wrap justify-center gap-6 mt-14 pt-10 border-t" style={{ borderColor: "#E5E7EB" }}>
          {[{ icon: Mail, t: "contacto@magiver.com" }, { icon: Phone, t: "+591 700 00000" }, { icon: MapPin, t: "Santa Cruz de la Sierra, Bolivia" }].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-2 text-slate-400 text-sm">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />{t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFooter({ onClient, onPro, onAdmin }: { onClient: () => void; onPro: () => void; onAdmin: () => void }) {
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);

  return (
    <footer className="pt-14 pb-8 border-t" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.08)" }}>
      {legalTab && <LegalModal defaultTab={legalTab} onClose={() => setLegalTab(null)} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoIcon size="md" />
              <span className="text-white font-bold text-lg">MAGIVER</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">Conectamos personas que resuelven. Siempre existe alguien capaz de ayudarte.</p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Plataforma</p>
            {["Servicios", "Clientes", "Profesionales"].map(l => (
              <button key={l} onClick={() => document.querySelector(`#${l.toLowerCase()}`)?.scrollIntoView({ behavior: "smooth" })} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">{l}</button>
            ))}
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Acceso</p>
            <button onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">Solicitar un servicio</button>
            <button onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">Registrarme como profesional</button>
            <button onClick={onPro} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">Panel Profesional</button>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Descargar app</p>
            {["App Store", "Google Play"].map(s => (
              <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 cursor-pointer hover:border-lime-400/30 transition-colors" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <Smartphone className="w-4 h-4" style={{ color: LIME }} /><span className="text-white text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar con legales y admin */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-slate-500 text-xs">© 2025 MAGIVER. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <button
              onClick={() => setLegalTab("cliente")}
              className="text-slate-400 hover:text-white text-xs transition-colors">
              Términos y Condiciones
            </button>
            <button
              onClick={() => setLegalTab("privacidad")}
              className="text-slate-400 hover:text-white text-xs transition-colors">
              Política de Privacidad
            </button>
            <button
              onClick={onAdmin}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs transition-colors">
              <Shield className="w-3 h-3" />Acceso administrador
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── CLIENT AUTH ─────────────────────────────────────────────────────────────
function ClientAuth({ onDone, onBack }: { onDone: (u: ClientUser) => void; onBack: () => void }) {
  const [tab, setTab] = useState<"register" | "login">("register");
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "register" && !termsAccepted) { setTermsError(true); return; }
    setTermsError(false);
    setAuthError("");
    setLoading(true);
    try {
      if (config.MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1000));
        onDone({ name: name || "Usuario", phone: phone || "+591 71234567", email: email || "usuario@email.com" } as ClientUser);
        return;
      }
      const session = tab === "register"
        ? await registerClient({ name, email, phone, password: pass })
        : await loginClient(email, pass);
      onDone(session.user as ClientUser);
    } catch (err: any) {
      setAuthError(err?.message || "No se pudo procesar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrap>
      {legalTab && <LegalModal defaultTab={legalTab} onClose={() => setLegalTab(null)} />}
      <AppHeader title="MAGIVER" onBack={onBack} />
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: NAVY }}>
              <LogoIcon size="lg" />
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ color: NAVY }}>Bienvenido</h2>
            <p className="text-slate-500 text-sm">Accede a tu cuenta de cliente</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border mb-6" style={{ borderColor: "#E5E7EB" }}>
            {(["register", "login"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setTermsError(false); }} className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={{ background: tab === t ? NAVY : "#fff", color: tab === t ? "#fff" : "#475569" }}>
                {t === "register" ? "Crear cuenta" : "Iniciar sesión"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === "register" && (<>
              <InputField label="Nombre completo" placeholder="Ej. María López" value={name} onChange={setName} icon={<User className="w-4 h-4" />} />
              <InputField label="Teléfono / WhatsApp" type="tel" placeholder="+591 7xxxxxxx" value={phone} onChange={setPhone} icon={<Phone className="w-4 h-4" />} />
            </>)}
            <InputField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} />
            <InputField label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={setPass} />
            {tab === "register" && (
              <LegalCheckbox
                checked={termsAccepted}
                onChange={v => { setTermsAccepted(v); if (v) setTermsError(false); }}
                error={termsError}
                onOpen={setLegalTab}
              />
            )}
            {authError && (
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{authError}
              </p>
            )}
            <LimeBtn type="submit" disabled={loading || (tab === "register" && !termsAccepted)} className="w-full py-3.5 text-base mt-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Ingresando...</> : tab === "register" ? "Crear mi cuenta" : "Ingresar"}
            </LimeBtn>
          </form>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT PROFILE ──────────────────────────────────────────────────────────
function ClientProfile({ user, onSave, onBack }: { user: ClientUser; onSave: (u: ClientUser) => void; onBack: () => void }) {
  const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone); const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);
  return (
    <ScreenWrap>
      <AppHeader title="Mi perfil" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl text-white mb-3" style={{ background: "#3B82F6" }}>
            {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <p className="font-bold text-lg" style={{ color: NAVY }}>{name}</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full mt-1" style={{ background: "#F0FDF4", color: "#16A34A" }}>Cliente MAGIVER</span>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ name, phone, email }); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Datos personales</p>
          <InputField label="Nombre completo" placeholder="Tu nombre" value={name} onChange={setName} icon={<User className="w-4 h-4" />} />
          <InputField label="Teléfono / WhatsApp" type="tel" placeholder="+591 7xxxxxxx" value={phone} onChange={setPhone} icon={<Phone className="w-4 h-4" />} />
          <InputField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} />
          <LimeBtn type="submit" className="w-full py-3.5 text-base mt-1">
            {saved ? <><Check className="w-4 h-4" />Guardado</> : "Guardar cambios"}
          </LimeBtn>
        </form>
        <Card className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Historial de cuenta</p>
          <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Servicios solicitados</span><span className="font-semibold" style={{ color: NAVY }}>4</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Miembro desde</span><span className="font-semibold" style={{ color: NAVY }}>Jun 2025</span></div>
        </Card>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT SERVICES ─────────────────────────────────────────────────────────
function ClientServices({ user, onSelect, onProfile, onBack }: { user: ClientUser; onSelect: (s: string) => void; onProfile: () => void; onBack: () => void }) {
  return (
    <ScreenWrap>
      <AppHeader title="MAGIVER" onBack={onBack}
        right={<button onClick={onProfile} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white hover:opacity-80 transition-colors" style={{ background: "#3B82F6" }}>{user.name[0]}</button>}
      />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-6"><h2 className="text-2xl font-black mb-1" style={{ color: NAVY }}>¿Qué necesitas, {user.name.split(" ")[0]}?</h2><p className="text-slate-500 text-sm">Selecciona el tipo de servicio</p></div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 bg-white" style={{ borderColor: "#E5E7EB" }}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
          <span className="text-sm text-slate-600 flex-1">Equipetrol, Santa Cruz de la Sierra</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#16A34A" }}>GPS activo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERVICES.map(svc => (
            <div key={svc.id} onClick={() => onSelect(svc.label)} className="bg-white rounded-2xl p-4 border cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: svc.color + "1A" }}><svc.icon className="w-6 h-6" style={{ color: svc.color }} /></div>
              <p className="font-bold text-sm" style={{ color: NAVY }}>{svc.label}</p>
            </div>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT MAP ───────────────────────────────────────────────────────────────
function ClientMap({ service, onRequest, onBack }: { service: string; onRequest: (pro: Professional) => void; onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const selectedPro = professionals.find(p => p.id === selectedId);

  useEffect(() => {
    if (config.MOCK_MODE) { setProfessionals(PROFESSIONALS); setLoading(false); return; }
    const categoryId = SERVICES.find(s => s.label === service)?.id;
    setLoading(true);
    setLoadError("");
    getNearbyProfessionals({ location: { lat: -17.785, lng: -63.181 }, category: categoryId as any })
      .then(pros => setProfessionals(pros.map((p, i) => proUserToProfessional(p, i))))
      .catch((err: any) => setLoadError(err?.message || "No se pudieron cargar los profesionales."))
      .finally(() => setLoading(false));
  }, [service]);

  return (
    <ScreenWrap>
      <AppHeader title={service} onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4"><MapView /></div>
        <div className="px-4 pb-4">
          {loading && <p className="text-sm text-slate-400 text-center py-8">Buscando profesionales cerca...</p>}
          {!loading && loadError && <p className="text-sm text-red-500 text-center py-8">{loadError}</p>}
          {!loading && !loadError && professionals.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Todavía no hay profesionales verificados en esta categoría.</p>
          )}
          {!loading && professionals.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{professionals.length} profesionales disponibles cerca</p>
          )}
          <div className="flex flex-col gap-3">
            {professionals.map(pro => (
              <div key={pro.id} onClick={() => { setSelectedId(pro.id); setShowProfile(true); }}
                className="bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all"
                style={{ borderColor: selectedId === pro.id ? LIME : "#E5E7EB", outline: selectedId === pro.id ? `2px solid ${LIME}` : "none" }}>
                <div className="flex items-center gap-3">
                  <ProAvatar pro={pro} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5"><p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p>{pro.verified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}</div>
                    <p className="text-xs text-slate-500">{pro.specialty} · {pro.distance} km · {pro.jobs} trabajos</p>
                    <div className="flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs font-semibold text-slate-700">{pro.rating}</span><span className="text-xs text-slate-400">({pro.reviews})</span></div>
                  </div>
                  <div className="text-right flex-shrink-0"><p className="text-green-600 font-bold text-sm">{pro.eta} min</p><p className="text-xs text-slate-400">Disponible</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showProfile && selectedPro && (
        <div className="absolute inset-0 bg-black/40 z-10 flex items-end" onClick={() => setShowProfile(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-6" />
            <div className="flex items-start gap-4 mb-5">
              <ProAvatar pro={selectedPro} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><h3 className="font-black text-xl" style={{ color: NAVY }}>{selectedPro.name}</h3>{selectedPro.verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}</div>
                <p className="text-slate-500 text-sm mb-2">{selectedPro.specialty}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{selectedPro.rating}</span><span className="text-slate-400">({selectedPro.reviews})</span></div>
                  <div className="flex items-center gap-1 text-slate-500"><MapPin className="w-4 h-4" style={{ color: LIME }} />{selectedPro.distance} km</div>
                  <div className="flex items-center gap-1 text-green-600"><Clock className="w-4 h-4" />{selectedPro.eta} min</div>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">{selectedPro.bio}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[["Trabajos", String(selectedPro.jobs)], ["Calificación", String(selectedPro.rating)], ["Disponible", "Ahora"]].map(([l, v]) => (
                <div key={l} className="text-center p-3 rounded-xl" style={{ background: LIGHT }}><p className="font-black text-lg" style={{ color: NAVY }}>{v}</p><p className="text-xs text-slate-500">{l}</p></div>
              ))}
            </div>
            <LimeBtn onClick={() => { setShowProfile(false); onRequest(selectedPro); }} className="w-full py-4 text-base">Solicitar a {selectedPro.name.split(" ")[0]} <ArrowRight className="w-4 h-4" /></LimeBtn>
          </div>
        </div>
      )}
    </ScreenWrap>
  );
}

// ─── CLIENT REQUEST ───────────────────────────────────────────────────────────
function ClientRequest({ service, pro, onSubmit, onBack }: { service: string; pro: Professional; onSubmit: (req: ServiceRequest) => void; onBack: () => void }) {
  const [desc, setDesc] = useState(""); const [addr, setAddr] = useState("Calle Los Pinos #342, Equipetrol");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;
    setError("");
    setLoading(true);
    try {
      if (config.MOCK_MODE) {
        await new Promise(r => setTimeout(r, 800));
        onSubmit({ service, description: desc, address: addr, professionalId: pro.id });
        return;
      }
      const categoryId = (SERVICES.find(s => s.label === service)?.id ?? "otro") as any;
      const real = await createServiceRequest({
        professionalId: pro.id, category: categoryId, description: desc,
        address: { street: addr, zone: "", city: "Santa Cruz de la Sierra", lat: -17.785, lng: -63.181 },
      });
      onSubmit({ id: real.id, service, description: desc, address: addr, professionalId: pro.id });
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrap>
      <AppHeader title="Detalles del servicio" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <Card className="mb-5">
          <div className="flex items-center gap-3">
            <ProAvatar pro={pro} />
            <div>
              <div className="flex items-center gap-1.5"><p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p><BadgeCheck className="w-4 h-4 text-blue-500" /></div>
              <p className="text-xs text-slate-500">{pro.specialty} · {pro.distance} km · llega en {pro.eta} min</p>
            </div>
          </div>
        </Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Descripción del trabajo</label>
            <textarea placeholder="Describe qué necesitas. Ej: 'El tomacorriente del cuarto ya no funciona...'" value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Dirección</label>
            <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={addr} onChange={e => setAddr(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} required /></div>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <div className="flex items-start gap-2"><MessageSquare className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-amber-700 leading-relaxed">El precio se coordina directamente entre tú y el profesional a través del chat.</p></div>
          </div>
          {error && (
            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </p>
          )}
          <LimeBtn type="submit" disabled={loading || !desc} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <>Confirmar solicitud <Send className="w-4 h-4" /></>}
          </LimeBtn>
        </form>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT SEARCHING ─────────────────────────────────────────────────────────
function ClientSearching({ pro, onMatched }: { pro: Professional; onMatched: () => void }) {
  const [matched, setMatched] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setMatched(true); setTimeout(onMatched, 1500); }, 3000); return () => clearTimeout(t); }, [onMatched]);
  return (
    <ScreenWrap>
      <AppHeader title="Buscando profesional" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {!matched ? (
          <>
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-lime-200 flex items-center justify-center" style={{ borderTopColor: LIME, animation: "spin 1.2s linear infinite" }}>
                <ProAvatar pro={pro} size="lg" />
              </div>
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>Notificando a profesionales...</h2>
            <p className="text-slate-500 text-sm mb-6">Buscando disponibilidad cerca de tu ubicación</p>
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" />Conectando con {pro.name}</div>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-green-600" /></div>
            <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>¡Solicitud aceptada!</h2>
            <p className="text-slate-500 text-sm mb-2"><strong>{pro.name}</strong> aceptó tu solicitud</p>
            <p className="text-green-600 font-semibold text-sm">Llegará en aprox. {pro.eta} minutos</p>
            <p className="text-xs text-slate-400 mt-4">Abriendo seguimiento...</p>
          </>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT TRACKING ──────────────────────────────────────────────────────────
function ClientTracking({ pro, request, jobStatus, messages, onSendMessage, onComplete, onBack }: {
  pro: Professional; request: ServiceRequest; jobStatus: JobStatus;
  messages: Message[]; onSendMessage: (text: string) => void;
  onComplete: () => void; onBack: () => void;
}) {
  const [tab, setTab] = useState<"track" | "chat">("track");
  const [msg, setMsg] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  const statusSteps = [
    { key: "matched" as JobStatus, label: "Solicitud aceptada", icon: <CheckCircle className="w-4 h-4" /> },
    { key: "en_camino" as JobStatus, label: "En camino", icon: <Car className="w-4 h-4" /> },
    { key: "en_sitio" as JobStatus, label: "En sitio", icon: <MapPin className="w-4 h-4" /> },
    { key: "completado" as JobStatus, label: "Trabajo completado", icon: <Award className="w-4 h-4" /> },
  ];
  const order: JobStatus[] = ["matched", "en_camino", "en_sitio", "completado"];
  const currentIdx = order.indexOf(jobStatus);
  return (
    <ScreenWrap>
      <AppHeader title={pro.name} onBack={onBack}
        right={<button onClick={() => setTab("chat")} className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors"><MessageSquare className="w-5 h-5 text-white" />{messages.filter(m => m.from === "pro").length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: LIME }} />}</button>}
      />
      <div className="flex border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
        {(["track", "chat"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="flex-1 py-3 text-sm font-semibold transition-colors" style={{ color: tab === t ? LIME : "rgba(255,255,255,0.5)", borderBottom: tab === t ? `2px solid ${LIME}` : "2px solid transparent" }}>
            {t === "track" ? "Seguimiento" : `Chat${messages.filter(m => m.from === "pro").length > 0 ? " ●" : ""}`}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "track" ? (
          <div className="flex-1 overflow-y-auto p-4">
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-4"><ProAvatar pro={pro} /><div className="flex-1"><div className="flex items-center gap-1.5"><p className="font-bold" style={{ color: NAVY }}>{pro.name}</p><BadgeCheck className="w-4 h-4 text-blue-500" /></div><p className="text-xs text-slate-500">{pro.specialty}</p></div><StatusBadge status={jobStatus} /></div>
              <MapView animate jobStatus={jobStatus} selectedProId="1" />
            </Card>
            <Card className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Estado del servicio</p>
              {statusSteps.map((step, i) => {
                const done = i <= currentIdx; const active = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-start gap-3 mb-3 last:mb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "ring-2" : ""}`}
                      style={{ background: done ? (active ? LIME : "#F0FDF4") : "#F1F5F9", color: done ? (active ? NAVY : "#16A34A") : "#94A3B8" }}>
                      {step.icon}
                    </div>
                    <div className="pt-1"><p className="text-sm font-semibold" style={{ color: done ? NAVY : "#94A3B8" }}>{step.label}</p>{active && <p className="text-xs text-slate-400 mt-0.5">Estado actual</p>}</div>
                  </div>
                );
              })}
            </Card>
            {jobStatus === "completado" && <LimeBtn onClick={onComplete} className="w-full py-4 text-base">Calificar a {pro.name.split(" ")[0]} <Star className="w-4 h-4" /></LimeBtn>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No hay mensajes aún</div>}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.from === "client" ? "justify-end" : "justify-start"}`}>
                  {m.from === "pro" && <ProAvatar pro={pro} size="sm" />}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.from === "client" ? "rounded-br-sm ml-3" : "rounded-bl-sm ml-2"}`} style={{ background: m.from === "client" ? NAVY : "#fff", color: m.from === "client" ? "#fff" : NAVY, border: m.from === "pro" ? "1px solid #E5E7EB" : "none" }}>
                    <p>{m.text}</p><p className="text-xs mt-1 text-slate-400">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-3" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { onSendMessage(msg.trim()); setMsg(""); } }} placeholder="Escribe un mensaje..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} />
              <button onClick={() => { if (msg.trim()) { onSendMessage(msg.trim()); setMsg(""); } }} className="w-11 h-11 rounded-xl flex items-center justify-center hover:brightness-110" style={{ background: LIME }}><Send className="w-4 h-4" style={{ color: NAVY }} /></button>
            </div>
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT PRECIO PAGADO ─────────────────────────────────────────────────────
function ClientPricePaid({ pro, requestId, onDone }: { pro: Professional; requestId?: string; onDone: (price?: number) => void }) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleConfirm = async () => {
    const amount = parseFloat(price);
    if (!amount || amount <= 0) { setError("Ingresa un monto válido."); return; }
    setError("");
    setLoading(true);
    try {
      if (!config.MOCK_MODE && requestId) {
        await updateJobStatus(requestId, "completed", amount);
      } else {
        await new Promise(r => setTimeout(r, 600));
      }
      onDone(amount);
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el monto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrap>
      <AppHeader title="Precio pagado" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <ProAvatar pro={pro} size="lg" />
            <h2 className="text-2xl font-black mt-4 mb-1" style={{ color: NAVY }}>¿Cuánto pagaste?</h2>
            <p className="text-slate-500 text-sm">Este dato queda registrado para {pro.name.split(" ")[0]} y para cualquier reclamo futuro.</p>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Monto pagado (Bs.)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="number" min="0" step="0.01" value={price} onChange={e => { setPrice(e.target.value); setError(""); }} placeholder="Ej. 150" className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} />
            </div>
          </div>
          {error && (
            <p className="text-xs font-medium flex items-center gap-1.5 mb-4" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </p>
          )}
          <LimeBtn onClick={handleConfirm} disabled={loading} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <>Confirmar y calificar <ArrowRight className="w-4 h-4" /></>}
          </LimeBtn>
          <button onClick={() => onDone()} className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors">Omitir por ahora</button>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT RATE ──────────────────────────────────────────────────────────────
function ClientRate({ pro, requestId, onSubmit }: { pro: Professional; requestId?: string; onSubmit: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState(0); const [hovered, setHovered] = useState(0); const [comment, setComment] = useState(""); const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const labels = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!config.MOCK_MODE && requestId) {
        await submitReview({ requestId, rating, comment: comment || undefined });
      } else {
        await new Promise(r => setTimeout(r, 800));
      }
      onSubmit(rating, comment);
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar la calificación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrap>
      <AppHeader title="Calificar servicio" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8"><ProAvatar pro={pro} size="lg" /><h2 className="text-2xl font-black mt-4 mb-1" style={{ color: NAVY }}>¿Cómo fue el servicio?</h2><p className="text-slate-500 text-sm">{pro.name} · {pro.specialty}</p></div>
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(n)} className="transition-transform hover:scale-110 active:scale-90">
                <Star className="w-10 h-10 transition-colors" style={{ color: n <= (hovered || rating) ? "#F59E0B" : "#E5E7EB", fill: n <= (hovered || rating) ? "#FBBF24" : "none" }} />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && <p className="text-center font-semibold mb-6" style={{ color: NAVY }}>{labels[hovered || rating]}</p>}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Comentario (opcional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Cuéntanos cómo fue tu experiencia..." rows={3} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} />
          </div>
          {error && (
            <p className="text-xs font-medium flex items-center gap-1.5 mb-3" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </p>
          )}
          <LimeBtn onClick={handleSubmit} disabled={!rating || loading} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <>Enviar calificación <ThumbsUp className="w-4 h-4" /></>}
          </LimeBtn>
          <button onClick={() => onSubmit(0, "")} className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors">Omitir por ahora</button>
        </div>
      </div>
    </ScreenWrap>
  );
}

function ClientDone({ pro, rating, onAgain, onHome }: { pro: Professional; rating: number; onAgain: () => void; onHome: () => void }) {
  return (
    <ScreenWrap>
      <AppHeader title="MAGIVER" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "#F0FDF4" }}><CheckCircle className="w-12 h-12 text-green-600" /></div>
        <h2 className="text-3xl font-black mb-2" style={{ color: NAVY }}>¡Servicio completado!</h2>
        <p className="text-slate-500 mb-3">Trabajaste con <strong>{pro.name}</strong></p>
        {rating > 0 && <div className="flex items-center justify-center gap-1 mb-6">{[...Array(rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}</div>}
        <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
          <LimeBtn onClick={onAgain} className="w-full py-4 text-base">Solicitar otro servicio</LimeBtn>
          <button onClick={onHome} className="w-full py-3.5 rounded-xl border text-sm font-semibold hover:bg-slate-50" style={{ borderColor: "#E5E7EB", color: NAVY }}>Volver al inicio</button>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO AUTH ─────────────────────────────────────────────────────────────────
function ProAuth({ onLogin, onRegister, onBack }: { onLogin: (u: ProUser) => void; onRegister: () => void; onBack: () => void }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      if (config.MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1000));
        onLogin({ name: "Carlos Rojas", phone: "+591 78901234", email: "carlos@email.com", specialty: "Electricista", ci: "5678901 SC", yearsExp: 8, bio: "Técnico eléctrico certificado con 8 años de experiencia.", status: "active" } as ProUser);
        return;
      }
      const session = await loginPro(email, pass);
      onLogin(session.user as ProUser);
    } catch (err: any) {
      setAuthError(err?.message || "No se pudo iniciar sesión. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrap>
      <AppHeader title="Panel Profesional" onBack={onBack} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#EFF6FF" }}><UserCheck className="w-8 h-8 text-blue-600" /></div>
            <h2 className="text-2xl font-black mb-1" style={{ color: NAVY }}>Acceso profesional</h2>
            <p className="text-slate-500 text-sm">Ingresa a tu panel de trabajo</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <InputField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} />
            <InputField label="Contraseña" type="password" placeholder="Tu contraseña" value={pass} onChange={setPass} />
            {authError && (
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{authError}
              </p>
            )}
            <LimeBtn type="submit" disabled={loading} className="w-full py-3.5 text-base mt-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Ingresando...</> : "Ingresar al panel"}
            </LimeBtn>
          </form>
          <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px" style={{ background: "#E5E7EB" }} /><span className="text-xs text-slate-400">o</span><div className="flex-1 h-px" style={{ background: "#E5E7EB" }} /></div>
          <button onClick={onRegister} className="w-full py-3.5 rounded-xl border text-sm font-semibold hover:bg-slate-50" style={{ borderColor: "#E5E7EB", color: NAVY }}>Registrarme como profesional</button>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO REGISTER ─────────────────────────────────────────────────────────────
function ProRegister({ onSubmit, onBack }: { onSubmit: (u: ProUser) => void; onBack: () => void }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [pass, setPass] = useState(""); const [specialty, setSpecialty] = useState("");
  const [ci, setCi] = useState(""); const [yearsExp, setYearsExp] = useState(""); const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [declarationError, setDeclarationError] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !specialty || !ci) return;
    let hasError = false;
    if (!termsAccepted) { setTermsError(true); hasError = true; }
    if (!declarationAccepted) { setDeclarationError(true); hasError = true; }
    if (hasError) return;
    setAuthError("");
    setLoading(true);
    try {
      if (config.MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1000));
        onSubmit({ name, phone, email, specialty, ci, yearsExp: parseInt(yearsExp) || 1, bio, status: "pending" } as ProUser);
        return;
      }
      const { id } = await apiRegisterProfessional({
        name, phone, email, password: pass,
        specialty: specialty as any, ci, yearsExp: parseInt(yearsExp) || 1, bio,
      });
      onSubmit({ id, name, phone, email, specialty, ci, yearsExp: parseInt(yearsExp) || 1, bio, status: "pending" } as ProUser);
    } catch (err: any) {
      setAuthError(err?.message || "No se pudo completar el registro. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrap>
      {legalTab && <LegalModal defaultTab={legalTab} onClose={() => setLegalTab(null)} />}
      <AppHeader title="Registro profesional" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-6">
          <h2 className="text-xl font-black mb-1" style={{ color: NAVY }}>Crea tu perfil profesional</h2>
          <p className="text-slate-500 text-sm">Tu información será verificada por un administrador</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Datos personales</p>
          <InputField label="Nombre completo" placeholder="Como aparece en tu CI" value={name} onChange={setName} icon={<User className="w-4 h-4" />} />
          <InputField label="Teléfono / WhatsApp" type="tel" placeholder="+591 7xxxxxxx" value={phone} onChange={setPhone} icon={<Phone className="w-4 h-4" />} />
          <InputField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} />
          <InputField label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={setPass} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Especialidad</p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Categoría principal</label>
            <div className="relative">
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none bg-white" style={{ borderColor: "#E5E7EB", color: specialty ? NAVY : "#94A3B8" }} required>
                <option value="" disabled>Selecciona tu especialidad</option>
                {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <InputField label="Años de experiencia" type="number" placeholder="Ej. 5" value={yearsExp} onChange={setYearsExp} icon={<Award className="w-4 h-4" />} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Bio / Descripción (opcional)</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Cuéntanos sobre tu experiencia..." rows={3} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Verificación de identidad</p>
          <InputField label="Número de CI" placeholder="Ej. 5678901 SC" value={ci} onChange={setCi} icon={<FileCheck className="w-4 h-4" />} />
          <div className="p-4 rounded-xl border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <div className="flex items-start gap-2">
              <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">En el siguiente paso subirás tu CI (anverso, reverso) y una selfie con tu documento.</p>
            </div>
          </div>

          {/* Checkbox 1 — Términos y Privacidad */}
          <LegalCheckbox
            checked={termsAccepted}
            onChange={v => { setTermsAccepted(v); if (v) setTermsError(false); }}
            error={termsError}
            onOpen={t => setLegalTab(t === "cliente" ? "profesional" : t)}
            hideMessage
          />

          {/* Checkbox 2 — Declaración jurada */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => { setDeclarationAccepted(!declarationAccepted); if (!declarationAccepted) setDeclarationError(false); }}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${declarationAccepted ? "border-transparent" : declarationError ? "border-red-400" : "border-slate-300 group-hover:border-slate-400"}`}
              style={{ background: declarationAccepted ? LIME : "#fff", minWidth: 20 }}>
              {declarationAccepted && <Check className="w-3 h-3" style={{ color: NAVY }} />}
            </div>
            <span className="text-xs text-slate-600 leading-relaxed">
              Declaro que presto servicios como profesional independiente y que la información y documentación presentada es verdadera.
            </span>
          </label>

          {/* Mensaje combinado — spec: un solo mensaje si falta cualquiera de los dos */}
          {(termsError || declarationError) && (
            <p className="text-xs font-medium flex items-center gap-1.5 -mt-2.5" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Debes aceptar los términos y declarar que la información presentada es verdadera para crear tu cuenta profesional.
            </p>
          )}

          <LimeBtn type="submit" disabled={loading || !name || !phone || !specialty || !ci || !termsAccepted || !declarationAccepted} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <>Continuar a documentos <ArrowRight className="w-4 h-4" /></>}
          </LimeBtn>
        </form>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO DOCUMENTS ────────────────────────────────────────────────────────────
function ProDocuments({ user, onSubmit, onBack, viewOnly = false, docs }: {
  user: ProUser; onSubmit: (docs: DocumentSet) => void; onBack: () => void;
  viewOnly?: boolean; docs?: DocumentSet;
}) {
  const [ciFront, setCiFront] = useState(docs?.ciFront || "");
  const [ciBack, setCiBack] = useState(docs?.ciBack || "");
  const [selfie, setSelfie] = useState(docs?.selfie || "");
  const [certs, setCerts] = useState<string[]>(docs?.certificates || []);
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  // Sube el archivo real al bucket "verification-docs" (o simula en modo mock)
  // antes de marcar el campo como listo — así professional_documents queda
  // poblado en Supabase apenas el usuario selecciona cada archivo.
  const handleFile = async (type: "ci_front" | "ci_back" | "selfie" | "certificate", file: File, onSet: (v: string) => void) => {
    if (config.MOCK_MODE) { onSet(file.name); return; }
    setUploadError("");
    setUploadingKey(type);
    try {
      await apiUploadDocument(user.id!, type, file);
      onSet(file.name);
    } catch (err: any) {
      setUploadError(err?.message || `No se pudo subir ${file.name}. Intenta de nuevo.`);
    } finally {
      setUploadingKey(null);
    }
  };

  const DocUpload = ({ label, value, onSet, type, required = false, hint }: {
    label: string; value: string; onSet: (v: string) => void;
    type: "ci_front" | "ci_back" | "selfie"; required?: boolean; hint?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>{label} {required && !viewOnly && <span style={{ color: "#EF4444" }}>*</span>}</label>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
      {viewOnly ? (
        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${value ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
          {value ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <Image className="w-5 h-5 text-slate-300 flex-shrink-0" />}
          <span className={`text-sm truncate ${value ? "text-green-700 font-medium" : "text-slate-400"}`}>{value || "No subido"}</span>
        </div>
      ) : (
        <label className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-colors ${uploadingKey ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${value ? "border-lime-400 bg-lime-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
          {uploadingKey === type ? <><Loader2 className="w-5 h-5 text-slate-400 flex-shrink-0 animate-spin" /><span className="text-sm text-slate-400">Subiendo...</span></>
            : value ? <><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-sm font-medium text-green-700 flex-1 truncate">{value}</span><span className="text-xs text-green-600">Listo</span></>
            : <><Upload className="w-5 h-5 text-slate-400 flex-shrink-0" /><span className="text-sm text-slate-400">Toca para subir archivo</span></>}
          <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploadingKey !== null}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(type, f, onSet); }} />
        </label>
      )}
    </div>
  );

  return (
    <ScreenWrap>
      <AppHeader title={viewOnly ? "Mis documentos" : "Subir documentos"} onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        {!viewOnly && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: LIME, color: NAVY }}>2</div>
              <div><h2 className="text-lg font-black" style={{ color: NAVY }}>Verificación de identidad</h2><p className="text-xs text-slate-500">Sube los documentos requeridos</p></div>
            </div>
          </div>
        )}
        {viewOnly && (
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-xl font-black" style={{ color: NAVY }}>Documentos de verificación</h2><p className="text-xs text-slate-500 mt-0.5">Enviados para revisión</p></div>
            <VerifBadge status={user.status} />
          </div>
        )}

        <div className="flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Cédula de identidad (obligatorio)</p>
          <DocUpload label="CI Anverso (frente)" value={ciFront} onSet={setCiFront} type="ci_front" required hint={viewOnly ? undefined : "Foto clara del frente de tu carnet"} />
          <DocUpload label="CI Reverso (dorso)" value={ciBack} onSet={setCiBack} type="ci_back" hint={viewOnly ? undefined : "Foto clara del reverso de tu carnet"} />
          <DocUpload label="Selfie sosteniendo CI" value={selfie} onSet={setSelfie} type="selfie" required hint={viewOnly ? undefined : "Foto tuya sosteniendo tu CI junto a tu rostro"} />

          <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: LIME }}>Certificados profesionales (opcional)</p>
          {!viewOnly && <div className="p-3 rounded-xl text-xs text-slate-500 border" style={{ background: "#F8FAFC", borderColor: "#E5E7EB" }}>Certificaciones técnicas, licencias, títulos o diplomas. No son obligatorios pero aumentan tu visibilidad.</div>}

          {certs.map((cert, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "#E5E7EB", background: "#F0FDF4" }}>
              <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 flex-1 truncate">{cert}</span>
              {!viewOnly && <button type="button" onClick={() => setCerts(certs.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}

          {!viewOnly && (
            <label className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-colors border-slate-200 hover:border-slate-300 bg-white ${uploadingKey ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              {uploadingKey === "certificate" ? <><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /><span className="text-sm text-slate-400">Subiendo...</span></>
                : <><FilePlus className="w-5 h-5 text-slate-400" /><span className="text-sm text-slate-400">Agregar certificado (imagen o PDF)</span></>}
              <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploadingKey !== null}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile("certificate", f, v => setCerts(prev => [...prev, v])); }} />
            </label>
          )}

          {!viewOnly && uploadError && (
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "#FEF2F2" }}>
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{uploadError}</p>
            </div>
          )}

          {!viewOnly && (!ciFront || !selfie) && (
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "#FEF3C7" }}>
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">Se requiere CI anverso y selfie con CI para continuar</p>
            </div>
          )}

          {!viewOnly && (
            <LimeBtn onClick={() => { setLoading(true); setTimeout(() => onSubmit({ ciFront, ciBack, selfie, certificates: certs }), 600); }} disabled={loading || !ciFront || !selfie || uploadingKey !== null} className="w-full py-4 text-base mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando solicitud...</> : <>Enviar para verificación <Send className="w-4 h-4" /></>}
            </LimeBtn>
          )}
          {viewOnly && <button onClick={onBack} className="w-full mt-2 py-3.5 rounded-xl border text-sm font-semibold hover:bg-slate-50" style={{ borderColor: "#E5E7EB", color: NAVY }}>Volver al perfil</button>}
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO VERIFY ───────────────────────────────────────────────────────────────
function ProVerify({ user, onOpenAdmin }: { user: ProUser; onOpenAdmin: () => void }) {
  return (
    <ScreenWrap>
      <AppHeader title="Verificación pendiente" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: "#FFFBEB" }}>
            <FileCheck className="w-12 h-12 text-amber-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FEF3C7" }}><Clock className="w-4 h-4 text-amber-600" /></div>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>Solicitud enviada</h2>
        <p className="text-slate-500 mb-1">Hola, <strong>{user.name.split(" ")[0]}</strong></p>
        <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">Un administrador MAGIVER revisará tu solicitud y documentos. Te notificaremos por WhatsApp una vez aprobado.</p>
        <div className="w-full max-w-xs flex flex-col gap-3 mb-6">
          {[{ done: true, label: "Datos personales enviados" }, { done: true, label: "Documentos recibidos" }, { done: false, label: "Revisión por administrador" }, { done: false, label: "Activación del perfil" }].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.done ? "#F0FDF4" : "#F1F5F9" }}>
                {s.done ? <CheckCircle className="w-4 h-4 text-green-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
              </div>
              <span className="text-sm" style={{ color: s.done ? NAVY : "#94A3B8", fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full max-w-xs p-4 rounded-2xl border mb-4" style={{ background: "#F0F9FF", borderColor: "#BAE6FD" }}>
          <p className="text-xs text-blue-700 leading-relaxed"><strong>Modo demo:</strong> Puedes abrir el panel de administrador para aprobar tu solicitud y ver el proceso completo.</p>
        </div>
        <button onClick={onOpenAdmin} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: LIME }}>
          <Settings className="w-4 h-4" />Abrir panel administrador (demo)
        </button>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO DASHBOARD ────────────────────────────────────────────────────────────
function ProDashboard({ user, jobStatus, activeRequest, onViewRequest, onProfile, onDocuments, onLogout, onSimulateRequest }: {
  user: ProUser; jobStatus: JobStatus; activeRequest: ServiceRequest | null;
  onViewRequest: () => void; onProfile: () => void; onDocuments: () => void;
  onLogout: () => void; onSimulateRequest: () => void;
}) {
  const [available, setAvailable] = useState(true);
  const hasIncoming = jobStatus === "searching" && activeRequest;
  const hasActiveJob = jobStatus === "en_camino" || jobStatus === "en_sitio";
  const recentJobs = [
    { name: "María López", service: "Instalación tomacorriente", date: "Hoy, 09:15", rating: 5 },
    { name: "Juan Quispe", service: "Revisión tablero eléctrico", date: "Ayer, 14:30", rating: 5 },
    { name: "Rosa Mamani", service: "Cambio de foco y cableado", date: "Lun, 11:00", rating: 4 },
  ];
  return (
    <ScreenWrap>
      <div style={{ background: NAVY }} className="flex-shrink-0">
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <LogoIcon size="md" />
            <span className="text-white font-bold">MAGIVER Pro</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"><Bell className="w-5 h-5 text-white" />{hasIncoming && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: LIME }} />}</button>
            <button onClick={onProfile} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><User className="w-4 h-4 text-slate-300" /></button>
            <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><LogOut className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>
        <div className="px-4 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0" style={{ background: "#3B82F6" }}>
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">{user.name}</p>
              <p className="text-slate-400 text-sm">{specialtyLabel(user.specialty)} · {user.yearsExp} años exp.</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-slate-300">4.9 · 47 reseñas</span>
                <span className="mx-1 text-slate-600">·</span>
                <BadgeCheck className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-300">Verificado</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-400">{available ? "Online" : "Offline"}</span>
              <button onClick={() => setAvailable(!available)}>
                {available ? <ToggleRight className="w-9 h-9" style={{ color: LIME }} /> : <ToggleLeft className="w-9 h-9 text-slate-500" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["134", "Trabajos"], ["4.9", "Calificación"], ["8 años", "Experiencia"]].map(([v, l]) => (
              <div key={l} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <p className="font-black text-white text-sm">{v}</p><p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {hasIncoming && (
          <div onClick={onViewRequest} className="mb-4 p-4 rounded-2xl border-2 cursor-pointer hover:shadow-lg transition-all" style={{ borderColor: LIME, background: "#F7FEE7" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full animate-ping" style={{ background: LIME }} /><span className="font-bold text-sm" style={{ color: NAVY }}>¡Nueva solicitud!</span></div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: LIME, color: NAVY }}>Ver ahora →</span>
            </div>
            <p className="text-sm text-slate-600">{activeRequest.service}</p>
            <p className="text-xs text-slate-400 mt-0.5">📍 {activeRequest.address}</p>
          </div>
        )}
        {hasActiveJob && (
          <div onClick={onViewRequest} className="mb-4 p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all" style={{ borderColor: "#E5E7EB", background: "#F0FDF4" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm text-green-800">Trabajo en curso</p>
              <StatusBadge status={jobStatus} />
            </div>
            <p className="text-xs text-green-600">{activeRequest?.service} — {activeRequest?.address}</p>
            <div className="mt-3">
              <button onClick={e => { e.stopPropagation(); onViewRequest(); }} className="w-full py-2 rounded-xl text-xs font-bold text-center hover:brightness-110" style={{ background: LIME, color: NAVY }}>
                Actualizar estado del trabajo →
              </button>
            </div>
          </div>
        )}
        {jobStatus === "idle" && (
          <div className="mb-4 p-4 rounded-2xl border" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>Sin solicitudes activas</p>
            <p className="text-xs text-slate-500 mb-3">Mantente Online para recibir notificaciones de clientes cercanos.</p>
            <button onClick={onSimulateRequest} className="text-xs font-semibold underline underline-offset-2 hover:opacity-70" style={{ color: LIME }}>Simular solicitud entrante (demo)</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button onClick={onProfile} className="flex items-center gap-2 p-4 rounded-2xl border bg-white hover:shadow-md transition-all" style={{ borderColor: "#E5E7EB" }}>
            <User className="w-5 h-5 text-blue-500" />
            <div className="text-left"><p className="font-semibold text-xs" style={{ color: NAVY }}>Mi perfil</p><p className="text-xs text-slate-400">Ver y editar</p></div>
          </button>
          <button onClick={onDocuments} className="flex items-center gap-2 p-4 rounded-2xl border bg-white hover:shadow-md transition-all" style={{ borderColor: "#E5E7EB" }}>
            <FileCheck className="w-5 h-5 text-green-600" />
            <div className="text-left"><p className="font-semibold text-xs" style={{ color: NAVY }}>Documentos</p><p className="text-xs text-slate-400">Ver estado</p></div>
          </button>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Trabajos recientes</p>
        <div className="flex flex-col gap-3">
          {recentJobs.map((job, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: NAVY }}>{job.service}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{job.name} · {job.date}</p>
                  <div className="flex items-center gap-1 mt-1">{[...Array(job.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}</div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO PROFILE ──────────────────────────────────────────────────────────────
function ProProfile({ user, onSave, onDocuments, onBack }: { user: ProUser; onSave: (u: ProUser) => void; onDocuments: () => void; onBack: () => void }) {
  const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone); const [email, setEmail] = useState(user.email);
  const [specialty, setSpecialty] = useState(user.specialty); const [yearsExp, setYearsExp] = useState(String(user.yearsExp)); const [bio, setBio] = useState(user.bio);
  const [saved, setSaved] = useState(false);
  return (
    <ScreenWrap>
      <AppHeader title="Mi perfil profesional" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl text-white mb-3" style={{ background: "#3B82F6" }}>
            {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <p className="font-bold text-lg" style={{ color: NAVY }}>{name}</p>
          <div className="mt-1"><VerifBadge status={user.status} /></div>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...user, name, phone, email, specialty, yearsExp: parseInt(yearsExp) || 1, bio }); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Datos de contacto</p>
          <InputField label="Nombre completo" placeholder="Tu nombre" value={name} onChange={setName} icon={<User className="w-4 h-4" />} />
          <InputField label="Teléfono / WhatsApp" type="tel" placeholder="+591 7xxxxxxx" value={phone} onChange={setPhone} icon={<Phone className="w-4 h-4" />} />
          <InputField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Información profesional</p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Especialidad</label>
            <div className="relative">
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }}>
                {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <InputField label="Años de experiencia" type="number" placeholder="Ej. 5" value={yearsExp} onChange={setYearsExp} icon={<Award className="w-4 h-4" />} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Bio / Descripción</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Cuéntanos sobre tu experiencia..." rows={3} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Verificación</p>
          <div className="flex items-center justify-between p-4 rounded-xl border" style={{ background: "#F8FAFC", borderColor: "#E5E7EB" }}>
            <div><p className="text-sm font-semibold" style={{ color: NAVY }}>Número de CI</p><p className="text-sm text-slate-500">{user.ci}</p></div>
            <VerifBadge status={user.status} />
          </div>
          <button type="button" onClick={onDocuments} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-all" style={{ background: "#F8FAFC", borderColor: "#E5E7EB" }}>
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-blue-500" />
              <div className="text-left"><p className="text-sm font-semibold" style={{ color: NAVY }}>Ver mis documentos</p><p className="text-xs text-slate-500">CI, selfie y certificados</p></div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <LimeBtn type="submit" className="w-full py-3.5 text-base mt-1">
            {saved ? <><Check className="w-4 h-4" />Guardado</> : "Guardar cambios"}
          </LimeBtn>
        </form>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO REQUEST ──────────────────────────────────────────────────────────────
function ProRequestDetail({ request, onAccept, onReject, onBack }: { request: ServiceRequest; onAccept: () => void; onReject: () => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <ScreenWrap>
      <AppHeader title="Nueva solicitud" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 p-4 rounded-2xl border-2" style={{ borderColor: LIME, background: "#F7FEE7" }}>
          <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: LIME }} /><span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4D7C0F" }}>Solicitud en tiempo real</span></div>
          <p className="text-sm text-green-800">Cliente a <strong>1.0 km</strong> · El precio se coordina en el chat</p>
        </div>
        <Card className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Detalles del servicio</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}><Zap className="w-6 h-6 text-amber-500" /></div>
            <div><p className="font-bold" style={{ color: NAVY }}>{request.service}</p><p className="text-xs text-slate-500">Hace 1 minuto</p></div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex gap-2"><span className="text-slate-500 flex-shrink-0 w-24">Descripción:</span><span style={{ color: NAVY }}>{request.description}</span></div>
            <div className="flex gap-2 items-start"><MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" /><span style={{ color: NAVY }}>{request.address}</span></div>
          </div>
        </Card>
        <Card className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Cliente</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: "#8B5CF6" }}>ML</div>
            <div><p className="font-bold text-sm" style={{ color: NAVY }}>M. López</p><p className="text-xs text-slate-500">Cliente verificado · 8 servicios</p><div className="flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs text-slate-600">5.0 como cliente</span></div></div>
          </div>
        </Card>
        <div className="mb-5"><MapView selectedProId="1" /></div>
        <div className="flex flex-col gap-3">
          <LimeBtn onClick={() => { setLoading(true); setTimeout(onAccept, 800); }} disabled={loading} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Aceptando...</> : <>Aceptar solicitud <CheckCircle className="w-4 h-4" /></>}
          </LimeBtn>
          <DangerBtn onClick={onReject} className="w-full py-3.5">Rechazar solicitud</DangerBtn>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO ACTIVE JOB ───────────────────────────────────────────────────────────
function ProActiveJob({ request, jobStatus, messages, onStatusChange, onSendMessage, onFinish, onBack }: {
  request: ServiceRequest; jobStatus: JobStatus; messages: Message[];
  onStatusChange: (s: JobStatus) => void; onSendMessage: (text: string) => void;
  onFinish: (photoFile: File) => Promise<void>; onBack: () => void;
}) {
  const [tab, setTab] = useState<"job" | "chat">("job");
  const [msg, setMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  const steps = [
    { status: "en_camino" as JobStatus, label: "Estoy en camino", sub: "Informa al cliente que ya vas", icon: Car, available: jobStatus === "matched" },
    { status: "en_sitio" as JobStatus, label: "Llegué al sitio", sub: "Confirma tu llegada", icon: MapPin, available: jobStatus === "en_camino" },
    { status: "completado" as JobStatus, label: "Trabajo completado", sub: "Marca el servicio como finalizado", icon: CheckCircle, available: jobStatus === "en_sitio" },
  ];
  return (
    <ScreenWrap>
      <AppHeader title="Trabajo activo" onBack={onBack} right={<StatusBadge status={jobStatus} />} />
      <div className="flex border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
        {(["job", "chat"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="flex-1 py-3 text-sm font-semibold transition-colors" style={{ color: tab === t ? LIME : "rgba(255,255,255,0.5)", borderBottom: tab === t ? `2px solid ${LIME}` : "2px solid transparent" }}>
            {t === "job" ? "Trabajo" : `Chat${messages.filter(m => m.from === "client").length > 0 ? " ●" : ""}`}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "job" ? (
          <div className="flex-1 overflow-y-auto p-4">
            <Card className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Servicio</p>
              <p className="font-bold" style={{ color: NAVY }}>{request.service}</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{request.description}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500"><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />{request.address}</div>
            </Card>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Actualizar estado del trabajo</p>
            <div className="flex flex-col gap-3 mb-5">
              {steps.map(btn => {
                const done = ["en_camino", "en_sitio", "completado"].indexOf(jobStatus) > ["en_camino", "en_sitio", "completado"].indexOf(btn.status);
                return (
                  <button key={btn.status} onClick={() => { if (btn.available) onStatusChange(btn.status); }}
                    disabled={!btn.available && !done}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${btn.available ? "cursor-pointer hover:shadow-md" : done ? "cursor-default" : "opacity-40 cursor-not-allowed"}`}
                    style={{ borderColor: btn.available ? LIME : done ? "#D1FAE5" : "#E5E7EB", background: btn.available ? "#F7FEE7" : done ? "#F0FDF4" : "#fff" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: btn.available ? LIME : done ? "#D1FAE5" : "#F1F5F9" }}>
                      {done ? <Check className="w-5 h-5 text-green-600" /> : <btn.icon className="w-5 h-5" style={{ color: btn.available ? NAVY : "#94A3B8" }} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: btn.available ? NAVY : done ? "#16A34A" : "#94A3B8" }}>{btn.label}</p>
                      <p className="text-xs" style={{ color: btn.available ? "#475569" : done ? "#16A34A" : "#94A3B8" }}>
                        {done ? "Completado ✓" : !btn.available ? "Completa el paso anterior" : btn.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {jobStatus === "completado" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Foto del trabajo terminado <span style={{ color: "#EF4444" }}>*</span></label>
                  <label className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${photoFile ? "border-lime-400 bg-lime-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                    {photoFile ? <><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-sm font-medium text-green-700 flex-1 truncate">{photoFile.name}</span><span className="text-xs text-green-600">Listo</span></>
                      : <><Upload className="w-5 h-5 text-slate-400 flex-shrink-0" /><span className="text-sm text-slate-400">Toca para subir una foto</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setPhotoFile(f); }} />
                  </label>
                </div>
                {finishError && (
                  <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{finishError}
                  </p>
                )}
                <LimeBtn onClick={async () => {
                  if (!photoFile) return;
                  setFinishError(""); setFinishing(true);
                  try { await onFinish(photoFile); }
                  catch (err: any) { setFinishError(err?.message || "No se pudo finalizar el trabajo. Intenta de nuevo."); }
                  finally { setFinishing(false); }
                }} disabled={!photoFile || finishing} className="w-full py-4 text-base">
                  {finishing ? <><Loader2 className="w-4 h-4 animate-spin" />Finalizando...</> : <>Finalizar y ver resumen <Award className="w-4 h-4" /></>}
                </LimeBtn>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No hay mensajes aún</div>}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.from === "pro" ? "justify-end" : "justify-start"}`}>
                  {m.from === "client" && <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ background: "#8B5CF6" }}>ML</div>}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm mx-2 ${m.from === "pro" ? "rounded-br-sm" : "rounded-bl-sm"}`} style={{ background: m.from === "pro" ? NAVY : "#fff", color: m.from === "pro" ? "#fff" : NAVY, border: m.from === "client" ? "1px solid #E5E7EB" : "none" }}>
                    <p>{m.text}</p><p className="text-xs mt-1 text-slate-400">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-3" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { onSendMessage(msg.trim()); setMsg(""); } }} placeholder="Escribe un mensaje..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} />
              <button onClick={() => { if (msg.trim()) { onSendMessage(msg.trim()); setMsg(""); } }} className="w-11 h-11 rounded-xl flex items-center justify-center hover:brightness-110" style={{ background: LIME }}><Send className="w-4 h-4" style={{ color: NAVY }} /></button>
            </div>
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

function ProJobDone({ clientRating, onHome }: { clientRating: number | null; onHome: () => void }) {
  return (
    <ScreenWrap>
      <AppHeader title="MAGIVER Pro" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "#F0FDF4" }}><Award className="w-12 h-12 text-green-600" /></div>
        <h2 className="text-3xl font-black mb-2" style={{ color: NAVY }}>¡Trabajo completado!</h2>
        <p className="text-slate-500 text-sm mb-2">El servicio ha sido marcado como finalizado</p>
        {clientRating !== null && clientRating > 0 && (
          <div className="mt-4 mb-6 p-5 rounded-2xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <p className="text-sm font-semibold text-amber-800 mb-2">El cliente te calificó</p>
            <div className="flex items-center justify-center gap-1">{[...Array(clientRating)].map((_, i) => <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400" />)}</div>
          </div>
        )}
        <LimeBtn onClick={onHome} className="w-full max-w-xs py-4 text-base mt-4">Volver al dashboard</LimeBtn>
      </div>
    </ScreenWrap>
  );
}

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────
function AdminAuth({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Atajo demo: campos vacíos entra directo, sin tocar Supabase (documentado en el aviso de abajo).
    if (config.MOCK_MODE || (!email && !pass)) {
      setLoading(true);
      setTimeout(() => onLogin(), 800);
      return;
    }
    setLoading(true);
    try {
      await loginAdmin(email, pass);
      onLogin();
    } catch (err: any) {
      setError(err?.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrap>
      <AppHeader title="Panel Administrador" onBack={onBack} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}><Shield className="w-8 h-8 text-red-500" /></div>
            <h2 className="text-2xl font-black mb-1" style={{ color: NAVY }}>Acceso administrador</h2>
            <p className="text-slate-500 text-sm">Credenciales de acceso restringido</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField label="Correo administrador" type="email" placeholder="admin@magiver.com" value={email} onChange={v => { setEmail(v); setError(""); }} icon={<Mail className="w-4 h-4" />} />
            <InputField label="Contraseña" type="password" placeholder="••••••••" value={pass} onChange={v => { setPass(v); setError(""); }} />
            {error && <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2" }}><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /><p className="text-xs text-red-700">{error}</p></div>}
            <LimeBtn type="submit" disabled={loading} className="w-full py-3.5 text-base mt-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</> : "Ingresar"}
            </LimeBtn>
          </form>
          <div className="mt-5 p-3 rounded-xl text-xs text-center" style={{ background: "#F8FAFC", color: "#475569" }}>
            Deja los campos vacíos y presiona Ingresar para entrar en modo demo.
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ pendingList, loadingPending, onReview, onLogout }: {
  pendingList: PendingVerification[]; loadingPending: boolean; onReview: (rec: PendingVerification) => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState<"pending" | "active" | "rejected">("pending");
  const activeMock = [
    { name: "Carlos Rojas", specialty: "Electricista", ci: "5678901 SC", approvedAt: "20/06/2025", jobs: 134, rating: 4.9 },
    { name: "Ana Mendoza", specialty: "Plomera", ci: "4321098 LP", approvedAt: "18/06/2025", jobs: 89, rating: 4.8 },
    { name: "Roberto Vaca", specialty: "Pintor", ci: "7654321 CB", approvedAt: "15/06/2025", jobs: 67, rating: 4.7 },
  ];
  const rejectedMock = [{ name: "Pedro Alandia", specialty: "Albañil", ci: "1234567 SC", rejectedAt: "22/06/2025", reason: "Documentos ilegibles" }];
  const stats = [
    { label: "Pendientes", value: pendingList.length, color: "#F59E0B" },
    { label: "Activos", value: activeMock.length, color: "#16A34A" },
    { label: "Rechazados", value: rejectedMock.length, color: "#EF4444" },
    { label: "Clientes", value: 248, color: "#3B82F6" },
    { label: "Servicios hoy", value: 31, color: "#8B5CF6" },
    { label: "Total completados", value: 1432, color: "#06B6D4" },
  ];
  return (
    <ScreenWrap>
      <div style={{ background: NAVY }} className="flex-shrink-0 px-4 pt-5 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <LogoIcon size="md" />
            <div><p className="text-white font-bold text-sm">MAGIVER Admin</p><p className="text-slate-400 text-xs">Panel de control</p></div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><LogOut className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(s => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <p className="font-black text-lg text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex border-b bg-white" style={{ borderColor: "#E5E7EB" }}>
        {(["pending", "active", "rejected"] as const).map(t => {
          const labels = { pending: `Pendientes (${pendingList.length})`, active: "Activos", rejected: "Rechazados" };
          return <button key={t} onClick={() => setTab(t)} className="flex-1 py-3 text-xs font-semibold transition-colors" style={{ color: tab === t ? NAVY : "#94A3B8", borderBottom: tab === t ? `2px solid ${LIME}` : "2px solid transparent" }}>{labels[t]}</button>;
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "pending" && (
          loadingPending ? (
            <div className="text-center py-12 text-slate-400"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" /><p className="text-sm">Cargando solicitudes...</p></div>
          ) : pendingList.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" /><p className="font-semibold">Sin solicitudes pendientes</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingList.map(rec => (
                <div key={rec.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: "#8B5CF6" }}>
                      {rec.professional.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: NAVY }}>{rec.professional.name}</p>
                      <p className="text-xs text-slate-500">{specialtyLabel(rec.professional.specialty)} · {rec.professional.yearsExp} años exp.</p>
                      <p className="text-xs text-slate-400">CI: {rec.professional.ci}</p>
                    </div>
                    <VerifBadge status="pending" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <Clock className="w-3 h-3" />Enviado: {new Date(rec.submittedAt).toLocaleString("es-BO")}
                    <span className="ml-auto">{rec.documents.ciFrontUrl ? "✓CI " : ""}{rec.documents.selfieUrl ? "✓Selfie " : ""}{rec.documents.certificateUrls.length > 0 ? `✓${rec.documents.certificateUrls.length}cert` : ""}</span>
                  </div>
                  <LimeBtn onClick={() => onReview(rec)} className="w-full py-2.5 text-sm">Revisar solicitud <ArrowRight className="w-3.5 h-3.5" /></LimeBtn>
                </div>
              ))}
            </div>
          )
        )}
        {tab === "active" && (
          <div className="flex flex-col gap-3">
            {activeMock.map(pro => (
              <Card key={pro.name}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#3B82F6" }}>{pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5"><p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p><BadgeCheck className="w-4 h-4 text-blue-500" /></div>
                    <p className="text-xs text-slate-500">{pro.specialty} · CI: {pro.ci}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{pro.jobs} trabajos</span>
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{pro.rating}</span>
                      <span>Aprobado: {pro.approvedAt}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === "rejected" && (
          <div className="flex flex-col gap-3">
            {rejectedMock.map(pro => (
              <Card key={pro.name}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#EF4444" }}>{pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p>
                    <p className="text-xs text-slate-500">{pro.specialty} · CI: {pro.ci}</p>
                    <p className="text-xs text-red-500 mt-0.5">Rechazado: {pro.rejectedAt} — {pro.reason}</p>
                  </div>
                  <VerifBadge status="rejected" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── ADMIN PRO REVIEW ─────────────────────────────────────────────────────────
function AdminProReview({ record, onDone, onBack }: {
  record: PendingVerification; onDone: () => void; onBack: () => void;
}) {
  const [action, setAction] = useState<"idle" | "approving" | "rejecting" | "done-approve" | "done-reject">("idle");
  const [rejectReason, setRejectReason] = useState(""); const [showRejectForm, setShowRejectForm] = useState(false);
  const [apiError, setApiError] = useState("");
  const DocRow = ({ label, url, required = false }: { label: string; url?: string; required?: boolean }) => (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: "#E5E7EB" }}>
          <img src={url} alt={label} className="w-full h-full object-cover" />
        </a>
      ) : (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: required ? "#FEF2F2" : "#F1F5F9" }}>
          {required ? <AlertCircle className="w-4 h-4 text-red-400" /> : <X className="w-4 h-4 text-slate-300" />}
        </div>
      )}
      <div className="flex-1"><p className="text-xs font-semibold" style={{ color: NAVY }}>{label}</p>
        {url ? <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver documento completo</a> : <p className="text-xs" style={{ color: required ? "#EF4444" : "#94A3B8" }}>{required ? "No subido (requerido)" : "No subido (opcional)"}</p>}
      </div>
    </div>
  );
  const handleApprove = async () => {
    setAction("approving"); setApiError("");
    try {
      await approveVerification(record.id);
      setAction("done-approve");
    } catch (err: any) {
      setApiError(err?.message || "No se pudo aprobar el perfil. Intenta de nuevo.");
      setAction("idle");
    }
  };
  const handleReject = async () => {
    setAction("rejecting"); setApiError("");
    try {
      await rejectVerification(record.id, rejectReason);
      setAction("done-reject");
    } catch (err: any) {
      setApiError(err?.message || "No se pudo rechazar la solicitud. Intenta de nuevo.");
      setAction("idle");
    }
  };
  if (action === "done-approve") return (
    <ScreenWrap>
      <AppHeader title="Panel Administrador" onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "#F0FDF4" }}><CheckCircle className="w-12 h-12 text-green-600" /></div>
        <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>¡Perfil aprobado!</h2>
        <p className="text-slate-500 mb-1"><strong>{record.professional.name}</strong> ha sido verificado</p>
        <p className="text-sm text-slate-400 mb-8">Se enviará notificación por WhatsApp al profesional</p>
        <LimeBtn onClick={onDone} className="w-full max-w-xs py-4 text-base">Volver al panel</LimeBtn>
      </div>
    </ScreenWrap>
  );
  if (action === "done-reject") return (
    <ScreenWrap>
      <AppHeader title="Panel Administrador" onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "#FEF2F2" }}><XCircle className="w-12 h-12 text-red-500" /></div>
        <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>Solicitud rechazada</h2>
        <p className="text-slate-500 mb-1"><strong>{record.professional.name}</strong> ha sido notificado</p>
        {rejectReason && <p className="text-sm text-slate-400 mb-8">Razón: {rejectReason}</p>}
        <LimeBtn onClick={onDone} className="w-full max-w-xs py-4 text-base">Volver al panel</LimeBtn>
      </div>
    </ScreenWrap>
  );
  return (
    <ScreenWrap>
      <AppHeader title="Revisar solicitud" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <Card className="mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white flex-shrink-0" style={{ background: "#8B5CF6" }}>
              {record.professional.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1"><h3 className="font-black text-lg" style={{ color: NAVY }}>{record.professional.name}</h3><p className="text-sm text-slate-500">{specialtyLabel(record.professional.specialty)}</p><VerifBadge status="pending" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-400">Teléfono</p><p className="font-semibold" style={{ color: NAVY }}>{record.professional.phone}</p></div>
            <div><p className="text-xs text-slate-400">Email</p><p className="font-semibold" style={{ color: NAVY }}>{record.professional.email}</p></div>
            <div><p className="text-xs text-slate-400">CI</p><p className="font-semibold" style={{ color: NAVY }}>{record.professional.ci}</p></div>
            <div><p className="text-xs text-slate-400">Experiencia</p><p className="font-semibold" style={{ color: NAVY }}>{record.professional.yearsExp} años</p></div>
            <div className="col-span-2"><p className="text-xs text-slate-400 mb-1">Bio</p><p className="text-sm text-slate-600 leading-relaxed">{record.professional.bio || "Sin descripción"}</p></div>
          </div>
        </Card>
        <Card className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Documentos subidos</p>
          <DocRow label="CI Anverso" url={record.documents.ciFrontUrl || undefined} required />
          <DocRow label="CI Reverso" url={record.documents.ciBackUrl} />
          <DocRow label="Selfie con CI" url={record.documents.selfieUrl || undefined} required />
          {record.documents.certificateUrls.length > 0
            ? record.documents.certificateUrls.map((url, i) => <DocRow key={i} label={`Certificado ${i + 1}`} url={url} />)
            : <DocRow label="Certificados profesionales" required={false} />
          }
        </Card>
        <p className="text-xs text-slate-400 mb-5 text-center">Enviado el {new Date(record.submittedAt).toLocaleString("es-BO")}</p>
        {apiError && (
          <div className="p-3 rounded-xl flex items-center gap-2 mb-4" style={{ background: "#FEF2F2" }}>
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{apiError}</p>
          </div>
        )}
        {!showRejectForm ? (
          <div className="flex flex-col gap-3">
            <LimeBtn onClick={handleApprove} disabled={action === "approving"} className="w-full py-4 text-base">
              {action === "approving" ? <><Loader2 className="w-4 h-4 animate-spin" />Aprobando...</> : <>Aprobar perfil <BadgeCheck className="w-4 h-4" /></>}
            </LimeBtn>
            <DangerBtn onClick={() => setShowRejectForm(true)} className="w-full py-3.5">Rechazar solicitud <XCircle className="w-4 h-4" /></DangerBtn>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Razón del rechazo</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Ej: Documentos ilegibles, foto no coincide..." rows={3} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} />
            </div>
            <DangerBtn onClick={handleReject} disabled={action === "rejecting"} className="w-full py-3.5">
              {action === "rejecting" ? <><Loader2 className="w-4 h-4 animate-spin" />Rechazando...</> : "Confirmar rechazo"}
            </DangerBtn>
            <button onClick={() => setShowRejectForm(false)} className="text-sm text-slate-400 hover:text-slate-600 transition-colors text-center">Cancelar</button>
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── PAGE: Landing (/) ────────────────────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate();

  // Hash tracking: update URL as user scrolls — feeds GA4 page_view events
  useEffect(() => {
    const ids = ["servicios", "clientes", "profesionales", "seguridad", "ayuda", "contacto"];
    const observers: IntersectionObserver[] = [];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) history.replaceState(null, "", `/#${id}`); },
        { threshold: 0.35, rootMargin: "-10% 0px -45% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    // Reset to / when scrolled back to top
    const heroObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) history.replaceState(null, "", "/"); },
      { threshold: 0.1 },
    );
    const hero = document.getElementById("hero-top");
    if (hero) { heroObs.observe(hero); observers.push(heroObs as IntersectionObserver); }
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollContact = () => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <DevStatus />
      <LandingHeader
        onClient={() => navigate("/cliente")}
        onPro={() => navigate("/profesional")}
        onAdmin={() => navigate("/admin")}
      />
      <main>
        <div id="hero-top">
          <LandingHero
            onClient={scrollContact}
            onPro={scrollContact}
            onAdmin={() => navigate("/admin")}
          />
        </div>
        <LandingServices onClient={() => navigate("/cliente")} />
        <LandingClients onClient={() => navigate("/cliente")} />
        <LandingPros onPro={() => navigate("/profesional")} />
        <LandingSecurity />
        <LandingFAQ />
        <LandingContact />
      </main>
      <LandingFooter
        onClient={() => navigate("/cliente")}
        onPro={() => navigate("/profesional")}
        onAdmin={() => navigate("/admin")}
      />
    </div>
  );
}

// ─── PAGE: Cliente portal (/cliente) ─────────────────────────────────────────
type CS = "auth" | "profile" | "services" | "map" | "request" | "searching" | "tracking" | "price" | "rate" | "done";

function ClientePortal() {
  const navigate = useNavigate();
  const {
    jobStatus, setJobStatus, messages, addMessage,
    activeRequest, setActiveRequest, selectedPro, setSelectedPro,
    clientRating, setClientRating, resetMarketplace,
  } = useAppCtx();

  const [screen, setScreen] = useState<CS>("auth");
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [selectedService, setSelectedService] = useState("");

  const handleMatched = () => {
    setJobStatus("matched");
    setScreen("tracking");
    setTimeout(() => addMessage("pro", `Hola, soy ${selectedPro?.name}. Ya acepté tu solicitud. En ${selectedPro?.eta} minutos estoy contigo.`), 800);
  };
  const handleClientMsg = (text: string) => {
    addMessage("client", text);
    const r = ["Entendido, ya voy en camino.", "Sin problema, llego pronto.", "Ok, avísame si necesitas algo más.", "Perfecto."];
    setTimeout(() => addMessage("pro", r[Math.floor(Math.random() * r.length)]), 1200);
  };
  const reset = () => { resetMarketplace(); setSelectedService(""); };

  if (screen === "auth") return <ClientAuth onDone={u => { setClientUser(u); setScreen("services"); }} onBack={() => navigate("/")} />;
  if (screen === "profile") return <ClientProfile user={clientUser!} onSave={u => { setClientUser(u); setScreen("services"); }} onBack={() => setScreen("services")} />;
  if (screen === "services") return <ClientServices user={clientUser!} onSelect={s => { setSelectedService(s); setScreen("map"); }} onProfile={() => setScreen("profile")} onBack={() => navigate("/")} />;
  if (screen === "map") return <ClientMap service={selectedService} onRequest={p => { setSelectedPro(p); setScreen("request"); }} onBack={() => setScreen("services")} />;
  if (screen === "request") return <ClientRequest service={selectedService} pro={selectedPro!} onSubmit={req => { setActiveRequest(req); setJobStatus("searching"); setScreen("searching"); }} onBack={() => setScreen("map")} />;
  if (screen === "searching") return <ClientSearching pro={selectedPro!} onMatched={handleMatched} />;
  if (screen === "tracking") return <ClientTracking pro={selectedPro!} request={activeRequest!} jobStatus={jobStatus} messages={messages} onSendMessage={handleClientMsg} onComplete={() => setScreen("price")} onBack={() => setScreen("services")} />;
  if (screen === "price") return <ClientPricePaid pro={selectedPro!} requestId={activeRequest?.id} onDone={price => { setActiveRequest(activeRequest ? { ...activeRequest, agreedPrice: price } : activeRequest); setScreen("rate"); }} />;
  if (screen === "rate") return <ClientRate pro={selectedPro!} requestId={activeRequest?.id} onSubmit={r => { setClientRating(r); setScreen("done"); }} />;
  if (screen === "done") return <ClientDone pro={selectedPro!} rating={clientRating ?? 0} onAgain={() => { reset(); setScreen("services"); }} onHome={() => { reset(); navigate("/"); }} />;
  return null;
}

// ─── PAGE: Profesional portal (/profesional) ──────────────────────────────────
type PS = "auth" | "register" | "documents" | "docview" | "verify" | "dashboard" | "profile" | "request" | "job" | "done";

function ProfesionalPortal() {
  const navigate = useNavigate();
  const {
    jobStatus, setJobStatus, messages, addMessage,
    activeRequest, setActiveRequest, selectedPro, setSelectedPro,
    clientRating, resetMarketplace,
  } = useAppCtx();

  const [screen, setScreen] = useState<PS>("auth");
  const [proUser, setProUser] = useState<ProUser | null>(null);
  const [proDocuments, setProDocuments] = useState<DocumentSet | null>(null);

  const handleProAccept = () => {
    setJobStatus("en_camino");
    setScreen("job");
    setTimeout(() => addMessage("pro", `Hola, soy ${proUser?.name}. Acabo de aceptar tu solicitud. En 12 minutos estoy contigo.`), 500);
    if (!config.MOCK_MODE && activeRequest?.id) {
      updateJobStatus(activeRequest.id, "en_camino").catch(() => {});
    }
  };
  const handleProReject = () => {
    if (!config.MOCK_MODE && activeRequest?.id) {
      updateJobStatus(activeRequest.id, "cancelled").catch(() => {});
    }
    resetMarketplace();
    setScreen("dashboard");
  };
  const handleProStatus = (status: JobStatus) => {
    setJobStatus(status);
    const msgs: Record<string, string> = {
      en_camino: "¡Voy en camino! Estaré ahí en aproximadamente 12 minutos.",
      en_sitio: "¡Ya llegué! Estoy en la puerta.",
      completado: "¡Listo! El trabajo ha sido completado. Fue un placer trabajar contigo.",
    };
    if (msgs[status]) setTimeout(() => addMessage("pro", msgs[status]), 300);
    if (!config.MOCK_MODE && activeRequest?.id && (status === "en_camino" || status === "en_sitio")) {
      updateJobStatus(activeRequest.id, status).catch(() => {});
    }
  };
  const handleJobFinish = async (photoFile: File) => {
    if (!config.MOCK_MODE && activeRequest?.id) {
      await uploadJobPhoto(activeRequest.id, photoFile);
      await updateJobStatus(activeRequest.id, "completed");
    }
    setScreen("done");
  };
  // Los documentos ya quedaron guardados en Supabase durante la subida (ver
  // ProDocuments/handleFile); acá solo se conserva una copia local para la
  // pantalla "Mis documentos" (docview) de este mismo profesional.
  const handleDocSubmit = (docs: DocumentSet) => {
    setProDocuments(docs);
    setScreen("verify");
  };
  const handleProMsg = (text: string) => {
    addMessage("pro", text);
    const r = ["Perfecto, muchas gracias.", "Ok, te espero.", "Entendido.", "Gracias por la información."];
    setTimeout(() => addMessage("client", r[Math.floor(Math.random() * r.length)]), 1200);
  };
  const simulateRequest = () => {
    const req: ServiceRequest = { service: "Electricista", description: "Revisión del tablero eléctrico y reparación de tomacorriente.", address: "Calle Los Pinos #342, Equipetrol" };
    setActiveRequest(req);
    setJobStatus("searching");
    if (!selectedPro) setSelectedPro(PROFESSIONALS[0]);
  };

  if (screen === "auth") return <ProAuth onLogin={u => { setProUser(u); setScreen("dashboard"); }} onRegister={() => setScreen("register")} onBack={() => navigate("/")} />;
  if (screen === "register") return <ProRegister onSubmit={u => { setProUser(u); setScreen("documents"); }} onBack={() => setScreen("auth")} />;
  if (screen === "documents") return <ProDocuments user={proUser!} onSubmit={handleDocSubmit} onBack={() => setScreen("register")} />;
  if (screen === "docview") return <ProDocuments user={proUser!} onSubmit={() => {}} onBack={() => setScreen("profile")} viewOnly docs={proDocuments ?? undefined} />;
  if (screen === "verify") return <ProVerify user={proUser!} onOpenAdmin={() => navigate("/admin")} />;
  if (screen === "dashboard") return <ProDashboard user={proUser!} jobStatus={jobStatus} activeRequest={activeRequest} onViewRequest={() => setScreen(jobStatus === "searching" ? "request" : "job")} onProfile={() => setScreen("profile")} onDocuments={() => setScreen("docview")} onLogout={() => { setProUser(null); navigate("/"); }} onSimulateRequest={simulateRequest} />;
  if (screen === "profile") return <ProProfile user={proUser!} onSave={u => { setProUser(u); setScreen("dashboard"); }} onDocuments={() => setScreen("docview")} onBack={() => setScreen("dashboard")} />;
  if (screen === "request") return <ProRequestDetail request={activeRequest ?? { service: "Electricista", description: "Revisión del tablero eléctrico.", address: "Calle Los Pinos #342, Equipetrol" }} onAccept={handleProAccept} onReject={handleProReject} onBack={() => setScreen("dashboard")} />;
  if (screen === "job") return <ProActiveJob request={activeRequest ?? { service: "Electricista", description: "Revisión del tablero eléctrico.", address: "Calle Los Pinos #342, Equipetrol" }} jobStatus={jobStatus} messages={messages} onStatusChange={handleProStatus} onSendMessage={handleProMsg} onFinish={handleJobFinish} onBack={() => setScreen("dashboard")} />;
  if (screen === "done") return <ProJobDone clientRating={clientRating} onHome={() => { resetMarketplace(); setScreen("dashboard"); }} />;
  return null;
}

// ─── PAGE: Admin portal (/admin) ──────────────────────────────────────────────
type AS = "auth" | "dashboard" | "review";

function AdminPortal() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<AS>("auth");
  const [reviewingRecord, setReviewingRecord] = useState<PendingVerification | null>(null);
  const [pendingList, setPendingList] = useState<PendingVerification[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const refreshPending = async () => {
    if (config.MOCK_MODE) return;
    setLoadingPending(true);
    try {
      const res = await getPendingVerifications();
      setPendingList(res.data);
    } catch {
      setPendingList([]);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => { if (screen === "dashboard") refreshPending(); }, [screen]);

  if (screen === "auth") return <AdminAuth onLogin={() => setScreen("dashboard")} onBack={() => navigate("/")} />;
  if (screen === "dashboard") return <AdminDashboard pendingList={pendingList} loadingPending={loadingPending} onReview={rec => { setReviewingRecord(rec); setScreen("review"); }} onLogout={() => navigate("/")} />;
  if (screen === "review") return <AdminProReview record={reviewingRecord!} onDone={() => setScreen("dashboard")} onBack={() => setScreen("dashboard")} />;
  return null;
}

// ─── PAGE: 404 ────────────────────────────────────────────────────────────────
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ background: NAVY, fontFamily: "Inter, sans-serif" }}>
      <LogoIcon size="lg" />
      <h1 className="text-8xl font-black text-white mt-6 mb-3" style={{ letterSpacing: "-0.04em" }}>404</h1>
      <p className="text-slate-400 text-lg mb-2">Esta página no existe.</p>
      <p className="text-slate-600 text-sm mb-10">Quizás la URL cambió o fue escrita incorrectamente.</p>
      <LimeBtn onClick={() => navigate("/")} className="text-base px-8 py-3.5">
        <ArrowRight className="w-4 h-4 rotate-180" />Volver al inicio
      </LimeBtn>
    </div>
  );
}

// ─── Root layout (provides context to all routes) ────────────────────────────
function Root() {
  return (
    <AppContextProvider>
      <Outlet />
    </AppContextProvider>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,          Component: LandingPage },
      { path: "cliente",      Component: ClientePortal },
      { path: "profesional",  Component: ProfesionalPortal },
      { path: "admin",        Component: AdminPortal },
      { path: "*",            Component: NotFoundPage },
    ],
  },
]);

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function App() {
  return <RouterProvider router={router} />;
}
