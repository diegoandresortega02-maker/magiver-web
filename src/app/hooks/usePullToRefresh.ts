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
  const [dragging, setDragging] = useState(false);
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
      setDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!trackingRef.current || startYRef.current == null) return;
      const rawDelta = e.touches[0].clientY - startYRef.current;
      if (rawDelta <= 0) { setPullDistance(0); return; }
      e.preventDefault();
      // Resistencia progresiva tipo "rubber band" (como en iOS/apps nativas).
      // SENSITIVITY es la respuesta inicial (0.45 = el indicador avanza
      // 0.45px por cada px que baja el dedo, ya desde el arranque del
      // gesto) — con 0.6 seguía sintiéndose fácil, así que se bajó de
      // nuevo. Llegar al umbral (1/4 de pantalla) ahora pide un arrastre
      // de dedo de casi toda la altura de la pantalla.
      const max = maxPull();
      const SENSITIVITY = 0.45;
      const damped = max * (1 - Math.exp((-rawDelta * SENSITIVITY) / max));
      setPullDistance(damped);
    };

    const onTouchEnd = () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      startYRef.current = null;
      setDragging(false);
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

  return { containerRef, pullDistance, refreshing, dragging };
}
