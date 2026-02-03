import { useCallback, useEffect, useMemo, useRef } from "react";

import { createSocket, disconnectSocket, getSocket } from "@/services/websocketClient";
import { useWebsocketStore } from "@/stores/websocketStore";
import type { WebSocketEvent } from "@/types/websocket";

type UseWebSocketOptions = {
  bookId?: string;
  chapterId?: string;
  enabled?: boolean;
  onEvent?: (event: WebSocketEvent) => void;
};

type WebSocketStatus = "connected" | "reconnecting" | "offline" | "disabled";

const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

const getReconnectDelay = (attempt: number) =>
  Math.min(MAX_DELAY, BASE_DELAY * Math.pow(2, attempt));

export const useWebSocket = ({ bookId, chapterId, enabled = true, onEvent }: UseWebSocketOptions) => {
  const url = process.env.NEXT_PUBLIC_WS_URL;
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const {
    connected,
    reconnectAttempts,
    connect,
    disconnect,
    onEvent: storeEvent,
    queueEvent,
    dequeueEvents,
    setReconnectAttempts,
  } = useWebsocketStore();

  const status: WebSocketStatus = useMemo(() => {
    if (!url || !enabled) return "disabled";
    if (connected) return "connected";
    if (reconnectAttempts > 0) return "reconnecting";
    return "offline";
  }, [connected, enabled, reconnectAttempts, url]);

  const emit = useCallback(
    (type: string, payload: unknown) => {
      const socket = getSocket();
      if (!socket || !connected) {
        queueEvent({ type, payload });
        return;
      }
      socket.emit(type, payload);
    },
    [connected, queueEvent],
  );

  useEffect(() => {
    if (!url || !enabled) return;

    const socket = createSocket(url);

    const handleConnect = () => {
      connect();
      attemptsRef.current = 0;
      setReconnectAttempts(0);
      if (bookId && chapterId) {
        socket.emit("join", { bookId, chapterId });
      }
      const pending = dequeueEvents();
      pending.forEach((event) => socket.emit(event.type, event.payload));
    };

    const handleDisconnect = () => {
      disconnect();
      attemptsRef.current += 1;
      setReconnectAttempts(attemptsRef.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const delay = getReconnectDelay(attemptsRef.current);
      reconnectTimer.current = setTimeout(() => {
        socket.connect();
      }, delay);
    };

    const handleEvent = (eventName: string, payload: unknown) => {
      const event: WebSocketEvent = {
        type: eventName,
        payload,
        timestamp: new Date().toISOString(),
      };
      storeEvent(event);
      onEvent?.(event);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.onAny(handleEvent);

    socket.connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (bookId && chapterId) {
        socket.emit("leave", { bookId, chapterId });
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.offAny(handleEvent);
      disconnectSocket();
    };
  }, [bookId, chapterId, connect, disconnect, dequeueEvents, enabled, onEvent, setReconnectAttempts, storeEvent, url]);

  return { status, connected, reconnectAttempts, emit };
};
