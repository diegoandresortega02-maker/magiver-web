import { useState, useEffect, useRef } from "react";
import { config } from "@/lib/config";
import { updateJobStatus, submitReview, cancelActiveJob, subscribeToProfessionalLocation, subscribeToJobChanges } from "@/lib/api";
import type { ClientReasonCode } from "@/lib/api";
import type { GeoPoint, JobStatus as ApiJobStatus } from "@/lib/types";
import {
  MessageSquare, CheckCircle, Car, MapPin, Award, Star, Send,
  DollarSign, ArrowRight, ThumbsUp, AlertCircle, Loader2, BadgeCheck,
} from "lucide-react";
import { NAVY, LIME, AppHeader, ScreenWrap, Card, StatusBadge, ProAvatar, LimeBtn, ReasonPickerSheet } from "../ui/primitives";
import { LiveMap } from "../maps/RealMap";
import { MapView } from "../maps/MapView";
import { CLIENT_REASONS } from "../lib.local/mappers";
import type { Professional, ServiceRequest, JobStatus, Message } from "../types.local";

// ─── CLIENT TRACKING ──────────────────────────────────────────────────────────
export function ClientTracking({ pro, request, jobStatus, messages, clientLocation, onSendMessage, onComplete, onCancelled, onCancelledByProfessional, onRequestUpdate, onBack }: {
  pro: Professional; request: ServiceRequest; jobStatus: JobStatus;
  messages: Message[]; clientLocation?: GeoPoint | null; onSendMessage: (text: string) => void;
  onComplete: () => void; onCancelled: () => void; onCancelledByProfessional: () => void; onRequestUpdate: (row: { status: ApiJobStatus; agreedPrice?: number }) => void; onBack: () => void;
}) {
  const [tab, setTab] = useState<"track" | "chat">("track");
  const [msg, setMsg] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [liveProLocation, setLiveProLocation] = useState<GeoPoint | null>(pro.location ?? null);
  const ownCancelRef = useRef(false);
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
  // Mantiene el estado del trabajo (en camino, en sitio, completado) al día
  // mientras el cliente mira esta pantalla — sin esto, jobStatus solo se
  // fijaba una vez al llegar acá y nunca se enteraba de los avances reales
  // del profesional. También detecta si el PROFESIONAL cancela (vuelve a
  // "pending"), caso en el que el cliente tampoco se enteraría solo.
  useEffect(() => {
    if (config.MOCK_MODE || !request.id) return;
    const unsubscribe = subscribeToJobChanges(request.id, row => {
      if (row.status === "pending" && !ownCancelRef.current) { onCancelledByProfessional(); return; }
      onRequestUpdate({ status: row.status, agreedPrice: row.agreedPrice });
    });
    return unsubscribe;
  }, [request.id]);
  const handleCancel = async (reasonCode: string, reasonText?: string) => {
    setCancelling(true); setCancelError("");
    ownCancelRef.current = true;
    try {
      if (!config.MOCK_MODE && request.id) await cancelActiveJob(request.id, reasonCode as ClientReasonCode, reasonText);
      onCancelled();
    } catch (err: any) {
      ownCancelRef.current = false;
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
export function ClientPricePaid({ pro, requestId, onDone }: { pro: Professional; requestId?: string; onDone: (price?: number) => void }) {
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
export function ClientRate({ pro, requestId, onSubmit }: { pro: Professional; requestId?: string; onSubmit: (rating: number, comment: string) => void }) {
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

export function ClientDone({ pro, rating, onAgain, onHome }: { pro: Professional; rating: number; onAgain: () => void; onHome: () => void }) {
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
