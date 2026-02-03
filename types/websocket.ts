export type WebSocketEvent<T = unknown> = {
  type: string;
  payload: T;
  timestamp: string;
};
