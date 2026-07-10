import { useState, useEffect } from "react";
import { config } from "@/lib/config";
import { getClientRequestHistory } from "@/lib/api";
import type { JobHistoryEntry } from "@/lib/api";
import { AppHeader, ScreenWrap, JobHistoryCard } from "../ui/primitives";
import { specialtyLabel } from "../lib.local/mappers";
import type { ClientUser } from "../types.local";

// ─── CLIENT HISTORY ───────────────────────────────────────────────────────────
export function ClientHistory({ user, onBack }: { user: ClientUser; onBack: () => void }) {
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [loading, setLoading] = useState(!config.MOCK_MODE);

  useEffect(() => {
    if (config.MOCK_MODE || !user.id) return;
    let active = true;
    getClientRequestHistory(user.id)
      .then(h => { if (active) setHistory(h); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);

  return (
    <ScreenWrap>
      <AppHeader title="Historial de servicios" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Todavía no tienes servicios completados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(job => (
              <JobHistoryCard
                key={job.id}
                categoryLabel={specialtyLabel(job.category)}
                counterpartName={job.counterpartName}
                dateLabel={new Date(job.completedAt).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" })}
                rating={job.rating}
                amount={job.agreedPrice}
                photoUrls={job.photoUrls}
              />
            ))}
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}
