// ─── MAGIVER — Cliente API (Supabase real) ────────────────────────────────────
// Con VITE_MOCK_MODE=false (o sin definir + Supabase configurado), estas
// funciones leen y escriben directo en las tablas de Supabase creadas por
// magiver_schema.sql. El modo mock queda como respaldo para desarrollo sin backend.

import { config } from "./config";
import { supabase } from "./supabaseClient";
import { signUpProfessionalAuth } from "./auth";
import type {
  PaginatedResponse,
  ServiceRequest, JobStatus as ApiJobStatus,
  ChatMessage, Review, PendingVerification, AdminStats,
  GeoPoint, ServiceCategory, ProUser,
} from "./types";

// ─── Profesionales ────────────────────────────────────────────────────────────

export interface NearbyProFilter {
  location: GeoPoint;
  category?: ServiceCategory;
  radiusKm?: number;
}

function rowToProUser(row: any, email = ""): ProUser {
  return {
    role: "professional", id: row.id, name: row.name, phone: row.phone, email,
    specialty: row.specialty, ci: row.ci, yearsExp: row.years_exp, bio: row.bio ?? "",
    status: row.status, rating: Number(row.rating), reviewCount: row.review_count,
    completedJobs: row.completed_jobs, isOnline: row.is_online,
    location: row.location_lat != null ? { lat: row.location_lat, lng: row.location_lng } : undefined,
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

export async function getActiveProfessionals(): Promise<ProUser[]> {
  if (config.MOCK_MODE) { await delay(400); return MOCK_PROFESSIONALS; }
  const { data, error } = await supabase.from("professionals").select("*").eq("status", "active").order("rating", { ascending: false });
  if (error) throw { code: "db_error", message: error.message };
  return (data ?? []).map(row => rowToProUser(row));
}

export async function getRejectedProfessionals(): Promise<ProUser[]> {
  if (config.MOCK_MODE) { await delay(400); return []; }
  const { data, error } = await supabase.from("professionals").select("*").eq("status", "rejected").order("created_at", { ascending: false });
  if (error) throw { code: "db_error", message: error.message };
  return (data ?? []).map(row => rowToProUser(row));
}

export async function getNearbyProfessionals(filter: NearbyProFilter): Promise<ProUser[]> {
  if (config.MOCK_MODE) { await delay(600); return MOCK_PROFESSIONALS; }
  // Nota: filtro real por distancia (PostGIS) queda pendiente; por ahora trae
  // todos los activos de la categoría pedida y se puede ordenar en el cliente.
  let query = supabase.from("professionals").select("*").eq("status", "active");
  if (filter.category) query = query.eq("specialty", filter.category);
  const { data, error } = await query;
  if (error) throw { code: "db_error", message: error.message };
  return (data ?? []).map(row => rowToProUser(row));
}

export async function getProfessionalById(id: string): Promise<ProUser> {
  if (config.MOCK_MODE) { await delay(300); return MOCK_PROFESSIONALS.find(p => p.id === id) ?? MOCK_PROFESSIONALS[0]; }
  const { data, error } = await supabase.from("professionals").select("*").eq("id", id).single();
  if (error) throw { code: "db_error", message: error.message };
  return rowToProUser(data);
}

// Actualiza la disponibilidad ("Online"/"Offline") y, si está disponible,
// la ubicación GPS real del profesional autenticado.
export async function updateMyPresence(input: { isOnline: boolean; location?: GeoPoint }): Promise<void> {
  if (config.MOCK_MODE) return;
  const { data: userData } = await supabase.auth.getUser();
  const id = userData.user?.id;
  if (!id) return;
  const patch: Record<string, unknown> = { is_online: input.isOnline };
  if (input.location) { patch.location_lat = input.location.lat; patch.location_lng = input.location.lng; }
  const { error } = await supabase.from("professionals").update(patch).eq("id", id);
  if (error) throw { code: "db_error", message: error.message };
}

// ─── Solicitudes de servicio ──────────────────────────────────────────────────

export interface CreateRequestPayload {
  // Ya no se elige un profesional al crear la solicitud — se transmite a los
  // profesionales cercanos (ver requests_select_broadcast_pool / accept_service_request).
  // Queda opcional solo por si el flujo de elegir directamente (ClientMap, hoy
  // inactivo) se reactiva más adelante.
  professionalId?: string;
  category: ServiceCategory;
  description: string;
  address: { street: string; zone: string; city: string; lat: number; lng: number };
}

function rowToServiceRequest(row: any): ServiceRequest {
  return {
    id: row.id, clientId: row.client_id, professionalId: row.professional_id ?? undefined,
    category: row.category, description: row.description ?? "",
    address: {
      street: row.address_street ?? "", zone: row.address_zone ?? "", city: row.address_city ?? "",
      coordinates: row.address_lat != null ? { lat: row.address_lat, lng: row.address_lng } : undefined,
    },
    status: row.status, agreedPrice: row.agreed_price != null ? Number(row.agreed_price) : undefined,
    createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at ?? undefined,
    searchRadiusKm: row.search_radius_km != null ? Number(row.search_radius_km) : undefined,
    radiusTier: row.radius_tier ?? undefined,
  };
}

export async function createServiceRequest(payload: CreateRequestPayload): Promise<ServiceRequest> {
  if (config.MOCK_MODE) {
    await delay(800);
    return {
      id: `req-${Date.now()}`, clientId: "client-001", professionalId: payload.professionalId,
      category: payload.category, description: payload.description,
      address: { street: payload.address.street, zone: payload.address.zone, city: payload.address.city },
      status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  }
  const { data: userData } = await supabase.auth.getUser();
  const clientId = userData.user?.id;
  if (!clientId) throw { code: "not_authenticated", message: "Debes iniciar sesión para solicitar un servicio." };

  const { data, error } = await supabase.from("service_requests").insert({
    client_id: clientId, professional_id: payload.professionalId ?? null, category: payload.category,
    description: payload.description, address_street: payload.address.street,
    address_zone: payload.address.zone, address_city: payload.address.city,
    address_lat: payload.address.lat, address_lng: payload.address.lng,
  }).select().single();
  if (error) throw { code: "db_error", message: error.message };
  return rowToServiceRequest(data);
}

// status="completed" puede venir acompañado del precio acordado por chat
export async function updateJobStatus(
  requestId: string,
  status: ApiJobStatus,
  agreedPrice?: number,
): Promise<ServiceRequest> {
  if (config.MOCK_MODE) { await delay(400); return { id: requestId, status } as ServiceRequest; }
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "completed") {
    patch.completed_at = new Date().toISOString();
    if (agreedPrice != null) patch.agreed_price = agreedPrice;
  }
  const { data, error } = await supabase.from("service_requests").update(patch).eq("id", requestId).select().single();
  if (error) throw { code: "db_error", message: error.message };
  return rowToServiceRequest(data);
}

export async function getJobById(requestId: string): Promise<ServiceRequest> {
  if (config.MOCK_MODE) { await delay(300); return { id: requestId, status: "pending" } as ServiceRequest; }
  const { data, error } = await supabase.from("service_requests").select("*").eq("id", requestId).single();
  if (error) throw { code: "db_error", message: error.message };
  return rowToServiceRequest(data);
}

// Solicitud activa más reciente asignada a un profesional (pendiente de
// aceptar o ya en curso). Se usa para que el panel del profesional muestre
// solicitudes reales sin depender de que cliente y profesional compartan
// la misma pestaña del navegador.
const ACTIVE_REQUEST_STATUSES: ApiJobStatus[] = ["pending", "accepted", "en_camino", "en_sitio", "in_progress"];

export async function getActiveRequestForProfessional(
  professionalId: string,
): Promise<(ServiceRequest & { clientName?: string }) | null> {
  if (config.MOCK_MODE) return null;
  const { data, error } = await supabase
    .from("service_requests")
    .select("*, clients(name)")
    .eq("professional_id", professionalId)
    .in("status", ACTIVE_REQUEST_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw { code: "db_error", message: error.message };
  if (!data) return null;
  return { ...rowToServiceRequest(data), clientName: (data as any).clients?.name };
}

// Suscribe a los cambios (nuevas solicitudes y cambios de estado) de las
// solicitudes asignadas a un profesional, vía Supabase Realtime.
export function subscribeToRequestChanges(
  professionalId: string,
  onChange: (row: ServiceRequest) => void,
): () => void {
  if (config.MOCK_MODE) return () => {};
  const channel = supabase
    .channel(`pro-requests-${professionalId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "service_requests", filter: `professional_id=eq.${professionalId}` },
      (payload) => onChange(rowToServiceRequest(payload.new)),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── Despacho automático (broadcast + primero-en-aceptar) ────────────────────
// El cliente ya no elige un profesional: la solicitud queda sin asignar
// (professional_id null, status 'pending') y se transmite a los profesionales
// activos/online de esa categoría (ver RLS requests_select_broadcast_pool).
// El radio de búsqueda se amplía solo por etapas vía un job de pg_cron
// (expand_stale_request_radius) — no depende de que el cliente tenga la
// pestaña abierta.

export type ProReasonCode = "too_far" | "client_unresponsive" | "no_longer_available" | "other";
export type ClientReasonCode = "price_too_high" | "professional_unresponsive" | "no_longer_needed" | "other";

// El primero en aceptar gana: la seguridad ante la condición de carrera la da
// el UPDATE atómico dentro del RPC (accept_service_request), no este cliente.
export async function acceptServiceRequest(requestId: string): Promise<ServiceRequest> {
  if (config.MOCK_MODE) { await delay(400); return { id: requestId, status: "accepted" } as ServiceRequest; }
  const { data, error } = await supabase.rpc("accept_service_request", { p_request_id: requestId });
  if (error) {
    if (error.message.includes("request_already_taken")) {
      throw { code: "request_already_taken", message: "Otro profesional ya aceptó esta solicitud." };
    }
    throw { code: "db_error", message: error.message };
  }
  return rowToServiceRequest(data);
}

// Rechazar (antes de aceptar) solo registra el motivo — la solicitud sigue
// 'pending' y visible para el resto de los profesionales de la categoría.
export async function rejectServiceRequest(requestId: string, reasonCode: ProReasonCode, reasonText?: string): Promise<void> {
  if (config.MOCK_MODE) { await delay(300); return; }
  const { error } = await supabase.rpc("reject_service_request", {
    p_request_id: requestId, p_reason_code: reasonCode, p_reason_text: reasonText ?? null,
  });
  if (error) throw { code: "db_error", message: error.message };
}

// Cancelar (después de aceptar) registra el motivo y reinicia la búsqueda
// desde el radio inicial — válido tanto para el cliente como el profesional asignado.
export async function cancelActiveJob(
  requestId: string,
  reasonCode: ProReasonCode | ClientReasonCode,
  reasonText?: string,
): Promise<ServiceRequest> {
  if (config.MOCK_MODE) { await delay(400); return { id: requestId, status: "pending" } as ServiceRequest; }
  const { data, error } = await supabase.rpc("cancel_active_job", {
    p_request_id: requestId, p_reason_code: reasonCode, p_reason_text: reasonText ?? null,
  });
  if (error) throw { code: "db_error", message: error.message };
  return rowToServiceRequest(data);
}

// Solicitudes que este profesional ya rechazó o canceló — para no
// volver a ofrecérselas cuando el radio se amplía.
export async function getRejectedRequestIds(professionalId: string): Promise<string[]> {
  if (config.MOCK_MODE) return [];
  const { data, error } = await supabase
    .from("request_events")
    .select("request_id")
    .eq("professional_id", professionalId)
    .in("event_type", ["reject", "cancel_by_professional"]);
  if (error) throw { code: "db_error", message: error.message };
  return (data ?? []).map((r: any) => r.request_id);
}

// La "bolsa" de solicitudes disponibles en la categoría de un profesional.
// El radio se filtra en el cliente (haversineKm), no acá — Realtime no
// puede filtrar por distancia, solo por columnas simples.
export async function getAvailableOffersForProfessional(category: ServiceCategory): Promise<ServiceRequest[]> {
  if (config.MOCK_MODE) return [];
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("category", category)
    .is("professional_id", null)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw { code: "db_error", message: error.message };
  return (data ?? []).map(rowToServiceRequest);
}

// Suscribe a los cambios de la bolsa de solicitudes disponibles de una
// categoría (nuevas solicitudes, ampliación de radio, alguien más la acepta).
export function subscribeToAvailableOffers(category: ServiceCategory, onChange: (row: ServiceRequest) => void): () => void {
  if (config.MOCK_MODE) return () => {};
  const channel = supabase
    .channel(`offers-${category}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "service_requests", filter: `category=eq.${category}` },
      (payload) => onChange(rowToServiceRequest(payload.new)),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// Suscribe a los cambios de UNA solicitud puntual (usado por el cliente
// mientras espera a que alguien acepte la suya).
export function subscribeToJobChanges(requestId: string, onChange: (row: ServiceRequest) => void): () => void {
  if (config.MOCK_MODE) return () => {};
  const channel = supabase
    .channel(`job-${requestId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "service_requests", filter: `id=eq.${requestId}` },
      (payload) => onChange(rowToServiceRequest(payload.new)),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function getMessages(requestId: string): Promise<ChatMessage[]> {
  if (config.MOCK_MODE) { await delay(300); return []; }
  const { data, error } = await supabase.from("chat_messages").select("*").eq("request_id", requestId).order("sent_at", { ascending: true });
  if (error) throw { code: "db_error", message: error.message };
  return (data ?? []).map(m => ({ id: m.id, requestId: m.request_id, from: m.sender_role, senderId: m.sender_id, text: m.text, sentAt: m.sent_at }));
}

// Suscribe a los mensajes nuevos de una solicitud vía Supabase Realtime.
// RLS de chat_messages (messages_select_involved) ya limita los eventos que
// llegan solo al cliente o profesional involucrados en esa solicitud.
// Devuelve una función para cancelar la suscripción.
export function subscribeToMessages(requestId: string, onInsert: (m: ChatMessage) => void): () => void {
  if (config.MOCK_MODE) return () => {};
  const channel = supabase
    .channel(`chat-${requestId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `request_id=eq.${requestId}` },
      (payload) => {
        const m = payload.new as any;
        onInsert({ id: m.id, requestId: m.request_id, from: m.sender_role, senderId: m.sender_id, text: m.text, sentAt: m.sent_at });
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function sendMessage(requestId: string, text: string): Promise<ChatMessage> {
  if (config.MOCK_MODE) {
    await delay(200);
    return { id: `msg-${Date.now()}`, requestId, from: "client", senderId: "client-001", text, sentAt: new Date().toISOString() };
  }
  const { data: userData } = await supabase.auth.getUser();
  const senderId = userData.user?.id;
  if (!senderId) throw { code: "not_authenticated", message: "Debes iniciar sesión para chatear." };

  const { data: req } = await supabase.from("service_requests").select("client_id, professional_id").eq("id", requestId).single();
  const senderRole = req?.client_id === senderId ? "client" : "professional";

  const { data, error } = await supabase.from("chat_messages").insert({
    request_id: requestId, sender_role: senderRole, sender_id: senderId, text,
  }).select().single();
  if (error) throw { code: "db_error", message: error.message };
  return { id: data.id, requestId: data.request_id, from: data.sender_role, senderId: data.sender_id, text: data.text, sentAt: data.sent_at };
}

// ─── Calificaciones (estrellas 1-5 + comentario) ─────────────────────────────

export async function submitReview(data: {
  requestId: string; rating: number; comment?: string;
}): Promise<Review> {
  if (config.MOCK_MODE) {
    await delay(600);
    return { id: `review-${Date.now()}`, requestId: data.requestId, fromClientId: "client-001", toProfessionalId: "pro-001", rating: data.rating, comment: data.comment, createdAt: new Date().toISOString() };
  }
  const { data: userData } = await supabase.auth.getUser();
  const clientId = userData.user?.id;
  if (!clientId) throw { code: "not_authenticated", message: "Debes iniciar sesión para calificar." };

  const { data: req, error: reqError } = await supabase.from("service_requests").select("professional_id").eq("id", data.requestId).single();
  if (reqError || !req?.professional_id) throw { code: "db_error", message: "No se encontró el profesional de esta solicitud." };

  const { data: review, error } = await supabase.from("reviews").insert({
    request_id: data.requestId, from_client_id: clientId, to_professional_id: req.professional_id,
    rating: data.rating, comment: data.comment,
  }).select().single();
  if (error) throw { code: "db_error", message: error.message };

  await supabase.from("service_requests").update({ status: "rated" }).eq("id", data.requestId);

  return { id: review.id, requestId: review.request_id, fromClientId: review.from_client_id, toProfessionalId: review.to_professional_id, rating: review.rating, comment: review.comment ?? undefined, createdAt: review.created_at };
}

// ─── Registro de profesional ──────────────────────────────────────────────────

export interface RegisterProPayload {
  name: string; phone: string; email: string; password: string;
  specialty: ServiceCategory; ci: string; yearsExp: number; bio: string;
}

export async function registerProfessional(payload: RegisterProPayload): Promise<{ id: string }> {
  if (config.MOCK_MODE) { await delay(1000); return { id: `pro-${Date.now()}` }; }

  // 1. Crear la cuenta de autenticación
  const userId = await signUpProfessionalAuth(payload.email, payload.password);

  // 2. Crear el perfil profesional, queda en estado "pending" hasta que el admin lo apruebe
  const { error } = await supabase.from("professionals").insert({
    id: userId, name: payload.name, phone: payload.phone, specialty: payload.specialty,
    ci: payload.ci, years_exp: payload.yearsExp, bio: payload.bio, status: "pending",
  });
  if (error) throw { code: "db_error", message: error.message };
  return { id: userId };
}

// ─── Subida de documentos (CI, selfie, certificados) ─────────────────────────

export async function uploadDocument(
  professionalId: string,
  type: "ci_front" | "ci_back" | "selfie" | "certificate",
  file: File,
): Promise<{ url: string }> {
  if (config.MOCK_MODE) {
    await delay(1200);
    return { url: `https://storage.magiver.com/docs/${professionalId}/${type}_${file.name}` };
  }
  // Sube el archivo al bucket privado "verification-docs", en una carpeta por usuario
  // (necesaria para que las políticas de seguridad del bucket funcionen).
  const path = `${professionalId}/${type}_${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from("verification-docs").upload(path, file, { upsert: true });
  if (uploadError) throw { code: "storage_error", message: uploadError.message };

  const { data: signed, error: signedError } = await supabase.storage.from("verification-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signedError) throw { code: "storage_error", message: signedError.message };

  const column =
    type === "ci_front" ? "ci_front_url" :
    type === "ci_back" ? "ci_back_url" :
    type === "selfie" ? "selfie_url" : null;

  if (column) {
    const { error: docError } = await supabase.from("professional_documents").upsert(
      { professional_id: professionalId, [column]: signed.signedUrl },
      { onConflict: "professional_id" },
    );
    if (docError) throw { code: "db_error", message: docError.message };
  } else {
    const { data: existing } = await supabase.from("professional_documents").select("certificate_urls").eq("professional_id", professionalId).maybeSingle();
    const certs = [...(existing?.certificate_urls ?? []), signed.signedUrl];
    const { error: docError } = await supabase.from("professional_documents").upsert(
      { professional_id: professionalId, certificate_urls: certs },
      { onConflict: "professional_id" },
    );
    if (docError) throw { code: "db_error", message: docError.message };
  }

  return { url: signed.signedUrl };
}

// ─── Foto de trabajo terminado ────────────────────────────────────────────────

export async function uploadJobPhoto(requestId: string, file: File): Promise<{ url: string }> {
  if (config.MOCK_MODE) {
    await delay(1200);
    return { url: `https://storage.magiver.com/jobs/${requestId}/${file.name}` };
  }
  const path = `${requestId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file, { upsert: true });
  if (uploadError) throw { code: "storage_error", message: uploadError.message };

  const { data: signed, error: signedError } = await supabase.storage.from("job-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signedError) throw { code: "storage_error", message: signedError.message };

  const { error: updateError } = await supabase.from("service_requests").update({ completion_photo_url: signed.signedUrl }).eq("id", requestId);
  if (updateError) throw { code: "db_error", message: updateError.message };

  return { url: signed.signedUrl };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  if (config.MOCK_MODE) {
    await delay(500);
    return { totalClients: 248, totalProfessionals: 37, pendingVerifications: 3, activeProfessionals: 31, requestsToday: 31, requestsTotal: 1432, completionRate: 0.94 };
  }
  const [clients, pros, active, pending, requests] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("professionals").select("id", { count: "exact", head: true }),
    supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("service_requests").select("id, status", { count: "exact" }),
  ]);
  const totalRequests = requests.count ?? 0;
  const completed = (requests.data ?? []).filter(r => r.status === "completed" || r.status === "rated").length;
  return {
    totalClients: clients.count ?? 0,
    totalProfessionals: pros.count ?? 0,
    pendingVerifications: pending.count ?? 0,
    activeProfessionals: active.count ?? 0,
    requestsToday: 0, // requiere filtrar por fecha; se puede agregar con un rango en created_at
    requestsTotal: totalRequests,
    completionRate: totalRequests > 0 ? completed / totalRequests : 0,
  };
}

export async function getPendingVerifications(): Promise<PaginatedResponse<PendingVerification>> {
  if (config.MOCK_MODE) { await delay(600); return { data: [], total: 0, page: 1, pageSize: 20 }; }
  const { data, error, count } = await supabase
    .from("professionals")
    .select("*, professional_documents(*)", { count: "exact" })
    .eq("status", "pending");
  if (error) throw { code: "db_error", message: error.message };

  const result: PendingVerification[] = (data ?? []).map((row: any) => {
    // professional_documents.professional_id es UNIQUE, así que PostgREST
    // embebe la relación como objeto (uno a uno), no como array.
    const docs = row.professional_documents;
    return {
      id: row.id,
      professional: rowToProUser(row),
      documents: {
        ciFrontUrl: docs?.ci_front_url ?? "",
        ciBackUrl: docs?.ci_back_url ?? undefined,
        selfieUrl: docs?.selfie_url ?? "",
        certificateUrls: docs?.certificate_urls ?? [],
      },
      submittedAt: docs?.submitted_at ?? row.created_at,
    };
  });
  return { data: result, total: count ?? result.length, page: 1, pageSize: result.length };
}

export async function approveVerification(verificationId: string): Promise<void> {
  if (config.MOCK_MODE) { await delay(800); return; }
  const { error } = await supabase.from("professionals").update({ status: "active" }).eq("id", verificationId);
  if (error) throw { code: "db_error", message: error.message };
}

export async function rejectVerification(verificationId: string, reason: string): Promise<void> {
  if (config.MOCK_MODE) { await delay(800); return; }
  const { error } = await supabase.from("professionals").update({ status: "rejected", rejection_reason: reason }).eq("id", verificationId);
  if (error) throw { code: "db_error", message: error.message };
}

// ─── Mock data (usada solo si VITE_MOCK_MODE no está en "false") ─────────────

const MOCK_PROFESSIONALS: ProUser[] = [
  {
    id: "pro-001", role: "professional", name: "Carlos Rojas", email: "carlos@email.com",
    phone: "+591 78901234", specialty: "electricista", ci: "5678901 SC",
    yearsExp: 8, bio: "Técnico eléctrico certificado.", status: "active",
    rating: 4.9, reviewCount: 47, completedJobs: 134, isOnline: true,
    createdAt: "2025-01-15T00:00:00Z",
    location: { lat: -17.785, lng: -63.181 },
  },
  {
    id: "pro-002", role: "professional", name: "Ana Mendoza", email: "ana@email.com",
    phone: "+591 76543210", specialty: "plomero", ci: "4321098 LP",
    yearsExp: 6, bio: "Especialista en instalaciones sanitarias.", status: "active",
    rating: 4.8, reviewCount: 32, completedJobs: 89, isOnline: true,
    createdAt: "2025-02-01T00:00:00Z",
    location: { lat: -17.787, lng: -63.178 },
  },
];

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
