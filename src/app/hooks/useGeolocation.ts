import { useState, useEffect } from "react";
import type { GeoPoint } from "@/lib/types";

// Ubicación GPS real del navegador, una sola vez (para el cliente al pedir un servicio).
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) { setError("Tu navegador no soporta geolocalización."); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);
  return { position, error };
}

// Ubicación GPS real en vivo mientras `active` es true (para el profesional
// mientras está Online). Expone también el error y la precisión (metros) —
// antes el error se descartaba en silencio, así que si el permiso fallaba o
// el navegador solo lograba una ubicación imprecisa (red/celda en vez de GPS
// real), el profesional nunca se enteraba y el cliente veía en el mapa la
// última posición guardada, que podía ser vieja o estar lejos de la real.
export function useWatchPosition(active: boolean) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    if (!navigator.geolocation) { setError("Tu navegador no soporta geolocalización."); return; }
    setError(null);
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setError(null);
      },
      err => setError(err.message),
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);
  return { position, accuracy, error };
}
