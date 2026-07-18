import { useState, useEffect } from "react";
import { config } from "@/lib/config";
import { getProfessionalReviews } from "@/lib/api";
import type { ProfessionalReview } from "@/lib/api";
import { Star, BadgeCheck, X, Loader2 } from "lucide-react";
import { NAVY, Card, ProAvatar } from "../ui/primitives";
import type { Professional } from "../types.local";

// Perfil completo del profesional visible para el cliente una vez que le
// aceptó la solicitud — trabajos realizados, calificación y comentarios de
// otras personas, no solo el nombre y la foto que ya se veían en seguimiento.
export function ProfessionalProfileModal({ pro, onClose }: { pro: Professional; onClose: () => void }) {
  const [reviews, setReviews] = useState<ProfessionalReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (config.MOCK_MODE || !pro.id) { setLoading(false); return; }
    let active = true;
    getProfessionalReviews(pro.id)
      .then(r => { if (active) setReviews(r); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pro.id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center" style={{ background: "rgba(15,23,42,0.6)" }} onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="font-black text-lg" style={{ color: NAVY }}>Perfil del profesional</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" style={{ color: NAVY }} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-4">
            <ProAvatar pro={pro} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-black text-lg" style={{ color: NAVY }}>{pro.name}</p>
                {pro.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
              </div>
              <p className="text-sm text-slate-500">{pro.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-5 py-3 px-4 rounded-xl" style={{ background: "#F8FAFC" }}>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <p className="font-black" style={{ color: NAVY }}>{pro.rating.toFixed(1)}</p>
              </div>
              <p className="text-xs text-slate-400">{pro.reviews} reseñas</p>
            </div>
            <div className="w-px h-8" style={{ background: "#E5E7EB" }} />
            <div className="flex-1 text-center">
              <p className="font-black" style={{ color: NAVY }}>{pro.jobs}</p>
              <p className="text-xs text-slate-400">Trabajos realizados</p>
            </div>
          </div>
          {pro.bio && <p className="text-sm text-slate-600 leading-relaxed mb-5">{pro.bio}</p>}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Comentarios de clientes</p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Todavía no tiene reseñas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <Card key={r.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm" style={{ color: NAVY }}>{r.clientName ?? "Cliente MAGIVER"}</p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
