import { useState, useEffect } from "react";
import { config } from "@/lib/config";
import { getProfessionalJobHistory, updateProfessionalProfile } from "@/lib/api";
import type { RecentJob, JobHistoryEntry } from "@/lib/api";
import {
  Bell, User, LogOut, Star, BadgeCheck, ToggleRight, ToggleLeft,
  CheckCircle, FileCheck, Award, ChevronRight, Phone, Mail, Check, AlertCircle, X,
} from "lucide-react";
import { NAVY, LIME, AppHeader, ScreenWrap, InputField, LimeBtn, DangerBtn, Card, StatusBadge, VerifBadge, LogoIcon, JobHistoryCard } from "../ui/primitives";
import { specialtyLabel, SERVICES } from "../lib.local/mappers";
import type { ProUser, JobStatus, ServiceRequest } from "../types.local";

// ─── PRO DASHBOARD ────────────────────────────────────────────────────────────
export function ProDashboard({ user, jobStatus, activeRequest, availableOffers, recentJobs, available, notice, onDismissNotice, onToggleAvailable, onViewRequest, onViewOffer, onProfile, onDocuments, onLogout, onViewHistory }: {
  user: ProUser; jobStatus: JobStatus; activeRequest: ServiceRequest | null; availableOffers: ServiceRequest[];
  recentJobs: RecentJob[];
  available: boolean; notice?: string; onDismissNotice?: () => void; onToggleAvailable: () => void;
  onViewRequest: () => void; onViewOffer: (offer: ServiceRequest) => void; onProfile: () => void; onDocuments: () => void;
  onLogout: () => void; onViewHistory: () => void;
}) {
  const hasIncoming = availableOffers.length > 0;
  const hasActiveJob = jobStatus === "matched" || jobStatus === "en_camino" || jobStatus === "en_sitio";
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
              <p className="text-slate-400 text-sm">{user.specialties.map(specialtyLabel).join(", ")} · {user.yearsExp} años exp.</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-slate-300">{(user.rating ?? 0).toFixed(1)} · {user.reviewCount ?? 0} reseñas</span>
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
            {[[String(user.completedJobs ?? 0), "Trabajos"], [(user.rating ?? 0).toFixed(1), "Calificación"], [`${user.yearsExp} años`, "Experiencia"]].map(([v, l]) => (
              <div key={l} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <p className="font-black text-white text-sm">{v}</p><p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {notice && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl border mb-4" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed flex-1">{notice}</p>
            {onDismissNotice && <button onClick={onDismissNotice} className="text-amber-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>}
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
        {recentJobs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Todavía no tienes trabajos completados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentJobs.map(job => (
              <Card key={job.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: NAVY }}>{specialtyLabel(job.category)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.clientName} · {new Date(job.completedAt).toLocaleDateString("es-BO", { day: "numeric", month: "short" })}</p>
                    {job.rating != null && <div className="flex items-center gap-1 mt-1">{[...Array(job.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}</div>}
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
        {recentJobs.length > 0 && (
          <button onClick={onViewHistory} className="w-full text-center text-xs font-semibold mt-3" style={{ color: LIME }}>
            Ver todos →
          </button>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── PRO JOB HISTORY ──────────────────────────────────────────────────────────
export function ProJobHistory({ user, onBack }: { user: ProUser; onBack: () => void }) {
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [loading, setLoading] = useState(!config.MOCK_MODE);
  useEffect(() => {
    if (config.MOCK_MODE || !user.id) return;
    let active = true;
    getProfessionalJobHistory(user.id)
      .then(h => { if (active) setHistory(h); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);
  return (
    <ScreenWrap>
      <AppHeader title="Historial de trabajos" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Todavía no tienes trabajos completados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(job => (
              <JobHistoryCard
                key={job.id}
                categoryLabel={specialtyLabel(job.category)}
                counterpartName={job.counterpartName}
                dateLabel={new Date(job.completedAt).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" })}
                rating={job.rating}
                amount={job.agreedPrice}
                photoUrls={job.photoUrls}
                notes={job.notes}
              />
            ))}
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── PRO PROFILE ──────────────────────────────────────────────────────────────
export function ProProfile({ user, onSave, onDocuments, onBack, onLogout }: { user: ProUser; onSave: (u: ProUser) => void; onDocuments: () => void; onBack: () => void; onLogout: () => void }) {
  const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone); const [email, setEmail] = useState(user.email);
  const [specialties, setSpecialties] = useState<string[]>(user.specialties); const [yearsExp, setYearsExp] = useState(String(user.yearsExp)); const [bio, setBio] = useState(user.bio);
  const toggleSpecialty = (id: string) => setSpecialties(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 4 ? [...prev, id] : prev);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (specialties.length === 0) return;
    setSaveError(""); setSaving(true);
    try {
      if (!config.MOCK_MODE && user.id) {
        await updateProfessionalProfile(user.id, { name, phone, specialties, yearsExp: parseInt(yearsExp) || 1, bio });
      }
      onSave({ ...user, name, phone, email, specialties, yearsExp: parseInt(yearsExp) || 1, bio });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err?.message || "No se pudieron guardar los cambios. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Datos de contacto</p>
          <InputField label="Nombre completo" placeholder="Tu nombre" value={name} onChange={setName} icon={<User className="w-4 h-4" />} />
          <InputField label="Teléfono / WhatsApp" type="tel" placeholder="+591 7xxxxxxx" value={phone} onChange={setPhone} icon={<Phone className="w-4 h-4" />} />
          <InputField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Información profesional</p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>
              Especialidades {specialties.length > 0 && <span className="normal-case font-normal text-slate-400">({specialties.length}/4)</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map(s => {
                const checked = specialties.includes(s.id);
                const disabled = !checked && specialties.length >= 4;
                return (
                  <button key={s.id} type="button" onClick={() => toggleSpecialty(s.id)} disabled={disabled}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    style={{ borderColor: checked ? LIME : "#E5E7EB", background: checked ? "#F7FEE7" : "#fff", color: NAVY }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: checked ? LIME : "#fff", border: checked ? "none" : "2px solid #E5E7EB" }}>
                      {checked && <Check className="w-3 h-3" style={{ color: NAVY }} />}
                    </div>
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
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
          {saveError && (
            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveError}
            </p>
          )}
          <LimeBtn type="submit" disabled={saving || specialties.length === 0} className="w-full py-3.5 text-base mt-1">
            {saving ? <>Guardando...</> : saved ? <><Check className="w-4 h-4" />Guardado</> : "Guardar cambios"}
          </LimeBtn>
        </form>
        <DangerBtn onClick={onLogout} className="w-full mt-6"><LogOut className="w-4 h-4" />Cerrar sesión</DangerBtn>
        <p className="text-center text-xs text-slate-300 mt-4">MAGIVER v{config.APP_VERSION}</p>
      </div>
    </ScreenWrap>
  );
}
