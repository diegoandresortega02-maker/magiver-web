import { distanceKm as haversineKm } from "@/lib/geo";
import type { ProUser as ApiProUser, ServiceRequest as ApiServiceRequest, GeoPoint } from "@/lib/types";
import {
  Zap, Droplets, Wind, Wrench, Paintbrush, Car,
  Bike, Sparkles, Flame, Leaf, Bug, Calculator, FlaskConical, Atom, Languages,
} from "lucide-react";
import type { Professional, JobStatus, ServiceRequest } from "../types.local";

// ─── Mock data ──────────────────────────────────────────────────────────────
export const PROFESSIONALS: Professional[] = [
  { id: "1", name: "Carlos Rojas", specialty: "Electricista", rating: 4.9, reviews: 47, distance: 1.0, eta: 12, initials: "CR", color: "#3B82F6", verified: true, jobs: 134, bio: "Técnico eléctrico con 8 años de experiencia en instalaciones residenciales y comerciales." },
  { id: "2", name: "Ana Mendoza", specialty: "Plomera", rating: 4.8, reviews: 32, distance: 1.4, eta: 15, initials: "AM", color: "#8B5CF6", verified: true, jobs: 89, bio: "Especialista en instalaciones sanitarias, reparación de tuberías y gasfitería." },
  { id: "3", name: "Roberto Vaca", specialty: "Pintor", rating: 4.7, reviews: 28, distance: 2.1, eta: 22, initials: "RV", color: "#F59E0B", verified: true, jobs: 67, bio: "Pintor profesional con acabados de alta calidad, interior y exterior." },
  { id: "4", name: "Luis Fernández", specialty: "Albañil", rating: 4.6, reviews: 53, distance: 2.8, eta: 28, initials: "LF", color: "#EF4444", verified: true, jobs: 201, bio: "Maestro constructor con experiencia en remodelaciones, revoque, pisos y trabajos civiles." },
];

export const SERVICES = [
  { id: "electricista", label: "Electricista", icon: Zap, color: "#F59E0B" },
  { id: "plomero", label: "Plomero", icon: Droplets, color: "#3B82F6" },
  { id: "aire_acondicionado", label: "Aire acond.", icon: Wind, color: "#06B6D4" },
  { id: "albanil", label: "Albañil", icon: Wrench, color: "#8B5CF6" },
  { id: "pintor", label: "Pintor", icon: Paintbrush, color: "#EC4899" },
  { id: "mecanico_moto", label: "Mecánico de motos", icon: Bike, color: "#DC2626" },
  { id: "mecanico_auto", label: "Mecánico de autos", icon: Car, color: "#1D4ED8" },
  { id: "lavado_autos", label: "Lavado de autos", icon: Sparkles, color: "#0EA5E9" },
  { id: "termotanques", label: "Termotanques", icon: Flame, color: "#EA580C" },
  { id: "jardineria", label: "Jardinería", icon: Leaf, color: "#16A34A" },
  { id: "fumigacion", label: "Fumigación", icon: Bug, color: "#A16207" },
  { id: "profesor_matematicas", label: "Profesor de Matemáticas", icon: Calculator, color: "#7C3AED" },
  { id: "profesor_quimica", label: "Profesor de Química", icon: FlaskConical, color: "#0891B2" },
  { id: "profesor_fisica", label: "Profesor de Física", icon: Atom, color: "#4F46E5" },
  { id: "profesor_ingles", label: "Profesor de Inglés", icon: Languages, color: "#DB2777" },
];

// Convierte el id técnico guardado en la base (ej. "aire_acondicionado")
// al label en español para mostrar en pantalla. Si ya viene un label
// (dato viejo/mock), lo devuelve tal cual.
export function specialtyLabel(value: string): string {
  return SERVICES.find(s => s.id === value)?.label ?? value;
}

// Motivos predefinidos para rechazar/cancelar (ver ReasonPickerSheet). Los
// códigos coinciden con reason_code en la tabla request_events.
export const PRO_REASONS: { code: string; label: string }[] = [
  { code: "too_far", label: "El lugar está muy lejos" },
  { code: "client_unresponsive", label: "El cliente no responde en el chat" },
  { code: "no_longer_available", label: "Ya no estoy disponible" },
  { code: "other", label: "Otro" },
];
export const CLIENT_REASONS: { code: string; label: string }[] = [
  { code: "price_too_high", label: "El precio cotizado es muy alto" },
  { code: "professional_unresponsive", label: "El profesional no responde en el chat" },
  { code: "no_longer_needed", label: "Ya no necesito el servicio" },
  { code: "other", label: "Otro" },
];

// Convierte un profesional real (de getNearbyProfessionals) a la forma que
// espera la UI del marketplace. Si se conoce la ubicación real del cliente
// y la del profesional, distance/eta se calculan de verdad (Haversine +
// una velocidad promedio de ciudad); si no, quedan como estimado fijo.
export const PRO_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];
export function proUserToProfessional(u: ApiProUser, index: number, clientLocation?: GeoPoint | null): Professional {
  let distance = 1.2, eta = 15;
  if (clientLocation && u.location) {
    distance = Math.round(haversineKm(clientLocation, u.location) * 10) / 10;
    eta = Math.max(5, Math.round((distance / 25) * 60)); // ~25 km/h en ciudad
  }
  return {
    id: u.id, name: u.name, specialty: u.specialties.map(specialtyLabel).join(", "), rating: u.rating,
    reviews: u.reviewCount, distance, eta, location: u.location,
    initials: u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    color: PRO_COLORS[index % PRO_COLORS.length], verified: true, jobs: u.completedJobs, bio: u.bio,
  };
}

export function nowStr() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Convierte una solicitud real (de getActiveRequestForProfessional /
// subscribeToRequestChanges) a la forma local que espera la UI del panel
// profesional, y su estado de Postgres al JobStatus local usado en pantalla.
export function apiStatusToLocal(status: ApiServiceRequest["status"]): JobStatus {
  if (status === "pending") return "searching"; // nadie la aceptó todavía (se está transmitiendo)
  if (status === "accepted") return "matched";
  if (status === "en_camino") return "en_camino";
  if (status === "en_sitio" || status === "in_progress") return "en_sitio";
  return "completado";
}

export function apiRequestToLocal(r: ApiServiceRequest & { clientName?: string }): ServiceRequest {
  return {
    id: r.id, professionalId: r.professionalId, agreedPrice: r.agreedPrice, clientName: r.clientName,
    service: specialtyLabel(r.category), description: r.description,
    address: [r.address.street, r.address.zone].filter(Boolean).join(", "),
    lat: r.address.coordinates?.lat, lng: r.address.coordinates?.lng, searchRadiusKm: r.searchRadiusKm,
  };
}
