import { useState, useEffect, useRef } from "react";
import { config } from "@/lib/config";
import { NAVY } from "../ui/primitives";
import { loadGoogleMaps, MINIMAL_MAP_STYLE } from "./googleMaps";
import { MapView, type MapMarker } from "./MapView";

export function RealMap({ markers, zoom = 14, onMarkerDragEnd, onMapClick }: {
  markers: MapMarker[]; zoom?: number;
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

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(config.MAPS_API_KEY)
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !ref.current || markers.length === 0) return;
    const g = (window as any).google;
    const map = new g.maps.Map(ref.current, {
      center: { lat: markers[0].lat, lng: markers[0].lng }, zoom,
      disableDefaultUI: true, zoomControl: true, clickableIcons: false, styles: MINIMAL_MAP_STYLE,
    });
    const bounds = new g.maps.LatLngBounds();
    markers.forEach(m => {
      const marker = new g.maps.Marker({
        position: { lat: m.lat, lng: m.lng }, map, title: m.label, draggable: !!m.draggable,
        label: { text: m.label, color: m.labelColor ?? "#fff", fontWeight: "700", fontSize: "11px" },
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 16, fillColor: m.color ?? NAVY, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      if (m.draggable) {
        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          onMarkerDragEndRef.current?.(m.id, pos.lat(), pos.lng());
        });
      }
      bounds.extend({ lat: m.lat, lng: m.lng });
    });
    if (onMapClickRef.current) {
      map.addListener("click", (e: any) => onMapClickRef.current?.(e.latLng.lat(), e.latLng.lng()));
    }
    if (markers.length > 1) map.fitBounds(bounds, 48);
  }, [ready, markersKey, zoom]);

  if (error) return <MapView />;
  return <div ref={ref} className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#E8F5E9" }} />;
}

// Usa el mapa real cuando hay una clave de Google Maps configurada y al
// menos una coordenada real; si no, cae al mapa decorativo de siempre.
export function LiveMap({ markers, fallback, zoom, onMarkerDragEnd, onMapClick }: {
  markers: MapMarker[]; fallback?: React.ReactNode; zoom?: number;
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  if (!config.MAPS_API_KEY || markers.length === 0) return <>{fallback ?? <MapView />}</>;
  return <RealMap markers={markers} zoom={zoom} onMarkerDragEnd={onMarkerDragEnd} onMapClick={onMapClick} />;
}
