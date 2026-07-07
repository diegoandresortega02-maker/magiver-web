import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import heroPhoto from "@/assets/photos/hero-electricista.jpg";
import prosPhoto from "@/assets/photos/pros-cliente-plomero.jpg";
import catElectricista from "@/assets/photos/cat-electricista.jpg";
import catPlomero from "@/assets/photos/cat-plomero.jpg";
import catAire from "@/assets/photos/cat-aire-acondicionado.jpg";
import catAlbanil from "@/assets/photos/cat-albanil.jpg";
import catPintor from "@/assets/photos/cat-pintor.jpg";
import catMecanicoMotos from "@/assets/photos/cat-mecanico-motos.jpg";
import catMecanicoAutos from "@/assets/photos/cat-mecanico-autos.jpg";
import catLavadoAutos from "@/assets/photos/cat-lavado-autos.jpg";
import catTermotanques from "@/assets/photos/cat-termotanques.jpg";
import catJardineria from "@/assets/photos/cat-jardineria.jpg";
import catFumigacion from "@/assets/photos/cat-fumigacion.jpg";
import catProfMatematicas from "@/assets/photos/cat-profesor-matematicas.jpg";
import catProfQuimica from "@/assets/photos/cat-profesor-quimica.jpg";
import catProfFisica from "@/assets/photos/cat-profesor-fisica.jpg";
import catProfIngles from "@/assets/photos/cat-profesor-ingles.jpg";
import {
  MapPin, Shield, Star, ChevronDown, Menu, X,
  Zap, Droplets, Wind, Wrench, Paintbrush, MoreHorizontal,
  MessageSquare, Navigation, Clock, Phone, Mail, FileCheck,
  BadgeCheck, AlertTriangle, BarChart3, Smartphone,
  ArrowRight, Briefcase, Car,
  DollarSign,
  Bike, Sparkles, Flame, Leaf, Bug, Calculator, FlaskConical, Atom, Languages,
} from "lucide-react";
import { NAVY, LIME, LIGHT, LogoIcon, LimeBtn, DevStatus } from "../ui/primitives";
import { LegalModal, type LegalTab } from "../legal/LegalModal";

// ─── LANDING ────────────────────────────────────────────────────────────────
function LandingHeader({ onClient, onPro, onAdmin }: { onClient: () => void; onPro: () => void; onAdmin: () => void }) {
  const [open, setOpen] = useState(false);
  const scrollTo = (id: string) => { setOpen(false); document.querySelector(id)?.scrollIntoView({ behavior: "smooth" }); };
  const links = [
    { l: "Servicios", h: "#servicios" }, { l: "Clientes", h: "#clientes" },
    { l: "Profesionales", h: "#profesionales" }, { l: "Seguridad", h: "#seguridad" },
    { l: "Ayuda", h: "#ayuda" }, { l: "Contacto", h: "#contacto" },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <LogoIcon size="md" />
            <span className="text-white font-bold text-lg">MAGIVER</span>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            {links.map(({ l, h }) => (
              <button key={h} onClick={() => scrollTo(h)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{l}</button>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={onPro} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Panel Pro</button>
            <LimeBtn onClick={onClient}>Empezar</LimeBtn>
          </div>
          {/* Cambio 1: botón Menú con label accesible */}
          <button
            aria-label="Menú"
            aria-expanded={open}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-xs font-semibold">{open ? "Cerrar" : "Menú"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t px-4 pb-5" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Sección: navegación */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 px-3 pt-4 pb-2">Secciones</p>
          <nav className="flex flex-col gap-1">
            {links.map(({ l, h }) => (
              <button key={h} onClick={() => scrollTo(h)}
                className="text-left text-sm font-medium text-slate-300 hover:text-white px-3 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between">
                {l}
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            ))}
          </nav>
          {/* Sección: acciones */}
          <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <LimeBtn onClick={() => { setOpen(false); onClient(); }} className="w-full py-3.5">
              <MapPin className="w-4 h-4" />Solicitar servicio
            </LimeBtn>
            <button onClick={() => { setOpen(false); onPro(); }}
              className="w-full py-3.5 rounded-xl border text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}>
              Soy profesional
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function LandingHero({ onClient, onPro, onAdmin }: { onClient: () => void; onPro: () => void; onAdmin: () => void }) {
  return (
    <section
      className="pt-16 min-h-screen flex items-center bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(15,23,42,0.88), rgba(15,23,42,0.94)), url(${heroPhoto})` }}
    >
      {/* Cambio 3: padding inferior extra para separar del siguiente bloque */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-5" style={{ color: LIME }}>Servicios bajo demanda en Bolivia</span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6" style={{ letterSpacing: "-0.02em" }}>
              Conectamos{" "}
              <span className="block">personas que </span>
              <span className="block" style={{ color: LIME }}>resuelven.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Encuentra profesionales verificados cerca de ti para trabajos técnicos, mantenimiento, mano de obra y soluciones del día a día.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <LimeBtn onClick={onClient} className="text-base px-8 py-3.5">
                <MapPin className="w-4 h-4" />Solicitar servicio
              </LimeBtn>
              <button onClick={onPro}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base border-2 transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
                Soy profesional
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {[["15+", "categorías"], ["GPS", "cercano"], ["24/7", "emergencias"]].map(([v, l]) => (
                <div key={v} className="flex items-center gap-2 px-4 py-2 rounded-full border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" }}>
                  <span className="font-bold text-sm" style={{ color: LIME }}>{v}</span>
                  <span className="text-slate-400 text-sm">{l}</span>
                </div>
              ))}
            </div>
            {/* Cambio 2: bloque admin eliminado del hero — movido al footer */}
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="flex items-center gap-2">
                  <LogoIcon size="sm" />
                  <span className="text-white font-bold text-sm">MAGIVER</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: LIME, color: NAVY }}>Disponible</span>
              </div>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E7EB" }}>
                <p className="text-xs text-slate-400 mb-1">¿Qué servicio necesitas?</p>
                <p className="font-semibold text-slate-800 text-sm">Electricista cerca de Equipetrol</p>
              </div>
              <div className="relative h-44 overflow-hidden" style={{ background: "#EEF7EE" }}>
                <svg className="absolute inset-0 w-full h-full opacity-25"><defs><pattern id="g2" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#4CAF50" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#g2)" /></svg>
                <svg className="absolute inset-0 w-full h-full"><line x1="48%" y1="72%" x2="76%" y2="28%" stroke={LIME} strokeWidth="2.5" strokeLinecap="round" /></svg>
                <div className="absolute flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs shadow-lg" style={{ background: LIME, color: NAVY, left: "44%", top: "62%", transform: "translate(-50%,-50%)" }}>Tú</div>
                <div className="absolute flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs shadow-lg text-white" style={{ background: NAVY, left: "72%", top: "22%", transform: "translate(-50%,-50%)" }}>4.9</div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#3B82F6" }}>CR</div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Carlos Rojas</p>
                    <p className="text-xs text-slate-500">Electricista verificado · 1.0 km</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-green-600">12 min</p>
                  <div className="flex items-center gap-0.5 justify-end"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs text-slate-500">4.9</span></div>
                </div>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={onClient} className="flex-1 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all" style={{ background: LIME, color: NAVY }}>Solicitar ahora</button>
                <button onClick={onPro} className="flex-1 py-2 rounded-xl text-xs font-bold border hover:bg-slate-50" style={{ borderColor: "#E5E7EB", color: NAVY }}>Soy profesional</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingServices({ onClient }: { onClient: () => void }) {
  const cats = [
    { icon: Zap, title: "Electricista", desc: "Instalaciones, reparaciones y mantenimiento eléctrico.", photo: catElectricista },
    { icon: Droplets, title: "Plomero", desc: "Tuberías, filtraciones e instalación sanitaria.", photo: catPlomero },
    { icon: Wind, title: "Aire acondicionado", desc: "Instalación, limpieza y reparación de equipos.", photo: catAire },
    { icon: Wrench, title: "Albañil", desc: "Construcción, remodelación y trabajos civiles.", photo: catAlbanil },
    { icon: Paintbrush, title: "Pintor", desc: "Pintura interior, exterior y decorativa.", photo: catPintor },
    { icon: Bike, title: "Mecánico de motos", desc: "Reparación y mantenimiento de motocicletas.", photo: catMecanicoMotos },
    { icon: Car, title: "Mecánico de autos", desc: "Diagnóstico, reparación y mantenimiento automotriz.", photo: catMecanicoAutos },
    { icon: Sparkles, title: "Lavado de autos", desc: "Lavado exterior, interior y encerado a domicilio.", photo: catLavadoAutos },
    { icon: Flame, title: "Termotanques", desc: "Instalación y reparación de calefones y termotanques.", photo: catTermotanques },
    { icon: Leaf, title: "Jardinería", desc: "Poda, mantenimiento de jardines y áreas verdes.", photo: catJardineria },
    { icon: Bug, title: "Fumigación", desc: "Control de plagas para el hogar y el jardín.", photo: catFumigacion },
    { icon: Calculator, title: "Profesor de Matemáticas", desc: "Clases particulares para colegio y universidad.", photo: catProfMatematicas },
    { icon: FlaskConical, title: "Profesor de Química", desc: "Clases particulares de química para todo nivel.", photo: catProfQuimica },
    { icon: Atom, title: "Profesor de Física", desc: "Clases particulares de física para todo nivel.", photo: catProfFisica },
    { icon: Languages, title: "Profesor de Inglés", desc: "Clases particulares de inglés para todo nivel.", photo: catProfIngles },
    { icon: MoreHorizontal, title: "Otros servicios", desc: "Carpintería, cerrajería y más.", photo: undefined },
  ];
  return (
    <section id="servicios" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Categorías</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            Todo lo que necesitas,{" "}
            <span className="block">en un solo lugar.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {cats.map(c => (
            <div key={c.title} onClick={onClient} className="bg-white rounded-2xl overflow-hidden border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
              {c.photo && (
                <div className="h-36 overflow-hidden">
                  <img src={c.photo} alt={c.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#F0FDF4" }}><c.icon className="w-6 h-6" style={{ color: "#16A34A" }} /></div>
                <h3 className="font-bold text-lg mb-1.5" style={{ color: NAVY }}>{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">{c.desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}>Ver profesionales <ArrowRight className="w-3 h-3" /></div>
              </div>
            </div>
          ))}
        </div>
        {/* Cambio 4: CTA general después de las categorías */}
        <div className="text-center">
          <LimeBtn onClick={onClient} className="text-base px-10 py-4">
            <MapPin className="w-4 h-4" />Solicitar un servicio ahora
          </LimeBtn>
          <p className="text-slate-400 text-sm mt-3">Sin registro previo · Profesionales verificados · GPS cercano</p>
        </div>
      </div>
    </section>
  );
}

function LandingClients({ onClient }: { onClient: () => void }) {
  const steps = [
    { n: "01", title: "Elige tu servicio", desc: "Selecciona la categoría. MAGIVER detecta tu ubicación y busca profesionales disponibles." },
    { n: "02", title: "Notificamos al profesional", desc: "En segundos, los profesionales cercanos verificados reciben tu solicitud." },
    { n: "03", title: "Contrata, chatea y califica", desc: "Coordina el trabajo y precio en el chat, sigue el trabajo en tiempo real y califica." },
  ];
  return (
    <section id="clientes" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Para clientes</span>
            <h2 className="text-4xl sm:text-5xl font-black mb-6" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Tres pasos.{" "}
              <span className="block">Un profesional.</span>
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">Sin llamadas interminables. MAGIVER conecta con el profesional indicado en minutos.</p>
            <LimeBtn onClick={onClient} className="text-base px-8 py-3.5">Solicitar servicio ahora</LimeBtn>
          </div>
          <div className="flex flex-col gap-5">
            {steps.map(s => (
              <div key={s.n} className="flex gap-5 p-5 rounded-2xl border hover:shadow-md transition-all" style={{ borderColor: "#E5E7EB" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: NAVY, color: LIME }}>{s.n}</div>
                <div><h3 className="font-bold text-base mb-1" style={{ color: NAVY }}>{s.title}</h3><p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingPros({ onPro }: { onPro: () => void }) {
  // Cambio 5: mensaje reforzado sobre solicitudes reales cercanas
  const benefits = [
    { icon: BadgeCheck, title: "Perfil verificado", desc: "Tu identidad y documentos validados dan confianza real a los clientes." },
    { icon: Navigation, title: "Solicitudes reales cerca tuyo", desc: "Recibe notificaciones de trabajos disponibles en tu zona según tu GPS." },
    { icon: BarChart3, title: "Panel de control", desc: "Gestiona tu agenda, historial de trabajos y calificaciones desde un solo lugar." },
    { icon: MessageSquare, title: "Chat directo", desc: "Coordina el trabajo y el precio de forma segura con el cliente." },
  ];
  return (
    <section id="profesionales" className="py-24" style={{ background: NAVY }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Para profesionales</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            Recibe solicitudes reales{" "}
            <span className="block">cerca de tu zona.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Únete a la red de profesionales verificados de MAGIVER y accede a clientes que ya están buscando tu servicio cerca de ti, sin intermediarios y sin cuotas.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-10">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
            <img src={prosPhoto} alt="Cliente satisfecho supervisando el trabajo de un plomero de MAGIVER" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.35), rgba(15,23,42,0) 35%)" }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
          {benefits.map(b => (
            <div key={b.title} className="p-6 rounded-2xl border hover:border-lime-400/40 hover:-translate-y-0.5 transition-all" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(132,204,22,0.15)" }}><b.icon className="w-5 h-5" style={{ color: LIME }} /></div>
              <h3 className="font-bold text-white mb-2">{b.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
          </div>
        </div>
        <div className="text-center"><LimeBtn onClick={onPro} className="text-base px-8 py-3.5"><Briefcase className="w-4 h-4" />Registrarme como profesional</LimeBtn></div>
      </div>
    </section>
  );
}

function LandingSecurity() {
  // Cambio 6: agregada tarjeta de presupuesto confirmado
  const items = [
    { icon: FileCheck, title: "Carnet verificado", desc: "CI presentado y validado antes de activar el perfil.", bg: "#EFF6FF", color: "#3B82F6" },
    { icon: BadgeCheck, title: "Certificados y licencias", desc: "Validación de certificaciones técnicas opcionales.", bg: "#F0FDF4", color: "#16A34A" },
    { icon: DollarSign, title: "Presupuesto antes de empezar", desc: "El cliente y el profesional acuerdan el precio por chat antes de iniciar cualquier trabajo. Sin sorpresas.", bg: "#F7FEE7", color: "#65A30D" },
    { icon: Star, title: "Calificaciones reales", desc: "Solo clientes con servicio completado pueden dejar reseña.", bg: "#FFFBEB", color: "#D97706" },
    { icon: AlertTriangle, title: "Sistema de reportes", desc: "Reporte de conductas con revisión humana garantizada.", bg: "#FEF2F2", color: "#EF4444" },
    { icon: Shield, title: "Historial transparente", desc: "Historial completo de servicios, calificaciones y antecedentes.", bg: "#F5F3FF", color: "#7C3AED" },
    { icon: Clock, title: "Soporte 24/7", desc: "Atención disponible para emergencias urgentes.", bg: "#FFF1F2", color: "#E11D48" },
    { icon: MessageSquare, title: "Chat seguro", desc: "Las conversaciones quedan registradas dentro de la plataforma para respaldo de ambas partes.", bg: "#F0FDFA", color: "#0891B2" },
  ];
  return (
    <section id="seguridad" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Seguridad</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            Confianza verificada{" "}
            <span className="block">en cada servicio.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Cada profesional es verificado, cada precio es acordado y cada trabajo queda registrado.
          </p>
        </div>
        {/* Banner destacado de presupuesto */}
        <div className="flex items-start gap-4 p-5 rounded-2xl border-2 mb-10"
          style={{ borderColor: "#84CC16", background: "#F7FEE7" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#ECFCCB" }}>
            <DollarSign className="w-6 h-6" style={{ color: "#65A30D" }} />
          </div>
          <div>
            <p className="font-bold text-base mb-1" style={{ color: NAVY }}>Presupuesto acordado antes de empezar</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              En MAGIVER el cliente y el profesional conversan y acuerdan el precio por chat <strong>antes</strong> de que comience cualquier trabajo. Sin costos ocultos, sin sorpresas al final.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-5 border hover:shadow-md hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: item.bg }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1.5" style={{ color: NAVY }}>{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "¿Cómo funciona el modelo marketplace?", a: "Los clientes publican una solicitud y profesionales verificados cercanos la reciben. El cliente elige con quién trabajar según perfil, calificación y distancia." },
    { q: "¿Cómo se coordina el precio del trabajo?", a: "El precio se coordina directamente entre el cliente y el profesional a través del chat de MAGIVER. Cada trabajo es único y el acuerdo es libre entre las partes." },
    { q: "¿Cómo se verifica a los profesionales?", a: "Cada profesional sube su CI (anverso, reverso y selfie) y certificados opcionales. Un administrador MAGIVER revisa y aprueba manualmente cada solicitud." },
    { q: "¿Qué pasa en caso de emergencia?", a: "MAGIVER tiene disponibilidad 24/7 con soporte humano en todo momento." },
    { q: "¿Hay costo para registrarme como profesional?", a: "El registro básico es gratuito. MAGIVER opera bajo comisión por servicio completado, sin cuotas mensuales." },
  ];
  return (
    <section id="ayuda" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Ayuda</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            Preguntas{" "}
            <span className="block">frecuentes.</span>
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="font-semibold text-sm pr-4" style={{ color: NAVY }}>{f.q}</span>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} style={{ color: open === i ? LIME : "#94A3B8" }} />
              </button>
              {open === i && <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t" style={{ borderColor: "#F1F5F9" }}>{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Cambio 7: dos caminos claros en contacto
function LandingContact() {
  return (
    <section id="contacto" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4" style={{ color: LIME }}>Contacto</span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
            ¿Tenés dudas?{" "}
            <span className="block">Escribinos.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">Para solicitar un servicio o registrarte como profesional, usá los botones de arriba — acá te dejamos cómo contactarnos directamente.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-10 border-t" style={{ borderColor: "#E5E7EB" }}>
          {[{ icon: Mail, t: "contacto@magiver.com" }, { icon: Phone, t: "+591 700 00000" }, { icon: MapPin, t: "Santa Cruz de la Sierra, Bolivia" }].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-2 text-slate-400 text-sm">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />{t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFooter({ onClient, onPro, onAdmin }: { onClient: () => void; onPro: () => void; onAdmin: () => void }) {
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);

  return (
    <footer className="pt-14 pb-8 border-t" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.08)" }}>
      {legalTab && <LegalModal defaultTab={legalTab} onClose={() => setLegalTab(null)} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoIcon size="md" />
              <span className="text-white font-bold text-lg">MAGIVER</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">Conectamos personas que resuelven. Siempre existe alguien capaz de ayudarte.</p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Plataforma</p>
            {["Servicios", "Clientes", "Profesionales"].map(l => (
              <button key={l} onClick={() => document.querySelector(`#${l.toLowerCase()}`)?.scrollIntoView({ behavior: "smooth" })} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">{l}</button>
            ))}
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Acceso</p>
            <button onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">Solicitar un servicio</button>
            <button onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">Registrarme como profesional</button>
            <button onClick={onPro} className="block text-slate-400 hover:text-white text-sm mb-2 transition-colors">Panel Profesional</button>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Descargar app</p>
            {["App Store", "Google Play"].map(s => (
              <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 cursor-pointer hover:border-lime-400/30 transition-colors" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <Smartphone className="w-4 h-4" style={{ color: LIME }} /><span className="text-white text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar con legales y admin */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-slate-500 text-xs">© 2025 MAGIVER. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <button
              onClick={() => setLegalTab("cliente")}
              className="text-slate-400 hover:text-white text-xs transition-colors">
              Términos y Condiciones
            </button>
            <button
              onClick={() => setLegalTab("privacidad")}
              className="text-slate-400 hover:text-white text-xs transition-colors">
              Política de Privacidad
            </button>
            <button
              onClick={onAdmin}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs transition-colors">
              <Shield className="w-3 h-3" />Acceso administrador
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE: Landing (/) ────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();

  // Hash tracking: update URL as user scrolls — feeds GA4 page_view events
  useEffect(() => {
    const ids = ["servicios", "clientes", "profesionales", "seguridad", "ayuda", "contacto"];
    const observers: IntersectionObserver[] = [];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) history.replaceState(null, "", `/#${id}`); },
        { threshold: 0.35, rootMargin: "-10% 0px -45% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    // Reset to / when scrolled back to top
    const heroObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) history.replaceState(null, "", "/"); },
      { threshold: 0.1 },
    );
    const hero = document.getElementById("hero-top");
    if (hero) { heroObs.observe(hero); observers.push(heroObs as IntersectionObserver); }
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <DevStatus />
      <LandingHeader
        onClient={() => navigate("/cliente")}
        onPro={() => navigate("/profesional")}
        onAdmin={() => navigate("/admin")}
      />
      <main>
        <div id="hero-top">
          <LandingHero
            onClient={() => navigate("/cliente")}
            onPro={() => navigate("/profesional")}
            onAdmin={() => navigate("/admin")}
          />
        </div>
        <LandingServices onClient={() => navigate("/cliente")} />
        <LandingClients onClient={() => navigate("/cliente")} />
        <LandingPros onPro={() => navigate("/profesional")} />
        <LandingSecurity />
        <LandingFAQ />
        <LandingContact />
      </main>
      <LandingFooter
        onClient={() => navigate("/cliente")}
        onPro={() => navigate("/profesional")}
        onAdmin={() => navigate("/admin")}
      />
    </div>
  );
}
