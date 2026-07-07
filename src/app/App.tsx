import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from "react-router";
import isotipo from "@/imports/isotipo_azul_verde_para_redes_-_verde_oficial.png";
import heroPhoto from "@/assets/photos/hero-electricista.jpg";
import prosPhoto from "@/assets/photos/pros-cliente-plomero.jpg";
import catElectricista from "@/assets/photos/cat-electricista.jpg";
import catPlomero from "@/assets/photos/cat-plomero.jpg";
import catAire from "@/assets/photos/cat-aire-acondicionado.jpg";
import catAlbanil from "@/assets/photos/cat-albanil.jpg";
import catPintor from "@/assets/photos/cat-pintor.jpg";
import catMecanicoMotos from "@/assets/photos/cat-mecanico-motos.jpg";
import catMecanicoAutos from "@/assets/photos/cat-mecanico-autos.jpg";
import catLavadoAutos from "@/assets/photos/cat-lavado-autos.jpg";
import catTermotanques from "@/assets/photos/cat-termotanques.jpg";
import catJardineria from "@/assets/photos/cat-jardineria.jpg";
import catFumigacion from "@/assets/photos/cat-fumigacion.jpg";
import catProfMatematicas from "@/assets/photos/cat-profesor-matematicas.jpg";
import catProfQuimica from "@/assets/photos/cat-profesor-quimica.jpg";
import catProfFisica from "@/assets/photos/cat-profesor-fisica.jpg";
import catProfIngles from "@/assets/photos/cat-profesor-ingles.jpg";
import { config } from "@/lib/config";
import { realtime } from "@/lib/realtime";
import { loginClient, registerClient, loginPro, loginAdmin } from "@/lib/auth";
import {
  registerProfessional as apiRegisterProfessional,
  uploadDocument as apiUploadDocument,
  getPendingVerifications, approveVerification, rejectVerification,
  getNearbyProfessionals, createServiceRequest, updateJobStatus, submitReview,
  uploadJobPhoto, getActiveProfessionals, getRejectedProfessionals, getAdminStats,
  getMessages, sendMessage, subscribeToMessages,
  getActiveRequestForProfessional, subscribeToRequestChanges, updateMyPresence,
  getProfessionalById, subscribeToJobChanges, acceptServiceRequest, rejectServiceRequest,
  cancelActiveJob, getAvailableOffersForProfessional, subscribeToAvailableOffers, getRejectedRequestIds,
  getJobById, savePushSubscription, subscribeToProfessionalLocation,
} from "@/lib/api";
import type { ProReasonCode, ClientReasonCode } from "@/lib/api";
import type { PendingVerification, ProUser as ApiProUser, AdminStats, ChatMessage, ServiceRequest as ApiServiceRequest, GeoPoint } from "@/lib/types";
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
  Bike, Sparkles, Flame, Leaf, Bug, Calculator, FlaskConical, Atom, Languages,
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
  location?: GeoPoint;
}

interface Message { id: string; from: "client" | "pro"; text: string; time: string }
interface ServiceRequest {
  service: string; description: string; address: string;
  id?: string; professionalId?: string; agreedPrice?: number; completionPhotoUrl?: string;
  clientName?: string; lat?: number; lng?: number; searchRadiusKm?: number;
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
  { id: "mecanico_moto", label: "Mecánico de motos", icon: Bike, color: "#DC2626" },
  { id: "mecanico_auto", label: "Mecánico de autos", icon: Car, color: "#1D4ED8" },
  { id: "lavado_autos", label: "Lavado de autos", icon: Sparkles, color: "#0EA5E9" },
  { id: "termotanques", label: "Termotanques", icon: Flame, color: "#EA580C" },
  { id: "jardineria", label: "Jardinería", icon: Leaf, color: "#16A34A" },
  { id: "fumigacion", label: "Fumigación", icon: Bug, color: "#A16207" },
  { id: "profesor_matematicas", label: "Profesor de Matemáticas", icon: Calculator, color: "#7C3AED" },
  { id: "profesor_quimica", label: "Profesor de Química", icon: FlaskConical, color: "#0891B2" },
  { id: "profesor_fisica", label: "Profesor de Física", icon: Atom, color: "#4F46E5" },
  { id: "profesor_ingles", label: "Profesor de Inglés", icon: Languages, color: "#DB2777" },
  { id: "otro", label: "Otro", icon: MoreHorizontal, color: "#6B7280" },
];

// Convierte el id técnico guardado en la base (ej. "aire_acondicionado")
// al label en español para mostrar en pantalla. Si ya viene un label
// (dato viejo/mock), lo devuelve tal cual.
function specialtyLabel(value: string): string {
  return SERVICES.find(s => s.id === value)?.label ?? value;
}

// Motivos predefinidos para rechazar/cancelar (ver ReasonPickerSheet). Los
// códigos coinciden con reason_code en la tabla request_events.
const PRO_REASONS: { code: string; label: string }[] = [
  { code: "too_far", label: "El lugar está muy lejos" },
  { code: "client_unresponsive", label: "El cliente no responde en el chat" },
  { code: "no_longer_available", label: "Ya no estoy disponible" },
  { code: "other", label: "Otro" },
];
const CLIENT_REASONS: { code: string; label: string }[] = [
  { code: "price_too_high", label: "El precio cotizado es muy alto" },
  { code: "professional_unresponsive", label: "El profesional no responde en el chat" },
  { code: "no_longer_needed", label: "Ya no necesito el servicio" },
  { code: "other", label: "Otro" },
];

// Distancia real entre dos puntos GPS (fórmula de Haversine, en km).
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Notificaciones push reales (funcionan con el navegador cerrado). Se llama
// en un momento con contexto claro para el usuario (justo al enviar su
// primera solicitud, o al ponerse "Online" por primera vez), no al cargar
// la página — los navegadores penalizan pedir el permiso sin esa razón.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function subscribeToPushNotifications() {
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

// Ubicación GPS real del navegador, una sola vez (para el cliente al pedir un servicio).
function useGeolocation() {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) { setError("Tu navegador no soporta geolocalización."); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);
  return { position, error };
}

// Ubicación GPS real en vivo mientras `active` es true (para el profesional
// mientras está Online).
function useWatchPosition(active: boolean) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);
  return position;
}

// Convierte un profesional real (de getNearbyProfessionals) a la forma que
// espera la UI del marketplace. Si se conoce la ubicación real del cliente
// y la del profesional, distance/eta se calculan de verdad (Haversine +
// una velocidad promedio de ciudad); si no, quedan como estimado fijo.
const PRO_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];
function proUserToProfessional(u: ApiProUser, index: number, clientLocation?: GeoPoint | null): Professional {
  let distance = 1.2, eta = 15;
  if (clientLocation && u.location) {
    distance = Math.round(haversineKm(clientLocation, u.location) * 10) / 10;
    eta = Math.max(5, Math.round((distance / 25) * 60)); // ~25 km/h en ciudad
  }
  return {
    id: u.id, name: u.name, specialty: specialtyLabel(u.specialty), rating: u.rating,
    reviews: u.reviewCount, distance, eta, location: u.location,
    initials: u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    color: PRO_COLORS[index % PRO_COLORS.length], verified: true, jobs: u.completedJobs, bio: u.bio,
  };
}

function nowStr() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Convierte una solicitud real (de getActiveRequestForProfessional /
// subscribeToRequestChanges) a la forma local que espera la UI del panel
// profesional, y su estado de Postgres al JobStatus local usado en pantalla.
function apiStatusToLocal(status: ApiServiceRequest["status"]): JobStatus {
  if (status === "pending") return "searching"; // nadie la aceptó todavía (se está transmitiendo)
  if (status === "accepted") return "matched";
  if (status === "en_camino") return "en_camino";
  if (status === "en_sitio" || status === "in_progress") return "en_sitio";
  return "completado";
}

function apiRequestToLocal(r: ApiServiceRequest & { clientName?: string }): ServiceRequest {
  return {
    id: r.id, professionalId: r.professionalId, agreedPrice: r.agreedPrice, clientName: r.clientName,
    service: specialtyLabel(r.category), description: r.description,
    address: [r.address.street, r.address.zone].filter(Boolean).join(", "),
    lat: r.address.coordinates?.lat, lng: r.address.coordinates?.lng, searchRadiusKm: r.searchRadiusKm,
  };
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

// ─── Chat en tiempo real (Supabase Realtime) ─────────────────────────────────
// Reemplaza la simulación local (addMessage + setTimeout) por mensajes reales
// persistidos en chat_messages, sincronizados en vivo por Supabase Realtime.
// Funciona entre sesiones/dispositivos distintos, no solo dentro de una misma
// pestaña — RLS (messages_select_involved) ya limita los eventos que llegan
// solo al cliente o profesional de esa solicitud.
function toLocalMessage(m: ChatMessage): Message {
  return {
    id: m.id,
    from: m.from === "professional" ? "pro" : "client",
    text: m.text,
    time: new Date(m.sentAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }),
  };
}

function useChatMessages(requestId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (config.MOCK_MODE || !requestId) { setMessages([]); return; }
    let active = true;
    setMessages([]);
    getMessages(requestId).then(msgs => { if (active) setMessages(msgs.map(toLocalMessage)); }).catch(() => {});
    const unsubscribe = subscribeToMessages(requestId, m => {
      setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, toLocalMessage(m)]);
    });
    return () => { active = false; unsubscribe(); };
  }, [requestId]);

  const send = async (text: string) => {
    if (!requestId) return;
    await sendMessage(requestId, text);
  };

  return { messages, send };
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

function DangerBtn({ children, onClick, className = "", disabled = false }: {
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
function ReasonPickerSheet({ title, reasons, confirmLabel, loading, error, onConfirm, onClose }: {
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

// ─── Mapa real (Google Maps) ──────────────────────────────────────────────────
// Carga el script de Google Maps una sola vez (cacheado en un módulo-level
// promise) y renderiza marcadores reales. Si no hay clave configurada o no
// hay coordenadas reales disponibles, el llamador debe usar MapView (arriba)
// como respaldo — ver LiveMap.
let googleMapsPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

// Convierte coordenadas GPS reales en una dirección legible (como al pedir
// comida: se detecta la ubicación sola, pero se puede editar después).
// Usa el Geocoder de la propia librería de Google Maps (no el endpoint REST
// directo) porque la clave tiene restricción de "HTTP referrer" — necesaria
// para el mapa — y esa restricción hace que el endpoint REST puro rechace
// la clave con "REQUEST_DENIED". El Geocoder de la librería JS sí respeta
// la restricción de referrer correctamente.
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!config.MAPS_API_KEY) return null;
  try {
    await loadGoogleMaps(config.MAPS_API_KEY);
    const g = (window as any).google;
    const geocoder = new g.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } });
    return result?.results?.[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}

interface MapMarker { id: string; lat: number; lng: number; label: string; color?: string; labelColor?: string; draggable?: boolean }

function RealMap({ markers, zoom = 14, onMarkerDragEnd, onMapClick }: {
  markers: MapMarker[]; zoom?: number;
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const markersKey = markers.map(m => `${m.id}:${m.lat.toFixed(5)},${m.lng.toFixed(5)}:${m.draggable ? 1 : 0}`).join("|");
  const onMarkerDragEndRef = useRef(onMarkerDragEnd);
  onMarkerDragEndRef.current = onMarkerDragEnd;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(config.MAPS_API_KEY)
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !ref.current || markers.length === 0) return;
    const g = (window as any).google;
    const map = new g.maps.Map(ref.current, {
      center: { lat: markers[0].lat, lng: markers[0].lng }, zoom,
      disableDefaultUI: true, zoomControl: true, clickableIcons: false,
    });
    const bounds = new g.maps.LatLngBounds();
    markers.forEach(m => {
      const marker = new g.maps.Marker({
        position: { lat: m.lat, lng: m.lng }, map, title: m.label, draggable: !!m.draggable,
        label: { text: m.label, color: m.labelColor ?? "#fff", fontWeight: "700", fontSize: "11px" },
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 16, fillColor: m.color ?? NAVY, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      if (m.draggable) {
        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          onMarkerDragEndRef.current?.(m.id, pos.lat(), pos.lng());
        });
      }
      bounds.extend({ lat: m.lat, lng: m.lng });
    });
    if (onMapClickRef.current) {
      map.addListener("click", (e: any) => onMapClickRef.current?.(e.latLng.lat(), e.latLng.lng()));
    }
    if (markers.length > 1) map.fitBounds(bounds, 48);
  }, [ready, markersKey, zoom]);

  if (error) return <MapView />;
  return <div ref={ref} className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#E8F5E9" }} />;
}

// Usa el mapa real cuando hay una clave de Google Maps configurada y al
// menos una coordenada real; si no, cae al mapa decorativo de siempre.
function LiveMap({ markers, fallback, zoom, onMarkerDragEnd, onMapClick }: {
  markers: MapMarker[]; fallback?: React.ReactNode; zoom?: number;
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  if (!config.MAPS_API_KEY || markers.length === 0) return <>{fallback ?? <MapView />}</>;
  return <RealMap markers={markers} zoom={zoom} onMarkerDragEnd={onMarkerDragEnd} onMapClick={onMapClick} />;
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
            <LimeBtn onClick={onClient}>Empezar</LimeBtn>
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
  return (
    <section
      className="pt-16 min-h-screen flex items-center bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(15,23,42,0.88), rgba(15,23,42,0.94)), url(${heroPhoto})` }}
    >
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
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <LimeBtn onClick={onClient} className="text-base px-8 py-3.5">
                <MapPin className="w-4 h-4" />Solicitar servicio
              </LimeBtn>
              <button onClick={onPro}
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
    { icon: Zap, title: "Electricista", desc: "Instalaciones, reparaciones y mantenimiento eléctrico.", photo: catElectricista },
    { icon: Droplets, title: "Plomero", desc: "Tuberías, filtraciones e instalación sanitaria.", photo: catPlomero },
    { icon: Wind, title: "Aire acondicionado", desc: "Instalación, limpieza y reparación de equipos.", photo: catAire },
    { icon: Wrench, title: "Albañil", desc: "Construcción, remodelación y trabajos civiles.", photo: catAlbanil },
    { icon: Paintbrush, title: "Pintor", desc: "Pintura interior, exterior y decorativa.", photo: catPintor },
    { icon: Bike, title: "Mecánico de motos", desc: "Reparación y mantenimiento de motocicletas.", photo: catMecanicoMotos },
    { icon: Car, title: "Mecánico de autos", desc: "Diagnóstico, reparación y mantenimiento automotriz.", photo: catMecanicoAutos },
    { icon: Sparkles, title: "Lavado de autos", desc: "Lavado exterior, interior y encerado a domicilio.", photo: catLavadoAutos },
    { icon: Flame, title: "Termotanques", desc: "Instalación y reparación de calefones y termotanques.", photo: catTermotanques },
    { icon: Leaf, title: "Jardinería", desc: "Poda, mantenimiento de jardines y áreas verdes.", photo: catJardineria },
    { icon: Bug, title: "Fumigación", desc: "Control de plagas para el hogar y el jardín.", photo: catFumigacion },
    { icon: Calculator, title: "Profesor de Matemáticas", desc: "Clases particulares para colegio y universidad.", photo: catProfMatematicas },
    { icon: FlaskConical, title: "Profesor de Química", desc: "Clases particulares de química para todo nivel.", photo: catProfQuimica },
    { icon: Atom, title: "Profesor de Física", desc: "Clases particulares de física para todo nivel.", photo: catProfFisica },
    { icon: Languages, title: "Profesor de Inglés", desc: "Clases particulares de inglés para todo nivel.", photo: catProfIngles },
    { icon: MoreHorizontal, title: "Otros servicios", desc: "Carpintería, cerrajería y más.", photo: undefined },
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
            <div key={c.title} onClick={onClient} className="bg-white rounded-2xl overflow-hidden border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
              {c.photo && (
                <div className="h-36 overflow-hidden">
                  <img src={c.photo} alt={c.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#F0FDF4" }}><c.icon className="w-6 h-6" style={{ color: "#16A34A" }} /></div>
                <h3 className="font-bold text-lg mb-1.5" style={{ color: NAVY }}>{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">{c.desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}>Ver profesionales <ArrowRight className="w-3 h-3" /></div>
              </div>
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
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-10">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
            <img src={prosPhoto} alt="Cliente satisfecho supervisando el trabajo de un plomero de MAGIVER" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.35), rgba(15,23,42,0) 35%)" }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
          {benefits.map(b => (
            <div key={b.title} className="p-6 rounded-2xl border hover:border-lime-400/40 hover:-translate-y-0.5 transition-all" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(132,204,22,0.15)" }}><b.icon className="w-5 h-5" style={{ color: LIME }} /></div>
              <h3 className="font-bold text-white mb-2">{b.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
          </div>
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
  return (
    <section id="contacto" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Contacto</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            ¿Tenés dudas?{" "}
            <span className="block">Escribinos.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">Para solicitar un servicio o registrarte como profesional, usá los botones de arriba — acá te dejamos cómo contactarnos directamente.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-10 border-t" style={{ borderColor: "#E5E7EB" }}>
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
function ClientServices({ user, clientLocation, onSelect, onProfile, onBack }: { user: ClientUser; clientLocation?: GeoPoint | null; onSelect: (s: string) => void; onProfile: () => void; onBack: () => void }) {
  return (
    <ScreenWrap>
      <AppHeader title="MAGIVER" onBack={onBack}
        right={<button onClick={onProfile} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white hover:opacity-80 transition-colors" style={{ background: "#3B82F6" }}>{user.name[0]}</button>}
      />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-6"><h2 className="text-2xl font-black mb-1" style={{ color: NAVY }}>¿Qué necesitas, {user.name.split(" ")[0]}?</h2><p className="text-slate-500 text-sm">Selecciona el tipo de servicio</p></div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 bg-white" style={{ borderColor: "#E5E7EB" }}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
          <span className="text-sm text-slate-600 flex-1">{clientLocation ? `${clientLocation.lat.toFixed(4)}, ${clientLocation.lng.toFixed(4)}` : "Santa Cruz de la Sierra (aprox.)"}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: clientLocation ? "#F0FDF4" : "#FEF3C7", color: clientLocation ? "#16A34A" : "#B45309" }}>{clientLocation ? "GPS activo" : "Ubicación aprox."}</span>
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
function ClientMap({ service, clientLocation, onRequest, onBack }: { service: string; clientLocation?: GeoPoint | null; onRequest: (pro: Professional) => void; onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const selectedPro = professionals.find(p => p.id === selectedId);

  useEffect(() => {
    if (config.MOCK_MODE) { setProfessionals(PROFESSIONALS); setLoading(false); return; }
    const categoryId = SERVICES.find(s => s.label === service)?.id;
    const location = clientLocation ?? { lat: -17.785, lng: -63.181 };
    setLoading(true);
    setLoadError("");
    getNearbyProfessionals({ location, category: categoryId as any })
      .then(pros => setProfessionals(pros.map((p, i) => proUserToProfessional(p, i, location))))
      .catch((err: any) => setLoadError(err?.message || "No se pudieron cargar los profesionales."))
      .finally(() => setLoading(false));
  }, [service, clientLocation]);

  return (
    <ScreenWrap>
      <AppHeader title={service} onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <LiveMap markers={[
            ...(clientLocation ? [{ id: "yo", lat: clientLocation.lat, lng: clientLocation.lng, label: "Tú", color: LIME, labelColor: NAVY }] : []),
            ...professionals.filter(p => p.location).map(p => ({ id: p.id, lat: p.location!.lat, lng: p.location!.lng, label: p.initials, color: p.color })),
          ]} />
        </div>
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
function ClientRequest({ service, clientLocation, onSubmit, onBack }: { service: string; clientLocation?: GeoPoint | null; onSubmit: (req: ServiceRequest) => void; onBack: () => void }) {
  const [desc, setDesc] = useState(""); const [addr, setAddr] = useState("Calle Los Pinos #342, Equipetrol");
  const [addrEdited, setAddrEdited] = useState(false);
  const [detectingAddr, setDetectingAddr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Posición exacta a usar para la solicitud: arranca en el GPS detectado,
  // pero el cliente puede arrastrar el pin o tocar el mapa para ajustarla
  // (por si el servicio es para otra dirección).
  const [pinLocation, setPinLocation] = useState<GeoPoint | null>(null);
  useEffect(() => { if (clientLocation && !pinLocation) setPinLocation(clientLocation); }, [clientLocation]);
  const handlePinChange = (lat: number, lng: number) => {
    setPinLocation({ lat, lng });
    setAddrEdited(false); // mover el pin siempre refresca la dirección detectada
  };
  // Detecta la dirección real a partir del pin (GPS al inicio, o donde el
  // cliente lo haya movido) — se puede editar el texto directamente también.
  useEffect(() => {
    if (!pinLocation || addrEdited) return;
    let active = true;
    setDetectingAddr(true);
    reverseGeocode(pinLocation.lat, pinLocation.lng).then(address => {
      if (active && address) setAddr(address);
    }).finally(() => { if (active) setDetectingAddr(false); });
    return () => { active = false; };
  }, [pinLocation?.lat, pinLocation?.lng]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;
    setError("");
    setLoading(true);
    try {
      if (config.MOCK_MODE) {
        await new Promise(r => setTimeout(r, 800));
        onSubmit({ id: `req-${Date.now()}`, service, description: desc, address: addr, lat: pinLocation?.lat, lng: pinLocation?.lng });
        return;
      }
      const categoryId = (SERVICES.find(s => s.label === service)?.id ?? "otro") as any;
      const location = pinLocation ?? { lat: -17.785, lng: -63.181 };
      const real = await createServiceRequest({
        category: categoryId, description: desc,
        address: { street: addr, zone: "", city: "Santa Cruz de la Sierra", lat: location.lat, lng: location.lng },
      });
      subscribeToPushNotifications();
      onSubmit({ id: real.id, service, description: desc, address: addr, lat: location.lat, lng: location.lng });
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
        <div className="mb-5 p-4 rounded-xl border flex items-center gap-2" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "#16A34A" }} />
          <p className="text-xs text-green-800">Vamos a avisarle a los profesionales de <strong>{service}</strong> más cercanos a tu zona.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Descripción del trabajo</label>
            <textarea placeholder="Describe qué necesitas. Ej: 'El tomacorriente del cuarto ya no funciona...'" value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Ubicación del servicio</label>
            {pinLocation && config.MAPS_API_KEY && (
              <div className="relative mb-3">
                <RealMap
                  zoom={16}
                  markers={[{ id: "pin", lat: pinLocation.lat, lng: pinLocation.lng, label: "", color: LIME, draggable: true }]}
                  onMarkerDragEnd={(_id, lat, lng) => handlePinChange(lat, lng)}
                  onMapClick={(lat, lng) => handlePinChange(lat, lng)}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(15,23,42,0.85)", color: "#fff" }}>
                  <Edit3 className="w-3.5 h-3.5" style={{ color: LIME }} />
                  Arrastra el pin o toca el mapa para ajustar
                </div>
              </div>
            )}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={addr} onChange={e => { setAddr(e.target.value); setAddrEdited(true); }} className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} required />
              {detectingAddr && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
            </div>
            <p className="text-xs text-slate-400 mt-1">{clientLocation ? "Detectada con tu GPS — ajusta el pin o edita el texto si es para otro lugar." : "Escribe la dirección exacta."}</p>
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
function ClientSearching({ requestId, onMatched, onCancel }: {
  requestId: string; onMatched: (pro: Professional) => void; onCancel: () => void;
}) {
  const [radiusKm, setRadiusKm] = useState(3);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (config.MOCK_MODE) {
      const t = setTimeout(() => {
        getProfessionalById("pro-001").then(u => onMatched(proUserToProfessional(u, 0)));
      }, 3000);
      return () => clearTimeout(t);
    }
    let active = true;
    getJobById(requestId).then(r => { if (active && r.searchRadiusKm != null) setRadiusKm(r.searchRadiusKm); }).catch(() => {});
    const unsubscribe = subscribeToJobChanges(requestId, row => {
      if (row.searchRadiusKm != null) setRadiusKm(row.searchRadiusKm);
      if (row.professionalId) {
        getProfessionalById(row.professionalId).then(u => onMatched(proUserToProfessional(u, 0))).catch(() => {});
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [requestId]);

  const handleCancel = async () => {
    setCancelling(true); setCancelError("");
    try {
      if (!config.MOCK_MODE) await updateJobStatus(requestId, "cancelled");
      onCancel();
    } catch (err: any) {
      setCancelError(err?.message || "No se pudo cancelar. Intenta de nuevo.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <ScreenWrap>
      <AppHeader title="Buscando profesional" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-lime-200 flex items-center justify-center" style={{ borderTopColor: LIME, animation: "spin 1.2s linear infinite" }}>
            <Loader2 className="w-8 h-8" style={{ color: LIME }} />
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>Notificando a profesionales...</h2>
        <p className="text-slate-500 text-sm mb-2">Buscando disponibilidad en un radio de {radiusKm} km</p>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8"><Loader2 className="w-4 h-4 animate-spin" />Esperando que alguien acepte...</div>
        {cancelError && (
          <p className="text-xs font-medium flex items-center gap-1.5 mb-4" style={{ color: "#EF4444" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{cancelError}
          </p>
        )}
        <DangerBtn onClick={handleCancel} disabled={cancelling} className="px-8 py-3">
          {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" />Cancelando...</> : "Cancelar búsqueda"}
        </DangerBtn>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT TRACKING ──────────────────────────────────────────────────────────
function ClientTracking({ pro, request, jobStatus, messages, clientLocation, onSendMessage, onComplete, onCancelled, onBack }: {
  pro: Professional; request: ServiceRequest; jobStatus: JobStatus;
  messages: Message[]; clientLocation?: GeoPoint | null; onSendMessage: (text: string) => void;
  onComplete: () => void; onCancelled: () => void; onBack: () => void;
}) {
  const [tab, setTab] = useState<"track" | "chat">("track");
  const [msg, setMsg] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [liveProLocation, setLiveProLocation] = useState<GeoPoint | null>(pro.location ?? null);
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  // Ubicación del profesional en vivo mientras viene en camino/está en sitio
  // (no una foto fija de cuando aceptó la solicitud).
  useEffect(() => {
    setLiveProLocation(pro.location ?? null);
    if (config.MOCK_MODE) return;
    const unsubscribe = subscribeToProfessionalLocation(pro.id, setLiveProLocation);
    return unsubscribe;
  }, [pro.id]);
  const handleCancel = async (reasonCode: string, reasonText?: string) => {
    setCancelling(true); setCancelError("");
    try {
      if (!config.MOCK_MODE && request.id) await cancelActiveJob(request.id, reasonCode as ClientReasonCode, reasonText);
      onCancelled();
    } catch (err: any) {
      setCancelError(err?.message || "No se pudo cancelar el servicio. Intenta de nuevo.");
      setCancelling(false);
    }
  };
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
              <LiveMap
                markers={[
                  ...(clientLocation ? [{ id: "yo", lat: clientLocation.lat, lng: clientLocation.lng, label: "Tú", color: LIME, labelColor: NAVY }] : []),
                  ...(liveProLocation ? [{ id: pro.id, lat: liveProLocation.lat, lng: liveProLocation.lng, label: pro.initials, color: pro.color }] : []),
                ]}
                fallback={<MapView animate jobStatus={jobStatus} selectedProId="1" />}
              />
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
            {jobStatus !== "completado" && (
              <button onClick={() => setShowCancel(true)} className="w-full text-center text-sm font-semibold mt-2" style={{ color: "#EF4444" }}>
                Cancelar servicio
              </button>
            )}
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
      {showCancel && (
        <ReasonPickerSheet
          title="¿Por qué cancelas este servicio?"
          reasons={CLIENT_REASONS}
          confirmLabel="Confirmar cancelación"
          loading={cancelling}
          error={cancelError || undefined}
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
        />
      )}
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
function ProDashboard({ user, jobStatus, activeRequest, availableOffers, available, onToggleAvailable, onViewRequest, onViewOffer, onProfile, onDocuments, onLogout }: {
  user: ProUser; jobStatus: JobStatus; activeRequest: ServiceRequest | null; availableOffers: ServiceRequest[];
  available: boolean; onToggleAvailable: () => void;
  onViewRequest: () => void; onViewOffer: (offer: ServiceRequest) => void; onProfile: () => void; onDocuments: () => void;
  onLogout: () => void;
}) {
  const hasIncoming = availableOffers.length > 0;
  const hasActiveJob = jobStatus === "matched" || jobStatus === "en_camino" || jobStatus === "en_sitio";
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
              <button onClick={onToggleAvailable}>
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
        {!hasActiveJob && availableOffers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Solicitudes disponibles cerca</p>
            <div className="flex flex-col gap-3">
              {availableOffers.map(offer => (
                <div key={offer.id} onClick={() => onViewOffer(offer)} className="p-4 rounded-2xl border-2 cursor-pointer hover:shadow-lg transition-all" style={{ borderColor: LIME, background: "#F7FEE7" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full animate-ping" style={{ background: LIME }} /><span className="font-bold text-sm" style={{ color: NAVY }}>Nueva solicitud</span></div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: LIME, color: NAVY }}>Ver →</span>
                  </div>
                  <p className="text-sm text-slate-600">{offer.service}</p>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {offer.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!hasActiveJob && availableOffers.length === 0 && (
          <div className="mb-4 p-4 rounded-2xl border" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>Sin solicitudes disponibles</p>
            <p className="text-xs text-slate-500">Mantente Online para recibir notificaciones de clientes cercanos.</p>
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
function ProRequestDetail({ request, proLocation, onAccepted, onRejected, onBack }: {
  request: ServiceRequest; proLocation?: GeoPoint | null;
  onAccepted: () => void; onRejected: () => void; onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const clientLoc = request.lat != null && request.lng != null ? { lat: request.lat, lng: request.lng } : null;
  const realDistance = proLocation && clientLoc ? Math.round(haversineKm(proLocation, clientLoc) * 10) / 10 : null;

  const handleAccept = async () => {
    setLoading(true); setAcceptError("");
    try {
      if (!config.MOCK_MODE) await acceptServiceRequest(request.id!);
      onAccepted();
    } catch (err: any) {
      setAcceptError(err?.message || "No se pudo aceptar la solicitud. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const handleReject = async (reasonCode: string, reasonText?: string) => {
    setRejecting(true); setRejectError("");
    try {
      if (!config.MOCK_MODE) await rejectServiceRequest(request.id!, reasonCode as ProReasonCode, reasonText);
      onRejected();
    } catch (err: any) {
      setRejectError(err?.message || "No se pudo rechazar la solicitud. Intenta de nuevo.");
      setRejecting(false);
    }
  };

  return (
    <ScreenWrap>
      <AppHeader title="Nueva solicitud" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 p-4 rounded-2xl border-2" style={{ borderColor: LIME, background: "#F7FEE7" }}>
          <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: LIME }} /><span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4D7C0F" }}>Solicitud en tiempo real</span></div>
          <p className="text-sm text-green-800">{realDistance != null ? <>Cliente a <strong>{realDistance} km</strong></> : "Cliente cerca de ti"} · El precio se coordina en el chat</p>
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
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: "#8B5CF6" }}>{(request.clientName ?? "M. López").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>
            <div><p className="font-bold text-sm" style={{ color: NAVY }}>{request.clientName ?? "M. López"}</p><p className="text-xs text-slate-500">Cliente verificado</p></div>
          </div>
        </Card>
        <div className="mb-5">
          <LiveMap
            markers={[
              ...(clientLoc ? [{ id: "cliente", lat: clientLoc.lat, lng: clientLoc.lng, label: request.clientName?.slice(0, 2).toUpperCase() ?? "CL", color: "#8B5CF6" }] : []),
              ...(proLocation ? [{ id: "yo", lat: proLocation.lat, lng: proLocation.lng, label: "Tú", color: LIME, labelColor: NAVY }] : []),
            ]}
            fallback={<MapView selectedProId="1" />}
          />
        </div>
        {acceptError && (
          <p className="text-xs font-medium flex items-center gap-1.5 mb-3" style={{ color: "#EF4444" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{acceptError}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <LimeBtn onClick={handleAccept} disabled={loading} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Aceptando...</> : <>Aceptar solicitud <CheckCircle className="w-4 h-4" /></>}
          </LimeBtn>
          <DangerBtn onClick={() => setShowReject(true)} className="w-full py-3.5">Rechazar solicitud</DangerBtn>
        </div>
      </div>
      {showReject && (
        <ReasonPickerSheet
          title="¿Por qué rechazas esta solicitud?"
          reasons={PRO_REASONS}
          confirmLabel="Confirmar rechazo"
          loading={rejecting}
          error={rejectError || undefined}
          onConfirm={handleReject}
          onClose={() => setShowReject(false)}
        />
      )}
    </ScreenWrap>
  );
}

// ─── PRO ACTIVE JOB ───────────────────────────────────────────────────────────
function ProActiveJob({ request, jobStatus, messages, onStatusChange, onSendMessage, onFinish, onCancelled, onBack }: {
  request: ServiceRequest; jobStatus: JobStatus; messages: Message[];
  onStatusChange: (s: JobStatus) => void; onSendMessage: (text: string) => void;
  onFinish: (photoFile: File) => Promise<void>; onCancelled: () => void; onBack: () => void;
}) {
  const [tab, setTab] = useState<"job" | "chat">("job");
  const [msg, setMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const handleCancel = async (reasonCode: string, reasonText?: string) => {
    setCancelling(true); setCancelError("");
    try {
      if (!config.MOCK_MODE && request.id) await cancelActiveJob(request.id, reasonCode as ProReasonCode, reasonText);
      onCancelled();
    } catch (err: any) {
      setCancelError(err?.message || "No se pudo cancelar el trabajo. Intenta de nuevo.");
      setCancelling(false);
    }
  };
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
            {jobStatus !== "completado" && (
              <button onClick={() => setShowCancel(true)} className="w-full text-center text-sm font-semibold mt-2" style={{ color: "#EF4444" }}>
                Cancelar trabajo
              </button>
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
      {showCancel && (
        <ReasonPickerSheet
          title="¿Por qué cancelas este trabajo?"
          reasons={PRO_REASONS}
          confirmLabel="Confirmar cancelación"
          loading={cancelling}
          error={cancelError || undefined}
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
        />
      )}
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
function AdminDashboard({ pendingList, loadingPending, activeList, loadingActive, rejectedList, loadingRejected, adminStats, onReview, onLogout }: {
  pendingList: PendingVerification[]; loadingPending: boolean;
  activeList: ApiProUser[]; loadingActive: boolean;
  rejectedList: ApiProUser[]; loadingRejected: boolean;
  adminStats: AdminStats | null;
  onReview: (rec: PendingVerification) => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState<"pending" | "active" | "rejected">("pending");
  const stats = [
    { label: "Pendientes", value: pendingList.length, color: "#F59E0B" },
    { label: "Activos", value: activeList.length, color: "#16A34A" },
    { label: "Rechazados", value: rejectedList.length, color: "#EF4444" },
    { label: "Clientes", value: adminStats?.totalClients ?? "—", color: "#3B82F6" },
    { label: "Servicios hoy", value: adminStats?.requestsToday ?? "—", color: "#8B5CF6" },
    { label: "Total completados", value: adminStats?.requestsTotal ?? "—", color: "#06B6D4" },
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
          loadingActive ? (
            <div className="text-center py-12 text-slate-400"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" /><p className="text-sm">Cargando profesionales...</p></div>
          ) : activeList.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="font-semibold">Sin profesionales activos</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeList.map(pro => (
                <Card key={pro.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#3B82F6" }}>{pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5"><p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p><BadgeCheck className="w-4 h-4 text-blue-500" /></div>
                      <p className="text-xs text-slate-500">{specialtyLabel(pro.specialty)} · CI: {pro.ci}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>{pro.completedJobs} trabajos</span>
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{pro.rating.toFixed(1)}</span>
                        <span>Registrado: {new Date(pro.createdAt).toLocaleDateString("es-BO")}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
        {tab === "rejected" && (
          loadingRejected ? (
            <div className="text-center py-12 text-slate-400"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" /><p className="text-sm">Cargando profesionales...</p></div>
          ) : rejectedList.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="font-semibold">Sin solicitudes rechazadas</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {rejectedList.map(pro => (
                <Card key={pro.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#EF4444" }}>{pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p>
                      <p className="text-xs text-slate-500">{specialtyLabel(pro.specialty)} · CI: {pro.ci}</p>
                      <p className="text-xs text-red-500 mt-0.5">{pro.rejectionReason || "Sin motivo registrado"}</p>
                    </div>
                    <VerifBadge status="rejected" />
                  </div>
                </Card>
              ))}
            </div>
          )
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
            onClient={() => navigate("/cliente")}
            onPro={() => navigate("/profesional")}
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
type CS = "auth" | "profile" | "services" | "request" | "searching" | "tracking" | "price" | "rate" | "done";

function ClientePortal() {
  const navigate = useNavigate();
  const {
    jobStatus, setJobStatus, messages, addMessage,
    activeRequest, setActiveRequest, selectedPro, setSelectedPro,
    clientRating, setClientRating, resetMarketplace,
  } = useAppCtx();
  const realChat = useChatMessages(activeRequest?.id);
  const chatMessages = config.MOCK_MODE ? messages : realChat.messages;
  const clientGeo = useGeolocation();

  const [screen, setScreen] = useState<CS>("auth");
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [selectedService, setSelectedService] = useState("");

  const handleMatched = (pro: Professional) => {
    setSelectedPro(pro);
    setJobStatus("matched");
    setScreen("tracking");
    if (config.MOCK_MODE) {
      setTimeout(() => addMessage("pro", `Hola, soy ${pro.name}. Ya acepté tu solicitud. En ${pro.eta} minutos estoy contigo.`), 800);
    }
  };
  const handleClientMsg = (text: string) => {
    if (config.MOCK_MODE) {
      addMessage("client", text);
      const r = ["Entendido, ya voy en camino.", "Sin problema, llego pronto.", "Ok, avísame si necesitas algo más.", "Perfecto."];
      setTimeout(() => addMessage("pro", r[Math.floor(Math.random() * r.length)]), 1200);
    } else {
      realChat.send(text).catch(() => {});
    }
  };
  const reset = () => { resetMarketplace(); setSelectedService(""); };

  if (screen === "auth") return <ClientAuth onDone={u => { setClientUser(u); setScreen("services"); }} onBack={() => navigate("/")} />;
  if (screen === "profile") return <ClientProfile user={clientUser!} onSave={u => { setClientUser(u); setScreen("services"); }} onBack={() => setScreen("services")} />;
  if (screen === "services") return <ClientServices user={clientUser!} clientLocation={clientGeo.position} onSelect={s => { setSelectedService(s); setScreen("request"); }} onProfile={() => setScreen("profile")} onBack={() => navigate("/")} />;
  if (screen === "request") return <ClientRequest service={selectedService} clientLocation={clientGeo.position} onSubmit={req => { setActiveRequest(req); setJobStatus("searching"); setScreen("searching"); }} onBack={() => setScreen("services")} />;
  if (screen === "searching") return <ClientSearching requestId={activeRequest!.id!} onMatched={handleMatched} onCancel={() => { reset(); setScreen("services"); }} />;
  if (screen === "tracking") return <ClientTracking pro={selectedPro!} request={activeRequest!} jobStatus={jobStatus} messages={chatMessages} clientLocation={clientGeo.position} onSendMessage={handleClientMsg} onComplete={() => setScreen("price")} onCancelled={() => { setJobStatus("searching"); setSelectedPro(null); setScreen("searching"); }} onBack={() => setScreen("services")} />;
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
  const realChat = useChatMessages(activeRequest?.id);
  const chatMessages = config.MOCK_MODE ? messages : realChat.messages;

  const [screen, setScreen] = useState<PS>("auth");
  const [proUser, setProUser] = useState<ProUser | null>(null);
  const [proDocuments, setProDocuments] = useState<DocumentSet | null>(null);

  // Muestra las solicitudes reales asignadas a este profesional (no depende
  // de que cliente y profesional compartan la misma pestaña del navegador),
  // y las mantiene sincronizadas en vivo vía Supabase Realtime.
  useEffect(() => {
    if (config.MOCK_MODE || !proUser?.id) return;
    let active = true;
    getActiveRequestForProfessional(proUser.id).then(req => {
      if (!active || !req) return;
      setActiveRequest(apiRequestToLocal(req));
      setJobStatus(apiStatusToLocal(req.status));
    }).catch(() => {});
    const unsubscribe = subscribeToRequestChanges(proUser.id, req => {
      if (req.status === "completed" || req.status === "rated" || req.status === "cancelled") return;
      setActiveRequest(prev => ({ ...apiRequestToLocal(req), clientName: prev?.clientName }));
      setJobStatus(apiStatusToLocal(req.status));
    });
    return () => { active = false; unsubscribe(); };
  }, [proUser?.id]);

  // Ubicación GPS real del profesional mientras está "Online", guardada en
  // professionals.location_lat/lng para que la distancia que ve el cliente
  // sea real (ver proUserToProfessional/haversineKm).
  const [available, setAvailable] = useState(true);
  const proPosition = useWatchPosition(available);
  useEffect(() => {
    if (config.MOCK_MODE || !proUser?.id) return;
    updateMyPresence({ isOnline: available, location: proPosition ?? undefined }).catch(() => {});
  }, [available, proPosition, proUser?.id]);
  const handleToggleAvailable = () => {
    const goingOnline = !available;
    setAvailable(goingOnline);
    if (goingOnline) subscribeToPushNotifications();
  };

  // La "bolsa" de solicitudes disponibles (pending, sin asignar) en la
  // categoría del profesional — solo mientras no tiene ya un trabajo activo.
  const [availableOffers, setAvailableOffers] = useState<ServiceRequest[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<ServiceRequest | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (config.MOCK_MODE || !proUser?.id || !proUser.specialty || activeRequest) { setAvailableOffers([]); return; }
    let active = true;
    const category = proUser.specialty as any;
    getRejectedRequestIds(proUser.id).then(ids => { if (active) setRejectedIds(new Set(ids)); }).catch(() => {});
    getAvailableOffersForProfessional(category).then(reqs => { if (active) setAvailableOffers(reqs.map(r => apiRequestToLocal(r))); }).catch(() => {});
    const unsubscribe = subscribeToAvailableOffers(category, row => {
      const local = apiRequestToLocal(row);
      setAvailableOffers(prev => {
        const withoutThis = prev.filter(o => o.id !== local.id);
        if (row.status !== "pending" || row.professionalId) return withoutThis; // ya no está disponible
        return [...withoutThis, local];
      });
    });
    return () => { active = false; unsubscribe(); };
  }, [proUser?.id, proUser?.specialty, !!activeRequest]);

  // El radio se filtra acá (haversine), no en la consulta — Realtime solo
  // puede filtrar por columnas simples (ver subscribeToAvailableOffers).
  const visibleOffers = availableOffers.filter(o => {
    if (o.id && rejectedIds.has(o.id)) return false;
    if (!proPosition || o.lat == null || o.lng == null) return true;
    return haversineKm(proPosition, { lat: o.lat, lng: o.lng }) <= (o.searchRadiusKm ?? 3);
  });

  const handleOfferAccepted = () => {
    if (selectedOffer?.id) {
      setActiveRequest(selectedOffer);
      setJobStatus("en_camino");
      if (!config.MOCK_MODE) updateJobStatus(selectedOffer.id, "en_camino").catch(() => {});
    } else if (config.MOCK_MODE) {
      setJobStatus("en_camino");
    }
    setSelectedOffer(null);
    setScreen("job");
  };
  const handleOfferRejected = () => {
    setSelectedOffer(null);
    setScreen("dashboard");
  };
  const handleProStatus = (status: JobStatus) => {
    setJobStatus(status);
    if (config.MOCK_MODE) {
      const msgs: Record<string, string> = {
        en_camino: "¡Voy en camino! Estaré ahí en aproximadamente 12 minutos.",
        en_sitio: "¡Ya llegué! Estoy en la puerta.",
        completado: "¡Listo! El trabajo ha sido completado. Fue un placer trabajar contigo.",
      };
      if (msgs[status]) setTimeout(() => addMessage("pro", msgs[status]), 300);
    } else if (activeRequest?.id && (status === "en_camino" || status === "en_sitio")) {
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
    if (config.MOCK_MODE) {
      addMessage("pro", text);
      const r = ["Perfecto, muchas gracias.", "Ok, te espero.", "Entendido.", "Gracias por la información."];
      setTimeout(() => addMessage("client", r[Math.floor(Math.random() * r.length)]), 1200);
    } else {
      realChat.send(text).catch(() => {});
    }
  };
  if (screen === "auth") return <ProAuth onLogin={u => { setProUser(u); setScreen("dashboard"); }} onRegister={() => setScreen("register")} onBack={() => navigate("/")} />;
  if (screen === "register") return <ProRegister onSubmit={u => { setProUser(u); setScreen("documents"); }} onBack={() => setScreen("auth")} />;
  if (screen === "documents") return <ProDocuments user={proUser!} onSubmit={handleDocSubmit} onBack={() => setScreen("register")} />;
  if (screen === "docview") return <ProDocuments user={proUser!} onSubmit={() => {}} onBack={() => setScreen("profile")} viewOnly docs={proDocuments ?? undefined} />;
  if (screen === "verify") return <ProVerify user={proUser!} onOpenAdmin={() => navigate("/admin")} />;
  if (screen === "dashboard") return <ProDashboard user={proUser!} jobStatus={jobStatus} activeRequest={activeRequest} availableOffers={visibleOffers} available={available} onToggleAvailable={handleToggleAvailable} onViewRequest={() => setScreen("job")} onViewOffer={offer => { setSelectedOffer(offer); setScreen("request"); }} onProfile={() => setScreen("profile")} onDocuments={() => setScreen("docview")} onLogout={() => { setProUser(null); navigate("/"); }} />;
  if (screen === "profile") return <ProProfile user={proUser!} onSave={u => { setProUser(u); setScreen("dashboard"); }} onDocuments={() => setScreen("docview")} onBack={() => setScreen("dashboard")} />;
  if (screen === "request") return <ProRequestDetail request={selectedOffer ?? { service: "Electricista", description: "Revisión del tablero eléctrico.", address: "Calle Los Pinos #342, Equipetrol" }} proLocation={proPosition} onAccepted={handleOfferAccepted} onRejected={handleOfferRejected} onBack={() => { setSelectedOffer(null); setScreen("dashboard"); }} />;
  if (screen === "job") return <ProActiveJob request={activeRequest ?? { service: "Electricista", description: "Revisión del tablero eléctrico.", address: "Calle Los Pinos #342, Equipetrol" }} jobStatus={jobStatus} messages={chatMessages} onStatusChange={handleProStatus} onSendMessage={handleProMsg} onFinish={handleJobFinish} onCancelled={() => { resetMarketplace(); setScreen("dashboard"); }} onBack={() => setScreen("dashboard")} />;
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
  const [activeList, setActiveList] = useState<ApiProUser[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [rejectedList, setRejectedList] = useState<ApiProUser[]>([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const refreshDashboard = async () => {
    if (config.MOCK_MODE) return;
    setLoadingPending(true); setLoadingActive(true); setLoadingRejected(true);
    try {
      const [pending, active, rejected, stats] = await Promise.all([
        getPendingVerifications(), getActiveProfessionals(), getRejectedProfessionals(), getAdminStats(),
      ]);
      setPendingList(pending.data);
      setActiveList(active);
      setRejectedList(rejected);
      setAdminStats(stats);
    } catch {
      setPendingList([]); setActiveList([]); setRejectedList([]);
    } finally {
      setLoadingPending(false); setLoadingActive(false); setLoadingRejected(false);
    }
  };

  useEffect(() => { if (screen === "dashboard") refreshDashboard(); }, [screen]);

  if (screen === "auth") return <AdminAuth onLogin={() => setScreen("dashboard")} onBack={() => navigate("/")} />;
  if (screen === "dashboard") return <AdminDashboard pendingList={pendingList} loadingPending={loadingPending} activeList={activeList} loadingActive={loadingActive} rejectedList={rejectedList} loadingRejected={loadingRejected} adminStats={adminStats} onReview={rec => { setReviewingRecord(rec); setScreen("review"); }} onLogout={() => navigate("/")} />;
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
