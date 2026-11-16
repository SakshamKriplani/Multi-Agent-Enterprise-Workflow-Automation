import { Background, type Edge, MarkerType, type Node, ReactFlow } from "@xyflow/react";

import { type FlowNodeData, nodeTypes } from "../components/FlowNode";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const N = (id: string, label: string, x: number, y: number, kind = "box", subtitle?: string): Node<FlowNodeData> => ({
  id,
  type: "flow",
  position: { x, y },
  data: { label, kind, subtitle },
});

const nodes: Node<FlowNodeData>[] = [
  N("fe", "Frontend", 220, 0, "box", "React · Vite · React Flow"),
  N("api", "REST + WebSocket API", 205, 100, "orchestrator", "FastAPI /api/v1"),
  N("orch", "Orchestrator", 220, 200, "orchestrator", "LangGraph + interrupt()"),
  N("agents", "Agents (4)", 220, 300, "agent", "Request · Vendor · Budget · Approval"),
  N("tools", "Tools (allowlisted)", 220, 400, "box", "pure Python functions"),
  N("db", "SQLite", 120, 500, "report", "executions · events · approvals"),
  N("cp", "Checkpoint DB", 330, 500, "report", "LangGraph SQLite saver"),
  N("llm", "Ollama (optional)", 470, 300, "optional", "llm mode only"),
];
const e = (s: string, t: string, label?: string, dashed = false): Edge => ({
  id: `${s}-${t}`,
  source: s,
  target: t,
  label,
  style: { stroke: "#656D76", strokeDasharray: dashed ? "5 4" : undefined },
  labelStyle: { fontSize: 10, fill: "#656D76" },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#656D76" },
});
const edges = [
  e("fe", "api", "fetch / WS"),
  e("api", "orch"),
  e("orch", "agents"),
  e("agents", "tools"),
  e("tools", "db"),
  e("orch", "cp"),
  e("agents", "llm", "parse + prose", true),
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm leading-relaxed text-fg">{children}</CardContent>
    </Card>
  );
}

export function Architecture() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Architecture</h1>
        <p className="text-sm text-muted">One process, one orchestrator, four agents, controlled tools, SQLite.</p>
      </div>
      <Card className="h-[620px] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
        >
          <Background gap={16} color="#E5E9ED" />
        </ReactFlow>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Execution lifecycle">
          <p>
            <code>POST /executions</code> stores the request and starts the graph as a background asyncio task. Each
            node runs an agent through a common executor that times it, validates its output against a Pydantic schema,
            retries transient LLM errors, and emits events.
          </p>
          <p>
            Every event is written to SQLite <em>before</em> it is published to WebSocket subscribers. A late or
            refreshed client replays persisted events, then follows the live stream.
          </p>
          <p>
            When policy requires a human, the graph pauses with <code>interrupt()</code>. The decision endpoint resumes
            it with <code>Command(resume=…)</code>. The checkpoint is on disk, so a pending approval survives a backend
            restart.
          </p>
        </Section>
        <Section title="Execution modes">
          <p>
            <strong>Demo mode</strong> uses a rule-based parser and template explanations. It needs no model and no API
            keys. The public deployment runs this mode.
          </p>
          <p>
            <strong>LLM mode</strong> calls a local Ollama model to parse the request (validated against a JSON schema)
            and to write explanation prose. If the model times out or returns invalid output, the agent fails visibly;
            there is no silent fallback.
          </p>
          <p>In both modes cost, budget, routing and approval rules are the same deterministic Python.</p>
        </Section>
        <Section title="Technology choices">
          <ul className="list-disc space-y-1 pl-5">
            <li>FastAPI + Pydantic for typed REST/WebSocket APIs and validation.</li>
            <li>LangGraph for the graph, conditional routing, interrupts and checkpointing.</li>
            <li>SQLAlchemy 2 + Alembic on SQLite: zero-ops persistence for a single-process demo.</li>
            <li>React + Vite + Tailwind + shadcn-style components; React Flow for graphs.</li>
          </ul>
        </Section>
        <Section title="Limitations">
          <ul className="list-disc space-y-1 pl-5">
            <li>SQLite and checkpoint files are ephemeral on free hosting; the app re-seeds on startup.</li>
            <li>Single process: the event bus and rate limiter are in-memory.</li>
            <li>No authentication; every reviewer is recorded as <code>demo_user</code>.</li>
            <li>All vendors, prices and budgets are fictional. Nothing is purchased.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
