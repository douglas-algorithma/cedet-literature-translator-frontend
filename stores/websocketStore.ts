import { create } from "zustand";

import type { WebSocketEvent } from "@/types/websocket";

type WebsocketStore = {
  connected: boolean;
  lastEvent: WebSocketEvent | null;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
  onEvent: (event: WebSocketEvent) => void;
  emit: (event: WebSocketEvent) => void;
};

export const useWebsocketStore = create<WebsocketStore>((set) => ({
  connected: false,
  lastEvent: null,
  reconnectAttempts: 0,
  connect: () => set({ connected: true }),
  disconnect: () => set({ connected: false }),
  onEvent: (event) => set({ lastEvent: event }),
  emit: (event) => set({ lastEvent: event }),
}));
