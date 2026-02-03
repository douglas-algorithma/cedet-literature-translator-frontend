import { create } from "zustand";

import type { WebSocketEvent } from "@/types/websocket";

export type WebSocketQueuedEvent = {
  type: string;
  payload: unknown;
};

type WebsocketStore = {
  connected: boolean;
  lastEvent: WebSocketEvent | null;
  reconnectAttempts: number;
  pendingEvents: WebSocketQueuedEvent[];
  connect: () => void;
  disconnect: () => void;
  setReconnectAttempts: (value: number) => void;
  incrementReconnectAttempts: () => void;
  onEvent: (event: WebSocketEvent) => void;
  queueEvent: (event: WebSocketQueuedEvent) => void;
  dequeueEvents: () => WebSocketQueuedEvent[];
};

export const useWebsocketStore = create<WebsocketStore>((set, get) => ({
  connected: false,
  lastEvent: null,
  reconnectAttempts: 0,
  pendingEvents: [],
  connect: () => set({ connected: true }),
  disconnect: () => set({ connected: false }),
  setReconnectAttempts: (value) => set({ reconnectAttempts: value }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  onEvent: (event) => set({ lastEvent: event }),
  queueEvent: (event) =>
    set((state) => ({ pendingEvents: [...state.pendingEvents, event] })),
  dequeueEvents: () => {
    const events = get().pendingEvents;
    set({ pendingEvents: [] });
    return events;
  },
}));
