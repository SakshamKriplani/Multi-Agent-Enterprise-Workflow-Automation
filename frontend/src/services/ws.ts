import type { StreamMessage } from "../types";
import { API_BASE_URL } from "./api";

export function streamUrl(executionId: string, afterSequence: number): string {
  const base = API_BASE_URL.startsWith("http")
    ? API_BASE_URL.replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${API_BASE_URL}`;
  return `${base}/executions/${executionId}/stream?after_sequence=${afterSequence}`;
}

export interface StreamHandlers {
  onMessage: (msg: StreamMessage) => void;
  onOpen?: () => void;
  onDrop?: () => void;
}

/** Opens one WebSocket. Returns a function that closes it. Reconnect policy lives in the hook. */
export function openExecutionStream(executionId: string, afterSequence: number, handlers: StreamHandlers): () => void {
  const ws = new WebSocket(streamUrl(executionId, afterSequence));
  let closedByUs = false;
  ws.onopen = () => handlers.onOpen?.();
  ws.onmessage = (e) => {
    try {
      handlers.onMessage(JSON.parse(e.data) as StreamMessage);
    } catch {
      /* ignore malformed frames */
    }
  };
  ws.onclose = () => {
    if (!closedByUs) handlers.onDrop?.();
  };
  return () => {
    closedByUs = true;
    ws.close();
  };
}
