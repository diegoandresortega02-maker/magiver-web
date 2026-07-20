import { useState, useEffect } from "react";
import { config } from "@/lib/config";
import { getNearbyProfessionals, createServiceRequest, updateJobStatus, getProfessionalById, subscribeToJobChanges, getJobById, getActiveRequestsForClient } from "@/lib/api";
import type { GeoPoint, ServiceRequest as ApiServiceRequest } from "@/lib/types";
import {
  MapPin, Star, BadgeCheck, Clock, MessageSquare, Send, ArrowRight,
  Loader2, AlertCircle, Edit3, Zap, X, Search,
} from "lucide-react";
import { NAVY, LIME, LIGHT, AppHeader, ScreenWrap, ProAvatar, LimeBtn, DangerBtn, Card, StatusBadge } from "../ui/primitives";
import { LiveMap, RealMap } from "../maps/RealMap";
import { reverseGeocode } from "../maps/googleMaps";
import { SERVICES, PROFESSIONALS, proUserToProfessional, specialtyLabel, apiStatusToLocal, PLACE_TYPES } from "../lib.local/mappers";
import { subscribeToPushNotifications } from "../hooks/usePushSubscription";
import type { ClientUser, Professional, ServiceRequest } from "../types.local";

// Centro de Santa Cruz de la Sierra — fallback cuando no hay GPS del cliente
// (permiso denegado, o el navegador todavía no resolvió la ubicación).
const SANTA_CRUZ_CENTER: GeoPoint = { lat: -17.785, lng: -63.181 };

// ─── CLIENT SERVICES ─────────────────────────────────────────────────────────
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ClientServices({ user, clientLocation, onSelect, onProfile, onViewActiveRequests, onBack }: { user: ClientUser; clientLocation?: GeoPoint | null; onSelect: (s: string) => void; onProfile: () => void; onViewActiveRequests: () => void; onBack: () => void }) {
  const [activeCount, setActiveCount] = useState(0);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (config.MOCK_MODE || !user.id) return;
    getActiveRequestsForClient(user.id).then(reqs => {
      setActiveCount(reqs.length);
      setActiveCategories(reqs.map(r => specialtyLabel(r.category)));
    }).catch(() => {});
  }, [user.id]);
  const visibleServices = SERVICES.filter(s => normalize(s.label).includes(normalize(query)));
  return (
    <ScreenWrap>
      <AppHeader title="MAGIVER" onBack={onBack}
        right={<button onClick={onProfile} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white hover:opacity-80 transition-colors" style={{ background: "#3B82F6" }}>{user.name[0]}</button>}
      />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-6"><h2 className="text-2xl font-black mb-1" style={{ color: NAVY }}>¿Qué necesitas, {user.name.split(" ")[0]}?</h2><p className="text-slate-500 text-sm">Selecciona el tipo de servicio</p></div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-4 bg-white" style={{ borderColor: "#E5E7EB" }}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
          <span className="text-sm text-slate-600 flex-1">{clientLocation ? `${clientLocation.lat.toFixed(4)}, ${clientLocation.lng.toFixed(4)}` : "Santa Cruz de la Sierra (aprox.)"}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: clientLocation ? "#F0FDF4" : "#FEF3C7", color: clientLocation ? "#16A34A" : "#B45309" }}>{clientLocation ? "GPS activo" : "Ubicación aprox."}</span>
        </div>
        {activeCount > 0 && (
          <button onClick={onViewActiveRequests} className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 mb-6 text-left" style={{ borderColor: LIME, background: "#F7FEE7" }}>
            <div>
              <p className="font-bold text-sm" style={{ color: NAVY }}>Tienes {activeCount} solicitud{activeCount > 1 ? "es" : ""} en curso</p>
              <p className="text-xs text-slate-500 mt-0.5">{activeCategories.join(" · ")}</p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
          </button>
        )}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar servicio (plomero, pintor...)"
            className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} />
        </div>
        {visibleServices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No encontramos ese servicio.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visibleServices.map(svc => (
              <div key={svc.id} onClick={() => onSelect(svc.label)} className="bg-white rounded-2xl p-4 border cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" style={{ borderColor: "#E5E7EB" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: svc.color + "1A" }}><svc.icon className="w-6 h-6" style={{ color: svc.color }} /></div>
                <p className="font-bold text-sm" style={{ color: NAVY }}>{svc.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT ACTIVE REQUESTS (listado de solicitudes en curso) ────────────────
export function ClientActiveRequests({ user, onSelect, onBack }: {
  user: ClientUser;
  onSelect: (req: ApiServiceRequest & { professionalName?: string }) => void;
  onBack: () => void;
}) {
  const [requests, setRequests] = useState<(ApiServiceRequest & { professionalName?: string })[]>([]);
  const [loading, setLoading] = useState(!config.MOCK_MODE);
  useEffect(() => {
    if (config.MOCK_MODE || !user.id) return;
    getActiveRequestsForClient(user.id).then(setRequests).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);
  return (
    <ScreenWrap>
      <AppHeader title="Solicitudes en curso" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No tienes solicitudes en curso.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map(req => (
              <Card key={req.id} onClick={() => onSelect(req)}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm" style={{ color: NAVY }}>{specialtyLabel(req.category)}</p>
                  <StatusBadge status={apiStatusToLocal(req.status)} />
                </div>
                <p className="text-xs text-slate-500">{req.professionalName ? `${req.professionalName} · ` : ""}{[req.address.street, req.address.zone].filter(Boolean).join(", ")}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT MAP ───────────────────────────────────────────────────────────────
export function ClientMap({ service, clientLocation, onRequest, onBack }: { service: string; clientLocation?: GeoPoint | null; onRequest: (pro: Professional) => void; onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const selectedPro = professionals.find(p => p.id === selectedId);

  useEffect(() => {
    if (config.MOCK_MODE) { setProfessionals(PROFESSIONALS); setLoading(false); return; }
    const categoryId = SERVICES.find(s => s.label === service)?.id;
    const location = clientLocation ?? SANTA_CRUZ_CENTER;
    setLoading(true);
    setLoadError("");
    getNearbyProfessionals({ location, category: categoryId as any })
      .then(pros => setProfessionals(pros.map((p, i) => proUserToProfessional(p, i, location))))
      .catch((err: any) => setLoadError(err?.message || "No se pudieron cargar los profesionales."))
      .finally(() => setLoading(false));
  }, [service, clientLocation]);

  return (
    <ScreenWrap>
      <AppHeader title={service} onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <LiveMap markers={[
            ...(clientLocation ? [{ id: "yo", lat: clientLocation.lat, lng: clientLocation.lng, label: "Tú", color: LIME, labelColor: NAVY }] : []),
            ...professionals.filter(p => p.location).map(p => ({ id: p.id, lat: p.location!.lat, lng: p.location!.lng, label: p.initials, color: p.color })),
          ]} />
        </div>
        <div className="px-4 pb-4">
          {loading && <p className="text-sm text-slate-400 text-center py-8">Buscando profesionales cerca...</p>}
          {!loading && loadError && <p className="text-sm text-red-500 text-center py-8">{loadError}</p>}
          {!loading && !loadError && professionals.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Todavía no hay profesionales verificados en esta categoría.</p>
          )}
          {!loading && professionals.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{professionals.length} profesionales disponibles cerca</p>
          )}
          <div className="flex flex-col gap-3">
            {professionals.map(pro => (
              <div key={pro.id} onClick={() => { setSelectedId(pro.id); setShowProfile(true); }}
                className="bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all"
                style={{ borderColor: selectedId === pro.id ? LIME : "#E5E7EB", outline: selectedId === pro.id ? `2px solid ${LIME}` : "none" }}>
                <div className="flex items-center gap-3">
                  <ProAvatar pro={pro} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5"><p className="font-bold text-sm" style={{ color: NAVY }}>{pro.name}</p>{pro.verified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}</div>
                    <p className="text-xs text-slate-500">{pro.specialty} · {pro.distance} km · {pro.jobs} trabajos</p>
                    <div className="flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs font-semibold text-slate-700">{pro.rating}</span><span className="text-xs text-slate-400">({pro.reviews})</span></div>
                  </div>
                  <div className="text-right flex-shrink-0"><p className="text-green-600 font-bold text-sm">{pro.eta} min</p><p className="text-xs text-slate-400">Disponible</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showProfile && selectedPro && (
        <div className="absolute inset-0 bg-black/40 z-10 flex items-end" onClick={() => setShowProfile(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-6" />
            <div className="flex items-start gap-4 mb-5">
              <ProAvatar pro={selectedPro} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><h3 className="font-black text-xl" style={{ color: NAVY }}>{selectedPro.name}</h3>{selectedPro.verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}</div>
                <p className="text-slate-500 text-sm mb-2">{selectedPro.specialty}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{selectedPro.rating}</span><span className="text-slate-400">({selectedPro.reviews})</span></div>
                  <div className="flex items-center gap-1 text-slate-500"><MapPin className="w-4 h-4" style={{ color: LIME }} />{selectedPro.distance} km</div>
                  <div className="flex items-center gap-1 text-green-600"><Clock className="w-4 h-4" />{selectedPro.eta} min</div>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">{selectedPro.bio}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[["Trabajos", String(selectedPro.jobs)], ["Calificación", String(selectedPro.rating)], ["Disponible", "Ahora"]].map(([l, v]) => (
                <div key={l} className="text-center p-3 rounded-xl" style={{ background: LIGHT }}><p className="font-black text-lg" style={{ color: NAVY }}>{v}</p><p className="text-xs text-slate-500">{l}</p></div>
              ))}
            </div>
            <LimeBtn onClick={() => { setShowProfile(false); onRequest(selectedPro); }} className="w-full py-4 text-base">Solicitar a {selectedPro.name.split(" ")[0]} <ArrowRight className="w-4 h-4" /></LimeBtn>
          </div>
        </div>
      )}
    </ScreenWrap>
  );
}

// ─── CLIENT REQUEST ───────────────────────────────────────────────────────────
export function ClientRequest({ service, clientLocation, onSubmit, onBack }: { service: string; clientLocation?: GeoPoint | null; onSubmit: (req: ServiceRequest) => void; onBack: () => void }) {
  const [desc, setDesc] = useState(""); const [addr, setAddr] = useState("Calle Los Pinos #342, Equipetrol");
  const [addrEdited, setAddrEdited] = useState(false);
  const [addrNumber, setAddrNumber] = useState("");
  const [placeType, setPlaceType] = useState<string>("");
  const [detectingAddr, setDetectingAddr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Posición exacta a usar para la solicitud: arranca en el GPS detectado,
  // pero el cliente puede arrastrar el pin o tocar el mapa para ajustarla
  // (por si el servicio es para otra dirección).
  // Arranca en el GPS si ya lo tenemos, o si no en el centro de Santa Cruz —
  // así el mapa (y la posibilidad de mover el pin a mano) siempre aparece,
  // en vez de quedar oculto en silencio cuando el navegador todavía no
  // resolvió el permiso de ubicación o el usuario lo denegó.
  const [pinLocation, setPinLocation] = useState<GeoPoint | null>(clientLocation ?? SANTA_CRUZ_CENTER);
  useEffect(() => {
    // Si el GPS llega después del primer render, reemplaza el centro
    // genérico por la posición real — pero solo si el cliente todavía no
    // movió el pin a mano (para no pisarle un ajuste ya hecho).
    if (clientLocation && pinLocation === SANTA_CRUZ_CENTER) setPinLocation(clientLocation);
  }, [clientLocation]);
  const handlePinChange = (lat: number, lng: number) => {
    setPinLocation({ lat, lng });
    setAddrEdited(false); // mover el pin siempre refresca la dirección detectada
  };
  // Detecta la dirección real a partir del pin (GPS al inicio, o donde el
  // cliente lo haya movido) — se puede editar el texto directamente también.
  useEffect(() => {
    if (!pinLocation || addrEdited) return;
    let active = true;
    setDetectingAddr(true);
    reverseGeocode(pinLocation.lat, pinLocation.lng).then(address => {
      if (active && address) setAddr(address);
    }).finally(() => { if (active) setDetectingAddr(false); });
    return () => { active = false; };
  }, [pinLocation?.lat, pinLocation?.lng]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;
    setError("");
    setLoading(true);
    try {
      if (config.MOCK_MODE) {
        await new Promise(r => setTimeout(r, 800));
        onSubmit({ id: `req-${Date.now()}`, service, description: desc, address: addr, lat: pinLocation?.lat, lng: pinLocation?.lng, addressNumber: addrNumber || undefined, placeType: placeType || undefined });
        return;
      }
      const categoryId = (SERVICES.find(s => s.label === service)?.id ?? "otro") as any;
      const location = pinLocation ?? SANTA_CRUZ_CENTER;
      const real = await createServiceRequest({
        category: categoryId, description: desc,
        address: { street: addr, zone: "", city: "Santa Cruz de la Sierra", lat: location.lat, lng: location.lng, number: addrNumber || undefined, placeType: (placeType || undefined) as any },
      });
      subscribeToPushNotifications();
      onSubmit({ id: real.id, service, description: desc, address: addr, lat: location.lat, lng: location.lng, addressNumber: addrNumber || undefined, placeType: placeType || undefined });
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrap>
      <AppHeader title="Detalles del servicio" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 p-4 rounded-xl border flex items-center gap-2" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "#16A34A" }} />
          <p className="text-xs text-green-800">Vamos a avisarle a los profesionales de <strong>{service}</strong> más cercanos a tu zona.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Descripción del trabajo</label>
            <textarea placeholder="Describe qué necesitas. Ej: 'El tomacorriente del cuarto ya no funciona...'" value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none" style={{ borderColor: "#E5E7EB", color: NAVY }} required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Ubicación del servicio</label>
            {!clientLocation && (
              <div className="mb-3 p-3 rounded-xl border flex items-start gap-2" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#B45309" }} />
                <p className="text-xs" style={{ color: "#92400E" }}>No pudimos detectar tu ubicación real (revisa el permiso de ubicación). El pin de abajo está en un punto genérico de Santa Cruz — <strong>arrástralo hasta tu dirección real</strong> antes de enviar.</p>
              </div>
            )}
            {pinLocation && config.MAPS_API_KEY && (
              <div className="relative mb-3">
                <RealMap
                  zoom={16}
                  markers={[{ id: "pin", lat: pinLocation.lat, lng: pinLocation.lng, label: "", color: LIME, draggable: true }]}
                  onMarkerDragEnd={(_id, lat, lng) => handlePinChange(lat, lng)}
                  onMapClick={(lat, lng) => handlePinChange(lat, lng)}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(15,23,42,0.85)", color: "#fff" }}>
                  <Edit3 className="w-3.5 h-3.5" style={{ color: LIME }} />
                  Arrastra el pin o toca el mapa para ajustar
                </div>
              </div>
            )}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={addr} onChange={e => { setAddr(e.target.value); setAddrEdited(true); }} className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} required />
              {detectingAddr && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
            </div>
            <p className="text-xs text-slate-400 mt-1">{clientLocation ? "Detectada con tu GPS — ajusta el pin o edita el texto si es para otro lugar." : "Escribe la dirección exacta."}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Número de casa/depto (opcional)</label>
            <input type="text" placeholder="Ej. Casa 12, Depto 3B, Piso 2..." value={addrNumber} onChange={e => setAddrNumber(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB", color: NAVY }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: NAVY }}>Tipo de lugar (opcional)</label>
            <div className="grid grid-cols-4 gap-2">
              {PLACE_TYPES.map(pt => {
                const checked = placeType === pt.id;
                const Icon = pt.icon;
                return (
                  <button key={pt.id} type="button" onClick={() => setPlaceType(checked ? "" : pt.id)}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 text-center transition-colors"
                    style={{ borderColor: checked ? LIME : "#E5E7EB", background: checked ? "#F7FEE7" : "#fff" }}>
                    <Icon className="w-4 h-4" style={{ color: checked ? "#4D7C0F" : "#94A3B8" }} />
                    <span className="text-xs leading-tight" style={{ color: checked ? NAVY : "#64748B" }}>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <div className="flex items-start gap-2"><MessageSquare className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-amber-700 leading-relaxed">El precio se coordina directamente entre tú y el profesional a través del chat.</p></div>
          </div>
          {error && (
            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </p>
          )}
          <LimeBtn type="submit" disabled={loading || !desc} className="w-full py-4 text-base">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <>Confirmar solicitud <Send className="w-4 h-4" /></>}
          </LimeBtn>
        </form>
      </div>
    </ScreenWrap>
  );
}

// ─── CLIENT SEARCHING ─────────────────────────────────────────────────────────
export function ClientSearching({ requestId, notice, onDismissNotice, onMatched, onCancel }: {
  requestId: string; notice?: string; onDismissNotice?: () => void; onMatched: (pro: Professional) => void; onCancel: () => void;
}) {
  const [radiusKm, setRadiusKm] = useState(3);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (config.MOCK_MODE) {
      const t = setTimeout(() => {
        getProfessionalById("pro-001").then(u => onMatched(proUserToProfessional(u, 0)));
      }, 3000);
      return () => clearTimeout(t);
    }
    let active = true;
    const checkCurrentStatus = () => {
      getJobById(requestId).then(r => {
        if (!active) return;
        if (r.searchRadiusKm != null) setRadiusKm(r.searchRadiusKm);
        if (r.professionalId) {
          getProfessionalById(r.professionalId).then(u => onMatched(proUserToProfessional(u, 0))).catch(() => {});
        }
      }).catch(() => {});
    };
    checkCurrentStatus();
    const unsubscribe = subscribeToJobChanges(requestId, row => {
      if (row.searchRadiusKm != null) setRadiusKm(row.searchRadiusKm);
      if (row.professionalId) {
        getProfessionalById(row.professionalId).then(u => onMatched(proUserToProfessional(u, 0))).catch(() => {});
      }
    });
    // La conexión Realtime se pausa mientras la app está en segundo plano
    // (o la pestaña oculta) — sin este chequeo, un profesional que acepta
    // justo en ese momento se pierde y la pantalla queda "buscando" para
    // siempre hasta que el cliente cancele y vuelva a pedir.
    const onVisible = () => { if (document.visibilityState === "visible") checkCurrentStatus(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; unsubscribe(); document.removeEventListener("visibilitychange", onVisible); };
  }, [requestId]);

  const handleCancel = async () => {
    setCancelling(true); setCancelError("");
    try {
      if (!config.MOCK_MODE) await updateJobStatus(requestId, "cancelled");
      onCancel();
    } catch (err: any) {
      setCancelError(err?.message || "No se pudo cancelar. Intenta de nuevo.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <ScreenWrap>
      <AppHeader title="Buscando profesional" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {notice && (
          <div className="w-full flex items-start gap-2 p-3.5 rounded-xl border mb-6 text-left" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed flex-1">{notice}</p>
            {onDismissNotice && <button onClick={onDismissNotice} className="text-amber-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>}
          </div>
        )}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-lime-200 flex items-center justify-center" style={{ borderTopColor: LIME, animation: "spin 1.2s linear infinite" }}>
            <Loader2 className="w-8 h-8" style={{ color: LIME }} />
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>Notificando a profesionales...</h2>
        <p className="text-slate-500 text-sm mb-2">Buscando disponibilidad en un radio de {radiusKm} km</p>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8"><Loader2 className="w-4 h-4 animate-spin" />Esperando que alguien acepte...</div>
        {cancelError && (
          <p className="text-xs font-medium flex items-center gap-1.5 mb-4" style={{ color: "#EF4444" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{cancelError}
          </p>
        )}
        <DangerBtn onClick={handleCancel} disabled={cancelling} className="px-8 py-3">
          {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" />Cancelando...</> : "Cancelar búsqueda"}
        </DangerBtn>
      </div>
    </ScreenWrap>
  );
}
