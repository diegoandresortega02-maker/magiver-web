// ─── MAGIVER — Cliente de Supabase ────────────────────────────────────────────
// Instancia única de Supabase usada por auth.ts y api.ts.
// Las credenciales vienen de utils/supabase/info.tsx (autogenerado por Figma Make)
// o de variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY si existen.

import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
