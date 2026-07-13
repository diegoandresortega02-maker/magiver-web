import { useState, useRef, useEffect } from "react";
import { config } from "@/lib/config";
import { distanceKm as haversineKm } from "@/lib/geo";
import { acceptServiceRequest, rejectServiceRequest, cancelActiveJob, getQuickReplies, createQuickReply, deleteQuickReply, subscribeToJobChanges } from "@/lib/api";
import type { ProReasonCode, QuickReply } from "@/lib/api";
import type { GeoPoint } from "@/lib/types";
import {
  MapPin, AlertCircle, Loader2, CheckCircle, Car, Check, Upload, Award, Send, Zap, Star, X, Plus,
} from "lucide-react";
import { NAVY, LIME, AppHeader, ScreenWrap, Card, StatusBadge, LimeBtn, DangerBtn, ReasonPickerSheet } from "../ui/primitives";
import { LiveMap } from "../maps/RealMap";
import { MapView } from "../maps/MapView";
import { PRO_REASONS } from "../lib.local/mappers";
import type { ServiceRequest, JobStatus, Message } from "../types.local";

// ─── PRO REQUEST ──────────────────────────────────────────────────────────────
export function ProRequestDetail({ request, proLocation, onAccepted, onRejected, onBack }: {
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
export function ProActiveJob({ request, jobStatus, messages, professionalId, proLocation, onStatusChange, onSendMessage, onFinish, onCancelled, onCancelledByClient, onBack }: {
  request: ServiceRequest; jobStatus: JobStatus; messages: Message[]; professionalId?: string; proLocation?: GeoPoint | null;
  onStatusChange: (s: JobStatus) => void; onSendMessage: (text: string) => void;
  onFinish: (photoFiles: File[]) => Promise<void>; onCancelled: () => void; onCancelledByClient: () => void; onBack: () => void;
}) {
  const clientLoc = request.lat != null && request.lng != null ? { lat: request.lat, lng: request.lng } : null;
  const [tab, setTab] = useState<"job" | "chat">("job");
  const [msg, setMsg] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = photoFiles.map(f => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [photoFiles]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [addingReply, setAddingReply] = useState(false);
  const [newReplyText, setNewReplyText] = useState("");
  useEffect(() => {
    if (config.MOCK_MODE || !professionalId) return;
    getQuickReplies(professionalId).then(setQuickReplies).catch(() => {});
  }, [professionalId]);
  const handleSaveQuickReply = async () => {
    const text = newReplyText.trim();
    if (!text || !professionalId) return;
    setNewReplyText(""); setAddingReply(false);
    try {
      const created = await createQuickReply(professionalId, text);
      setQuickReplies(prev => [...prev, created]);
    } catch { /* no bloquea el chat si falla el guardado */ }
  };
  const handleDeleteQuickReply = async (id: string) => {
    setQuickReplies(prev => prev.filter(r => r.id !== id));
    try { await deleteQuickReply(id); } catch { /* ya se quitó de la vista */ }
  };
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const ownCancelRef = useRef(false);
  // Detecta si el CLIENTE cancela mientras el profesional está en esta
  // pantalla: cancel_active_job libera la solicitud (professional_id vuelve
  // a null, status a "pending"), pero la suscripción por professional_id
  // del panel principal deja de matchear esa fila justo en ese cambio —
  // por eso se necesita esta suscripción aparte, filtrada por el id de la
  // solicitud (que no cambia), para enterarse sí o sí.
  useEffect(() => {
    if (config.MOCK_MODE || !request.id) return;
    const unsubscribe = subscribeToJobChanges(request.id, row => {
      if (row.status === "pending" && !ownCancelRef.current) onCancelledByClient();
    });
    return unsubscribe;
  }, [request.id]);
  const handleCancel = async (reasonCode: string, reasonText?: string) => {
    setCancelling(true); setCancelError("");
    ownCancelRef.current = true;
    try {
      if (!config.MOCK_MODE && request.id) await cancelActiveJob(request.id, reasonCode as ProReasonCode, reasonText);
      onCancelled();
    } catch (err: any) {
      ownCancelRef.current = false;
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
            {jobStatus !== "completado" && (
              <div className="mb-5">
                <LiveMap
                  markers={[
                    ...(clientLoc ? [{ id: "cliente", lat: clientLoc.lat, lng: clientLoc.lng, label: request.clientName?.slice(0, 2).toUpperCase() ?? "CL", color: "#8B5CF6" }] : []),
                    ...(proLocation ? [{ id: "yo", lat: proLocation.lat, lng: proLocation.lng, label: "Tú", color: LIME, labelColor: NAVY }] : []),
                  ]}
                  fallback={<MapView selectedProId="1" />}
                />
              </div>
            )}
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
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>
                    Fotos del trabajo terminado (1 a 3) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative w-full aspect-square rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                          <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photoFiles.length < 3 && (
                    <label className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors border-slate-200 hover:border-slate-300 bg-white">
                      <Upload className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-400">
                        {photoFiles.length === 0 ? "Toca para subir 1 a 3 fotos" : `Agregar otra foto (${photoFiles.length}/3)`}
                      </span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                        const picked = Array.from(e.target.files ?? []);
                        if (picked.length > 0) setPhotoFiles(prev => [...prev, ...picked].slice(0, 3));
                        e.target.value = "";
                      }} />
                    </label>
                  )}
                </div>
                {finishError && (
                  <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{finishError}
                  </p>
                )}
                <LimeBtn onClick={async () => {
                  if (photoFiles.length === 0) return;
                  setFinishError(""); setFinishing(true);
                  try { await onFinish(photoFiles); }
                  catch (err: any) { setFinishError(err?.message || "No se pudo finalizar el trabajo. Intenta de nuevo."); }
                  finally { setFinishing(false); }
                }} disabled={photoFiles.length === 0 || finishing} className="w-full py-4 text-base">
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
            <div className="border-t" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
              <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
                {quickReplies.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 flex-shrink-0 pl-3 pr-2 py-1.5 rounded-full border text-xs" style={{ borderColor: "#E5E7EB", background: "#F8FAFC", color: NAVY }}>
                    <button onClick={() => setMsg(r.text)} className="max-w-[160px] truncate">{r.text}</button>
                    <button onClick={() => handleDeleteQuickReply(r.id)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {addingReply ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input autoFocus value={newReplyText} onChange={e => setNewReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveQuickReply(); if (e.key === "Escape") { setAddingReply(false); setNewReplyText(""); } }}
                      placeholder="Nueva respuesta guardada..." className="px-3 py-1.5 rounded-full border text-xs outline-none" style={{ borderColor: LIME, color: NAVY, width: 180 }} />
                    <button onClick={handleSaveQuickReply} className="text-xs font-semibold flex-shrink-0" style={{ color: LIME }}>Guardar</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingReply(true)} className="flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold" style={{ borderColor: LIME, color: LIME }}>
                    <Plus className="w-3 h-3" />Respuesta rápida
                  </button>
                )}
              </div>
              <div className="p-4 pt-2 flex gap-3">
                <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { onSendMessage(msg.trim()); setMsg(""); } }} placeholder="Escribe un mensaje..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} />
                <button onClick={() => { if (msg.trim()) { onSendMessage(msg.trim()); setMsg(""); } }} className="w-11 h-11 rounded-xl flex items-center justify-center hover:brightness-110" style={{ background: LIME }}><Send className="w-4 h-4" style={{ color: NAVY }} /></button>
              </div>
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

export function ProJobDone({ clientRating, onHome }: { clientRating: number | null; onHome: () => void }) {
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
