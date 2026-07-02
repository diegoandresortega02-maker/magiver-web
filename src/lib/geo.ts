// ─── MAGIVER — Servicio de geolocalización ────────────────────────────────────
// Abstrae la Geolocation API del navegador y la integración con Google Maps.
// La app móvil (React Native) usa react-native-geolocation-service con la
// misma interfaz GeoPoint definida en types.ts.
//
// TODO: cuando se tenga la API key de Google Maps, habilitar:
//   1. Carga del SDK: loadGoogleMaps()
//   2. Mapa real en lugar del SVG animado
//   3. Geocodificación inversa de coordinates → dirección

import { config } from "./config";
import type { GeoPoint, Address } from "./types";

// ─── Posición actual ──────────────────────────────────────────────────────────

export async function getCurrentPosition(): Promise<GeoPoint> {
  if (!navigator.geolocation) {
    console.warn("[Geo] Geolocation no disponible, usando posición mock");
    return MOCK_POSITION;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => {
        console.warn("[Geo] Error obteniendo posición, usando mock:", err.message);
        resolve(MOCK_POSITION); // fallback graceful
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  });
}

// ─── Tracking continuo (para el profesional en camino) ────────────────────────

export function watchPosition(
  onUpdate: (pos: GeoPoint) => void,
  onError?: (err: GeolocationPositionError) => void,
): () => void {
  if (!navigator.geolocation) {
    // Simular movimiento del profesional para demo
    return simulateMovement(onUpdate);
  }

  const watchId = navigator.geolocation.watchPosition(
    pos => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    err => {
      console.warn("[Geo] Error en watchPosition:", err.message);
      onError?.(err);
    },
    { enableHighAccuracy: true, distanceFilter: 10 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

// ─── Geocodificación inversa (coordenadas → dirección legible) ────────────────

export async function reverseGeocode(point: GeoPoint): Promise<Address> {
  if (!config.MAPS_API_KEY || config.MOCK_MODE) {
    // TODO: reemplazar con llamada real a Google Geocoding API
    return {
      street: "Calle Los Pinos #342",
      zone: "Equipetrol",
      city: "Santa Cruz de la Sierra",
      coordinates: point,
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.lat},${point.lng}&key=${config.MAPS_API_KEY}&language=es`;
  const res = await fetch(url);
  const data = await res.json();
  const result = data.results?.[0];
  if (!result) throw new Error("No se encontró dirección para las coordenadas");

  return parseGoogleAddress(result, point);
}

// ─── Distancia entre dos puntos (fórmula Haversine) ───────────────────────────

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

// ─── ETA estimado basado en distancia ────────────────────────────────────────

export function estimateEtaMinutes(distanceKm: number, avgSpeedKmh = 25): number {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const MOCK_POSITION: GeoPoint = { lat: -17.7863, lng: -63.1812 }; // Equipetrol, SCZ

function toRad(deg: number) { return deg * (Math.PI / 180); }

function simulateMovement(onUpdate: (pos: GeoPoint) => void): () => void {
  // Simula que el profesional se mueve 0.0002° cada 2 segundos
  let step = 0;
  const interval = setInterval(() => {
    step++;
    onUpdate({
      lat: MOCK_POSITION.lat + step * 0.0002,
      lng: MOCK_POSITION.lng + step * 0.0002,
    });
  }, 2000);
  return () => clearInterval(interval);
}

function parseGoogleAddress(result: Record<string, unknown>, point: GeoPoint): Address {
  const components = (result.address_components as Array<{ types: string[]; long_name: string }>) ?? [];
  const get = (type: string) =>
    components.find(c => c.types.includes(type))?.long_name ?? "";
  return {
    street: `${get("route")} ${get("street_number")}`.trim(),
    zone: get("sublocality") || get("neighborhood"),
    city: get("locality") || get("administrative_area_level_2"),
    coordinates: point,
  };
}
