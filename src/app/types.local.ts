import type { GeoPoint } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ClientUser { id?: string; name: string; phone: string; email: string; createdAt?: string }

export interface ProUser {
  id?: string;
  name: string; phone: string; email: string;
  specialties: string[]; ci: string;
  yearsExp: number; bio: string;
  rating?: number; reviewCount?: number; completedJobs?: number;
  status: "pending" | "active" | "rejected";
}

export interface DocumentSet {
  ciFront: string; ciBack: string; selfie: string;
  certificates: string[];
}

export interface Professional {
  id: string; name: string; specialty: string; rating: number;
  reviews: number; distance: number; eta: number;
  initials: string; color: string; verified: boolean; jobs: number; bio: string;
  location?: GeoPoint;
}

export interface Message { id: string; from: "client" | "pro"; text: string; time: string }
export interface ServiceRequest {
  service: string; description: string; address: string;
  id?: string; professionalId?: string; agreedPrice?: number; completionPhotoUrls?: string[];
  clientName?: string; lat?: number; lng?: number; searchRadiusKm?: number;
}

export type JobStatus = "idle" | "searching" | "matched" | "en_camino" | "en_sitio" | "completado";
export type Screen =
  | "landing"
  | "client-auth" | "client-profile" | "client-services" | "client-map"
  | "client-request" | "client-searching" | "client-tracking" | "client-rate" | "client-done"
  | "pro-auth" | "pro-register" | "pro-documents" | "pro-docview" | "pro-verify"
  | "pro-dashboard" | "pro-profile" | "pro-request" | "pro-job" | "pro-done"
  | "admin-auth" | "admin-dashboard" | "admin-pro-review";
