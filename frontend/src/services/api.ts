import type {
  AgentDetail,
  AgentListItem,
  Approval,
  ExecutionDetail,
  ExecutionEvent,
  ExecutionSummary,
  Health,
  Page,
  WorkflowDefinition,
  WorkflowListItem,
} from "../types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "network_error", `Cannot reach the backend at ${API_BASE_URL}. Is it running?`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(res.status, err?.code ?? "http_error", err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return body as T;
}

export const api = {
  health: () => request<Health>("/health"),
  workflows: () => request<{ items: WorkflowListItem[] }>("/workflows"),
  workflow: (id: string) => request<WorkflowDefinition>(`/workflows/${id}`),
  agents: () => request<{ items: AgentListItem[] }>("/agents"),
  agent: (id: string) => request<AgentDetail>(`/agents/${id}`),
  createExecution: (text: string, idempotencyKey?: string) =>
    request<ExecutionSummary>("/executions", {
      method: "POST",
      body: JSON.stringify({ request: text }),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    }),
  executions: (limit = 10, offset = 0) => request<Page<ExecutionSummary>>(`/executions?limit=${limit}&offset=${offset}`),
  execution: (id: string) => request<ExecutionDetail>(`/executions/${id}`),
  events: (id: string, afterSequence = 0) =>
    request<{ items: ExecutionEvent[] }>(`/executions/${id}/events?after_sequence=${afterSequence}`),
  decide: (approvalId: string, decision: "approve" | "reject", comment?: string) =>
    request<Approval>(`/approvals/${approvalId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, comment: comment || null }),
    }),
  resetDemo: () => request<{ status: string; message: string }>("/demo/reset", { method: "POST" }),
};
