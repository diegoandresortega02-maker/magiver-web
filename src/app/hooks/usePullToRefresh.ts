import { useEffect, useRef, useState } from "react";

// Gesto de "deslizar hacia abajo para actualizar" (pull-to-refresh), como en
// casi cualquier app nativa. Solo se activa cuando el toque empieza en la
// parte de arriba de la pantalla (el contenedor con scroll más cercano ya
// está en scrollTop 0) — así no interfiere con el scroll normal del resto
// de la pantalla. Al soltar habiendo bajado más de 1/4 de la altura de la
// pantalla, hace un reload real (equivalente a F5), no un refresco parcial
// de datos — es lo que pidió el usuario explícitamente.
export function usePullToRefresh<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const trackingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = () => window.innerHeight * 0.25;
    const maxPull = () => window.innerHeight * 0.35;

    const isAtTop = (target: EventTarget | null): boolean => {
      let el = target as HTMLElement | null;
      while (el && el !== container) {
        const style = window.getComputedStyle(el);
        const scrollable = (style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight;
        if (scrollable) return el.scrollTop <= 0;
        el = el.parentElement;
      }
      return true;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (!isAtTop(e.target)) { trackingRef.current = false; return; }
      startYRef.current = e.touches[0].clientY;
      trackingRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!trackingRef.current || startYRef.current == null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) { setPullDistance(0); return; }
      // Un poco de resistencia progresiva, como en las apps nativas — el
      // dedo se mueve más de lo que el indicador visualmente baja.
      e.preventDefault();
      setPullDistance(Math.min(delta * 0.5, maxPull()));
    };

    const onTouchEnd = () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      startYRef.current = null;
      setPullDistance(current => {
        if (current >= threshold()) {
          setRefreshing(true);
          window.location.reload();
          return current;
        }
        return 0;
      });
    };

    // touchmove necesita { passive: false } para poder cancelar el scroll
    // nativo mientras se hace el gesto — React adjunta los handlers de JSX
    // como pasivos por defecto, por eso van con addEventListener a mano acá.
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [refreshing]);

  return { containerRef, pullDistance, refreshing };
}
