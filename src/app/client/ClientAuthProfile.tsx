import { useState, useEffect } from "react";
import { config } from "@/lib/config";
import { loginClient, registerClient } from "@/lib/auth";
import { getClientRequestCount } from "@/lib/api";
import { User, Phone, Mail, AlertCircle, Loader2, Check, LogOut, ChevronRight } from "lucide-react";
import { NAVY, LIME, LogoIcon, LimeBtn, DangerBtn, AppHeader, ScreenWrap, InputField, Card } from "../ui/primitives";
import { LegalModal, LegalCheckbox, type LegalTab } from "../legal/LegalModal";
import type { ClientUser } from "../types.local";

// ─── CLIENT AUTH ─────────────────────────────────────────────────────────────
export function ClientAuth({ onDone, onBack }: { onDone: (u: ClientUser) => void; onBack: () => void }) {
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
            <LimeBtn type="submit" disabled={loading || (tab === "register" && (!name.trim() || !phone.trim() || !termsAccepted))} className="w-full py-3.5 text-base mt-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Ingresando...</> : tab === "register" ? "Crear mi cuenta" : "Ingresar"}
            </LimeBtn>
          </form>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT PROFILE ──────────────────────────────────────────────────────────
export function ClientProfile({ user, onSave, onBack, onLogout, onViewHistory }: { user: ClientUser; onSave: (u: ClientUser) => void; onBack: () => void; onLogout: () => void; onViewHistory: () => void }) {
  const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone); const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);
  const [requestCount, setRequestCount] = useState<number | null>(null);
  useEffect(() => {
    if (config.MOCK_MODE || !user.id) return;
    getClientRequestCount(user.id).then(setRequestCount).catch(() => {});
  }, [user.id]);
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-BO", { month: "long", year: "numeric" })
    : null;
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
        <form onSubmit={e => { e.preventDefault(); onSave({ ...user, name, phone, email }); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="flex flex-col gap-5">
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
          <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Servicios solicitados</span><span className="font-semibold" style={{ color: NAVY }}>{requestCount ?? "—"}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Miembro desde</span><span className="font-semibold" style={{ color: NAVY }}>{memberSince ?? "—"}</span></div>
          <button onClick={onViewHistory} className="text-xs font-semibold flex items-center gap-1 mt-3" style={{ color: LIME }}>
            Ver historial completo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Card>
        <DangerBtn onClick={onLogout} className="w-full mt-6"><LogOut className="w-4 h-4" />Cerrar sesión</DangerBtn>
        <p className="text-center text-xs text-slate-300 mt-4">MAGIVER v{config.APP_VERSION}</p>
      </div>
    </ScreenWrap>
  );
}
