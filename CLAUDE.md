# CLAUDE.md

RAG app with chat (default) and document ingestion interfaces. Config via env vars, no admin UI.

## Stack
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Node.js + Hono + Bun
- Database: Supabase (Postgres, pgvector, Auth, Storage, Realtime)
- LLM: OpenAI (Module 1), OpenRouter (Module 2+)
- Observability: LangSmith

## Rules
- No LangChain, no LangGraph - raw SDK calls only
- Use Zod for structured LLM outputs and request/response validation
- All tables need Row-Level Security - users only see their own data
- Stream chat responses via SSE
- Use Supabase Realtime for ingestion status updates
- Module 2+ uses stateless completions - store and send chat history yourself
- Ingestion is manual file upload only - no connectors or automated pipelines

## Planning
- Save all plans to `.agent/plans/` folder
- Naming convention: `{sequence}.{plan-name}.md` (e.g., `1.auth-setup.md`, `2.document-ingestion.md`)
- Plans should be detailed enough to execute without ambiguity
- Each task in the plan must include at least one validation test to verify it works
- Assess complexity and single-pass feasibility - can an agent realistically complete this in one go?
- Include a complexity indicator at the top of each plan:
  - ✅ **Simple** - Single-pass executable, low risk
  - ⚠️ **Medium** - May need iteration, some complexity
  - 🔴 **Complex** - Break into sub-plans before executing

## Development Flow
1. **Plan** - Create a detailed plan and save it to `.agent/plans/`
2. **Build** - Execute the plan to implement the feature
3. **Validate** - Test and verify the implementation works correctly. Use browser testing where applicable via an appropriate MCP
4. **Iterate** - Fix any issues found during validation

## Progress
Check PROGRESS.md for current module status. Update it as you complete tasks.

## Browser testing (Playwright MCP)

Use the `playwright` MCP server (project-scoped, `.mcp.json`) for browser testing — it runs as a local subprocess (`npx @playwright/mcp@latest`) and can reach `localhost:5173`/`localhost:3001` directly.

Don't use the Docker-based `MCP_DOCKER` browser tools (`mcp__MCP_DOCKER__browser_*`) for this repo's dev servers — that browser runs inside an isolated Docker network and cannot reach the host's `localhost` (`ERR_CONNECTION_REFUSED` on both `localhost` and `host.docker.internal`).

Test account for sign-in flows (dev Supabase project, "Confirm email" disabled): `test@test.com` / `/dashboard/project/vn`
