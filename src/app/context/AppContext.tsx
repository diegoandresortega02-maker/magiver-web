import { useState, useEffect, createContext, useContext } from "react";
import { config } from "@/lib/config";
import { getMessages, sendMessage, subscribeToMessages } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { nowStr } from "../lib.local/mappers";
import type { JobStatus, Message, ServiceRequest, Professional } from "../types.local";

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

export function useAppCtx() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppCtx must be used inside AppContextProvider");
  return ctx;
}

export function AppContextProvider({ children }: { children: React.ReactNode }) {
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
export function toLocalMessage(m: ChatMessage): Message {
  return {
    id: m.id,
    from: m.from === "professional" ? "pro" : "client",
    text: m.text,
    time: new Date(m.sentAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function useChatMessages(requestId: string | undefined) {
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
