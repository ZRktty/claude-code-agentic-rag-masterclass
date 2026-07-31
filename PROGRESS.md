# Progress

Track your progress through the masterclass. Update this file as you complete modules - Claude Code reads this to understand where you are in the project.

## Convention
- `[ ]` = Not started
- `[-]` = In progress
- `[x]` = Completed

## Modules

### Module 1: App Shell + Observability
- [x] 1. Repo scaffolding (`.agent/plans/1.repo-scaffolding.md`)
- [x] 2. Supabase schema + auth (`.agent/plans/2.supabase-schema-auth.md`)
- [x] 3. Chat core (`.agent/plans/3.chat-core.md`)
- [x] 4. File attach + observability (`.agent/plans/4.file-attach-observability.md`)

**Module 1 complete.** Notes from sub-plan 4's validation pass:

- Per-thread file attach works end-to-end: upload → OpenAI vector store (one per thread) → `file_search` tool wired into `responses.create` → grounded answer returned via SSE.
- Verified retrieval is real, not a hallucination: attached a file with an invented fact ("ZEBRA-QUANTUM-77"), asked about it, got the exact answer, and confirmed `response.file_search_call.{in_progress,searching,completed}` events fire in the raw OpenAI event stream before the text delta.
- `wrapOpenAI` from `langsmith` wraps `openai.responses.create` (including the streaming call shape) with no runtime errors during testing; env vars `LANGSMITH_TRACING`/`LANGSMITH_API_KEY`/`LANGSMITH_PROJECT` are still the current names for `langsmith@0.8.9`.
- LangSmith trace ingestion confirmed end-to-end: initial testing hit a `403 Forbidden` on `POST /runs/multipart` because the workspace is EU-hosted and needs `LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com` set explicitly (undocumented default is the US endpoint) plus a correctly-scoped API key. After fixing both, a test message's run showed up in the `runs/query` API and the user confirmed it in the dashboard. `LANGSMITH_ENDPOINT` is now documented in `backend/.env.example`.
