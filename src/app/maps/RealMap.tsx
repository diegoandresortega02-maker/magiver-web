import { useState, useEffect, useRef } from "react";
import { NAVY } from "../ui/primitives";
import { loadGoogleMaps, getMapsApiKey, MINIMAL_MAP_STYLE } from "./googleMaps";
import { MapView, type MapMarker } from "./MapView";

// "yo" es el id que usan todas las pantallas para el marcador de la propia
// posición del usuario (ver ProJobFlow.tsx / ClientTracking.tsx /
// ClientJobFlow.tsx) — ese marcador se dibuja distinto (estilo "punto
// azul" de Google Maps) al resto, que son pines de la otra parte/dirección.
const SELF_MARKER_ID = "yo";

// Pin normal: anillo de color (identidad) + placa blanca interior con las
// iniciales en un color que siempre contrasta bien, sin depender de qué
// tan clara u oscura sea la variante de color del marcador.
function pinIconUrl(color: string, label: string, labelColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="${color}" stroke="#fff" stroke-width="3"/>
    <circle cx="20" cy="20" r="9.5" fill="#fff"/>
    <text x="20" y="21" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="${labelColor}">${label}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// Marcador de "mi posición": un punto sólido con anillo blanco, más un
// cono de dirección semitransparente que rota según hacia dónde apunta el
// teléfono (misma idea que el "punto azul" de Google Maps/Uber/Yango).
function selfIconUrl(color: string, heading: number | null): string {
  const cone = heading != null
    ? `<path d="M20 2 L29 18 L20 13 L11 18 Z" fill="${color}" opacity="0.35" transform="rotate(${heading} 20 20)"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    ${cone}
    <circle cx="20" cy="20" r="8" fill="${color}" stroke="#fff" stroke-width="3"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

export function RealMap({ markers, zoom = 14, heading, onMarkerDragEnd, onMapClick }: {
  markers: MapMarker[]; zoom?: number; heading?: number | null;
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const markersKey = markers.map(m => `${m.id}:${m.lat.toFixed(5)},${m.lng.toFixed(5)}:${m.draggable ? 1 : 0}`).join("|");
  const onMarkerDragEndRef = useRef(onMarkerDragEnd);
  onMarkerDragEndRef.current = onMarkerDragEnd;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const mapRef = useRef<any>(null);
  const markerInstancesRef = useRef<Record<string, any>>({});
  const boundsFittedRef = useRef(false);
  const hasMarkers = markers.length > 0;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(getMapsApiKey())
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  // El mapa se crea UNA sola vez (apenas hay al menos un marcador) y después
  // se reutiliza siempre la misma instancia — antes se destruía y recreaba
  // por completo en cada cambio de posición, lo que recentraba la cámara de
  // golpe cada vez que alguien arrastraba o tocaba el pin (se sentía como
  // que "no dejaba" moverlo libremente, o que el mapa se reseteaba solo).
  useEffect(() => {
    if (!ready || !ref.current || mapRef.current || !hasMarkers) return;
    const g = (window as any).google;
    mapRef.current = new g.maps.Map(ref.current, {
      center: { lat: markers[0].lat, lng: markers[0].lng }, zoom,
      disableDefaultUI: true, zoomControl: true, clickableIcons: false, styles: MINIMAL_MAP_STYLE,
    });
    if (onMapClickRef.current) {
      mapRef.current.addListener("click", (e: any) => onMapClickRef.current?.(e.latLng.lat(), e.latLng.lng()));
    }
  }, [ready, hasMarkers]);

  useEffect(() => { mapRef.current?.setZoom(zoom); }, [zoom]);

  // Sincroniza los marcadores con el mapa ya existente: mueve los que ya
  // están, crea los nuevos, saca los que desaparecieron — sin recrear el
  // mapa ni tocar la cámara del usuario en cada actualización.
  useEffect(() => {
    const map = mapRef.current;
    const g = (window as any).google;
    if (!map || !g) return;
    const seenIds = new Set(markers.map(m => m.id));
    Object.keys(markerInstancesRef.current).forEach(id => {
      if (!seenIds.has(id)) { markerInstancesRef.current[id].setMap(null); delete markerInstancesRef.current[id]; }
    });
    const bounds = new g.maps.LatLngBounds();
    markers.forEach(m => {
      const color = m.color ?? NAVY;
      const isSelf = m.id === SELF_MARKER_ID;
      const iconUrl = isSelf ? selfIconUrl(color, heading ?? null) : pinIconUrl(color, m.label, m.labelColor ?? NAVY);
      const icon = { url: iconUrl, scaledSize: new g.maps.Size(40, 40), anchor: new g.maps.Point(20, 20) };
      let marker = markerInstancesRef.current[m.id];
      if (!marker) {
        marker = new g.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map, title: m.label, draggable: !!m.draggable, icon });
        if (m.draggable) {
          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            onMarkerDragEndRef.current?.(m.id, pos.lat(), pos.lng());
          });
        }
        markerInstancesRef.current[m.id] = marker;
      } else {
        marker.setPosition({ lat: m.lat, lng: m.lng });
        if (!isSelf) marker.setIcon(icon);
      }
      bounds.extend({ lat: m.lat, lng: m.lng });
    });
    // Encuadra ambos marcadores solo la primera vez que aparecen juntos —
    // actualizaciones posteriores (ej. el profesional moviéndose en vivo)
    // no deben reencuadrar/mover la cámara que el usuario ya está mirando.
    if (!boundsFittedRef.current && markers.length > 1) {
      map.fitBounds(bounds, 48);
      boundsFittedRef.current = true;
    }
  }, [markersKey]);

  // El rumbo cambia mucho más seguido que la posición — actualiza solo el
  // ícono del marcador propio en vez de tocar el resto del mapa en cada
  // lectura de la brújula.
  useEffect(() => {
    const g = (window as any).google;
    const selfMarker = markerInstancesRef.current[SELF_MARKER_ID];
    const selfData = markers.find(m => m.id === SELF_MARKER_ID);
    if (!g || !selfMarker || !selfData) return;
    const color = selfData.color ?? NAVY;
    selfMarker.setIcon({ url: selfIconUrl(color, heading ?? null), scaledSize: new g.maps.Size(40, 40), anchor: new g.maps.Point(20, 20) });
  }, [heading]);

  if (error) return <MapView />;
  return <div ref={ref} className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#E8F5E9" }} />;
}

// Usa el mapa real cuando hay una clave de Google Maps configurada y al
// menos una coordenada real; si no, cae al mapa decorativo de siempre.
export function LiveMap({ markers, fallback, zoom, heading, onMarkerDragEnd, onMapClick }: {
  markers: MapMarker[]; fallback?: React.ReactNode; zoom?: number; heading?: number | null;
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  if (!getMapsApiKey() || markers.length === 0) return <>{fallback ?? <MapView />}</>;
  return <RealMap markers={markers} zoom={zoom} heading={heading} onMarkerDragEnd={onMarkerDragEnd} onMapClick={onMapClick} />;
}
