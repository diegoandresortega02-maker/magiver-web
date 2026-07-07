import { Capacitor } from "@capacitor/core";
import { config } from "@/lib/config";

// Dentro del WebView nativo de Android el origen no es magiver.com.bo, así
// que la clave web (restringida por referrer HTTP) no puede funcionar ahí —
// se usa una segunda clave restringida por app Android (paquete + SHA-1).
export function getMapsApiKey(): string {
  return Capacitor.isNativePlatform() && config.MAPS_API_KEY_ANDROID
    ? config.MAPS_API_KEY_ANDROID
    : config.MAPS_API_KEY;
}

// ─── Mapa real (Google Maps) ──────────────────────────────────────────────────
// Carga el script de Google Maps una sola vez (cacheado en un módulo-level
// promise) y renderiza marcadores reales. Si no hay clave configurada o no
// hay coordenadas reales disponibles, el llamador debe usar MapView (arriba)
// como respaldo — ver LiveMap.

// Estilo minimalista tipo PedidosYa/Uber: sin íconos de negocios/POIs, sin
// transporte público, calles simplificadas — reduce el "ruido" visual del
// estilo por defecto de Google Maps.
export const MINIMAL_MAP_STYLE = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d1d5db" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
];

export let googleMapsPromise: Promise<void> | null = null;
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

// Convierte coordenadas GPS reales en una dirección legible (como al pedir
// comida: se detecta la ubicación sola, pero se puede editar después).
// Usa el Geocoder de la propia librería de Google Maps (no el endpoint REST
// directo) porque la clave tiene restricción de "HTTP referrer" — necesaria
// para el mapa — y esa restricción hace que el endpoint REST puro rechace
// la clave con "REQUEST_DENIED". El Geocoder de la librería JS sí respeta
// la restricción de referrer correctamente.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!getMapsApiKey()) return null;
  try {
    await loadGoogleMaps(getMapsApiKey());
    const g = (window as any).google;
    const geocoder = new g.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } });
    return result?.results?.[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}
