import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { config } from "@/lib/config";
import { loadSession } from "@/lib/auth";
import { useAppCtx, useChatMessages } from "../context/AppContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { SessionLoading } from "../ui/primitives";
import { ClientAuth, ClientProfile } from "./ClientAuthProfile";
import { ClientServices, ClientMap, ClientRequest, ClientSearching } from "./ClientJobFlow";
import { ClientTracking, ClientPricePaid, ClientRate, ClientDone } from "./ClientTracking";
import type { ClientUser, Professional } from "../types.local";

// ─── PAGE: Cliente portal (/cliente) ─────────────────────────────────────────
type CS = "auth" | "profile" | "services" | "request" | "searching" | "tracking" | "price" | "rate" | "done";

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

  // Restaura la sesión si ya había una guardada (Supabase persiste el token
  // solo, esto evita pedir login de nuevo tras recargar la app o volver
  // atrás — antes esto no se revisaba y siempre arrancaba en "auth").
  useEffect(() => {
    if (config.MOCK_MODE) return;
    let active = true;
    loadSession().then(session => {
      if (!active) return;
      if (session?.user.role === "client") {
        setClientUser(session.user as ClientUser);
        setScreen("services");
      }
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
