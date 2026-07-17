import { useEffect, useRef, useState } from "react";
import { NAVY } from "./ui/primitives";

// Se muestra una sola vez por dispositivo/navegador (persistido en
// localStorage) — no en cada apertura, para no demorar 6s a usuarios
// recurrentes. Elige el video según la forma de la pantalla porque cada
// export viene recortado para ese aspecto (vertical/cuadrado/horizontal).
const SEEN_KEY = "magiver_intro_seen_v1";

function pickIntroSrc(): string {
  const ratio = window.innerWidth / window.innerHeight;
  if (ratio < 0.9) return "/intro/magiver_isotipo_9x16.mp4";
  if (ratio > 1.15) return "/intro/magiver_isotipo_16x9.mp4";
  return "/intro/magiver_isotipo_1x1.mp4";
}

export function IntroSplash() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY);
    } catch {
      return false;
    }
  });
  const [fading, setFading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const srcRef = useRef<string>(visible ? pickIntroSrc() : "");
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // localStorage inaccesible (modo privado, etc.) — igual la ocultamos.
    }
    setFading(true);
    setTimeout(() => setVisible(false), 300);
  };

  useEffect(() => {
    if (!visible) return;
    // Red de seguridad: si el video no puede reproducirse por algún motivo,
    // no bloqueamos el acceso a la app más de unos segundos.
    const timeout = setTimeout(finish, 8000);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: NAVY, opacity: fading ? 0 : 1, transition: "opacity 300ms ease-out" }}
      onClick={finish}
    >
      <video
        src={srcRef.current}
        autoPlay
        muted
        playsInline
        preload="auto"
        onPlaying={() => setPlaying(true)}
        onEnded={finish}
        onError={finish}
        className="w-full h-full object-cover"
        style={{ opacity: playing ? 1 : 0 }}
      />
    </div>
  );
}
