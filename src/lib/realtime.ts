// ─── MAGIVER — Servicio de tiempo real (WebSocket) ────────────────────────────
// Gestiona la conexión WebSocket para:
//   • Chat cliente ↔ profesional
//   • Actualizaciones de estado del trabajo en tiempo real
//   • Tracking GPS del profesional en el mapa
//   • Notificaciones de nuevas solicitudes para el profesional
//
// TODO: instalar socket.io-client cuando el backend WS esté listo:
//   npm install socket.io-client
//   Descomentar las importaciones de socket.io y eliminar el mock

import { config } from "./config";
import { getAccessToken } from "./auth";
import type { WsEvent, WsEventType, ChatMessage, GeoPoint, JobStatus } from "./types";

// ─── Tipos internos ───────────────────────────────────────────────────────────

type EventHandler<T = unknown> = (payload: T) => void;

interface RealtimeService {
  connect(userId: string, role: "client" | "professional"): void;
  disconnect(): void;
  joinJob(requestId: string): void;
  leaveJob(requestId: string): void;
  sendMessage(requestId: string, text: string): void;
  updateLocation(location: GeoPoint): void;
  on<T>(event: WsEventType, handler: EventHandler<T>): () => void;
  isConnected(): boolean;
}

// ─── Implementación mock ──────────────────────────────────────────────────────
// Simula el comportamiento del WebSocket con callbacks locales.
// Eliminar esto cuando el backend WS esté operativo.

class MockRealtimeService implements RealtimeService {
  private handlers = new Map<WsEventType, Set<EventHandler>>();
  private _connected = false;

  connect(userId: string, role: string): void {
    this._connected = true;
    console.info(`[Realtime MOCK] Conectado como ${role} (${userId})`);
  }

  disconnect(): void {
    this._connected = false;
    this.handlers.clear();
    console.info("[Realtime MOCK] Desconectado");
  }

  joinJob(requestId: string): void {
    console.info(`[Realtime MOCK] Unido al room del trabajo ${requestId}`);
  }

  leaveJob(requestId: string): void {
    console.info(`[Realtime MOCK] Saliendo del room ${requestId}`);
  }

  sendMessage(requestId: string, text: string): void {
    // El mock no hace nada — los mensajes se manejan con estado local en App.tsx
    // En producción: socket.emit("chat:send", { requestId, text })
    console.info(`[Realtime MOCK] Mensaje enviado al room ${requestId}: "${text}"`);
  }

  updateLocation(location: GeoPoint): void {
    // En producción: socket.emit("location:update", location)
    console.info("[Realtime MOCK] Ubicación actualizada:", location);
  }

  on<T>(event: WsEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as EventHandler);
    return () => this.handlers.get(event)?.delete(handler as EventHandler);
  }

  // Método de prueba — simula que llega un evento del servidor
  // Usar desde la consola del navegador:
  //   window.__magiver_realtime.simulate("chat:new_message", { text: "Hola!" })
  simulate<T>(event: WsEventType, payload: T): void {
    this.handlers.get(event)?.forEach(h => h(payload));
  }

  isConnected(): boolean { return this._connected; }
}

// ─── TODO: Implementación real con socket.io ──────────────────────────────────
// Descomentar cuando el backend WS esté listo y eliminar MockRealtimeService

// import { io, Socket } from "socket.io-client";
//
// class SocketIORealtimeService implements RealtimeService {
//   private socket: Socket | null = null;
//
//   connect(userId: string, role: string): void {
//     this.socket = io(config.WS_URL, {
//       auth: { token: getAccessToken() },
//       query: { userId, role },
//       transports: ["websocket"],
//       reconnection: true,
//       reconnectionDelay: 1000,
//     });
//
//     this.socket.on("connect", () => {
//       console.info(`[Realtime] Conectado al servidor WS`);
//     });
//
//     this.socket.on("disconnect", (reason) => {
//       console.warn(`[Realtime] Desconectado: ${reason}`);
//     });
//
//     this.socket.on("connect_error", (err) => {
//       console.error("[Realtime] Error de conexión:", err.message);
//     });
//   }
//
//   disconnect(): void { this.socket?.disconnect(); this.socket = null; }
//   joinJob(requestId: string): void { this.socket?.emit("job:join", requestId); }
//   leaveJob(requestId: string): void { this.socket?.emit("job:leave", requestId); }
//   sendMessage(requestId: string, text: string): void {
//     this.socket?.emit("chat:send", { requestId, text });
//   }
//   updateLocation(location: GeoPoint): void {
//     this.socket?.emit("location:update", location);
//   }
//   on<T>(event: WsEventType, handler: EventHandler<T>): () => void {
//     this.socket?.on(event, handler as EventHandler);
//     return () => this.socket?.off(event, handler as EventHandler);
//   }
//   isConnected(): boolean { return this.socket?.connected ?? false; }
// }

// ─── Singleton exportado ──────────────────────────────────────────────────────

export const realtime: RealtimeService = new MockRealtimeService();

// Exponer en window para testing desde la consola del navegador
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__magiver_realtime = realtime;
}
