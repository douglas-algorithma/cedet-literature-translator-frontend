import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => socket;

export const createSocket = (url?: string) => {
  if (socket) return socket;

  socket = io(url ?? process.env.NEXT_PUBLIC_WS_URL ?? "", {
    autoConnect: false,
    reconnection: false,
    transports: ["websocket"],
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
