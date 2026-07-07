import { useState } from "react";
import { config } from "@/lib/config";
import { loginAdmin } from "@/lib/auth";
import { approveVerification, rejectVerification } from "@/lib/api";
import type { PendingVerification, ProUser as ApiProUser, AdminStats } from "@/lib/types";
import {
  Shield, Mail, AlertCircle, Loader2, LogOut, CheckCircle, Users,
  BadgeCheck, Star, Clock, XCircle, ArrowRight, X,
} from "lucide-react";
import { NAVY, LIME, AppHeader, ScreenWrap, InputField, LimeBtn, DangerBtn, Card, VerifBadge, LogoIcon } from "../ui/primitives";
import { specialtyLabel } from "../lib.local/mappers";

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────
export function AdminAuth({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
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
export function AdminDashboard({ pendingList, loadingPending, activeList, loadingActive, rejectedList, loadingRejected, adminStats, onReview, onLogout }: {
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
export function AdminProReview({ record, onDone, onBack }: {
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
            {record.professional.homeAddress && (
              <div className="col-span-2"><p className="text-xs text-slate-400">Dirección de vivienda (declarada)</p><p className="font-semibold" style={{ color: NAVY }}>{record.professional.homeAddress.street}{record.professional.homeAddress.zone ? `, ${record.professional.homeAddress.zone}` : ""}</p></div>
            )}
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
