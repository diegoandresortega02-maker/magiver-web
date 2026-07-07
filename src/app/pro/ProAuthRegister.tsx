import { useState } from "react";
import { config } from "@/lib/config";
import { loginPro } from "@/lib/auth";
import { registerProfessional as apiRegisterProfessional, uploadDocument as apiUploadDocument } from "@/lib/api";
import {
  UserCheck, Mail, AlertCircle, Loader2, User, Phone, MapPin, ChevronDown,
  Award, FileCheck, Camera, Check, ArrowRight, Image, Upload, Trash2, FilePlus, Send,
  CheckCircle, Clock, Settings,
} from "lucide-react";
import { NAVY, LIME, AppHeader, ScreenWrap, InputField, LimeBtn, VerifBadge } from "../ui/primitives";
import { LegalModal, LegalCheckbox, type LegalTab } from "../legal/LegalModal";
import { SERVICES } from "../lib.local/mappers";
import type { ProUser, DocumentSet } from "../types.local";

// ─── PRO AUTH ─────────────────────────────────────────────────────────────────
export function ProAuth({ onLogin, onRegister, onBack }: { onLogin: (u: ProUser) => void; onRegister: () => void; onBack: () => void }) {
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
export function ProRegister({ onSubmit, onBack }: { onSubmit: (u: ProUser) => void; onBack: () => void }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [pass, setPass] = useState(""); const [specialty, setSpecialty] = useState("");
  const [ci, setCi] = useState(""); const [yearsExp, setYearsExp] = useState(""); const [bio, setBio] = useState("");
  const [homeStreet, setHomeStreet] = useState(""); const [homeZone, setHomeZone] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [declarationError, setDeclarationError] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !specialty || !ci || !homeStreet) return;
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
        homeAddress: { street: homeStreet, zone: homeZone, city: "Santa Cruz de la Sierra" },
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
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>Dirección de tu vivienda</p>
          <p className="text-xs text-slate-500 -mt-3">Se pide solo una vez, al registrarte, para tu verificación de identidad.</p>
          <InputField label="Calle y número" placeholder="Ej. Calle Los Pinos #342" value={homeStreet} onChange={setHomeStreet} icon={<MapPin className="w-4 h-4" />} />
          <InputField label="Zona / Barrio" placeholder="Ej. Equipetrol" value={homeZone} onChange={setHomeZone} icon={<MapPin className="w-4 h-4" />} />
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

          <LimeBtn type="submit" disabled={loading || !name || !phone || !specialty || !ci || !homeStreet || !termsAccepted || !declarationAccepted} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <>Continuar a documentos <ArrowRight className="w-4 h-4" /></>}
          </LimeBtn>
        </form>
      </div>
    </ScreenWrap>
  );
}

// ─── PRO DOCUMENTS ────────────────────────────────────────────────────────────
export function ProDocuments({ user, onSubmit, onBack, viewOnly = false, docs }: {
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
export function ProVerify({ user, onOpenAdmin }: { user: ProUser; onOpenAdmin: () => void }) {
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
