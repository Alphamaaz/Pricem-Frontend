import { io, type Socket } from "socket.io-client";
import { ASSET_URL, tokenStore } from "./api";

let socket: Socket | null = null;

export function getRealtimeSocket() {
  const token = tokenStore.get();
  if (!token) return null;
  if (!socket) {
    socket = io(ASSET_URL, {
      autoConnect: false,
      auth: { token },
      transports: ["websocket", "polling"],
    });
  }
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
