import { useState, useEffect } from "react";
import { Geolocation } from "@capacitor/geolocation";
import type { GeoPoint } from "@/lib/types";

// Usamos @capacitor/geolocation en vez de navigator.geolocation directo.
// En la app nativa Android esto pide el permiso de ubicación del sistema
// operativo de forma explícita y lee el GPS real (FusedLocationProvider) en
// vez de depender del puente de geolocalización del WebView — en varios
// teléfonos/versiones de Android ese puente no dispara el diálogo de
// permiso o entrega una posición imprecisa por red en vez de GPS real, que
// es justo lo que causaba que el pin apareciera en un lugar genérico. En la
// web este mismo plugin usa navigator.geolocation por debajo, así que el
// comportamiento en el navegador no cambia.

// Ubicación GPS real, una sola vez (para el cliente al pedir un servicio).
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Geolocation.requestPermissions().catch(() => {});
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
        if (!cancelled) setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "No se pudo obtener tu ubicación.");
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { position, error };
}

// Ubicación GPS real en vivo mientras `active` es true (para el profesional
// mientras está Online). Expone también el error y la precisión (metros).
export function useWatchPosition(active: boolean) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    let watchId: string | null = null;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        await Geolocation.requestPermissions().catch(() => {});
        watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
          if (cancelled) return;
          if (err) { setError(err.message ?? "No se pudo obtener tu ubicación."); return; }
          if (pos) {
            setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setAccuracy(pos.coords.accuracy);
            setError(null);
          }
        });
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "No se pudo obtener tu ubicación.");
      }
    })();
    return () => {
      cancelled = true;
      if (watchId) Geolocation.clearWatch({ id: watchId }).catch(() => {});
    };
  }, [active]);
  return { position, accuracy, error };
}
