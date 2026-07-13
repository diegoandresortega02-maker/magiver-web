import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { config } from "@/lib/config";
import { loadSession, logout } from "@/lib/auth";
import { distanceKm as haversineKm } from "@/lib/geo";
import { SessionLoading } from "../ui/primitives";
import {
  getActiveRequestForProfessional, subscribeToRequestChanges, updateMyPresence,
  updateJobStatus, getAvailableOffersForProfessional, subscribeToAvailableOffers, getRejectedRequestIds,
  uploadJobPhoto, getRecentJobsForProfessional,
} from "@/lib/api";
import type { RecentJob } from "@/lib/api";
import { useAppCtx, useChatMessages } from "../context/AppContext";
import { useWatchPosition } from "../hooks/useGeolocation";
import { subscribeToPushNotifications } from "../hooks/usePushSubscription";
import { apiStatusToLocal, apiRequestToLocal } from "../lib.local/mappers";
import { ProAuth, ProRegister, ProDocuments, ProVerify } from "./ProAuthRegister";
import { ProDashboard, ProProfile, ProJobHistory } from "./ProDashboardProfile";
import { ProRequestDetail, ProActiveJob, ProJobDone } from "./ProJobFlow";
import type { ProUser, DocumentSet, JobStatus, ServiceRequest } from "../types.local";

// ─── PAGE: Profesional portal (/profesional) ──────────────────────────────────
type PS = "auth" | "register" | "documents" | "docview" | "verify" | "dashboard" | "profile" | "history" | "request" | "job" | "done";

export function ProfesionalPortal() {
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
  const [checkingSession, setCheckingSession] = useState(!config.MOCK_MODE);

  // Restaura la sesión si ya había una guardada (ver mismo fix en
  // ClientePortal) — antes siempre arrancaba en "auth" sin revisar si el
  // profesional ya tenía una sesión de Supabase válida.
  useEffect(() => {
    if (config.MOCK_MODE) return;
    let active = true;
    loadSession().then(session => {
      if (!active) return;
      if (session?.user.role === "professional") {
        setProUser(session.user as ProUser);
        setScreen(session.user.status === "active" ? "dashboard" : "verify");
      }
    }).finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

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

  // Trabajos reales ya completados (antes era una lista de ejemplo inventada).
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  useEffect(() => {
    if (config.MOCK_MODE || !proUser?.id) return;
    getRecentJobsForProfessional(proUser.id).then(setRecentJobs).catch(() => {});
  }, [proUser?.id, jobStatus]);

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
  const handleJobFinish = async (photoFiles: File[]) => {
    if (!config.MOCK_MODE && activeRequest?.id) {
      await uploadJobPhoto(activeRequest.id, photoFiles);
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
  if (checkingSession) return <SessionLoading />;
  if (screen === "auth") return <ProAuth onLogin={u => { setProUser(u); setScreen("dashboard"); }} onRegister={() => setScreen("register")} onBack={() => navigate("/")} />;
  if (screen === "register") return <ProRegister onSubmit={u => { setProUser(u); setScreen("documents"); }} onBack={() => setScreen("auth")} />;
  if (screen === "documents") return <ProDocuments user={proUser!} onSubmit={handleDocSubmit} onBack={() => setScreen("register")} />;
  if (screen === "docview") return <ProDocuments user={proUser!} onSubmit={() => {}} onBack={() => setScreen("profile")} viewOnly docs={proDocuments ?? undefined} />;
  if (screen === "verify") return <ProVerify user={proUser!} onOpenAdmin={() => navigate("/admin")} />;
  if (screen === "dashboard") return <ProDashboard user={proUser!} jobStatus={jobStatus} activeRequest={activeRequest} availableOffers={visibleOffers} recentJobs={recentJobs} available={available} onToggleAvailable={handleToggleAvailable} onViewRequest={() => setScreen("job")} onViewOffer={offer => { setSelectedOffer(offer); setScreen("request"); }} onProfile={() => setScreen("profile")} onDocuments={() => setScreen("docview")} onLogout={() => { logout(); resetMarketplace(); setProUser(null); navigate("/"); }} onViewHistory={() => setScreen("history")} />;
  if (screen === "history") return <ProJobHistory user={proUser!} onBack={() => setScreen("dashboard")} />;
  if (screen === "profile") return <ProProfile user={proUser!} onSave={u => { setProUser(u); setScreen("dashboard"); }} onDocuments={() => setScreen("docview")} onBack={() => setScreen("dashboard")} onLogout={() => { logout(); resetMarketplace(); setProUser(null); navigate("/"); }} />;
  if (screen === "request") return <ProRequestDetail request={selectedOffer ?? { service: "Electricista", description: "Revisión del tablero eléctrico.", address: "Calle Los Pinos #342, Equipetrol" }} proLocation={proPosition} onAccepted={handleOfferAccepted} onRejected={handleOfferRejected} onBack={() => { setSelectedOffer(null); setScreen("dashboard"); }} />;
  if (screen === "job") return <ProActiveJob request={activeRequest ?? { service: "Electricista", description: "Revisión del tablero eléctrico.", address: "Calle Los Pinos #342, Equipetrol" }} jobStatus={jobStatus} messages={chatMessages} professionalId={proUser?.id} proLocation={proPosition} onStatusChange={handleProStatus} onSendMessage={handleProMsg} onFinish={handleJobFinish} onCancelled={() => { resetMarketplace(); setScreen("dashboard"); }} onBack={() => setScreen("dashboard")} />;
  if (screen === "done") return <ProJobDone clientRating={clientRating} onHome={() => { resetMarketplace(); setScreen("dashboard"); }} />;
  return null;
}
