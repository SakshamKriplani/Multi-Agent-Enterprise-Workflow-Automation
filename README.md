# Enterprise AI Workflow Orchestration Platform

A multi-agent procurement automation demo. One LangGraph orchestrator coordinates four agents (Request, Vendor, Budget, Approval) over a shared typed state, with controlled tools, a human approval gate that survives restarts, persisted execution events, and a live dashboard.

**Stack:** FastAPI · LangGraph · Pydantic · SQLAlchemy · Alembic · SQLite · WebSockets · React · Vite · TypeScript · Tailwind · shadcn-style components · React Flow

> All vendors, prices and budgets are fictional. No real purchase is ever made.

## What it does

Submit a request such as *"Purchase 10 laptops for the engineering department with a maximum budget of ₹8,00,000."* The system parses it, compares vendors, checks the department budget, applies approval policy, pauses for a human when policy requires it, and produces a structured procurement report. The dashboard shows the graph, a live event timeline, each agent's inputs and outputs, and the final report.

Every number (cost, budget, thresholds, routing) is computed by deterministic Python. In `llm` mode a local Ollama model only parses the request text and writes explanation prose.

## Run it locally

Requirements: Python 3.10+ and Node 20+.

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000              # migrates + seeds on startup

# Frontend (second terminal)
cd frontend
npm install
npm run dev                                            # http://localhost:5173
```

Configuration comes from environment variables or `backend/.env` (see `.env.example`). Defaults run demo mode with SQLite under `backend/data/`.

### With Docker

```bash
docker compose up --build
```

Frontend on http://localhost:5173, API on http://localhost:8000/api/v1. Data persists in the `backend-data` volume.

### LLM mode (optional)

```bash
ollama pull llama3.1:8b
EXECUTION_MODE=llm uvicorn app.main:app --port 8000
```

## Tests

```bash
cd backend && pytest                 # 70 tests: unit, six scenarios, restart/resume, API, WebSocket, llm mode (mocked)
cd frontend && npm test              # component tests (Vitest + Testing Library)
cd frontend && npx playwright install chromium && npm run e2e   # full journey; needs backend + frontend running
python evals/run_eval.py [--llm]     # parser accuracy eval (see docs/evals.md)
```

## Architecture in brief

```
React UI ──REST/WS──► FastAPI ──► ExecutionService ──► LangGraph graph ──► Agents ──► allowlisted Tools ──► SQLite
                                         │                   │
                                         │                   └── SQLite checkpointer (approval interrupts survive restarts)
                                         └── EventPublisher: persist event, then publish to WebSocket subscribers
```

- **Graph:** `init → request → (invalid → finalize) → vendor → budget → approval → (human_review →) finalize`.
- **Human approval:** `interrupt()` in `human_review`, resumed by `Command(resume=…)` from `POST /approvals/{id}/decision`. Double decisions get `409`.
- **Events:** monotonic sequence per execution, written to SQLite before publishing; the WebSocket replays then streams, so refreshing never loses or duplicates events.
- **Reliability:** Pydantic validation on API input, tool arguments and agent outputs; retries only for transient LLM errors; typed error classes; startup marks interrupted runs as failed; idempotency keys; per-IP rate limit.

API base path is `/api/v1`. Interactive docs at http://localhost:8000/docs.

More detail: [architecture](docs/architecture.md) · [agents](docs/agent-design.md) · [workflow](docs/workflow-design.md) · [database](docs/database-schema.md) · [demo & deployment](docs/demo-guide.md) · [decisions](docs/decisions.md) · [progress](docs/progress.md) · [evals](docs/evals.md)

## Deploying

Backend on Render (Docker, `backend/`), frontend on Vercel (`frontend/`, set `VITE_API_BASE_URL`). The public deployment runs `demo` mode and needs no API keys. Step-by-step notes are in [docs/demo-guide.md](docs/demo-guide.md).

## Limitations

- SQLite and checkpoint files on free hosting are ephemeral. The app re-seeds on startup so it is always usable, but history can disappear.
- Single process: in-memory event bus and rate limiter. Not built for multiple replicas.
- No authentication; reviewers are recorded as `demo_user`.
- One workflow (procurement) with a fixed graph. This is a demo, not a production system.
