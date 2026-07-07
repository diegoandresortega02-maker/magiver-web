// ─── MAGIVER — Tipos compartidos web ↔ app móvil ──────────────────────────────
// Este archivo define los contratos de datos que el backend devuelve.
// La app móvil (React Native / Flutter) debe usar exactamente los mismos tipos.

// ─── Usuarios ────────────────────────────────────────────────────────────────

export type UserRole = "client" | "professional" | "admin";

export interface BaseUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ClientUser extends BaseUser {
  role: "client";
  totalRequests: number;
}

export interface ProUser extends BaseUser {
  role: "professional";
  specialty: string;
  ci: string;
  yearsExp: number;
  bio: string;
  status: "pending" | "active" | "suspended" | "rejected";
  rating: number;
  reviewCount: number;
  completedJobs: number;
  location?: GeoPoint;
  isOnline: boolean;
  rejectionReason?: string;
  homeAddress?: { street: string; zone: string; city: string }; // solo capturada en el registro, para verificación
}

export interface AdminUser extends BaseUser {
  role: "admin";
}

// ─── Geolocalización ─────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  zone: string;
  city: string;
  coordinates?: GeoPoint;
}

// ─── Servicios ───────────────────────────────────────────────────────────────

export type ServiceCategory =
  | "electricista"
  | "plomero"
  | "aire_acondicionado"
  | "albanil"
  | "pintor"
  | "mecanico_moto"
  | "mecanico_auto"
  | "lavado_autos"
  | "termotanques"
  | "jardineria"
  | "fumigacion"
  | "profesor_matematicas"
  | "profesor_quimica"
  | "profesor_fisica"
  | "profesor_ingles"
  | "otro";

export type JobStatus =
  | "pending"      // Cliente envió solicitud, esperando respuesta
  | "accepted"     // Profesional aceptó
  | "en_camino"    // Profesional en camino
  | "en_sitio"     // Profesional llegó
  | "in_progress"  // Trabajo en curso
  | "completed"    // Marcado como completado por el profesional
  | "rated"        // Cliente calificó
  | "cancelled";   // Cancelado por cualquiera de las partes

export interface ServiceRequest {
  id: string;
  clientId: string;
  professionalId?: string;
  category: ServiceCategory;
  description: string;
  address: Address;
  status: JobStatus;
  agreedPrice?: number;      // precio acordado por chat, registrado al completar (sin cobro dentro de la app)
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  searchRadiusKm?: number;   // radio actual de transmisión mientras status='pending' sin asignar
  radiusTier?: number;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  requestId: string;
  from: "client" | "professional";
  senderId: string;
  text: string;
  sentAt: string;
  readAt?: string;
}

// ─── Calificaciones ──────────────────────────────────────────────────────────

export interface Review {
  id: string;
  requestId: string;
  fromClientId: string;
  toProfessionalId: string;
  rating: number;             // 1–5
  comment?: string;
  createdAt: string;
}

// ─── Documentos de verificación ──────────────────────────────────────────────

export interface VerificationDocuments {
  ciFrontUrl: string;
  ciBackUrl?: string;
  selfieUrl: string;
  certificateUrls: string[];
}

export interface PendingVerification {
  id: string;
  professional: ProUser;
  documents: VerificationDocuments;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export interface AuthSession {
  user: ClientUser | ProUser | AdminUser;
  tokens: AuthTokens;
}

// ─── Respuestas del API ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// ─── Eventos WebSocket ────────────────────────────────────────────────────────
// Los mismos eventos se usan en web y en la app móvil via socket.io

export type WsEventType =
  | "request:new"           // Nueva solicitud para el profesional
  | "request:accepted"      // Profesional aceptó
  | "request:rejected"      // Profesional rechazó
  | "job:status_changed"    // Estado del trabajo cambió
  | "job:location_update"   // Actualización de ubicación del profesional
  | "chat:new_message"      // Nuevo mensaje de chat
  | "chat:message_read"     // Mensaje leído
  | "pro:online"            // Profesional se conectó
  | "pro:offline"           // Profesional se desconectó
  | "notification:push"     // Notificación push

export interface WsEvent<T = unknown> {
  type: WsEventType;
  payload: T;
  timestamp: string;
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  // data.type determina la pantalla a abrir en la app:
  // "new_request", "request_accepted", "job_update", "new_message"
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalClients: number;
  totalProfessionals: number;
  pendingVerifications: number;
  activeProfessionals: number;
  requestsToday: number;
  requestsTotal: number;
  completionRate: number;
}
