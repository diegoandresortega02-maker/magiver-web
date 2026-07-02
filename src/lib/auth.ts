// ─── MAGIVER — Servicio de autenticación (Supabase real) ──────────────────────
// Reemplaza el mock anterior. Usa Supabase Auth (email + contraseña) y
// las tablas clients / professionals / admins para el perfil de cada rol.

import { supabase } from "./supabaseClient";
import type { AuthSession, ClientUser, ProUser, AdminUser } from "./types";

// ─── Sesión actual ─────────────────────────────────────────────────────────
// Supabase ya persiste la sesión sola (localStorage + refresco automático).
// Estas funciones quedan como helpers de conveniencia para el resto del código.

export async function loadSession(): Promise<AuthSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const user = await fetchProfileForUser(session.user.id, session.user.email ?? "");
  if (!user) return null;

  return {
    user,
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: (session.expires_at ?? 0) * 1000,
    },
  };
}

export function clearSession(): void {
  void supabase.auth.signOut();
}

export function getAccessToken(): string | null {
  // Nota: llamada síncrona de conveniencia. Para tokens frescos usar loadSession().
  const raw = localStorage.getItem(
    `sb-${new URL(supabase.supabaseUrl).hostname.split(".")[0]}-auth-token`,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.access_token ?? null;
  } catch {
    return null;
  }
}

// Busca el perfil del usuario en la tabla que corresponda según su rol.
async function fetchProfileForUser(
  userId: string,
  email: string,
): Promise<ClientUser | ProUser | AdminUser | null> {
  const { data: admin } = await supabase.from("admins").select("*").eq("id", userId).maybeSingle();
  if (admin) {
    return { role: "admin", id: admin.id, name: admin.name, phone: admin.phone ?? "", email, createdAt: admin.created_at };
  }

  const { data: pro } = await supabase.from("professionals").select("*").eq("id", userId).maybeSingle();
  if (pro) {
    return {
      role: "professional", id: pro.id, name: pro.name, phone: pro.phone, email,
      specialty: pro.specialty, ci: pro.ci, yearsExp: pro.years_exp, bio: pro.bio ?? "",
      status: pro.status, rating: Number(pro.rating), reviewCount: pro.review_count,
      completedJobs: pro.completed_jobs, isOnline: pro.is_online,
      location: pro.location_lat != null ? { lat: pro.location_lat, lng: pro.location_lng } : undefined,
      createdAt: pro.created_at,
    };
  }

  const { data: client } = await supabase.from("clients").select("*").eq("id", userId).maybeSingle();
  if (client) {
    return { role: "client", id: client.id, name: client.name, phone: client.phone, email, totalRequests: client.total_requests, createdAt: client.created_at };
  }

  return null;
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

export async function loginClient(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { code: "auth_error", message: error.message };
  const session = await loadSession();
  if (!session) throw { code: "profile_missing", message: "No se encontró el perfil de cliente." };
  return session;
}

export async function registerClient(data: {
  name: string; email: string; phone: string; password: string;
}): Promise<AuthSession> {
  const { data: signUp, error } = await supabase.auth.signUp({ email: data.email, password: data.password });
  if (error) throw { code: "auth_error", message: error.message };
  const userId = signUp.user?.id;
  if (!userId) throw { code: "signup_failed", message: "No se pudo crear la cuenta." };

  const { error: insertError } = await supabase.from("clients").insert({
    id: userId, name: data.name, phone: data.phone,
  });
  if (insertError) throw { code: "profile_error", message: insertError.message };

  // Si el proyecto tiene "Confirm email" activado, Supabase no da sesión todavía.
  if (!signUp.session) {
    throw { code: "email_confirmation_required", message: "Cuenta creada. Revisa tu correo y confirma tu cuenta antes de iniciar sesión." };
  }

  const session = await loadSession();
  if (!session) throw { code: "profile_missing", message: "Cuenta creada pero no se pudo cargar la sesión." };
  return session;
}

// ─── Profesional ───────────────────────────────────────────────────────────

export async function loginPro(email: string, password: string): Promise<AuthSession> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { code: "auth_error", message: error.message };
  const session = await loadSession();
  if (!session) throw { code: "profile_missing", message: "No se encontró el perfil de profesional." };
  return session;
}

// El registro completo de Profesional (con specialty, ci, etc.) se hace vía
// api.ts → registerProfessional(), que además crea la fila en `professionals`.
// Esta función solo crea la cuenta de auth y devuelve el userId para ese paso.
export async function signUpProfessionalAuth(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw { code: "auth_error", message: error.message };
  const userId = data.user?.id;
  if (!userId) throw { code: "signup_failed", message: "No se pudo crear la cuenta." };
  return userId;
}

// ─── Administrador ───────────────────────────────────────────────────────────

export async function loginAdmin(email: string, password: string): Promise<AuthSession> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { code: "auth_error", message: error.message };
  const session = await loadSession();
  if (!session || session.user.role !== "admin") {
    await supabase.auth.signOut();
    throw { code: "not_admin", message: "Esta cuenta no tiene permisos de administrador." };
  }
  return session;
}

// ─── Cierre de sesión ──────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
