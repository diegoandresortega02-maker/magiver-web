import { useNavigate } from "react-router";
import { NAVY, LIME, AppHeader, ScreenWrap } from "../ui/primitives";
import { LEGAL_CONTENT } from "./LegalModal";

// ─── PAGE: Términos y Condiciones (/terminos) ──────────────────────────────
// Página pública standalone (no un modal) — necesaria para la "URL de
// Condiciones del servicio" que piden Meta/Google al configurar la app.
// Reutiliza el mismo texto que ya existe en LegalModal (LEGAL_CONTENT),
// combinando las secciones de clientes y profesionales en una sola página.
export function TermsPage() {
  const navigate = useNavigate();
  const sections = [LEGAL_CONTENT.cliente, LEGAL_CONTENT.profesional];
  return (
    <ScreenWrap>
      <AppHeader title="Términos y Condiciones" onBack={() => navigate("/")} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: LIME }}>
            Última actualización: 17 de julio de 2026
          </p>
          {sections.map((s, i) => (
            <div key={i} className="mb-8">
              <h2 className="font-bold text-lg mb-3" style={{ color: NAVY }}>{s.title}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j} className="text-slate-600 text-sm leading-relaxed mb-3 last:mb-0">{p}</p>
              ))}
            </div>
          ))}
          <p className="text-xs text-slate-400 text-center mt-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
            Borrador funcional — antes del lanzamiento comercial, estos términos serán revisados por un abogado conforme a la normativa vigente en Bolivia.
          </p>
        </div>
      </div>
    </ScreenWrap>
  );
}
