import { useEffect, useState } from "react";

// Rumbo de la brújula del dispositivo (0-360°, 0 = Norte), para dibujar la
// flechita de dirección sobre el marcador de "mi posición" en el mapa —
// null si no hay sensor disponible o todavía no llegó ninguna lectura.
export function useDeviceHeading(enabled: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let lastUpdate = 0;
    const handler = (e: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastUpdate < 150) return; // no repintar el ícono en cada evento
      const webkitHeading = (e as any).webkitCompassHeading; // Safari/iOS: ya viene en grados desde el Norte
      if (typeof webkitHeading === "number") {
        lastUpdate = now;
        setHeading(webkitHeading);
      } else if ((e as any).absolute && e.alpha != null) {
        lastUpdate = now;
        setHeading((360 - e.alpha) % 360);
      }
    };
    window.addEventListener("deviceorientationabsolute", handler as any, true);
    window.addEventListener("deviceorientation", handler as any, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as any, true);
      window.removeEventListener("deviceorientation", handler as any, true);
    };
  }, [enabled]);

  return heading;
}

// iOS Safari 13+ exige pedir permiso explícito con un gesto del usuario
// (ej. dentro de un onClick) antes de poder recibir eventos de orientación
// — en Android y el resto de navegadores no hace falta, se puede llamar
// igual sin que rompa nada (devuelve true directo).
export async function requestDeviceHeadingPermission(): Promise<boolean> {
  const DOE = (window as any).DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    try {
      const result = await DOE.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }
  return true;
}
