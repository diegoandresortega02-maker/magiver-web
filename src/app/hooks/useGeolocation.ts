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
// mientras está Online).
export function useWatchPosition(active: boolean) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);
  return position;
}
