import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { NAVY, LIME } from "../ui/primitives";
import { PROFESSIONALS } from "../lib.local/mappers";
import type { JobStatus } from "../types.local";

// ─── Map ────────────────────────────────────────────────────────────────────
const PRO_POS = [{ id: "1", x: 68, y: 30 }, { id: "2", x: 75, y: 55 }, { id: "3", x: 30, y: 65 }, { id: "4", x: 20, y: 35 }];

export interface MapMarker { id: string; lat: number; lng: number; label: string; color?: string; labelColor?: string; draggable?: boolean }

export function MapView({ selectedProId, onSelectPro, animate = false, jobStatus }: {
  selectedProId?: string; onSelectPro?: (id: string) => void;
  animate?: boolean; jobStatus?: JobStatus;
}) {
  const [dotPos, setDotPos] = useState({ x: 68, y: 30 });
  useEffect(() => {
    if (!animate) return;
    const t = { en_camino: { x: 55, y: 45 }, en_sitio: { x: 50, y: 50 }, completado: { x: 50, y: 50 } };
    const p = t[jobStatus as keyof typeof t];
    if (p) setDotPos(p);
  }, [jobStatus, animate]);
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "#E8F5E9", aspectRatio: "16/9" }}>
      <svg className="absolute inset-0 w-full h-full opacity-25">
        <defs><pattern id="mg" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2d6a4f" strokeWidth="0.6" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#mg)" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#2d6a4f" strokeWidth="1.5" opacity="0.4" />
        <line x1="30%" y1="0" x2="20%" y2="100%" stroke="#2d6a4f" strokeWidth="1.5" opacity="0.4" />
        <line x1="65%" y1="0" x2="70%" y2="100%" stroke="#2d6a4f" strokeWidth="1.5" opacity="0.4" />
      </svg>
      {animate && jobStatus && jobStatus !== "idle" && (
        <svg className="absolute inset-0 w-full h-full">
          <line x1={`${dotPos.x}%`} y1={`${dotPos.y}%`} x2="50%" y2="50%" stroke={LIME} strokeWidth="2" strokeDasharray="5,3" opacity="0.7" />
        </svg>
      )}
      {PRO_POS.map(pos => {
        const pro = PROFESSIONALS.find(p => p.id === pos.id);
        if (!pro) return null;
        const isSel = selectedProId === pos.id;
        const isActive = animate && pos.id === "1";
        return (
          <div key={pos.id} onClick={() => onSelectPro?.(pos.id)}
            className={`absolute flex items-center justify-center rounded-full font-bold text-xs text-white cursor-pointer shadow-md transition-all duration-700 ${isSel ? "ring-2 ring-offset-1" : ""}`}
            style={{ left: `${isActive ? dotPos.x : pos.x}%`, top: `${isActive ? dotPos.y : pos.y}%`, transform: "translate(-50%,-50%)", width: isSel ? "42px" : "36px", height: isSel ? "42px" : "36px", background: isSel ? NAVY : pro.color }}>
            {isSel ? "★" : pro.initials}
          </div>
        );
      })}
      <div className="absolute flex items-center justify-center w-11 h-11 rounded-full font-bold text-sm shadow-lg" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: LIME, color: NAVY }}>Tú</div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(255,255,255,0.9)", color: NAVY }}>
        <MapPin className="w-3 h-3" style={{ color: LIME }} />Equipetrol, SCZ
      </div>
    </div>
  );
}
