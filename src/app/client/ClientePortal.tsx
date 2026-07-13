import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { config } from "@/lib/config";
import { loadSession, logout } from "@/lib/auth";
import { getActiveRequestsForClient, getProfessionalById } from "@/lib/api";
import type { ServiceRequest as ApiServiceRequest } from "@/lib/types";
import { apiRequestToLocal, apiStatusToLocal, proUserToProfessional } from "../lib.local/mappers";
import { useAppCtx, useChatMessages } from "../context/AppContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { SessionLoading } from "../ui/primitives";
import { ClientAuth, ClientProfile } from "./ClientAuthProfile";
import { ClientHistory } from "./ClientHistory";
import { ClientServices, ClientMap, ClientRequest, ClientSearching, ClientActiveRequests } from "./ClientJobFlow";
import { ClientTracking, ClientPricePaid, ClientRate, ClientDone } from "./ClientTracking";
import type { ClientUser, Professional } from "../types.local";

// ─── PAGE: Cliente portal (/cliente) ─────────────────────────────────────────
type CS = "auth" | "profile" | "history" | "services" | "myRequests" | "request" | "searching" | "tracking" | "price" | "rate" | "done";

export function ClientePortal() {
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
  const [checkingSession, setCheckingSession] = useState(!config.MOCK_MODE);
  const [cancelNotice, setCancelNotice] = useState("");

  // Restaura la sesión si ya había una guardada (Supabase persiste el token
  // solo, esto evita pedir login de nuevo tras recargar la app o volver
  // atrás — antes esto no se revisaba y siempre arrancaba en "auth").
  // También retoma la(s) solicitud(es) en curso si había alguna, en vez de
  // perderlas y arrancar de cero en "servicios". Con exactamente 1 activa,
  // salta directo a su pantalla (igual que antes); con 2+ no se puede
  // adivinar cuál mostrar, así que aterriza en "servicios", donde el botón
  // "solicitudes en curso" lleva al listado completo.
  // Fija la solicitud elegida (desde la restauración de sesión de abajo, o
  // desde el listado "myRequests") como la que se está viendo ahora mismo, y
  // navega a su pantalla correspondiente según su estado.
  const handleSelectRequest = async (req: ApiServiceRequest & { professionalName?: string }) => {
    setActiveRequest(apiRequestToLocal(req));
    setJobStatus(apiStatusToLocal(req.status));
    if (req.professionalId) {
      const pro = await getProfessionalById(req.professionalId);
      setSelectedPro(proUserToProfessional(pro, 0));
    }
    setScreen(req.status === "pending" ? "searching" : "tracking");
  };

  useEffect(() => {
    if (config.MOCK_MODE) return;
    let active = true;
    loadSession().then(async session => {
      if (!active || session?.user.role !== "client") return;
      const user = session.user as ClientUser;
      setClientUser(user);
      try {
        const reqs = user.id ? await getActiveRequestsForClient(user.id) : [];
        if (active && reqs.length === 1) {
          await handleSelectRequest(reqs[0]);
          return;
        }
      } catch { /* si falla, cae a "services" abajo */ }
      if (active) setScreen("services");
    }).finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

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

  if (checkingSession) return <SessionLoading />;
  if (screen === "auth") return <ClientAuth onDone={u => { setClientUser(u); setScreen("services"); }} onBack={() => navigate("/")} />;
  if (screen === "profile") return <ClientProfile user={clientUser!} onSave={u => { setClientUser(u); setScreen("services"); }} onBack={() => setScreen("services")} onLogout={() => { logout(); reset(); setClientUser(null); setScreen("auth"); navigate("/"); }} onViewHistory={() => setScreen("history")} />;
  if (screen === "history") return <ClientHistory user={clientUser!} onBack={() => setScreen("profile")} />;
  if (screen === "services") return <ClientServices user={clientUser!} clientLocation={clientGeo.position} onSelect={s => { setSelectedService(s); setScreen("request"); }} onProfile={() => setScreen("profile")} onViewActiveRequests={() => setScreen("myRequests")} onBack={() => navigate("/")} />;
  if (screen === "myRequests") return <ClientActiveRequests user={clientUser!} onSelect={handleSelectRequest} onBack={() => setScreen("services")} />;
  if (screen === "request") return <ClientRequest service={selectedService} clientLocation={clientGeo.position} onSubmit={req => { setActiveRequest(req); setJobStatus("searching"); setScreen("searching"); }} onBack={() => setScreen("services")} />;
  if (screen === "searching") return <ClientSearching requestId={activeRequest!.id!} notice={cancelNotice} onDismissNotice={() => setCancelNotice("")} onMatched={handleMatched} onCancel={() => { reset(); setScreen("services"); }} />;
  if (screen === "tracking") return <ClientTracking pro={selectedPro!} request={activeRequest!} jobStatus={jobStatus} messages={chatMessages} clientLocation={clientGeo.position} onSendMessage={handleClientMsg} onComplete={() => setScreen("price")} onCancelled={() => { setJobStatus("searching"); setSelectedPro(null); setScreen("searching"); }} onCancelledByProfessional={() => { setCancelNotice("El profesional canceló el servicio. Seguimos buscando a alguien más..."); setJobStatus("searching"); setSelectedPro(null); setScreen("searching"); }} onRequestUpdate={row => { setJobStatus(apiStatusToLocal(row.status)); if (row.agreedPrice != null) setActiveRequest(prev => prev ? { ...prev, agreedPrice: row.agreedPrice } : prev); }} onBack={() => setScreen("services")} />;
  if (screen === "price") return <ClientPricePaid pro={selectedPro!} requestId={activeRequest?.id} onDone={price => { setActiveRequest(activeRequest ? { ...activeRequest, agreedPrice: price } : activeRequest); setScreen("rate"); }} />;
  if (screen === "rate") return <ClientRate pro={selectedPro!} requestId={activeRequest?.id} onSubmit={r => { setClientRating(r); setScreen("done"); }} />;
  if (screen === "done") return <ClientDone pro={selectedPro!} rating={clientRating ?? 0} onAgain={() => { reset(); setScreen("services"); }} onHome={() => { reset(); navigate("/"); }} />;
  return null;
}
